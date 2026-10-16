import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { isSmsConfigured, isWhatsAppConfigured, serverEnv } from "@/lib/env";
import { sendSms, sendWhatsAppTemplate, toGsm } from "@/lib/messaging/providers";
import {
  smsText,
  whatsappPreview,
  whatsappTemplate,
  type MessageContext,
  type MessageKind,
} from "@/lib/messaging/content";
import type { ReminderChannel } from "@/lib/types";
import type { Database } from "@/lib/database.types";

type LogInsert = Database["public"]["Tables"]["message_log"]["Insert"];

export interface SendInput {
  tenantId: string;
  appointmentId: string;
  clientId: string;
  jobId: string | null;
  phone: string;
  kind: MessageKind;
  channelPolicy: ReminderChannel;
  ctx: MessageContext;
  /** Za SMS fallback nakon neuspjelog WhatsAppa. */
  only?: "whatsapp" | "sms";
}

export interface SendResult {
  channel: "whatsapp" | "sms";
  providerId: string;
  dryRun: boolean;
}

async function log(row: LogInsert) {
  const { error } = await adminClient().from("message_log").insert(row);
  if (error) console.error("message_log insert", error.message);
}

/**
 * Šalje poruku po pravilu salona: WhatsApp pa SMS kao rezerva, samo WhatsApp
 * ili samo SMS. Svaki pokušaj (uspješan ili ne) upisuje se u message_log.
 */
export async function sendAppointmentMessage(input: SendInput): Promise<SendResult> {
  const e = serverEnv();
  const base: Omit<LogInsert, "channel"> = {
    tenant_id: input.tenantId,
    appointment_id: input.appointmentId,
    client_id: input.clientId,
    job_id: input.jobId,
    phone: input.phone,
    direction: "out",
  };

  const wantsWa = input.only ? input.only === "whatsapp" : input.channelPolicy !== "sms";
  const wantsSms = input.only ? input.only === "sms" : input.channelPolicy !== "whatsapp";

  const waReady = isWhatsAppConfigured();
  const smsReady = isSmsConfigured();

  // Razvojni režim: ništa nije podešeno ili je eksplicitno uključen dry run.
  if (e.dryRun || (!waReady && !smsReady)) {
    const channel = wantsWa ? "whatsapp" : "sms";
    const body = channel === "whatsapp" ? whatsappPreview(input.kind, input.ctx) : toGsm(smsText(input.kind, input.ctx));
    const providerId = `dry-${crypto.randomUUID()}`;
    await log({ ...base, channel, template: input.kind, body, provider_message_id: providerId, status: "sent", error: "Probni režim – poruka nije stvarno poslana" });
    return { channel, providerId, dryRun: true };
  }

  const errors: string[] = [];

  if (wantsWa && waReady) {
    const tpl = whatsappTemplate(input.kind, input.ctx);
    try {
      const providerId = await sendWhatsAppTemplate(input.phone, tpl.name, e.waLang, tpl.components);
      await log({ ...base, channel: "whatsapp", template: tpl.name, body: whatsappPreview(input.kind, input.ctx), provider_message_id: providerId, status: "sent" });
      return { channel: "whatsapp", providerId, dryRun: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      await log({ ...base, channel: "whatsapp", template: tpl.name, body: whatsappPreview(input.kind, input.ctx), status: "failed", error: msg, fallback_sent: wantsSms && smsReady });
    }
  }

  if (wantsSms && smsReady) {
    const text = toGsm(smsText(input.kind, input.ctx));
    try {
      const providerId = await sendSms(input.phone, text);
      await log({ ...base, channel: "sms", template: input.kind, body: text, provider_message_id: providerId, status: "sent" });
      return { channel: "sms", providerId, dryRun: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      await log({ ...base, channel: "sms", template: input.kind, body: text, status: "failed", error: msg });
    }
  }

  if (!errors.length) errors.push("Nijedan kanal nije dostupan za ovo pravilo slanja");
  throw new Error(errors.join(" | "));
}
