import "server-only";
import { cacheLife } from "next/cache";
import { env } from "@/lib/env";

// Je li Google prijava uključena u Supabaseu (Authentication → Providers)?
// Dugme se pojavljuje samo kad jeste, pa nema greške ako provider još nije podešen.
export async function isGoogleEnabled(): Promise<boolean> {
  "use cache";
  cacheLife("minutes");
  if (!env.supabaseUrl || !env.supabaseAnonKey) return false;
  try {
    const res = await fetch(`${env.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: env.supabaseAnonKey },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { external?: { google?: boolean } };
    return Boolean(json.external?.google);
  } catch {
    return false;
  }
}
