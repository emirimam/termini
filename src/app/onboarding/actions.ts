"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { TenantKind } from "@/lib/types";

export type OnboardingState = { error?: string } | null;

// Putanje koje aplikacija koristi – salon ne može uzeti taj link.
const RESERVED = new Set([
  "app", "api", "auth", "t", "prijava", "registracija", "onboarding", "admin", "termini",
  "cijene", "kontakt", "pomoc", "uslovi", "privatnost", "static", "_next", "manifest.webmanifest",
]);

const schema = z.object({
  name: z.string().trim().min(2, "Upišite naziv salona.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/, "Link može imati 3–40 znakova: mala slova, brojeve i crtice."),
  kind: z.enum(["salon", "dental", "barber", "beauty", "other"]),
  ownerName: z.string().trim().max(80).optional().default(""),
});

const DEFAULT_SERVICES: Record<TenantKind, { name: string; duration_min: number; price: number; buffer_min?: number }[]> = {
  salon: [
    { name: "Žensko šišanje", duration_min: 45, price: 25 },
    { name: "Muško šišanje", duration_min: 30, price: 15 },
    { name: "Feniranje", duration_min: 30, price: 15 },
    { name: "Farbanje", duration_min: 120, price: 60 },
  ],
  barber: [
    { name: "Šišanje", duration_min: 30, price: 15 },
    { name: "Brada", duration_min: 20, price: 10 },
    { name: "Šišanje i brada", duration_min: 45, price: 22 },
  ],
  beauty: [
    { name: "Manikir", duration_min: 45, price: 25 },
    { name: "Pedikir", duration_min: 60, price: 35 },
    { name: "Tretman lica", duration_min: 60, price: 50 },
  ],
  dental: [
    { name: "Pregled", duration_min: 30, price: 30, buffer_min: 10 },
    { name: "Plombiranje", duration_min: 45, price: 60, buffer_min: 10 },
    { name: "Uklanjanje kamenca", duration_min: 45, price: 50, buffer_min: 10 },
    { name: "Izbjeljivanje zuba", duration_min: 60, price: 200, buffer_min: 10 },
  ],
  other: [{ name: "Termin", duration_min: 30, price: 0 }],
};

export async function createTenant(_prev: OnboardingState, form: FormData): Promise<OnboardingState> {
  const parsed = schema.safeParse({
    name: form.get("name"),
    slug: form.get("slug"),
    kind: form.get("kind"),
    ownerName: form.get("ownerName"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (RESERVED.has(v.slug)) return { error: "Ovaj link je rezervisan. Izaberite drugi." };

  const supabase = await createClient();
  const { data: tenantId, error } = await supabase.rpc("create_tenant", {
    p_name: v.name,
    p_slug: v.slug,
    p_kind: v.kind,
    p_owner_name: v.ownerName,
  });
  if (error || !tenantId) {
    if (error?.code === "23505") return { error: "Link je zauzet. Probajte drugi." };
    return { error: "Salon nije kreiran. Pokušajte ponovo." };
  }

  const services = DEFAULT_SERVICES[v.kind].map((s, i) => ({
    tenant_id: tenantId,
    name: s.name,
    duration_min: s.duration_min,
    buffer_min: s.buffer_min ?? 0,
    price: s.price || null,
    sort: i,
  }));
  await supabase.from("services").insert(services);
  if (v.kind === "dental") {
    await supabase.from("tenants").update({ slot_step_minutes: 15, cancel_until_hours: 24 }).eq("id", tenantId);
  }

  redirect("/app?dobrodosli=1");
}
