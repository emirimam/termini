"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { KIND_LABEL, type TenantKind } from "@/lib/types";
import { cx } from "@/lib/format";

interface Row {
  id: string;
  name: string;
  slug: string;
  kind: TenantKind;
  city: string | null;
  createdAt: string;
  suspended: boolean;
  owners: string[];
  appointments_total: number;
  appointments_30d: number;
  upcoming: number;
  wa_month: number;
  sms_month: number;
  failed_month: number;
  last_booking_at: string | null;
}

type Filter = "all" | "active" | "inactive" | "suspended";

const dateFmt = new Intl.DateTimeFormat("bs-BA", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Sarajevo" });

export function TenantsTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "active" && (r.suspended || r.appointments_30d === 0)) return false;
      if (filter === "inactive" && (r.suspended || r.appointments_30d > 0)) return false;
      if (filter === "suspended" && !r.suspended) return false;
      if (!term) return true;
      return [r.name, r.slug, r.city ?? "", ...r.owners].some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, q, filter]);

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="field !pl-9" placeholder="Naziv, link, grad ili email vlasnika" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Traži salone" />
        </div>
        {(
          [
            ["all", "Svi"],
            ["active", "Aktivni"],
            ["inactive", "Bez termina"],
            ["suspended", "Suspendovani"],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cx(
              "rounded-full border px-3.5 py-2 text-sm font-medium",
              filter === f ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Salon</th>
              <th className="px-4 py-3 font-medium">Vlasnik</th>
              <th className="px-4 py-3 text-right font-medium">Termini 30 d</th>
              <th className="px-4 py-3 text-right font-medium">Nadolazeći</th>
              <th className="px-4 py-3 text-right font-medium">Poruke (mj.)</th>
              <th className="px-4 py-3 font-medium">Registrovan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((r) => (
              <tr key={r.id} className={cx("hover:bg-surface-2", r.suspended && "opacity-60")}>
                <td className="px-4 py-3">
                  <Link href={`/admin/saloni/${r.id}`} className="font-semibold hover:underline">
                    {r.name}
                  </Link>
                  {r.suspended && <span className="ml-2 rounded-full bg-danger-soft px-2 text-xs font-semibold text-danger">suspendovan</span>}
                  <span className="block text-xs text-muted">
                    /{r.slug} · {KIND_LABEL[r.kind]}
                    {r.city ? ` · ${r.city}` : ""}
                  </span>
                </td>
                <td className="max-w-48 truncate px-4 py-3 text-muted">{r.owners.join(", ") || "—"}</td>
                <td className="tabular px-4 py-3 text-right font-semibold">{r.appointments_30d}</td>
                <td className="tabular px-4 py-3 text-right">{r.upcoming}</td>
                <td className="tabular px-4 py-3 text-right">
                  {r.wa_month + r.sms_month}
                  {r.failed_month > 0 && <span className="ml-1 text-xs text-danger">({r.failed_month} neusp.)</span>}
                </td>
                <td className="tabular px-4 py-3 text-muted">{dateFmt.format(new Date(r.createdAt))}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Nema salona za ovaj filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
