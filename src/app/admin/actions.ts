"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import type { ActionResult } from "@/lib/types";

const schema = z.object({
  tenantId: z.uuid(),
  suspended: z.boolean(),
  reason: z.string().trim().max(200).optional().default(""),
});

export async function setTenantSuspended(input: z.input<typeof schema>): Promise<ActionResult> {
  if (!(await isPlatformAdmin())) return { ok: false, error: "Nemate pristup." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Neispravan zahtjev." };
  const v = parsed.data;
  const { error } = await adminClient()
    .from("tenants")
    .update({ suspended: v.suspended, suspended_reason: v.suspended ? v.reason || null : null })
    .eq("id", v.tenantId);
  if (error) return { ok: false, error: "Promjena nije sačuvana." };
  revalidatePath("/admin");
  revalidatePath(`/admin/saloni/${v.tenantId}`);
  return { ok: true, data: null };
}
