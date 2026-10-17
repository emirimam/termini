"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type AuthState = { error?: string; info?: string } | null;

const creds = z.object({
  email: z.email("Upišite ispravnu email adresu."),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 znakova."),
});

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/app";
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = creds.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Email još nije potvrđen. Otvorite link koji smo vam poslali." };
    }
    return { error: "Pogrešan email ili lozinka." };
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = creds.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${env.appUrl}/auth/callback?next=/onboarding` },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { error: "Nalog s ovim emailom već postoji. Prijavite se." };
    }
    return { error: error.message };
  }
  // Ako je potvrda emaila isključena, sesija postoji odmah.
  if (data.session) redirect("/onboarding");
  return { info: `Poslali smo link za potvrdu na ${parsed.data.email}. Otvorite ga da nastavite.` };
}

export async function signInWithGoogle(form: FormData) {
  const next = safeNext(form.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/prijava?greska=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/prijava");
}
