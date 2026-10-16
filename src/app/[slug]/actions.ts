"use server";

import { after } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import {
  getCatalog,
  getTenantBySlug,
  isOverlapError,
  loadDayAvailability,
  loadDaySlots,
  pickLeastBusy,
  scheduleJobs,
  staffForService,
} from "@/lib/booking";
import { normalizePhone } from "@/lib/phone";
import { processDueJobs } from "@/lib/reminders/process";
import { isValidDateStr, localDate, todayIn } from "@/lib/time";
import type { ActionResult } from "@/lib/types";
import type { Slot } from "@/lib/availability";

async function resolve(slug: string, serviceId: string, staffId: string) {
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !tenant.online_booking_enabled || tenant.suspended) return null;
  const catalog = await getCatalog(tenant);
  const service = catalog.services.find((s) => s.id === serviceId);
  if (!service) return null;
  const eligible = staffForService(catalog, serviceId);
  const staffIds = staffId === "any" ? eligible.map((s) => s.id) : eligible.filter((s) => s.id === staffId).map((s) => s.id);
  return { tenant, service, staffIds };
}

export async function getDays(
  slug: string,
  serviceId: string,
  staffId: string,
  fromDate?: string,
): Promise<ActionResult<{ date: string; count: number; first: string | null }[]>> {
  const r = await resolve(slug, serviceId, staffId);
  if (!r) return { ok: false, error: "Usluga nije dostupna za online rezervaciju." };
  const today = todayIn(r.tenant.timezone);
  const start = fromDate && isValidDateStr(fromDate) && fromDate > today ? fromDate : today;
  const data = await loadDayAvailability({ ...r, fromDate: start, days: 14 });
  return { ok: true, data };
}

export async function getSlots(
  slug: string,
  serviceId: string,
  staffId: string,
  date: string,
): Promise<ActionResult<Slot[]>> {
  if (!isValidDateStr(date)) return { ok: false, error: "Neispravan datum." };
  const r = await resolve(slug, serviceId, staffId);
  if (!r) return { ok: false, error: "Usluga nije dostupna za online rezervaciju." };
  return { ok: true, data: await loadDaySlots({ ...r, date }) };
}

const bookingSchema = z.object({
  slug: z.string().min(2).max(40),
  serviceId: z.uuid(),
  staffId: z.union([z.uuid(), z.literal("any")]),
  startsAt: z.iso.datetime(),
  name: z.string().trim().min(2, "Upišite ime i prezime.").max(120),
  phone: z.string().trim().min(6, "Upišite broj telefona.").max(30),
  note: z.string().trim().max(500).optional().default(""),
  consent: z.boolean(),
  website: z.string().max(0).optional().default(""), // honeypot za botove
});

export type BookingInput = z.input<typeof bookingSchema>;

export async function book(input: BookingInput): Promise<ActionResult<{ token: string }>> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Provjerite podatke." };
  const v = parsed.data;
  if (v.website) return { ok: false, error: "Rezervacija nije uspjela." };

  const phone = normalizePhone(v.phone);
  if (!phone) return { ok: false, error: "Broj telefona nije ispravan. Primjer: 061 123 456" };

  const r = await resolve(v.slug, v.serviceId, v.staffId);
  if (!r) return { ok: false, error: "Usluga nije dostupna za online rezervaciju." };
  const { tenant, service } = r;

  // Termin mora i dalje biti slobodan po pravilima salona.
  const date = localDate(v.startsAt, tenant.timezone);
  const slots = await loadDaySlots({ ...r, date });
  const slot = slots.find((s) => new Date(s.startsAt).getTime() === new Date(v.startsAt).getTime());
  if (!slot) return { ok: false, error: "Ovaj termin je upravo zauzet. Izaberite drugi." };

  const db = adminClient();

  // Klijent: postojeći po broju telefona ili novi
  const { data: existing } = await db
    .from("clients")
    .select("id, blocked, name")
    .eq("tenant_id", tenant.id)
    .eq("phone", phone)
    .maybeSingle();

  let clientId: string;
  if (existing) {
    if (existing.blocked) {
      return { ok: false, error: `Online rezervacija trenutno nije moguća. Nazovite ${tenant.name}${tenant.phone ? ` na ${tenant.phone}` : ""}.` };
    }
    clientId = existing.id;
    await db.from("clients").update({ messaging_consent: v.consent }).eq("id", clientId);
  } else {
    const { data: created, error } = await db
      .from("clients")
      .insert({ tenant_id: tenant.id, name: v.name, phone, messaging_consent: v.consent, source: "online" })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "Rezervacija nije uspjela. Pokušajte ponovo." };
    clientId = created.id;
  }

  // Zaštita od zloupotrebe: najviše 3 aktivna buduća termina online po klijentu.
  const { count } = await db
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("client_id", clientId)
    .in("status", ["booked", "confirmed"])
    .gte("starts_at", new Date().toISOString());
  if ((count ?? 0) >= 3) {
    return { ok: false, error: "Već imate 3 zakazana termina. Za više termina javite se salonu." };
  }

  const staffId = await pickLeastBusy(tenant, slot.staffIds, slot.startsAt);
  const start = new Date(slot.startsAt);
  const end = new Date(start.getTime() + service.duration_min * 60_000);
  const blockedUntil = new Date(end.getTime() + service.buffer_min * 60_000);

  const { data: appt, error } = await db
    .from("appointments")
    .insert({
      tenant_id: tenant.id,
      staff_id: staffId,
      service_id: service.id,
      client_id: clientId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      blocked_until: blockedUntil.toISOString(),
      status: "booked",
      source: "online",
      price: service.price,
      notes: v.note || null,
    })
    .select("id, tenant_id, starts_at, manage_token")
    .single();

  if (error || !appt) {
    if (isOverlapError(error)) return { ok: false, error: "Ovaj termin je upravo zauzet. Izaberite drugi." };
    return { ok: false, error: "Rezervacija nije uspjela. Pokušajte ponovo." };
  }

  if (v.consent) {
    await scheduleJobs(appt, tenant, true);
    // Potvrdu šaljemo odmah nakon odgovora, bez čekanja na cron.
    after(async () => {
      try {
        await processDueJobs(10);
      } catch (e) {
        console.error("after booking", e);
      }
    });
  }

  return { ok: true, data: { token: appt.manage_token } };
}
