import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";
import { computeSlots, type Slot } from "@/lib/availability";
import { planJobs } from "@/lib/reminders/plan";
import { addDays, localDate, zonedInstant } from "@/lib/time";
import type { Appointment, Service, Staff, Tenant, TimeOff, WorkingHours } from "@/lib/types";

// Jezgro rezervacija – dijele ga javna stranica, upravljanje preko tokena,
// WhatsApp webhook i admin panel.

export interface Catalog {
  tenant: Tenant;
  services: Service[];
  staff: Staff[];
  links: { staff_id: string; service_id: string }[];
}

// cache(): metadata, OG slika i stranica dijele isti upit u jednom zahtjevu.
export const getTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  if (!/^[a-z0-9-]{2,40}$/i.test(slug)) return null;
  const { data } = await adminClient().from("tenants").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
  return (data as Tenant) ?? null;
});

export async function getWorkingHours(tenantId: string): Promise<WorkingHours[]> {
  const { data } = await adminClient()
    .from("working_hours")
    .select("*, staff!inner(active)")
    .eq("tenant_id", tenantId)
    .eq("staff.active", true);
  return (data ?? []) as unknown as WorkingHours[];
}

export async function getCatalog(tenant: Tenant, db: SupabaseClient = adminClient()): Promise<Catalog> {
  const [services, staff, links] = await Promise.all([
    db.from("services").select("*").eq("tenant_id", tenant.id).eq("active", true).order("sort").order("name"),
    db.from("staff").select("*").eq("tenant_id", tenant.id).eq("active", true).order("sort").order("name"),
    db.from("staff_services").select("staff_id, service_id").eq("tenant_id", tenant.id),
  ]);
  return {
    tenant,
    services: (services.data ?? []) as Service[],
    staff: (staff.data ?? []) as Staff[],
    links: links.data ?? [],
  };
}

/** Osoblje koje radi uslugu. Ako usluga nema dodijeljeno osoblje, rade je svi. */
export function staffForService(catalog: Catalog, serviceId: string): Staff[] {
  const assigned = catalog.links.filter((l) => l.service_id === serviceId).map((l) => l.staff_id);
  if (!assigned.length) return catalog.staff;
  return catalog.staff.filter((s) => assigned.includes(s.id));
}

export async function loadDaySlots(opts: {
  tenant: Tenant;
  service: Service;
  staffIds: string[];
  date: string;
  excludeAppointmentId?: string;
  ignoreNotice?: boolean;
}): Promise<Slot[]> {
  const { tenant, service, staffIds, date } = opts;
  if (!staffIds.length) return [];
  const db = adminClient();
  // Okvir dana s rezervom zbog vremenskih zona
  const from = zonedInstant(date, "00:00", tenant.timezone).toISOString();
  const to = zonedInstant(addDays(date, 1), "00:00", tenant.timezone).toISOString();

  const [hours, off, busy] = await Promise.all([
    db.from("working_hours").select("*").eq("tenant_id", tenant.id).in("staff_id", staffIds),
    db.from("time_off").select("*").eq("tenant_id", tenant.id).lt("starts_at", to).gt("ends_at", from),
    db
      .from("appointments")
      .select("id, staff_id, starts_at, blocked_until")
      .eq("tenant_id", tenant.id)
      .in("staff_id", staffIds)
      .in("status", ["booked", "confirmed"])
      .lt("starts_at", to)
      .gt("blocked_until", from),
  ]);

  return computeSlots({
    tenant,
    service,
    staffIds,
    date,
    hours: (hours.data ?? []) as WorkingHours[],
    timeOff: (off.data ?? []) as TimeOff[],
    busy: (busy.data ?? []).filter((b) => b.id !== opts.excludeAppointmentId),
    ignoreNotice: opts.ignoreNotice,
  });
}

/** Za svaki od narednih N dana: ima li bar jedan slobodan termin. */
export async function loadDayAvailability(opts: {
  tenant: Tenant;
  service: Service;
  staffIds: string[];
  fromDate: string;
  days: number;
  excludeAppointmentId?: string;
}) {
  const dates = Array.from({ length: opts.days }, (_, i) => addDays(opts.fromDate, i));
  const results = await Promise.all(
    dates.map(async (date) => {
      const slots = await loadDaySlots({ ...opts, date });
      return { date, count: slots.length, first: slots[0]?.time ?? null };
    }),
  );
  return results;
}

/** Izaberi osobu s najmanje termina tog dana (ravnomjerno opterećenje). */
export async function pickLeastBusy(tenant: Tenant, staffIds: string[], startsAt: string) {
  if (staffIds.length === 1) return staffIds[0];
  const date = localDate(startsAt, tenant.timezone);
  const from = zonedInstant(date, "00:00", tenant.timezone).toISOString();
  const to = zonedInstant(addDays(date, 1), "00:00", tenant.timezone).toISOString();
  const { data } = await adminClient()
    .from("appointments")
    .select("staff_id")
    .eq("tenant_id", tenant.id)
    .in("staff_id", staffIds)
    .in("status", ["booked", "confirmed"])
    .gte("starts_at", from)
    .lt("starts_at", to);
  const counts = new Map(staffIds.map((id) => [id, 0]));
  for (const r of data ?? []) counts.set(r.staff_id, (counts.get(r.staff_id) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => a[1] - b[1])[0][0];
}

/** Zamijeni buduće poslove za termin novim planom (nakon kreiranja ili pomjeranja). */
export async function scheduleJobs(appointment: Pick<Appointment, "id" | "tenant_id" | "starts_at">, tenant: Tenant, withConfirmation: boolean) {
  const db = adminClient();
  await db
    .from("reminder_jobs")
    .update({ status: "cancelled" })
    .eq("appointment_id", appointment.id)
    .eq("status", "pending");

  const jobs = planJobs(new Date(appointment.starts_at), tenant, new Date(), withConfirmation);
  if (!jobs.length) return;
  const { error } = await db.from("reminder_jobs").insert(
    jobs.map((j) => ({
      tenant_id: appointment.tenant_id,
      appointment_id: appointment.id,
      kind: j.kind,
      offset_min: j.offset_min,
      send_at: j.send_at.toISOString(),
    })),
  );
  if (error) console.error("scheduleJobs", error.message);
}

export async function cancelPendingJobs(appointmentId: string) {
  await adminClient()
    .from("reminder_jobs")
    .update({ status: "cancelled" })
    .eq("appointment_id", appointmentId)
    .eq("status", "pending");
}

export async function queueCancellationMessage(a: Pick<Appointment, "id" | "tenant_id">) {
  await adminClient().from("reminder_jobs").insert({
    tenant_id: a.tenant_id,
    appointment_id: a.id,
    kind: "cancellation",
    send_at: new Date().toISOString(),
  });
}

export function isOverlapError(err: { code?: string; message?: string } | null) {
  return err?.code === "23P01" || err?.message?.includes("appointments_no_overlap");
}

// ---------------------------------------------------------------------------
// Upravljanje terminom preko tokena (link iz poruke)
// ---------------------------------------------------------------------------

export type TokenAppointment = Appointment & {
  tenant: Tenant;
  service: Service;
  staff: Staff;
  client: { id: string; name: string; phone: string };
};

export async function getByToken(token: string): Promise<TokenAppointment | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { data } = await adminClient()
    .from("appointments")
    .select("*, tenant:tenants(*), service:services(*), staff:staff(*), client:clients(id, name, phone)")
    .eq("manage_token", token)
    .maybeSingle();
  return (data as TokenAppointment) ?? null;
}

export function canClientCancel(a: TokenAppointment, now = new Date()) {
  if (a.status !== "booked" && a.status !== "confirmed") return false;
  const limit = new Date(a.starts_at).getTime() - a.tenant.cancel_until_hours * 3_600_000;
  return now.getTime() <= limit;
}

export async function confirmByToken(token: string) {
  const a = await getByToken(token);
  if (!a) return { ok: false as const, error: "Termin nije pronađen." };
  if (a.status === "confirmed") return { ok: true as const, appointment: a };
  if (a.status !== "booked") return { ok: false as const, error: "Ovaj termin više nije aktivan." };
  await adminClient().from("appointments").update({ status: "confirmed" }).eq("id", a.id);
  return { ok: true as const, appointment: { ...a, status: "confirmed" as const } };
}

export async function cancelByToken(token: string) {
  const a = await getByToken(token);
  if (!a) return { ok: false as const, error: "Termin nije pronađen." };
  if (a.status === "cancelled") return { ok: true as const, appointment: a };
  if (!canClientCancel(a)) {
    return {
      ok: false as const,
      error: `Online otkazivanje je moguće najkasnije ${a.tenant.cancel_until_hours} h prije termina. Nazovite ${a.tenant.name}${a.tenant.phone ? ` na ${a.tenant.phone}` : ""}.`,
    };
  }
  const { error } = await adminClient()
    .from("appointments")
    .update({ status: "cancelled", cancelled_by: "client" })
    .eq("id", a.id);
  if (error) return { ok: false as const, error: "Otkazivanje nije uspjelo. Pokušajte ponovo." };
  await cancelPendingJobs(a.id);
  return { ok: true as const, appointment: { ...a, status: "cancelled" as const } };
}
