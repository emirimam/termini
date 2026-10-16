import { env, serverEnv } from "@/lib/env";
import { formatWhen, formatWhenShort } from "@/lib/time";
import type { WaComponent } from "@/lib/messaging/providers";

// Sadržaj poruka. WhatsApp šabloni moraju odgovarati onima odobrenim u
// Meta Business Manageru – vidi docs/whatsapp-sabloni.md.

export type MessageKind = "confirmation" | "reminder" | "cancellation";

export interface MessageContext {
  clientName: string;
  tenantName: string;
  tenantSlug: string;
  tenantPhone: string | null;
  serviceName: string;
  staffName: string;
  startsAt: string;
  timezone: string;
  manageToken: string;
}

export function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full;
}

export function manageUrl(token: string) {
  return `${env.appUrl}/t/${token}`;
}

export function whatsappTemplate(kind: MessageKind, c: MessageContext) {
  const e = serverEnv();
  const when = formatWhen(c.startsAt, c.timezone);
  const body: WaComponent = {
    type: "body",
    parameters: [firstName(c.clientName), c.tenantName, c.serviceName, when].map((text) => ({
      type: "text" as const,
      text,
    })),
  };

  if (kind === "confirmation") {
    return {
      name: e.waTplConfirmation,
      components: [
        body,
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: c.manageToken }] },
      ] satisfies WaComponent[],
    };
  }
  if (kind === "reminder") {
    return {
      name: e.waTplReminder,
      components: [
        body,
        { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `confirm:${c.manageToken}` }] },
        { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: `cancel:${c.manageToken}` }] },
        { type: "button", sub_type: "url", index: "2", parameters: [{ type: "text", text: c.manageToken }] },
      ] satisfies WaComponent[],
    };
  }
  return {
    name: e.waTplCancellation,
    components: [
      body,
      { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: c.tenantSlug }] },
    ] satisfies WaComponent[],
  };
}

/** Tekst kakav korisnik vidi na WhatsAppu – za dnevnik poruka. */
export function whatsappPreview(kind: MessageKind, c: MessageContext) {
  const when = formatWhen(c.startsAt, c.timezone);
  const n = firstName(c.clientName);
  if (kind === "confirmation") return `Zdravo ${n}, vaš termin u ${c.tenantName} je zakazan: ${c.serviceName}, ${when}.`;
  if (kind === "reminder") return `Zdravo ${n}, podsjećamo vas na termin u ${c.tenantName}: ${c.serviceName}, ${when}. [Dolazim] [Otkaži termin]`;
  return `Zdravo ${n}, vaš termin u ${c.tenantName} (${c.serviceName}, ${when}) je otkazan.`;
}

export function smsText(kind: MessageKind, c: MessageContext) {
  const when = formatWhenShort(c.startsAt, c.timezone);
  const url = manageUrl(c.manageToken);
  if (kind === "confirmation") return `${c.tenantName}: termin zakazan ${when} (${c.serviceName}). Promjena/otkazivanje: ${url}`;
  if (kind === "reminder") return `Podsjetnik: ${c.tenantName}, ${when} (${c.serviceName}). Potvrda ili otkazivanje: ${url}`;
  return `${c.tenantName}: termin ${when} je otkazan. Novi termin: ${env.appUrl}/${c.tenantSlug}`;
}
