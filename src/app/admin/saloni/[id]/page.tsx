import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform";
import { adminClient } from "@/lib/supabase/admin";
import { KIND_LABEL, STATUS_LABEL, type AppointmentStatus } from "@/lib/types";
import { formatDayShort, localDate, localTime } from "@/lib/time";
import { offsetLabel } from "@/lib/reminders/plan";
import { loadTenantRows } from "../../data";
import { SuspendControl } from "./suspend-control";

type Props = { params: Promise<{ id: string }> };

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface-2" />}>
      <TenantDetail params={params} />
    </Suspense>
  );
}

const CHANNEL: Record<string, string> = {
  whatsapp_sms: "WhatsApp, pa SMS",
  whatsapp: "Samo WhatsApp",
  sms: "Samo SMS",
  off: "Isključeno",
};

async function TenantDetail({ params }: Props) {
  await requirePlatformAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const rows = await loadTenantRows();
  const row = rows.find((r) => r.tenant.id === id);
  if (!row) notFound();
  const { tenant: t, stats: s, owners } = row;

  const db = adminClient();
  const [recent, services, staff] = await Promise.all([
    db
      .from("appointments")
      .select("id, starts_at, status, source, service:services(name), staff:staff(name)")
      .eq("tenant_id", t.id)
      .order("created_at", { ascending: false })
      .limit(15),
    db.from("services").select("id", { count: "exact", head: true }).eq("tenant_id", t.id).eq("active", true),
    db.from("staff").select("name").eq("tenant_id", t.id).eq("active", true).order("sort"),
  ]);

  const tz = t.timezone;
  const facts: [string, string][] = [
    ["Vrsta", KIND_LABEL[t.kind]],
    ["Vlasnik", owners.join(", ") || "—"],
    ["Telefon", t.phone ?? "—"],
    ["Adresa", [t.address, t.city].filter(Boolean).join(", ") || "—"],
    ["Tim", (staff.data ?? []).map((x) => x.name).join(", ") || "—"],
    ["Aktivnih usluga", String(services.count ?? 0)],
    ["Online zakazivanje", t.online_booking_enabled ? "Uključeno" : "Isključeno"],
    ["Podsjetnici", `${CHANNEL[t.reminder_channel]} · ${t.reminder_offsets.map(offsetLabel).join(", ")}`],
    ["Registrovan", `${formatDayShort(localDate(t.created_at, tz))} ${localDate(t.created_at, tz).slice(0, 4)}.`],
  ];

  return (
    <>
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Svi saloni
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t.name}</h1>
          <a href={`/${t.slug}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            /{t.slug} <ExternalLink className="size-3.5" />
          </a>
        </div>
        <SuspendControl tenantId={t.id} suspended={t.suspended} reason={t.suspended_reason} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Termina ukupno", s.appointments_total],
          ["Novih 30 d", s.appointments_30d],
          ["Nadolazećih", s.upcoming],
          ["Nedolazaka 30 d", s.no_shows_30d],
          ["Klijenata", s.clients],
          ["Poruka (mj.)", `${s.wa_month} WA · ${s.sms_month} SMS`],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-display tabular mt-1 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-lg font-bold">Podaci</h2>
          <dl className="mt-3 grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-lg font-bold">Posljednji termini</h2>
          {(recent.data ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted">Još nema termina.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {(recent.data ?? []).map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2">
                  <span className="tabular w-24 shrink-0 text-muted">
                    {formatDayShort(localDate(a.starts_at, tz))} {localTime(a.starts_at, tz)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {(a.service as unknown as { name: string } | null)?.name} · {(a.staff as unknown as { name: string } | null)?.name}
                  </span>
                  <span className="text-xs text-muted">{a.source === "online" ? "online" : "salon"}</span>
                  <span className="w-20 text-right text-xs font-semibold">{STATUS_LABEL[a.status as AppointmentStatus]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
