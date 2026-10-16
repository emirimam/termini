"use server";

import { after } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  cancelByToken,
  confirmByToken,
  getByToken,
  getCatalog,
  isOverlapError,
  loadDayAvailability,
  loadDaySlots,
  scheduleJobs,
  staffForService,
} from "@/lib/booking";
import { processDueJobs } from "@/lib/reminders/process";
import { isValidDateStr, localDate, todayIn } from "@/lib/time";
import type { ActionResult } from "@/lib/types";
import type { Slot } from "@/lib/availability";

export async function confirmAction(token: string): Promise<ActionResult> {
  const r = await confirmByToken(token);
  return r.ok ? { ok: true, data: null } : { ok: false, error: r.error };
}

export async function cancelAction(token: string): Promise<ActionResult> {
  const r = await cancelByToken(token);
  return r.ok ? { ok: true, data: null } : { ok: false, error: r.error };
}

// Pomjeranje: isti salon i usluga, isti zaposlenik (ili bilo ko ko radi uslugu
// ako je klijent na početku birao "prva slobodna osoba" – to ne pamtimo, pa
// nudimo istog zaposlenika radi kontinuiteta).
async function rescheduleContext(token: string) {
  const a = await getByToken(token);
  if (!a || (a.status !== "booked" && a.status !== "confirmed")) return null;
  const catalog = await getCatalog(a.tenant);
  const eligible = staffForService(catalog, a.service_id).map((s) => s.id);
  const staffIds = eligible.includes(a.staff_id) ? [a.staff_id] : eligible;
  return { a, staffIds };
}

export async function rescheduleDays(
  token: string,
  from?: string,
): Promise<ActionResult<{ date: string; count: number; first: string | null }[]>> {
  const ctx = await rescheduleContext(token);
  if (!ctx) return { ok: false, error: "Termin se više ne može mijenjati." };
  const today = todayIn(ctx.a.tenant.timezone);
  const start = from && isValidDateStr(from) && from > today ? from : today;
  const days = await loadDayAvailability({
    tenant: ctx.a.tenant,
    service: ctx.a.service,
    staffIds: ctx.staffIds,
    fromDate: start,
    days: 14,
    excludeAppointmentId: ctx.a.id,
  });
  return { ok: true, data: days };
}

export async function rescheduleSlots(token: string, date: string): Promise<ActionResult<Slot[]>> {
  if (!isValidDateStr(date)) return { ok: false, error: "Neispravan datum." };
  const ctx = await rescheduleContext(token);
  if (!ctx) return { ok: false, error: "Termin se više ne može mijenjati." };
  const slots = await loadDaySlots({
    tenant: ctx.a.tenant,
    service: ctx.a.service,
    staffIds: ctx.staffIds,
    date,
    excludeAppointmentId: ctx.a.id,
  });
  return { ok: true, data: slots };
}

export async function rescheduleAction(token: string, startsAt: string): Promise<ActionResult> {
  const ctx = await rescheduleContext(token);
  if (!ctx) return { ok: false, error: "Termin se više ne može mijenjati." };
  const { a } = ctx;

  const limit = new Date(a.starts_at).getTime() - a.tenant.cancel_until_hours * 3_600_000;
  if (Date.now() > limit) {
    return {
      ok: false,
      error: `Online promjena je moguća najkasnije ${a.tenant.cancel_until_hours} h prije termina. Nazovite salon.`,
    };
  }

  const date = localDate(startsAt, a.tenant.timezone);
  const slots = await loadDaySlots({
    tenant: a.tenant,
    service: a.service,
    staffIds: ctx.staffIds,
    date,
    excludeAppointmentId: a.id,
  });
  const slot = slots.find((s) => new Date(s.startsAt).getTime() === new Date(startsAt).getTime());
  if (!slot) return { ok: false, error: "Ovaj termin je upravo zauzet. Izaberite drugi." };

  const staffId = slot.staffIds.includes(a.staff_id) ? a.staff_id : slot.staffIds[0];
  const start = new Date(slot.startsAt);
  const end = new Date(start.getTime() + a.service.duration_min * 60_000);
  const blocked = new Date(end.getTime() + a.service.buffer_min * 60_000);

  const { error } = await adminClient()
    .from("appointments")
    .update({
      staff_id: staffId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      blocked_until: blocked.toISOString(),
      status: "booked",
    })
    .eq("id", a.id);
  if (error) {
    if (isOverlapError(error)) return { ok: false, error: "Ovaj termin je upravo zauzet. Izaberite drugi." };
    return { ok: false, error: "Promjena nije uspjela. Pokušajte ponovo." };
  }

  await scheduleJobs({ id: a.id, tenant_id: a.tenant_id, starts_at: start.toISOString() }, a.tenant, true);
  after(async () => {
    try {
      await processDueJobs(10);
    } catch (e) {
      console.error("after reschedule", e);
    }
  });
  return { ok: true, data: null };
}
