// Centralizovan pristup varijablama okruženja.
// Javne (NEXT_PUBLIC_*) se koriste u browseru, ostale samo na serveru.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export function serverEnv() {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    cronSecret: process.env.CRON_SECRET ?? "",
    // WhatsApp Cloud API (Meta)
    waToken: process.env.WHATSAPP_TOKEN ?? "",
    waPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    waAppSecret: process.env.WHATSAPP_APP_SECRET ?? "",
    waVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
    waApiVersion: process.env.WHATSAPP_API_VERSION ?? "v23.0",
    waLang: process.env.WHATSAPP_TEMPLATE_LANG ?? "hr",
    waTplConfirmation: process.env.WHATSAPP_TEMPLATE_CONFIRMATION ?? "termin_potvrda",
    waTplReminder: process.env.WHATSAPP_TEMPLATE_REMINDER ?? "termin_podsjetnik",
    waTplCancellation: process.env.WHATSAPP_TEMPLATE_CANCELLATION ?? "termin_otkazan",
    // SMS
    smsProvider: (process.env.SMS_PROVIDER ?? "") as "" | "infobip" | "twilio",
    smsSender: process.env.SMS_SENDER ?? "Termini",
    infobipBaseUrl: (process.env.INFOBIP_BASE_URL ?? "").replace(/\/$/, ""),
    infobipApiKey: process.env.INFOBIP_API_KEY ?? "",
    twilioSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    twilioToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    // Kad nijedan kanal nije podešen, poruke se samo upisuju u dnevnik.
    dryRun: process.env.MESSAGING_DRY_RUN === "true",
  };
}

export function isWhatsAppConfigured() {
  const e = serverEnv();
  return Boolean(e.waToken && e.waPhoneNumberId);
}

export function isSmsConfigured() {
  const e = serverEnv();
  if (e.smsProvider === "infobip") return Boolean(e.infobipBaseUrl && e.infobipApiKey);
  if (e.smsProvider === "twilio") return Boolean(e.twilioSid && e.twilioToken);
  return false;
}
