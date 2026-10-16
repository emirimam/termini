"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/tenant";
import type { ActionResult } from "@/lib/types";

const serviceSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Upišite naziv usluge.").max(80),
  description: z.string().trim().max(300).optional().default(""),
  duration_min: z.coerce.number().int().min(5, "Trajanje je najmanje 5 minuta.").max(600),
  buffer_min: z.coerce.number().int().min(0).max(120).default(0),
  price: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v.replace(",", ".")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Cijena nije ispravna."),
  active: z.boolean().default(true),
});

export async function saveService(input: z.input<typeof serviceSchema>): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...v } = parsed.data;
  const { supabase, tenant } = await requireAdmin();
  const row = { ...v, description: v.description || null };

  const { error } = id
    ? await supabase.from("services").update(row).eq("id", id).eq("tenant_id", tenant.id)
    : await supabase.from("services").insert({ ...row, tenant_id: tenant.id, sort: 999 });
  if (error) return { ok: false, error: "Usluga nije sačuvana." };
  revalidatePath("/app/usluge");
  return { ok: true, data: null };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const { supabase, tenant } = await requireAdmin();
  // Usluga s terminima se samo sakriva da historija ostane čitljiva.
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("service_id", id);
  const { error } = count
    ? await supabase.from("services").update({ active: false }).eq("id", id).eq("tenant_id", tenant.id)
    : await supabase.from("services").delete().eq("id", id).eq("tenant_id", tenant.id);
  if (error) return { ok: false, error: "Brisanje nije uspjelo." };
  revalidatePath("/app/usluge");
  return { ok: true, data: null };
}

export async function moveService(id: string, direction: -1 | 1): Promise<ActionResult> {
  const { supabase, tenant } = await requireAdmin();
  const { data } = await supabase.from("services").select("id, sort, name").eq("tenant_id", tenant.id).order("sort").order("name");
  const list = data ?? [];
  const i = list.findIndex((s) => s.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true, data: null };
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((s, idx) => supabase.from("services").update({ sort: idx }).eq("id", s.id).eq("tenant_id", tenant.id)));
  revalidatePath("/app/usluge");
  return { ok: true, data: null };
}
