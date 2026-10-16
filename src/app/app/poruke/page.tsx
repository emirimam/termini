import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { isSmsConfigured, isWhatsAppConfigured, serverEnv } from "@/lib/env";
import { formatPhone } from "@/lib/phone";
import { localDate, localTime, formatDayShort } from "@/lib/time";
import { cx } from "@/lib/format";
import { ListSkeleton, PageHeader, PageShell } from "../page-header";

export const metadata: Metadata = { title: "Poruke" };

const STATUS: Record<string, { label: string; cls: string }> = {
  queued: { label: "U redu", cls: "bg-surface-2" },
  sent: { label: "Poslano", cls: "bg-surface-2" },
  delivered: { label: "Isporučeno", cls: "bg-brand-soft text-brand" },
  read: { label: "Pročitano", cls: "bg-ok-soft text-ok" },
  failed: { label: "Neuspjelo", cls: "bg-danger-soft text-danger" },
  received: { label: "Primljeno", cls: "bg-warn-soft" },
};

export default function Page() {
  return (
    <PageShell>
      <PageHeader title="Poruke" description="Potvrde, podsjetnici i odgovori klijenata. WhatsApp ide prvi, a SMS ako WhatsApp ne uspije." />
      <Suspense fallback={<ListSkeleton />}>
        <MessagesLoader />
      </Suspense>
    </PageShell>
  );
}

async function MessagesLoader() {
  const { supabase, tenant } = await requireTenant();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [list, wa, sms] = await Promise.all([
    supabase
      .from("message_log")
      .select("id, channel, direction, phone, body, status, error, created_at, template")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(150),
    supabase
      .from("message_log")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("channel", "whatsapp")
      .eq("direction", "out")
      .neq("status", "failed")
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("message_log")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("channel", "sms")
      .eq("direction", "out")
      .neq("status", "failed")
      .gte("created_at", monthStart.toISOString()),
  ]);

  const dry = serverEnv().dryRun || (!isWhatsAppConfigured() && !isSmsConfigured());
  const rows = list.data ?? [];
  const tz = tenant.timezone;

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="WhatsApp ovaj mjesec" value={wa.count ?? 0} />
        <Stat label="SMS ovaj mjesec" value={sms.count ?? 0} />
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-muted">Kanali</p>
          <p className="mt-1 text-sm font-semibold">
            WhatsApp {isWhatsAppConfigured() ? "povezan" : "nije povezan"}
            <br />
            SMS {isSmsConfigured() ? "povezan" : "nije povezan"}
          </p>
        </div>
      </div>

      {dry && (
        <p className="mb-6 rounded-2xl bg-warn-soft p-4 text-sm">
          <strong>Probni režim.</strong> Poruke se upisuju ovdje ali se ne šalju klijentima dok se ne povežu WhatsApp i SMS
          (varijable okruženja – vidi upute u README).
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
          Još nema poruka. Prva stiže kad neko zakaže termin.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {rows.map((m) => {
            const st = STATUS[m.status] ?? STATUS.sent;
            return (
              <li key={m.id} className="flex gap-3 px-4 py-3">
                <span
                  className={cx(
                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                    m.direction === "in" ? "bg-warn-soft" : "bg-surface-2",
                  )}
                  aria-label={m.direction === "in" ? "Dolazna" : "Odlazna"}
                >
                  {m.direction === "in" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="tabular font-semibold">{formatPhone(m.phone)}</span>
                    <span className="rounded bg-surface-2 px-1.5 text-xs font-medium">{m.channel === "whatsapp" ? "WhatsApp" : "SMS"}</span>
                    <span className={cx("rounded-full px-2 text-xs font-semibold", st.cls)}>{st.label}</span>
                    <span className="tabular ml-auto text-xs text-muted">
                      {formatDayShort(localDate(m.created_at, tz))} {localTime(m.created_at, tz)}
                    </span>
                  </div>
                  {m.body && <p className="mt-1 text-sm text-muted">{m.body}</p>}
                  {m.error && <p className="mt-1 text-xs text-danger">{m.error}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display tabular mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
