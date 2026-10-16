import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Prijava" };

type Props = { searchParams: Promise<{ next?: string; greska?: string }> };

export default function Page({ searchParams }: Props) {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Prijava</h1>
      <p className="mb-8 mt-1 text-muted">Kalendar vašeg salona čeka.</p>
      <Suspense fallback={<AuthForm mode="login" />}>
        <LoginWithParams searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LoginWithParams({ searchParams }: Props) {
  const { next, greska } = await searchParams;
  return (
    <>
      {greska && (
        <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          Link za prijavu je istekao ili nije ispravan. Prijavite se ponovo.
        </p>
      )}
      <AuthForm mode="login" next={next} />
    </>
  );
}
