import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// Administratori platforme se prepoznaju po (potvrđenom) emailu prijavljenog
// korisnika i tabeli platform_admins koju čita samo server.

export const isPlatformAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!user || !email || !user.email_confirmed_at) return null;
  const { data } = await adminClient().from("platform_admins").select("email").eq("email", email).maybeSingle();
  return data ? user : null;
});

/** Za /admin: neovlaštenima stranica ne postoji (404), da se ne otkriva panel. */
export async function requirePlatformAdmin() {
  const user = await isPlatformAdmin();
  if (!user) notFound();
  return user;
}
