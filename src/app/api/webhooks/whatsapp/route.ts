import { createHmac, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { env, serverEnv } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { cancelByToken, confirmByToken } from "@/lib/booking";
import { sendAppointmentMessage } from "@/lib/messaging/send";
import { sendWhatsAppText } from "@/lib/messaging/providers";
import { contextFor, loadAppointmentFull } from "@/lib/reminders/process";
import { manageUrl } from "@/lib/messaging/content";
import { formatWhen } from "@/lib/time";
import type { MessageKind } from "@/lib/messaging/content";

// WhatsApp Cloud API webhook:
//  - GET: verifikacija pri podešavanju u Meta developer konzoli
//  - POST: statusi isporuke (sent/delivered/read/failed) i odgovori klijenata
//    na dugmad "Dolazim" / "Otkaži termin".

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === serverEnv().waVerifyToken) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

function validSignature(raw: string, header: string | null) {
  const secret = serverEnv().waAppSecret;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header.slice(7));
  return a.length === b.length && timingSafeEqual(a, b);
}

interface WaStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  recipient_id: string;
  errors?: { code: number; title?: string; message?: string }[];
}

interface WaMessage {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  button?: { payload?: string; text?: string };
  interactive?: { button_reply?: { id: string; title: string } };
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("invalid signature", { status: 401 });
  }

  let body: { entry?: { changes?: { value?: { statuses?: WaStatus[]; messages?: WaMessage[] } }[] }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const statuses: WaStatus[] = [];
  const messages: WaMessage[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      statuses.push(...(change.value?.statuses ?? []));
      messages.push(...(change.value?.messages ?? []));
    }
  }

  // Meta očekuje brz 200 – obrada ide nakon odgovora.
  after(async () => {
    for (const s of statuses) await handleStatus(s).catch((e) => console.error("wa status", e));
    for (const m of messages) await handleMessage(m).catch((e) => console.error("wa message", e));
  });

  return new Response("ok", { status: 200 });
}

async function handleStatus(s: WaStatus) {
  const db = adminClient();
  const { data: log } = await db
    .from("message_log")
    .select("id, appointment_id, job_id, fallback_sent, status, tenant_id")
    .eq("provider_message_id", s.id)
    .maybeSingle();
  if (!log) return;

  // Statusi ne smiju ići unazad (read → delivered)
  const order = ["queued", "sent", "delivered", "read"];
  const failed = s.status === "failed";
  if (!failed && order.indexOf(s.status) <= order.indexOf(log.status)) return;

  const error = failed ? s.errors?.map((e) => `${e.code} ${e.title ?? e.message ?? ""}`.trim()).join("; ") ?? "failed" : null;
  await db.from("message_log").update({ status: s.status, error }).eq("id", log.id);

  // WhatsApp nije isporučen (npr. broj nema WhatsApp) → SMS rezerva
  if (failed && !log.fallback_sent && log.appointment_id && log.job_id) {
    const { data: job } = await db.from("reminder_jobs").select("kind").eq("id", log.job_id).maybeSingle();
    const a = await loadAppointmentFull(log.appointment_id);
    if (!job || !a || a.tenant.reminder_channel !== "whatsapp_sms") return;
    if (job.kind !== "cancellation" && a.status !== "booked" && a.status !== "confirmed") return;

    await db.from("message_log").update({ fallback_sent: true }).eq("id", log.id);
    try {
      const res = await sendAppointmentMessage({
        tenantId: a.tenant_id,
        appointmentId: a.id,
        clientId: a.client_id,
        jobId: log.job_id,
        phone: a.client.phone,
        kind: job.kind as MessageKind,
        channelPolicy: a.tenant.reminder_channel,
        ctx: contextFor(a),
        only: "sms",
      });
      await db.from("reminder_jobs").update({ channel_used: res.channel }).eq("id", log.job_id);
    } catch (e) {
      console.error("sms fallback", e);
    }
  }
}

async function handleMessage(m: WaMessage) {
  const db = adminClient();
  const phone = `+${m.from}`;
  const payload = m.button?.payload ?? m.interactive?.button_reply?.id ?? "";
  const text = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? `[${m.type}]`;

  const match = /^(confirm|cancel):([0-9a-f-]{36})$/i.exec(payload);
  let tenantId: string | null = null;
  let appointmentId: string | null = null;
  let reply: string | null = null;

  if (match) {
    const [, action, token] = match;
    const res = action === "confirm" ? await confirmByToken(token) : await cancelByToken(token);
    if (res.ok) {
      const a = res.appointment;
      tenantId = a.tenant_id;
      appointmentId = a.id;
      // Odgovor se šalje samo vlasniku termina (broj se mora poklapati).
      if (a.client.phone === phone) {
        const when = formatWhen(a.starts_at, a.tenant.timezone);
        reply =
          action === "confirm"
            ? `Hvala! Vaš dolazak je potvrđen: ${a.service.name}, ${when}. Vidimo se u ${a.tenant.name}.`
            : `Termin ${when} je otkazan. Novi termin možete zakazati ovdje: ${env.appUrl}/${a.tenant.slug}`;
      }
    } else {
      reply = res.error;
    }
  } else {
    // Slobodan tekst: prosljeđujemo uputstvo; salon vidi poruku u dnevniku.
    const { data: last } = await db
      .from("message_log")
      .select("tenant_id, appointment_id")
      .eq("phone", phone)
      .eq("direction", "out")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    tenantId = last?.tenant_id ?? null;
    appointmentId = last?.appointment_id ?? null;
    if (appointmentId) {
      const a = await loadAppointmentFull(appointmentId);
      if (a) {
        reply = `Ovo je automatski broj za termine. Za promjenu termina: ${manageUrl(a.manage_token)}${
          a.tenant.phone ? `\nZa sva ostala pitanja nazovite ${a.tenant.name}: ${a.tenant.phone}` : ""
        }`;
      }
    }
  }

  await db.from("message_log").insert({
    tenant_id: tenantId,
    appointment_id: appointmentId,
    channel: "whatsapp",
    direction: "in",
    phone,
    body: text.slice(0, 1000),
    provider_message_id: m.id,
    status: "received",
  });

  if (reply) {
    try {
      const id = await sendWhatsAppText(phone, reply);
      await db.from("message_log").insert({
        tenant_id: tenantId,
        appointment_id: appointmentId,
        channel: "whatsapp",
        direction: "out",
        phone,
        body: reply,
        provider_message_id: id,
        status: "sent",
      });
    } catch (e) {
      console.error("wa reply", e);
    }
  }
}
