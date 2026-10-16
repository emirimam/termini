"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Loader2, Plus, Trash2 } from "lucide-react";
import type { Service, Staff, TimeOff, WorkingHours } from "@/lib/types";
import { cx, initials } from "@/lib/format";
import { addDays, formatDayShort, ISO_DAYS, localDate } from "@/lib/time";
import { Dialog, Notice, Toggle } from "@/components/ui";
import { addTimeOff, deleteStaff, deleteTimeOff, saveStaff } from "./actions";

const COLORS = ["#0F6B5C", "#3554C4", "#B5476B", "#C7741C", "#6B4FB3", "#2E7D9A", "#5E7D2E", "#8A5A44"];

type Range = { start: string; end: string };
type Week = Record<number, Range[]>;

function toWeek(hours: WorkingHours[], staffId?: string): Week {
  const w: Week = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  for (const h of hours.filter((h) => h.staff_id === staffId)) {
    w[h.weekday].push({ start: h.start_time.slice(0, 5), end: h.end_time.slice(0, 5) });
  }
  return w;
}

function summarizeHours(week: Week) {
  const days = [1, 2, 3, 4, 5, 6, 7].filter((d) => week[d].length);
  if (!days.length) return "Ne radi";
  const first = week[days[0]].map((r) => `${r.start}–${r.end}`).join(", ");
  const same = days.every((d) => week[d].map((r) => `${r.start}–${r.end}`).join(", ") === first);
  const label = days.map((d) => ISO_DAYS[d].slice(0, 3)).join(", ");
  return same ? `${label} · ${first}` : `${days.length} dana sedmično`;
}

interface Props {
  timezone: string;
  staff: Staff[];
  services: Service[];
  links: { staff_id: string; service_id: string }[];
  hours: WorkingHours[];
  timeOff: TimeOff[];
}

export function TeamEditor({ timezone, staff, services, links, hours, timeOff }: Props) {
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [offOpen, setOffOpen] = useState(false);
  const router = useRouter();
  const [, start] = useTransition();

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {staff.map((s) => {
          const svc = links.filter((l) => l.staff_id === s.id).length;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setEditing(s)}
                className={cx(
                  "flex w-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-ink",
                  !s.active && "opacity-50",
                )}
              >
                <span className="font-display grid size-11 shrink-0 place-items-center rounded-full font-bold text-white" style={{ background: s.color }}>
                  {initials(s.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{s.name}</span>
                  {s.title && <span className="block truncate text-sm text-muted">{s.title}</span>}
                  <span className="mt-1 block text-sm text-muted">{summarizeHours(toWeek(hours, s.id))}</span>
                  <span className="block text-sm text-muted">
                    {svc === 0 ? "Sve usluge" : `${svc} ${svc === 1 ? "usluga" : svc < 5 ? "usluge" : "usluga"}`}
                    {!s.active && " · neaktivan"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button type="button" className="btn btn-primary mt-4" onClick={() => setEditing("new")}>
        <Plus className="size-4" /> Dodaj osobu
      </button>

      <section className="mt-12">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">Odsustva i neradni dani</h2>
            <p className="text-sm text-muted">Godišnji odmor, bolovanje, praznici – tih dana se ne nude termini.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOffOpen(true)}>
            <CalendarOff className="size-4" /> Dodaj
          </button>
        </div>
        {timeOff.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">Nema planiranih odsustava.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {timeOff.map((t) => {
              const from = localDate(t.starts_at, timezone);
              const to = addDays(localDate(t.ends_at, timezone), -1);
              const who = t.staff_id ? staff.find((s) => s.id === t.staff_id)?.name : "Cijeli salon";
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{who}</span>
                    <span className="text-sm text-muted">
                      {from === to ? formatDayShort(from) : `${formatDayShort(from)} – ${formatDayShort(to)}`}
                      {t.reason && ` · ${t.reason}`}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-muted hover:text-danger"
                    aria-label="Ukloni odsustvo"
                    onClick={() => start(async () => { await deleteTimeOff(t.id); router.refresh(); })}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <StaffDialog
        key={editing === "new" ? "new" : editing?.id ?? "none"}
        open={editing !== null}
        staff={editing === "new" ? null : editing}
        services={services}
        assigned={editing && editing !== "new" ? links.filter((l) => l.staff_id === editing.id).map((l) => l.service_id) : []}
        week={editing && editing !== "new" ? toWeek(hours, editing.id) : toWeek(hours, staff[0]?.id)}
        onClose={() => setEditing(null)}
      />
      <TimeOffDialog open={offOpen} staff={staff} onClose={() => setOffOpen(false)} />
    </>
  );
}

function StaffDialog({
  open,
  staff,
  services,
  assigned,
  week: initialWeek,
  onClose,
}: {
  open: boolean;
  staff: Staff | null;
  services: Service[];
  assigned: string[];
  week: Week;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(staff?.name ?? "");
  const [title, setTitle] = useState(staff?.title ?? "");
  const [color, setColor] = useState(staff?.color ?? COLORS[1]);
  const [active, setActive] = useState(staff?.active ?? true);
  const [allServices, setAllServices] = useState(assigned.length === 0);
  const [serviceIds, setServiceIds] = useState<string[]>(assigned);
  const [week, setWeek] = useState<Week>(initialWeek);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const setDay = (d: number, ranges: Range[]) => setWeek((w) => ({ ...w, [d]: ranges }));

  return (
    <Dialog open={open} onClose={onClose} title={staff ? staff.name : "Nova osoba"} wide>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await saveStaff({
              id: staff?.id,
              name,
              title,
              color,
              active,
              serviceIds: allServices ? [] : serviceIds,
              hours: Object.entries(week).flatMap(([d, rs]) => rs.map((r) => ({ weekday: Number(d), ...r }))),
            });
            if (!res.ok) return setError(res.error);
            onClose();
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pname">Ime</label>
            <input id="pname" className="field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="ptitle">Zvanje <span className="font-normal text-muted">(nije obavezno)</span></label>
            <input id="ptitle" className="field" placeholder="npr. Stomatolog, Senior frizer" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        <fieldset>
          <legend className="label">Boja u kalendaru</legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cx("size-8 rounded-full ring-offset-2 ring-offset-surface", color === c && "ring-2 ring-ink")}
                style={{ background: c }}
                aria-label={`Boja ${c}`}
                aria-pressed={color === c}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">Radno vrijeme</legend>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div key={d} className="flex flex-wrap items-center gap-2">
                <label className="flex w-32 items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--brand)]"
                    checked={week[d].length > 0}
                    onChange={(e) => setDay(d, e.target.checked ? [{ start: "08:00", end: "16:00" }] : [])}
                  />
                  {ISO_DAYS[d]}
                </label>
                {week[d].length === 0 && <span className="text-sm text-muted">Ne radi</span>}
                {week[d].map((r, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="px-1 text-xs text-muted">i</span>}
                    <input
                      type="time"
                      className="field tabular !w-[6.5rem] !py-1.5 !text-sm"
                      value={r.start}
                      onChange={(e) => setDay(d, week[d].map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                      aria-label={`${ISO_DAYS[d]} od`}
                    />
                    <span className="text-muted">–</span>
                    <input
                      type="time"
                      className="field tabular !w-[6.5rem] !py-1.5 !text-sm"
                      value={r.end}
                      onChange={(e) => setDay(d, week[d].map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                      aria-label={`${ISO_DAYS[d]} do`}
                    />
                  </span>
                ))}
                {week[d].length === 1 && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand hover:underline"
                    onClick={() => setDay(d, [{ ...week[d][0], end: "12:00" }, { start: "13:00", end: week[d][0].end > "13:00" ? week[d][0].end : "16:00" }])}
                  >
                    + pauza
                  </button>
                )}
                {week[d].length === 2 && (
                  <button type="button" className="text-xs font-semibold text-muted hover:underline" onClick={() => setDay(d, [{ start: week[d][0].start, end: week[d][1].end }])}>
                    bez pauze
                  </button>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">Usluge</legend>
          <Toggle checked={allServices} onChange={setAllServices} label="Radi sve usluge" />
          {!allServices && (
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--brand)]"
                    checked={serviceIds.includes(s.id)}
                    onChange={(e) => setServiceIds((ids) => (e.target.checked ? [...ids, s.id] : ids.filter((x) => x !== s.id)))}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <Toggle checked={active} onChange={setActive} label="Prima termine" />

        {error && <Notice kind="error">{error}</Notice>}

        <div className="flex gap-2">
          {staff && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (!confirm(`Ukloniti ${staff.name} iz tima?`)) return;
                  const res = await deleteStaff(staff.id);
                  if (!res.ok) return setError(res.error);
                  onClose();
                  router.refresh();
                })
              }
            >
              Ukloni
            </button>
          )}
          <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Sačuvaj
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function TimeOffDialog({ open, staff, onClose }: { open: boolean; staff: Staff[]; onClose: () => void }) {
  const router = useRouter();
  const [staffId, setStaffId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onClose={onClose} title="Odsustvo">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await addTimeOff({ staffId, from, to: to || from, reason });
            if (!res.ok) return setError(res.error);
            setFrom("");
            setTo("");
            setReason("");
            onClose();
            router.refresh();
          });
        }}
      >
        <div>
          <label className="label" htmlFor="ostaff">Ko</label>
          <select id="ostaff" className="field" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="all">Cijeli salon (zatvoreno)</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="ofrom">Od</label>
            <input id="ofrom" type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="oto">Do (uključivo)</label>
            <input id="oto" type="date" className="field" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="oreason">Razlog <span className="font-normal text-muted">(vidi samo salon)</span></label>
          <input id="oreason" className="field" placeholder="npr. Godišnji odmor" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <p className="hint">Već zakazani termini u tom periodu ostaju – provjerite ih u kalendaru.</p>
        {error && <Notice kind="error">{error}</Notice>}
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Sačuvaj odsustvo
        </button>
      </form>
    </Dialog>
  );
}
