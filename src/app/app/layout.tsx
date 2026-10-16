import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { requireTenant } from "@/lib/tenant";
import { signOut } from "../(auth)/actions";
import { BottomNav, SideNav } from "./nav";

export const metadata: Metadata = {
  title: { default: "Kalendar", template: "%s · Termini" },
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:grid md:min-h-dvh md:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-surface px-3 py-5 md:flex">
        <Link href="/app" className="px-2" aria-label="Kalendar">
          <Logo />
        </Link>
        <SideNav />
        <div className="mt-auto">
          <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-surface-2" />}>
            <TenantCard />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0 pb-24 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}

async function TenantCard() {
  const { tenant, user } = await requireTenant();
  return (
    <div className="space-y-1 rounded-2xl bg-surface-2 p-3">
      <p className="truncate font-semibold">{tenant.name}</p>
      <p className="truncate text-xs text-muted">{user.email}</p>
      <div className="flex items-center justify-between pt-2">
        <a
          href={`/${tenant.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          Stranica za klijente
          <ExternalLink className="size-3" aria-hidden />
        </a>
        <form action={signOut}>
          <button type="submit" className="rounded-lg p-1 text-muted hover:text-ink" aria-label="Odjava" title="Odjava">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
