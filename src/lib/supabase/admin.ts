import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

// Service role klijent: zaobilazi RLS. Koristi se SAMO na serveru za javnu
// rezervaciju, upravljanje terminom preko tokena, podsjetnike i webhookove.
// Svaki upit mora eksplicitno filtrirati po tenant_id.
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function adminClient() {
  if (!cached) {
    const key = serverEnv().serviceRoleKey;
    if (!env.supabaseUrl || !key) {
      throw new Error("Supabase nije podešen (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    }
    cached = createClient<Database>(env.supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
