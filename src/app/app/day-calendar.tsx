"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, MessageCircle, Phone, Plus } from "lucide-react";
import type { AppointmentStatus, Service, Staff, WorkingHours } from "@/lib/types";
import { addDays, formatDayLong, localDate, localMinutes, localTime, minutesToTime, timeToMinutes, zonedInstant } from "@/lib/time";
import { env } from "@/lib/env";
import { cx, formatPrice, initials } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { Dialog, Notice, StatusBadge } from "@/components/ui";
import { createAppointment, searchClients, setAppointmentStatus } from "./actions";

export interface CalendarAppointment {
  id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  source: "online" | "admin";
  price: number | null;
  client: { id: string; name: string; phone: string; no_show_count: number };
  service: { id: string; name: string };
}

interface Props {
  date: string;
  today: string;
  timezone: string;
  slug: string;
  welcome: boolean;
  staff: Staff[];
  services: Service[];
  hours: WorkingHours[];
  appointments: CalendarAppointment[];
  timeOff: { staff_id: string | null; starts_at: string; ends_at: string; reason: string | null }[];
  slotStep: number;
}

const PPM = 1.5; // piksela po minuti → 90 px po satu

export function DayCalendar(props: Props) {
  const { date, today, timezone, staff, hours, appointments, timeOff } = props;
  const router = useRouter();
  const [selected, setSelected] = useState<CalendarAppointment | null>(null);
  const [draft, setDraft] = useState<{ staffId: string; time: string } | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const active = appointments.filter((a) => a.status !== "cancelled");
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  // Vremenski okvir dana: od najranijeg početka rada do najkasnijeg kraja,
  // proširen terminima izvan radnog vremena.
  const [dayStart, dayEnd] = useMemo(() => {
    let s = hours.length ? Math.min(...hours.map((h) => timeToMinutes(h.start_time))) : 8 * 60;
    let e = hours.length ? Math.max(...hours.map((h) => timeToMinutes(h.end_time))) : 18 * 60;
    for (const a of active) {
      s = Math.min(s, localMinutes(a.starts_at, timezone));
      e = Math.max(e, localMinutes(a.ends_at, timezone) || 24 * 60);
    }
    return [Math.floor(s / 60) * 60, Math.min(24 * 60, Math.ceil(e / 60) * 60)];
  }, [hours, active, timezone]);

  const height = (dayEnd - dayStart) * PPM;
  const dayFrom = zonedInstant(date, "00:00", timezone);
  const dayTo = zonedInstant(addDays(date, 1), "00:00", timezone);
  const hourMarks = Array.from({ length: (dayEnd - dayStart) / 60 + 1 }, (_, i) => dayStart + i * 60);
  const nowMin = now !== null && date === today ? localMinutes(now, timezone) : null;

  useEffect(() => {
    // Na današnjem danu skrolaj do trenutnog vremena.
    if (scrollRef.current && nowMin !== null && nowMin > dayStart) {
      scrollRef.current.scrollTop = Math.max(0, (nowMin - dayStart) * PPM - 120);
    }
    // samo pri prvom prikazu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now === null]);

  const revenue = active
    .filter((a) => a.status !== "no_show")
    .reduce((sum, a) => sum + (a.price ? Number(a.price) : 0), 0);

  function openDraft(staffId: string, e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const min = dayStart + (e.clientY - rect.top) / PPM;
    const rounded = Math.floor(min / props.slotStep) * props.slotStep;
    setDraft({ staffId, time: minutesToTime(Math.max(dayStart, Math.min(rounded, 23 * 60 + 45))) });
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Zaglavlje */}
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3 md:px-6">
        <div className="mr-auto min-w-0">
          <h1 className="font-display truncate text-xl font-bold first-letter:uppercase md:text-2xl">
            {date === today ? "Danas" : date === addDays(today, 1) ? "Sutra" : formatDayLong(date)}
          </h1>
          <p className="text-sm text-muted first-letter:uppercase">
            {date === today || date === addDays(today, 1) ? <span>{formatDayLong(date)} · </span> : null}
            {active.length === 0
              ? "Nema termina"
              : `${active.length} ${active.length % 10 === 1 && active.length % 100 !== 11 ? "termin" : "termina"}`}
            {revenue > 0 && ` · ${formatPrice(revenue)}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/app?datum=${addDays(date, -1)}`} className="btn btn-ghost btn-sm !px-2.5" aria-label="Prethodni dan">
            <ChevronLeft className="size-4" />
          </Link>
          {date !== today && (
            <Link href="/app" className="btn btn-ghost btn-sm">
              Danas
            </Link>
          )}
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && router.push(`/app?datum=${e.target.value}`)}
            className="field !w-auto !py-1.5 !text-sm"
            aria-label="Izaberi datum"
          />
          <Link href={`/app?datum=${addDays(date, 1)}`} className="btn btn-ghost btn-sm !px-2.5" aria-label="Sljedeći dan">
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setDraft({ staffId: staff[0]?.id ?? "", time: "" })}
          disabled={!staff.length}
        >
          <Plus className="size-4" />
          Novi termin
        </button>
      </header>

      {props.welcome && <Welcome slug={props.slug} />}

      {staff.length === 0 ? (
        <div className="m-6 rounded-2xl border border-line bg-surface p-6">
          <p className="font-semibold">Dodajte bar jednu osobu u tim.</p>
          <p className="mt-1 text-sm text-muted">Termini se zakazuju kod konkretne osobe.</p>
          <Link href="/app/tim" className="btn btn-primary btn-sm mt-4">
            Otvori tim
          </Link>
        </div>
      ) : (
        <div ref={scrollRef} className="relative flex-1 overflow-auto">
          {/* Imena osoblja */}
          <div className="sticky top-0 z-20 flex border-b border-line bg-paper/95 backdrop-blur">
            <div className="w-14 shrink-0" />
            {staff.map((s) => (
              <div key={s.id} className="flex min-w-40 flex-1 items-center gap-2 px-3 py-2.5">
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold text-white"
                  style={{ background: s.color }}
                >
                  {initials(s.name)}
                </span>
                <span className="truncate text-sm font-semibold">{s.name}</span>
              </div>
            ))}
          </div>

          <div className="flex" style={{ height }}>
            {/* Sati */}
            <div className="relative w-14 shrink-0">
              {hourMarks.map((m) => (
                <span
                  key={m}
                  className="tabular absolute right-2 -translate-y-1/2 text-xs text-muted"
                  style={{ top: (m - dayStart) * PPM }}
                >
                  {m < 24 * 60 && m > dayStart ? minutesToTime(m) : ""}
                </span>
              ))}
            </div>

            {staff.map((s) => {
              const windows = hours.filter((h) => h.staff_id === s.id);
              const off = timeOff.filter((t) => t.staff_id === null || t.staff_id === s.id);
              return (
                <div
                  key={s.id}
                  className="relative min-w-40 flex-1 cursor-copy border-l border-line"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px ${60 * PPM}px)`,
                    backgroundColor: "color-mix(in oklab, var(--surface-2) 70%, transparent)",
                  }}
                  onClick={(e) => openDraft(s.id, e)}
                  aria-label={`Kolona: ${s.name}. Klikni na prazno mjesto za novi termin.`}
                >
                  {/* Radno vrijeme – svjetlija podloga */}
                  {windows.map((w) => (
                    <div
                      key={w.id}
                      className="pointer-events-none absolute inset-x-0 bg-surface"
                      style={{
                        top: (timeToMinutes(w.start_time) - dayStart) * PPM,
                        height: (timeToMinutes(w.end_time) - timeToMinutes(w.start_time)) * PPM,
                        backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px ${60 * PPM}px)`,
                        backgroundPositionY: `${-((timeToMinutes(w.start_time) - dayStart) * PPM)}px`,
                      }}
                    />
                  ))}
                  {off.map((t, i) => {
                    const s0 = Math.max(dayStart, new Date(t.starts_at) <= dayFrom ? dayStart : localMinutes(t.starts_at, timezone));
                    const e0 = Math.min(dayEnd, new Date(t.ends_at) >= dayTo ? dayEnd : localMinutes(t.ends_at, timezone));
                    return (
                      <div
                        key={i}
                        className="pointer-events-none absolute inset-x-0 grid place-items-center text-xs font-medium text-muted"
                        style={{
                          top: (s0 - dayStart) * PPM,
                          height: Math.max(0, (e0 - s0) * PPM),
                          background: "repeating-linear-gradient(135deg, var(--surface-2) 0 8px, transparent 8px 16px)",
                        }}
                      >
                        {t.reason ?? "Odsustvo"}
                      </div>
                    );
                  })}

                  {active
                    .filter((a) => a.staff_id === s.id)
                    .map((a) => {
                      const top = (localMinutes(a.starts_at, timezone) - dayStart) * PPM;
                      const h = Math.max(28, ((new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60_000) * PPM - 2);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelected(a)}
                          className={cx(
                            "absolute inset-x-1 overflow-hidden rounded-xl border-l-4 px-2.5 py-1.5 text-left shadow-sm transition-transform hover:-translate-y-px",
                            a.status === "completed" || a.status === "no_show" ? "opacity-60" : "",
                          )}
                          style={{
                            top,
                            height: h,
                            borderLeftColor: s.color,
                            background: `color-mix(in oklab, ${s.color} 14%, var(--surface))`,
                          }}
                        >
                          <span className="flex items-center gap-1 text-xs font-semibold tabular">
                            {localTime(a.starts_at, timezone)}
                            {a.status === "confirmed" && <Check className="size-3.5 text-ok" aria-label="Potvrđen" />}
                            {a.source === "online" && (
                              <span className="ml-auto rounded bg-surface/70 px-1 text-[0.65rem] font-medium text-muted">online</span>
                            )}
                          </span>
                          <span className={cx("block truncate text-sm font-semibold", a.status === "no_show" && "line-through")}>
                            {a.client.name}
                          </span>
                          {h > 52 && <span className="block truncate text-xs text-muted">{a.service.name}</span>}
                        </button>
                      );
                    })}

                  {nowMin !== null && nowMin >= dayStart && nowMin <= dayEnd && (
                    <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-danger" style={{ top: (nowMin - dayStart) * PPM }}>
                      <span className="absolute -left-1 -top-[3px] size-2 rounded-full bg-danger" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {cancelled.length > 0 && (
            <details className="m-4 rounded-2xl border border-line bg-surface p-4 text-sm">
              <summary className="cursor-pointer font-semibold">Otkazani termini ({cancelled.length})</summary>
              <ul className="mt-3 space-y-1.5 text-muted">
                {cancelled.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => setSelected(a)} className="hover:text-ink">
                      <span className="tabular">{localTime(a.starts_at, timezone)}</span> {a.client.name}, {a.service.name}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <AppointmentDialog appointment={selected} timezone={timezone} staff={staff} onClose={() => setSelected(null)} />
      <NewAppointmentDialog
        open={draft !== null}
        initial={draft}
        date={date}
        staff={staff}
        services={props.services}
        onClose={() => setDraft(null)}
      />
    </div>
  );
}

function Welcome({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${env.appUrl}/${slug}`;
  return (
    <div className="mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-brand-soft p-4 md:mx-6">
      <div className="mr-auto">
        <p className="font-semibold">Salon je spreman.</p>
        <p className="text-sm text-muted">Pošaljite link klijentima ili ga stavite na Instagram.</p>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Link kopiran" : "Kopiraj link"}
      </button>
      <Link href="/app/usluge" className="btn btn-ghost btn-sm">
        Uredi usluge
      </Link>
    </div>
  );
}

function AppointmentDialog({
  appointment: a,
  timezone,
  staff,
  onClose,
}: {
  appointment: CalendarAppointment | null;
  timezone: string;
  staff: Staff[];
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [notify, setNotify] = useState(true);
  const router = useRouter();

  const change = (status: AppointmentStatus, withNotify = false) =>
    start(async () => {
      setError(null);
      const res = await setAppointmentStatus(a!.id, status, withNotify);
      if (!res.ok) return setError(res.error);
      setConfirmCancel(false);
      onClose();
      router.refresh();
    });

  const person = staff.find((s) => s.id === a?.staff_id);
  const waNumber = a?.client.phone.replace(/^\+/, "");

  return (
    <Dialog
      open={a !== null}
      onClose={() => {
        setConfirmCancel(false);
        setError(null);
        onClose();
      }}
      title={a?.client.name ?? ""}
    >
      {a && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={a.status} />
            {a.client.no_show_count > 0 && (
              <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold">
                Nije došao {a.client.no_show_count}×
              </span>
            )}
          </div>

          <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Termin</dt>
            <dd className="font-medium first-letter:uppercase">
              {formatDayLong(localDate(a.starts_at, timezone))}{" "}
              u <span className="tabular">{localTime(a.starts_at, timezone)}–{localTime(a.ends_at, timezone)}</span>
            </dd>
            <dt className="text-muted">Usluga</dt>
            <dd className="font-medium">
              {a.service.name}
              {a.price ? <span className="text-muted"> · {formatPrice(a.price)}</span> : null}
            </dd>
            <dt className="text-muted">Kod</dt>
            <dd className="font-medium">{person?.name}</dd>
            <dt className="text-muted">Telefon</dt>
            <dd className="tabular font-medium">{formatPhone(a.client.phone)}</dd>
            {a.notes && (
              <>
                <dt className="text-muted">Napomena</dt>
                <dd>{a.notes}</dd>
              </>
            )}
          </dl>

          <div className="flex gap-2">
            <a href={`tel:${a.client.phone}`} className="btn btn-ghost btn-sm flex-1">
              <Phone className="size-4" /> Pozovi
            </a>
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm flex-1">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>

          {error && <Notice kind="error">{error}</Notice>}

          {a.status !== "cancelled" && !confirmCancel && (
            <div className="grid grid-cols-2 gap-2 border-t border-line pt-5">
              {a.status === "booked" && (
                <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => change("confirmed")}>
                  Potvrđen
                </button>
              )}
              {a.status !== "completed" && (
                <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => change("completed")}>
                  Završen
                </button>
              )}
              {a.status !== "no_show" && (
                <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => change("no_show")}>
                  Nije došao
                </button>
              )}
              <button type="button" className="btn btn-danger btn-sm" disabled={pending} onClick={() => setConfirmCancel(true)}>
                Otkaži
              </button>
            </div>
          )}

          {confirmCancel && (
            <div className="space-y-3 rounded-2xl bg-surface-2 p-4">
              <p className="font-semibold">Otkazati termin?</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-[var(--brand)]" />
                Obavijesti klijenta porukom
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)} disabled={pending}>
                  Nazad
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => change("cancelled", notify)} disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Otkaži termin
                </button>
              </div>
            </div>
          )}

          {a.status === "cancelled" && (
            <button type="button" className="btn btn-ghost btn-sm w-full" disabled={pending} onClick={() => change("booked")}>
              Vrati termin
            </button>
          )}
        </div>
      )}
    </Dialog>
  );
}

type ClientHit = { id: string; name: string; phone: string; blocked: boolean; no_show_count: number };

function NewAppointmentDialog({
  open,
  initial,
  date,
  staff,
  services,
  onClose,
}: {
  open: boolean;
  initial: { staffId: string; time: string } | null;
  date: string;
  staff: Staff[];
  services: Service[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ClientHit[]>([]);
  const [client, setClient] = useState<ClientHit | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(initial?.staffId ?? staff[0]?.id ?? "");
  const [day, setDay] = useState(date);
  const [time, setTime] = useState(initial?.time ?? "");
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Svako otvaranje kreće od početka, s predloženom osobom i vremenom.
  const [openedFor, setOpenedFor] = useState(initial);
  if (initial !== openedFor) {
    setOpenedFor(initial);
    if (initial) {
      setStaffId(initial.staffId || staff[0]?.id || "");
      setTime(initial.time);
      setDay(date);
      setClient(null);
      setQuery("");
      setHits([]);
      setNewName("");
      setNewPhone("");
      setNotes("");
      setError(null);
    }
  }

  const searching = !client && query.trim().length >= 2;
  useEffect(() => {
    if (!searching) return;
    const t = setTimeout(async () => setHits(await searchClients(query)), 200);
    return () => clearTimeout(t);
  }, [query, searching]);
  const visibleHits = searching ? hits : [];

  const isNew = !client && query.trim().length > 0 && visibleHits.length === 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      setError(null);
      const res = await createAppointment({
        clientId: client?.id,
        clientName: client ? undefined : newName || query,
        clientPhone: client ? undefined : newPhone,
        serviceId,
        staffId,
        date: day,
        time,
        notes,
        notify,
      });
      if (!res.ok) return setError(res.error);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Novi termin">
      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <label className="label" htmlFor="client-q">Klijent</label>
          {client ? (
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2.5">
              <span>
                <span className="font-semibold">{client.name}</span>{" "}
                <span className="tabular text-sm text-muted">{formatPhone(client.phone)}</span>
              </span>
              <button type="button" className="text-sm font-semibold text-brand" onClick={() => setClient(null)}>
                Promijeni
              </button>
            </div>
          ) : (
            <>
              <input
                id="client-q"
                className="field"
                placeholder="Ime ili broj telefona"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setNewName(e.target.value);
                }}
                autoComplete="off"
              />
              {visibleHits.length > 0 && (
                <ul className="absolute inset-x-0 z-10 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
                  {visibleHits.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-surface-2"
                        onClick={() => setClient(h)}
                      >
                        <span className="font-medium">
                          {h.name}
                          {h.blocked && <span className="ml-2 text-xs text-danger">blokiran</span>}
                        </span>
                        <span className="tabular text-sm text-muted">{formatPhone(h.phone)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {isNew && (
          <div className="rise rounded-xl bg-surface-2 p-3">
            <p className="mb-2 text-sm font-medium">Novi klijent: {query}</p>
            <input
              className="field tabular"
              type="tel"
              inputMode="tel"
              placeholder="Broj mobitela, npr. 061 123 456"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label" htmlFor="svc">Usluga</label>
            <select id="svc" className="field" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_min} min)
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="stf">Kod</label>
            <select id="stf" className="field" value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="day">Datum</label>
            <input id="day" type="date" className="field" value={day} onChange={(e) => setDay(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="tm">Vrijeme</label>
            <input id="tm" type="time" step={300} className="field tabular" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="nt">Napomena</label>
          <input id="nt" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          Pošalji potvrdu i podsjetnike klijentu
        </label>

        {error && <Notice kind="error">{error}</Notice>}

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Sačuvaj termin
        </button>
      </form>
    </Dialog>
  );
}
