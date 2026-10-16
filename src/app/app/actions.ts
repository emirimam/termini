"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant";
import { cancelPendingJobs, isOverlapError, queueCancellationMessage, scheduleJobs } from "@/lib/booking";
import { normalizePhone } from "@/lib/phone";
import { processDueJobs } from "@/lib/reminders/process";
import { zonedInstant } from "@/lib/time";
import type { ActionResult, AppointmentStatus } from "@/lib/types";

function kick() {
  after(async () => {
    try {
      await processDueJobs(10);
    } catch (e) {
      console.error("after admin action", e);
    }
  });
}

export async function searchClients(q: string) {
  const { supabase, tenant } = await requireTenant();
  // Znakovi koji imaju posebno značenje u PostgREST filteru se uklanjaju.
  const term = q.replace(/[,()*%\\:."']/g, " ").trim();
  if (term.length < 2) return [];
  const digits = term.replace(/\D/g, "");
  const filter = digits.length >= 3 ? `name.ilike.%${term}%,phone.ilike.%${digits.replace(/^0/, "")}%` : `name.ilike.%${term}%`;
  const { data } = await supabase
    .from("clients")
    .select("id, name, phone, blocked, no_show_count")
    .eq("tenant_id", tenant.id)
    .or(filter)
    .order("name")
    .limit(8);
  return data ?? [];
}

const newSchema = z
  .object({
    clientId: z.uuid().optional(),
    clientName: z.string().trim().max(120).optional(),
    clientPhone: z.string().trim().max(30).optional(),
    serviceId: z.uuid({ message: "Izaberite uslugu." }),
    staffId: z.uuid({ message: "Izaberite osobu." }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Izaberite datum."),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Upišite vrijeme."),
    notes: z.string().trim().max(500).optional(),
    notify: z.boolean(),
  })
  .refine((v) => v.clientId || (v.clientName && v.clientName.length >= 2 && v.clientPhone), {
    message: "Izaberite klijenta ili upišite ime i broj telefona.",
  });

export async function createAppointment(input: z.input<typeof newSchema>): Promise<ActionResult> {
  const parsed = newSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { supabase, tenant } = await requireTenant();

  let clientId = v.clientId;
  if (!clientId) {
    const phone = normalizePhone(v.clientPhone ?? "");
    if (!phone) return { ok: false, error: "Broj telefona nije ispravan." };
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("phone", phone)
      .maybeSingle();
    if (existing) clientId = existing.id;
    else {
      const { data: created, error } = await supabase
        .from("clients")
        .insert({ tenant_id: tenant.id, name: v.clientName!, phone, source: "admin" })
        .select("id")
        .single();
      if (error || !created) return { ok: false, error: "Klijent nije sačuvan." };
      clientId = created.id;
    }
  }

  const { data: service } = await supabase
    .from("services")
    .select("id, duration_min, buffer_min, price")
    .eq("tenant_id", tenant.id)
    .eq("id", v.serviceId)
    .maybeSingle();
  if (!service) return { ok: false, error: "Usluga ne postoji." };

  const start = zonedInstant(v.date, v.time, tenant.timezone);
  const end = new Date(start.getTime() + service.duration_min * 60_000);
  const blocked = new Date(end.getTime() + service.buffer_min * 60_000);

  const { data: appt, error } = await supabase
    .from("appointments")
    .insert({
      tenant_id: tenant.id,
      staff_id: v.staffId,
      service_id: service.id,
      client_id: clientId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      blocked_until: blocked.toISOString(),
      status: "booked",
      source: "admin",
      price: service.price,
      notes: v.notes || null,
    })
    .select("id, tenant_id, starts_at")
    .single();
  if (error || !appt) {
    if (isOverlapError(error)) return { ok: false, error: "Osoba već ima termin u to vrijeme." };
    return { ok: false, error: "Termin nije sačuvan." };
  }

  await scheduleJobs(appt, tenant, v.notify);
  if (v.notify) kick();
  revalidatePath("/app");
  return { ok: true, data: null };
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus, notify = false): Promise<ActionResult> {
  const { supabase, tenant } = await requireTenant();
  const { data: before } = await supabase
    .from("appointments")
    .select("id, tenant_id, status, client_id")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .maybeSingle();
  if (!before) return { ok: false, error: "Termin ne postoji." };

  const { error } = await supabase
    .from("appointments")
    .update({ status, ...(status === "cancelled" ? { cancelled_by: "staff" } : {}) })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) {
    if (isOverlapError(error)) return { ok: false, error: "Termin se preklapa s drugim terminom." };
    return { ok: false, error: "Promjena nije sačuvana." };
  }

  if (status === "cancelled" || status === "completed" || status === "no_show") await cancelPendingJobs(id);
  if (status === "cancelled" && notify) {
    await queueCancellationMessage(before);
    kick();
  }
  // Brojač nedolazaka pomaže da salon prepozna klijente koji često ne dođu.
  if (status === "no_show" && before.status !== "no_show") {
    const { data: c } = await supabase.from("clients").select("no_show_count").eq("id", before.client_id).single();
    if (c) await supabase.from("clients").update({ no_show_count: c.no_show_count + 1 }).eq("id", before.client_id);
  }
  revalidatePath("/app");
  return { ok: true, data: null };
}
