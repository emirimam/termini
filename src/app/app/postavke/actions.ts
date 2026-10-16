"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/tenant";
import type { ActionResult } from "@/lib/types";

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Upišite naziv salona.").max(80),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.union([z.email("Email nije ispravan."), z.literal("")]).optional().default(""),
  address: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(60).optional().default(""),
  description: z.string().trim().max(400).optional().default(""),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  online_booking_enabled: z.boolean(),
  min_notice_minutes: z.number().int().min(0).max(10080),
  horizon_days: z.number().int().min(1).max(365),
  slot_step_minutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30), z.literal(60)]),
  cancel_until_hours: z.number().int().min(0).max(168),
  reminder_channel: z.enum(["whatsapp_sms", "whatsapp", "sms", "off"]),
  reminder_offsets: z.array(z.number().int().min(15).max(10080)).max(3, "Najviše 3 podsjetnika."),
  send_confirmation: z.boolean(),
  quiet_start: z.string().regex(/^\d{2}:\d{2}$/),
  quiet_end: z.string().regex(/^\d{2}:\d{2}$/),
});

export type SettingsInput = z.input<typeof settingsSchema>;

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { supabase, tenant } = await requireAdmin();
  const { error } = await supabase
    .from("tenants")
    .update({
      ...v,
      phone: v.phone || null,
      email: v.email || null,
      address: v.address || null,
      city: v.city || null,
      description: v.description || null,
    })
    .eq("id", tenant.id);
  if (error) return { ok: false, error: "Postavke nisu sačuvane." };
  revalidatePath("/app", "layout");
  return { ok: true, data: null };
}
