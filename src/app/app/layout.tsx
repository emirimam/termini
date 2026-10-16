import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { requireTenant } from "@/lib/tenant";
import { isPlatformAdmin } from "@/lib/platform";
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
      <div className="min-w-0 pb-24 md:pb-0">
        <Suspense fallback={null}>
          <SuspendedNotice />
        </Suspense>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

async function SuspendedNotice() {
  const { tenant } = await requireTenant();
  if (!tenant.suspended) return null;
  return (
    <div role="alert" className="bg-danger-soft px-4 py-3 text-sm md:px-6">
      <strong className="text-danger">Online zakazivanje i podsjetnici su privremeno zaustavljeni.</strong>{" "}
      {tenant.suspended_reason ?? "Za više informacija javite se podršci Terminija."}
    </div>
  );
}

async function TenantCard() {
  const [{ tenant, user }, platformAdmin] = await Promise.all([requireTenant(), isPlatformAdmin()]);
  return (
    <div className="space-y-1 rounded-2xl bg-surface-2 p-3">
      {platformAdmin && (
        <Link href="/admin" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
          <ShieldCheck className="size-3.5" aria-hidden /> Admin platforme
        </Link>
      )}
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
