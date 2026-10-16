"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/tenant";
import { zonedInstant, addDays } from "@/lib/time";
import type { ActionResult } from "@/lib/types";

const time = z.string().regex(/^\d{2}:\d{2}$/);

const staffSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Upišite ime.").max(80),
  title: z.string().trim().max(80).optional().default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  active: z.boolean(),
  serviceIds: z.array(z.uuid()),
  hours: z
    .array(z.object({ weekday: z.number().int().min(1).max(7), start: time, end: time }))
    .refine((h) => h.every((r) => r.end > r.start), "Kraj radnog vremena mora biti nakon početka."),
});

export async function saveStaff(input: z.input<typeof staffSchema>): Promise<ActionResult> {
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { supabase, tenant } = await requireAdmin();

  let staffId = v.id;
  const row = { name: v.name, title: v.title || null, color: v.color, active: v.active };
  if (staffId) {
    const { error } = await supabase.from("staff").update(row).eq("id", staffId).eq("tenant_id", tenant.id);
    if (error) return { ok: false, error: "Promjene nisu sačuvane." };
  } else {
    const { data, error } = await supabase.from("staff").insert({ ...row, tenant_id: tenant.id, sort: 999 }).select("id").single();
    if (error || !data) return { ok: false, error: "Osoba nije dodana." };
    staffId = data.id;
  }

  // Usluge i radno vrijeme se zamjenjuju u cjelini.
  await supabase.from("staff_services").delete().eq("staff_id", staffId).eq("tenant_id", tenant.id);
  if (v.serviceIds.length) {
    await supabase
      .from("staff_services")
      .insert(v.serviceIds.map((service_id) => ({ staff_id: staffId!, service_id, tenant_id: tenant.id })));
  }
  await supabase.from("working_hours").delete().eq("staff_id", staffId).eq("tenant_id", tenant.id);
  if (v.hours.length) {
    const { error } = await supabase.from("working_hours").insert(
      v.hours.map((h) => ({ tenant_id: tenant.id, staff_id: staffId!, weekday: h.weekday, start_time: h.start, end_time: h.end })),
    );
    if (error) return { ok: false, error: "Radno vrijeme nije sačuvano." };
  }

  revalidatePath("/app/tim");
  revalidatePath("/app");
  return { ok: true, data: null };
}

export async function deleteStaff(id: string): Promise<ActionResult> {
  const { supabase, tenant } = await requireAdmin();
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("staff_id", id);
  const { error } = count
    ? await supabase.from("staff").update({ active: false }).eq("id", id).eq("tenant_id", tenant.id)
    : await supabase.from("staff").delete().eq("id", id).eq("tenant_id", tenant.id);
  if (error) return { ok: false, error: "Brisanje nije uspjelo." };
  revalidatePath("/app/tim");
  return { ok: true, data: null };
}

const offSchema = z.object({
  staffId: z.union([z.uuid(), z.literal("all")]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Izaberite datum."),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Izaberite datum."),
  reason: z.string().trim().max(80).optional().default(""),
});

export async function addTimeOff(input: z.input<typeof offSchema>): Promise<ActionResult> {
  const parsed = offSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (v.to < v.from) return { ok: false, error: "Datum završetka je prije početka." };
  const { supabase, tenant } = await requireAdmin();
  const { error } = await supabase.from("time_off").insert({
    tenant_id: tenant.id,
    staff_id: v.staffId === "all" ? null : v.staffId,
    starts_at: zonedInstant(v.from, "00:00", tenant.timezone).toISOString(),
    ends_at: zonedInstant(addDays(v.to, 1), "00:00", tenant.timezone).toISOString(),
    reason: v.reason || null,
  });
  if (error) return { ok: false, error: "Odsustvo nije sačuvano." };
  revalidatePath("/app/tim");
  revalidatePath("/app");
  return { ok: true, data: null };
}

export async function deleteTimeOff(id: string): Promise<ActionResult> {
  const { supabase, tenant } = await requireAdmin();
  await supabase.from("time_off").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/app/tim");
  return { ok: true, data: null };
}
