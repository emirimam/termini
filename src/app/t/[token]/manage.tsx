"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Loader2, MapPin, Phone, X } from "lucide-react";
import type { AppointmentStatus } from "@/lib/types";
import type { Slot } from "@/lib/availability";
import { SlotPicker } from "@/components/slot-picker";
import { cx } from "@/lib/format";
import { formatDayLong, localDate } from "@/lib/time";
import { cancelAction, confirmAction, rescheduleAction, rescheduleDays, rescheduleSlots } from "./actions";

interface Props {
  token: string;
  justBooked: boolean;
  status: AppointmentStatus;
  canChange: boolean;
  cancelHours: number;
  tenant: { name: string; slug: string; phone: string | null; address: string | null };
  info: {
    service: string;
    staff: string;
    clientName: string;
    day: string;
    time: string;
    duration: string;
    price: string | null;
    timezone: string;
  };
}

const STATUS_TEXT: Record<AppointmentStatus, string> = {
  booked: "Termin je zakazan",
  confirmed: "Dolazak potvrđen",
  cancelled: "Termin je otkazan",
  completed: "Termin je završen",
  no_show: "Termin je propušten",
};

export function ManageAppointment({ token, justBooked, status, canChange, cancelHours, tenant, info }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel">("view");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const active = status === "booked" || status === "confirmed";
  const loadDays = useCallback((from?: string) => rescheduleDays(token, from), [token]);
  const loadSlots = useCallback((date: string) => rescheduleSlots(token, date), [token]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Nešto nije u redu. Pokušajte ponovo.");
        return;
      }
      setNotice(done);
      setMode("view");
      setSlot(null);
      router.refresh();
    });

  const headline = justBooked && status === "booked" && !notice ? "Vidimo se!" : STATUS_TEXT[status];

  return (
    <div className="rise">
      <div className="mb-6 text-center">
        <div
          className={cx(
            "mx-auto mb-4 grid size-14 place-items-center rounded-full",
            active ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted",
          )}
          aria-hidden
        >
          {active ? <Check className="size-7" strokeWidth={2.5} /> : <X className="size-7" />}
        </div>
        <h1 className="font-display text-3xl font-bold">{headline}</h1>
        {justBooked && active && !notice && (
          <p className="mt-2 text-muted">
            Potvrda stiže na WhatsApp ili SMS. Podsjetit ćemo vas i prije termina.
          </p>
        )}
        {notice && <p className="mt-2 font-medium text-ok">{notice}</p>}
      </div>

      <article className={cx("ticket overflow-hidden", !active && "opacity-70")}>
        <div className="p-6">
          <p className="text-sm text-muted">{tenant.name}</p>
          <p className="mt-1 text-lg font-semibold">{info.service}</p>
          <p className="mt-4 text-sm capitalize text-muted">{info.day}</p>
          <p
            className={cx(
              "font-display tabular mt-1 inline-block rounded-xl px-3 py-1 text-5xl font-bold",
              active ? "bg-stub text-stub-ink" : "bg-surface-2 line-through",
            )}
          >
            {info.time}
          </p>
        </div>
        <div className="ticket-perf" />
        <dl className="grid grid-cols-2 gap-y-3 p-6 text-sm">
          <dt className="text-muted">Kod</dt>
          <dd className="text-right font-medium">{info.staff}</dd>
          <dt className="text-muted">Trajanje</dt>
          <dd className="text-right font-medium">{info.duration}</dd>
          {info.price && (
            <>
              <dt className="text-muted">Cijena</dt>
              <dd className="tabular text-right font-medium">{info.price}</dd>
            </>
          )}
          <dt className="text-muted">Na ime</dt>
          <dd className="text-right font-medium">{info.clientName}</dd>
        </dl>
      </article>

      <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
        {tenant.address && (
          <a
            className="inline-flex items-center gap-1.5 hover:text-ink"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tenant.name}, ${tenant.address}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin className="size-4" aria-hidden />
            {tenant.address}
          </a>
        )}
        {tenant.phone && (
          <a className="inline-flex items-center gap-1.5 hover:text-ink" href={`tel:${tenant.phone}`}>
            <Phone className="size-4" aria-hidden />
            {tenant.phone}
          </a>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {active && mode === "view" && (
        <div className="mt-6 space-y-2">
          {status === "booked" && !justBooked && (
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={pending}
              onClick={() => run(() => confirmAction(token), "Hvala, dolazak je potvrđen.")}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Potvrđujem dolazak
            </button>
          )}
          <a href={`/t/${token}/kalendar`} className="btn btn-ghost w-full">
            <CalendarPlus className="size-4" aria-hidden />
            Dodaj u kalendar
          </a>
          {canChange ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setMode("reschedule")}>
                Promijeni termin
              </button>
              <button type="button" className="btn btn-ghost text-danger" onClick={() => setMode("cancel")}>
                Otkaži termin
              </button>
            </div>
          ) : (
            <p className="pt-2 text-center text-sm text-muted">
              Do termina je manje od {cancelHours} h. Za promjenu nazovite {tenant.name}.
            </p>
          )}
        </div>
      )}

      {mode === "cancel" && (
        <div className="rise mt-6 rounded-2xl border border-line bg-surface p-5">
          <p className="font-semibold">Otkazati termin?</p>
          <p className="mt-1 text-sm text-muted">Termin se oslobađa za druge klijente.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setMode("view")} disabled={pending}>
              Zadrži termin
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() => run(() => cancelAction(token), "Termin je otkazan.")}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Otkaži termin
            </button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="rise mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Novi termin</p>
            <button type="button" className="text-sm font-semibold text-muted hover:text-ink" onClick={() => setMode("view")}>
              Odustani
            </button>
          </div>
          <SlotPicker loadDays={loadDays} loadSlots={loadSlots} value={slot} onChange={setSlot} />
          {slot && (
            <button
              type="button"
              className="btn btn-primary mt-5 w-full"
              disabled={pending}
              onClick={() =>
                run(
                  () => rescheduleAction(token, slot.startsAt),
                  `Termin je pomjeren na ${formatDayLong(localDate(slot.startsAt, info.timezone))} u ${slot.time}.`,
                )
              }
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Pomjeri na {slot.time}
            </button>
          )}
        </div>
      )}

      {!active && (
        <div className="mt-6 text-center">
          <a href={`/${tenant.slug}`} className="btn btn-primary">
            Zakaži novi termin
          </a>
        </div>
      )}
    </div>
  );
}
