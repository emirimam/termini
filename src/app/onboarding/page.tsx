import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { getSession } from "@/lib/tenant";
import { OnboardingForm } from "./form";

export const metadata: Metadata = { title: "Novi salon" };

export default function Page() {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md content-center px-4 py-12">
      <Logo className="mb-10" />
      <h1 className="font-display text-3xl font-bold">Vaš salon</h1>
      <p className="mb-8 mt-1 text-muted">Ovo vide klijenti kad otvore vaš link za zakazivanje.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  const s = await getSession();
  if (!s.user) redirect("/prijava");
  if (s.tenant) redirect("/app");
  return <OnboardingForm />;
}
