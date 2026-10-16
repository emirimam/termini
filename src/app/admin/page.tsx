import { Suspense } from "react";
import { requirePlatformAdmin } from "@/lib/platform";
import { loadTenantRows } from "./data";
import { TenantsTable } from "./tenants-table";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface-2" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  // Layout i stranica se renderuju paralelno – provjera mora biti i ovdje.
  await requirePlatformAdmin();
  const rows = await loadTenantRows();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((a, r) => a + f(r), 0);
  const active = rows.filter((r) => r.stats.appointments_30d > 0 && !r.tenant.suspended).length;
  const newThisMonth = rows.filter((r) => new Date(r.tenant.created_at) >= monthStart).length;
  const bookings30 = sum((r) => r.stats.appointments_30d);
  const noShows = sum((r) => r.stats.no_shows_30d);

  const stats = [
    { label: "Saloni", value: rows.length, sub: `${newThisMonth} novih ovaj mjesec` },
    { label: "Aktivni (30 dana)", value: active, sub: "imaju bar jedan novi termin" },
    { label: "Novi termini (30 dana)", value: bookings30, sub: `${noShows} nedolazaka` },
    { label: "Poruke ovaj mjesec", value: sum((r) => r.stats.wa_month + r.stats.sms_month), sub: `${sum((r) => r.stats.wa_month)} WhatsApp · ${sum((r) => r.stats.sms_month)} SMS` },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Saloni na platformi</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="font-display tabular mt-1 text-3xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>
      <TenantsTable
        rows={rows.map((r) => ({
          id: r.tenant.id,
          name: r.tenant.name,
          slug: r.tenant.slug,
          kind: r.tenant.kind,
          city: r.tenant.city,
          createdAt: r.tenant.created_at,
          suspended: r.tenant.suspended,
          owners: r.owners,
          ...r.stats,
        }))}
      />
    </>
  );
}
