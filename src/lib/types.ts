// Tipovi redova iz baze (ručno usklađeni s migracijom).

export type TenantKind = "salon" | "dental" | "barber" | "beauty" | "other";
export type ReminderChannel = "whatsapp_sms" | "whatsapp" | "sms" | "off";
export type AppointmentStatus = "booked" | "confirmed" | "cancelled" | "completed" | "no_show";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  kind: TenantKind;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  description: string | null;
  brand_color: string;
  logo_url: string | null;
  min_notice_minutes: number;
  horizon_days: number;
  slot_step_minutes: number;
  cancel_until_hours: number;
  online_booking_enabled: boolean;
  reminder_channel: ReminderChannel;
  reminder_offsets: number[];
  send_confirmation: boolean;
  quiet_start: string;
  quiet_end: string;
  created_at: string;
}

export interface Staff {
  id: string;
  tenant_id: string;
  name: string;
  title: string | null;
  color: string;
  active: boolean;
  sort: number;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  duration_min: number;
  buffer_min: number;
  price: number | null;
  currency: string;
  active: boolean;
  sort: number;
}

export interface WorkingHours {
  id: string;
  tenant_id: string;
  staff_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface TimeOff {
  id: string;
  tenant_id: string;
  staff_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  messaging_consent: boolean;
  no_show_count: number;
  blocked: boolean;
  source: "online" | "admin" | "import";
  created_at: string;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  staff_id: string;
  service_id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  blocked_until: string;
  status: AppointmentStatus;
  source: "online" | "admin";
  price: number | null;
  notes: string | null;
  manage_token: string;
  cancelled_by: "client" | "staff" | null;
  created_at: string;
}

export interface ReminderJob {
  id: string;
  tenant_id: string;
  appointment_id: string;
  kind: "confirmation" | "reminder" | "cancellation";
  offset_min: number;
  send_at: string;
  status: "pending" | "processing" | "sent" | "failed" | "skipped" | "cancelled";
  attempts: number;
  last_error: string | null;
  channel_used: "whatsapp" | "sms" | null;
  sent_at: string | null;
}

export interface MessageLog {
  id: string;
  tenant_id: string | null;
  appointment_id: string | null;
  client_id: string | null;
  job_id: string | null;
  channel: "whatsapp" | "sms";
  direction: "out" | "in";
  phone: string;
  template: string | null;
  body: string | null;
  provider_message_id: string | null;
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "received";
  error: string | null;
  fallback_sent: boolean;
  created_at: string;
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  booked: "Zakazan",
  confirmed: "Potvrđen",
  cancelled: "Otkazan",
  completed: "Završen",
  no_show: "Nije došao",
};

export const KIND_LABEL: Record<TenantKind, string> = {
  salon: "Frizerski salon",
  barber: "Brijačnica",
  beauty: "Kozmetički salon",
  dental: "Stomatološka ordinacija",
  other: "Drugo",
};

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };
