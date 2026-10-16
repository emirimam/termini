import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { requirePlatformAdmin } from "@/lib/platform";

export const metadata: Metadata = {
  title: { default: "Admin platforme", template: "%s · Admin · Termini" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-8">
          <Link href="/admin" aria-label="Admin početna">
            <Logo />
          </Link>
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper">Admin platforme</span>
          <nav className="ml-auto flex items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="text-muted hover:text-ink">Saloni</Link>
            <Link href="/app" className="text-muted hover:text-ink">Moj kalendar</Link>
          </nav>
        </div>
      </header>
      <Suspense fallback={<div className="mx-auto mt-10 h-96 max-w-6xl animate-pulse rounded-3xl bg-surface-2" />}>
        <Guard>{children}</Guard>
      </Suspense>
    </div>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>;
}
