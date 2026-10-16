"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Loader2, Users } from "lucide-react";
import type { Service, Staff } from "@/lib/types";
import type { Slot } from "@/lib/availability";
import { SlotPicker } from "@/components/slot-picker";
import { cx, formatDuration, formatPrice, initials } from "@/lib/format";
import { formatDayLong, localDate } from "@/lib/time";
import { book, getDays, getSlots } from "./actions";

interface Props {
  slug: string;
  tenantName: string;
  timezone: string;
  services: Service[];
  staff: Staff[];
  links: { staff_id: string; service_id: string }[];
}

type Step = "service" | "staff" | "time" | "details";

export function BookingFlow({ slug, tenantName, timezone, services, staff, links }: Props) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(services.length === 1 ? services[0].id : null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(true);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const service = services.find((s) => s.id === serviceId) ?? null;

  const eligible = useMemo(() => {
    if (!serviceId) return [];
    const assigned = links.filter((l) => l.service_id === serviceId).map((l) => l.staff_id);
    return assigned.length ? staff.filter((s) => assigned.includes(s.id)) : staff;
  }, [serviceId, links, staff]);

  // Kad uslugu radi samo jedna osoba, korak izbora osobe se preskače.
  const effectiveStaff = eligible.length === 1 ? eligible[0].id : staffId;
  const chosenStaff = staff.find((s) => s.id === effectiveStaff);

  const step: Step = !service ? "service" : !effectiveStaff ? "staff" : !slot ? "time" : "details";

  const loadDays = useCallback(
    (from?: string) => getDays(slug, serviceId!, effectiveStaff!, from),
    [slug, serviceId, effectiveStaff],
  );
  const loadSlots = useCallback(
    (date: string) => getSlots(slug, serviceId!, effectiveStaff!, date),
    [slug, serviceId, effectiveStaff],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !effectiveStaff || !slot) return;
    setError(null);
    startTransition(async () => {
      const res = await book({
        slug,
        serviceId: service.id,
        staffId: effectiveStaff,
        startsAt: slot.startsAt,
        name,
        phone,
        note,
        consent,
        website,
      });
      if (res.ok) {
        router.push(`/t/${res.data.token}?novi=1`);
      } else {
        setError(res.error);
        if (res.error.includes("zauzet")) setSlot(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Korak 1: usluga */}
      <StepCard
        n={1}
        title="Usluga"
        open={step === "service"}
        summary={service ? `${service.name}, ${formatDuration(service.duration_min)}` : null}
        onEdit={() => {
          setServiceId(null);
          setStaffId(null);
          setSlot(null);
        }}
      >
        <ul className="divide-y divide-line">
          {services.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setServiceId(s.id);
                  setStaffId(null);
                  setSlot(null);
                }}
                className="flex w-full items-center gap-4 py-3.5 text-left transition-colors hover:text-brand"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{s.name}</span>
                  {s.description && <span className="mt-0.5 block text-sm text-muted">{s.description}</span>}
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
                    <Clock className="size-3.5" aria-hidden />
                    {formatDuration(s.duration_min)}
                  </span>
                </span>
                {formatPrice(s.price, s.currency) && (
                  <span className="tabular shrink-0 font-semibold">{formatPrice(s.price, s.currency)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </StepCard>

      {/* Korak 2: osoba */}
      {service && eligible.length > 1 && (
        <StepCard
          n={2}
          title="Kod koga"
          open={step === "staff"}
          summary={staffId === "any" ? "Prva slobodna osoba" : chosenStaff?.name ?? null}
          onEdit={() => {
            setStaffId(null);
            setSlot(null);
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <StaffOption label="Prva slobodna osoba" sub="Najviše slobodnih termina" onClick={() => setStaffId("any")}>
              <Users className="size-5" aria-hidden />
            </StaffOption>
            {eligible.map((s) => (
              <StaffOption key={s.id} label={s.name} sub={s.title} onClick={() => setStaffId(s.id)} color={s.color}>
                {initials(s.name)}
              </StaffOption>
            ))}
          </div>
        </StepCard>
      )}

      {/* Korak 3: termin */}
      {service && effectiveStaff && (
        <StepCard
          n={eligible.length > 1 ? 3 : 2}
          title="Termin"
          open={step === "time"}
          summary={slot ? `${formatDayLong(localDate(slot.startsAt, timezone))} u ${slot.time}` : null}
          onEdit={() => setSlot(null)}
        >
          <SlotPicker
            key={`${serviceId}-${effectiveStaff}`}
            loadDays={loadDays}
            loadSlots={loadSlots}
            value={slot}
            onChange={setSlot}
          />
        </StepCard>
      )}

      {/* Korak 4: podaci + karta termina */}
      {service && slot && (
        <form onSubmit={submit} className="rise space-y-5 pt-3">
          <div className="ticket overflow-hidden">
            <div className="flex items-end justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-sm text-muted">{tenantName}</p>
                <p className="mt-0.5 truncate font-semibold">{service.name}</p>
                <p className="text-sm capitalize text-muted">{formatDayLong(localDate(slot.startsAt, timezone))}</p>
              </div>
              <p className="font-display tabular shrink-0 rounded-xl bg-stub px-3 py-1 text-4xl font-bold text-stub-ink">
                {slot.time}
              </p>
            </div>
            <div className="ticket-perf" />
            <div className="flex justify-between gap-4 p-5 text-sm">
              <span className="text-muted">
                {staffId === "any" || !chosenStaff ? "Prva slobodna osoba" : chosenStaff.name}
                {" · "}
                {formatDuration(service.duration_min)}
              </span>
              {formatPrice(service.price, service.currency) && (
                <span className="tabular font-semibold">{formatPrice(service.price, service.currency)}</span>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <div>
              <label className="label" htmlFor="name">Ime i prezime</label>
              <input
                id="name"
                className="field"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">Broj mobitela</label>
              <input
                id="phone"
                className="field tabular"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="061 123 456"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="hint">Na ovaj broj stiže potvrda i podsjetnik.</p>
            </div>
            <div>
              <label className="label" htmlFor="note">
                Napomena <span className="font-normal text-muted">(nije obavezno)</span>
              </label>
              <textarea
                id="note"
                className="field min-h-20 resize-y"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {/* Honeypot – nevidljivo za ljude */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden
            />
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
              />
              <span>Pošaljite mi potvrdu i podsjetnike na WhatsApp ili SMS.</span>
            </label>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <div className="sticky bottom-4 z-10">
            <button type="submit" className="btn btn-primary w-full py-3.5 text-base shadow-lg" disabled={pending}>
              {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Check className="size-5" aria-hidden />}
              {pending ? "Zakazujem…" : "Zakaži termin"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function StepCard({
  n,
  title,
  open,
  summary,
  onEdit,
  children,
}: {
  n: number;
  title: string;
  open: boolean;
  summary: string | null;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const done = !open && summary;
  return (
    <section
      className={cx(
        "rounded-2xl border bg-surface transition-colors",
        open ? "border-ink/80 p-5" : "border-line px-5 py-4",
      )}
      aria-labelledby={`step-${n}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={cx(
            "grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold",
            done ? "bg-brand text-brand-ink" : open ? "bg-ink text-paper" : "bg-surface-2 text-muted",
          )}
          aria-hidden
        >
          {done ? <Check className="size-4" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`step-${n}`} className={cx("font-display font-semibold", open ? "text-lg" : "text-sm text-muted")}>
            {title}
          </h2>
          {done && <p className="truncate font-semibold first-letter:uppercase">{summary}</p>}
        </div>
        {done && (
          <button type="button" onClick={onEdit} className="text-sm font-semibold text-brand hover:underline">
            Promijeni
          </button>
        )}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}

function StaffOption({
  label,
  sub,
  color,
  onClick,
  children,
}: {
  label: string;
  sub?: string | null;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:border-ink"
    >
      <span
        className="font-display grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
        style={{ background: color ?? "var(--ink)" }}
      >
        {children}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{label}</span>
        {sub && <span className="block truncate text-sm text-muted">{sub}</span>}
      </span>
    </button>
  );
}
