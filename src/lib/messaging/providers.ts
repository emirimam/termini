import "server-only";
import { serverEnv } from "@/lib/env";
import { waId } from "@/lib/phone";

// Tanki adapteri za vanjske servise. Vraćaju ID poruke kod providera
// ili bacaju grešku s čitljivom porukom.

export class ProviderError extends Error {
  constructor(message: string, public readonly permanent = false) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// WhatsApp Cloud API
// ---------------------------------------------------------------------------

export type WaComponent =
  | { type: "body"; parameters: { type: "text"; text: string }[] }
  | { type: "button"; sub_type: "quick_reply"; index: string; parameters: { type: "payload"; payload: string }[] }
  | { type: "button"; sub_type: "url"; index: string; parameters: { type: "text"; text: string }[] };

async function waPost(payload: Record<string, unknown>): Promise<string> {
  const e = serverEnv();
  const res = await fetch(`https://graph.facebook.com/${e.waApiVersion}/${e.waPhoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${e.waToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as {
    messages?: { id: string }[];
    error?: { message?: string; code?: number };
  };
  if (!res.ok || !json.messages?.[0]?.id) {
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    // 131026 = primalac nema WhatsApp / ne može primiti; 132xxx = problem sa šablonom
    const code = json.error?.code ?? 0;
    throw new ProviderError(`WhatsApp: ${msg}${code ? ` (${code})` : ""}`, res.status === 400);
  }
  return json.messages[0].id;
}

export function sendWhatsAppTemplate(to: string, name: string, lang: string, components: WaComponent[]) {
  return waPost({
    to: waId(to),
    type: "template",
    template: { name, language: { code: lang }, components },
  });
}

export function sendWhatsAppText(to: string, body: string) {
  return waPost({ to: waId(to), type: "text", text: { body, preview_url: false } });
}

// ---------------------------------------------------------------------------
// SMS: Infobip ili Twilio
// ---------------------------------------------------------------------------

export async function sendSms(to: string, text: string): Promise<string> {
  const e = serverEnv();

  if (e.smsProvider === "infobip") {
    const res = await fetch(`${e.infobipBaseUrl}/sms/2/text/advanced`, {
      method: "POST",
      headers: {
        Authorization: `App ${e.infobipApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: [{ destinations: [{ to: waId(to) }], from: e.smsSender, text }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      messages?: { messageId: string; status?: { groupName?: string; description?: string } }[];
      requestError?: { serviceException?: { text?: string } };
    };
    const m = json.messages?.[0];
    if (!res.ok || !m || m.status?.groupName === "REJECTED") {
      throw new ProviderError(
        `SMS (Infobip): ${m?.status?.description ?? json.requestError?.serviceException?.text ?? `HTTP ${res.status}`}`,
      );
    }
    return m.messageId;
  }

  if (e.smsProvider === "twilio") {
    const body = new URLSearchParams({ To: to, From: e.smsSender, Body: text });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${e.twilioSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${e.twilioSid}:${e.twilioToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!res.ok || !json.sid) throw new ProviderError(`SMS (Twilio): ${json.message ?? `HTTP ${res.status}`}`);
    return json.sid;
  }

  throw new ProviderError("SMS provider nije podešen", true);
}

// ---------------------------------------------------------------------------
// GSM-7: naša slova (č, ć, ž, š, đ) prebacuju SMS u UCS-2 i skraćuju ga na
// 70 znakova po dijelu. Za SMS ih transliterujemo da poruka stane u 160.
// ---------------------------------------------------------------------------
const TRANSLIT: Record<string, string> = {
  č: "c", ć: "c", ž: "z", š: "s", đ: "dj",
  Č: "C", Ć: "C", Ž: "Z", Š: "S", Đ: "Dj",
  "–": "-", "—": "-", "„": '"', "“": '"', "”": '"', "’": "'",
};

export function toGsm(text: string) {
  return text.replace(/[čćžšđČĆŽŠĐ–—„“”’]/g, (ch) => TRANSLIT[ch] ?? ch);
}
