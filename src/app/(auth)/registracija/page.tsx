import { Suspense } from "react";
import type { Metadata } from "next";
import { isGoogleEnabled } from "@/lib/auth-providers";
import { AuthForm } from "../auth-form";
import { GoogleButton, OrDivider } from "../google-button";

export const metadata: Metadata = {
  title: "Registrujte salon besplatno",
  description: "Napravite nalog za salon ili ordinaciju i počnite primati online termine s podsjetnicima na WhatsApp i SMS.",
  alternates: { canonical: "/registracija" },
};

export default function Page() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Registrujte salon</h1>
      <p className="mb-8 mt-1 text-muted">Besplatno. Prvi online termin za pet minuta.</p>
      <Suspense fallback={null}>
        <Google />
      </Suspense>
      <AuthForm mode="signup" />
    </>
  );
}

async function Google() {
  if (!(await isGoogleEnabled())) return null;
  return (
    <>
      <GoogleButton next="/onboarding" label="Registruj se s Google nalogom" />
      <OrDivider />
    </>
  );
}
