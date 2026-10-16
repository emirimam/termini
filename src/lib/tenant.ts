import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/types";

// Trenutni korisnik i njegov salon. React cache() sprječava ponovne upite
// unutar istog renderovanja (layout + stranica).

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, tenant: null, role: null } as const;

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role, tenant:tenants(*)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return {
    supabase,
    user,
    tenant: (membership?.tenant as unknown as Tenant | null) ?? null,
    role: (membership?.role as "owner" | "admin" | "staff" | undefined) ?? null,
  } as const;
});

/** Za stranice panela: prijavljen korisnik sa salonom ili redirect. */
export async function requireTenant() {
  const s = await getSession();
  if (!s.user) redirect("/prijava");
  if (!s.tenant) redirect("/onboarding");
  return { supabase: s.supabase, user: s.user, tenant: s.tenant, role: s.role ?? "staff" };
}

export async function requireAdmin() {
  const s = await requireTenant();
  if (s.role !== "owner" && s.role !== "admin") {
    throw new Error("Samo vlasnik ili administrator može mijenjati ova podešavanja.");
  }
  return s;
}
