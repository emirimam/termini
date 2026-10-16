"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant";
import { normalizePhone } from "@/lib/phone";
import type { ActionResult } from "@/lib/types";

const clientSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Upišite ime.").max(120),
  phone: z.string().trim().min(6, "Upišite broj telefona."),
  email: z.union([z.email("Email nije ispravan."), z.literal("")]).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  messaging_consent: z.boolean(),
  blocked: z.boolean(),
});

export async function saveClient(input: z.input<typeof clientSchema>): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...v } = parsed.data;
  const phone = normalizePhone(v.phone);
  if (!phone) return { ok: false, error: "Broj telefona nije ispravan." };
  const { supabase, tenant } = await requireTenant();
  const row = { ...v, phone, email: v.email || null, notes: v.notes || null };

  const { error } = id
    ? await supabase.from("clients").update(row).eq("id", id).eq("tenant_id", tenant.id)
    : await supabase.from("clients").insert({ ...row, tenant_id: tenant.id, source: "admin" });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Klijent s ovim brojem već postoji." };
    return { ok: false, error: "Klijent nije sačuvan." };
  }
  revalidatePath("/app/klijenti");
  return { ok: true, data: null };
}

const importSchema = z
  .array(
    z.object({
      name: z.string().max(200),
      phone: z.string().max(60),
      email: z.string().max(200).optional(),
      notes: z.string().max(1000).optional(),
    }),
  )
  .max(5000, "Najviše 5000 kontakata odjednom.");

export async function importClients(
  rows: z.input<typeof importSchema>,
): Promise<ActionResult<{ added: number; skipped: number; invalid: number }>> {
  const parsed = importSchema.safeParse(rows);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { supabase, tenant } = await requireTenant();

  let invalid = 0;
  const byPhone = new Map<string, { tenant_id: string; name: string; phone: string; email: string | null; notes: string | null; source: string }>();
  for (const r of parsed.data) {
    const phone = normalizePhone(r.phone);
    const name = r.name.trim();
    if (!phone || name.length < 1) {
      invalid++;
      continue;
    }
    const email = r.email?.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email.trim()) ? r.email.trim() : null;
    byPhone.set(phone, { tenant_id: tenant.id, name: name.slice(0, 120), phone, email, notes: r.notes?.trim() || null, source: "import" });
  }

  const unique = [...byPhone.values()];
  let added = 0;
  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500);
    const { data, error } = await supabase
      .from("clients")
      .upsert(chunk, { onConflict: "tenant_id,phone", ignoreDuplicates: true })
      .select("id");
    if (error) return { ok: false, error: `Uvoz prekinut: ${error.message}` };
    added += data?.length ?? 0;
  }

  revalidatePath("/app/klijenti");
  return { ok: true, data: { added, skipped: parsed.data.length - invalid - added, invalid } };
}
