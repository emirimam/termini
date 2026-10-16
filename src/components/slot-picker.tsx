"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Slot } from "@/lib/availability";
import type { ActionResult } from "@/lib/types";
import { addDays, dayNameShort, formatDayLong, formatMonthYear } from "@/lib/time";
import { cx } from "@/lib/format";

type DayInfo = { date: string; count: number; first: string | null };

interface Props {
  loadDays: (from?: string) => Promise<ActionResult<DayInfo[]>>;
  loadSlots: (date: string) => Promise<ActionResult<Slot[]>>;
  value: Slot | null;
  onChange: (slot: Slot | null) => void;
}

export function SlotPicker({ loadDays, loadSlots, value, onChange }: Props) {
  const [days, setDays] = useState<DayInfo[] | null>(null);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDays, startDays] = useTransition();
  const [loadingSlots, startSlots] = useTransition();

  useEffect(() => {
    startDays(async () => {
      const res = await loadDays(from);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setDays(res.data);
      // Automatski otvori prvi dan sa slobodnim terminima
      const firstFree = res.data.find((d) => d.count > 0);
      setDate((current) => (current && res.data.some((d) => d.date === current) ? current : firstFree?.date ?? null));
    });
  }, [from, loadDays]);

  useEffect(() => {
    if (!date) return;
    startSlots(async () => {
      const res = await loadSlots(date);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSlots(res.data);
    });
  }, [date, loadSlots]);

  const hasFree = days?.some((d) => d.count > 0);
  const next = () => {
    if (!days?.length) return;
    setHistory((h) => [...h, from ?? ""]);
    setFrom(addDays(days[days.length - 1].date, 1));
  };
  const prev = () => {
    const h = [...history];
    const p = h.pop();
    setHistory(h);
    setFrom(p || undefined);
  };

  const morning = slots?.filter((s) => Number(s.time.slice(0, 2)) < 12) ?? [];
  const afternoon = slots?.filter((s) => Number(s.time.slice(0, 2)) >= 12) ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-muted">{days?.[0] ? formatMonthYear(days[0].date) : " "}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prev}
            disabled={!history.length || loadingDays}
            className="btn btn-ghost btn-sm !px-2.5"
            aria-label="Prethodnih 14 dana"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={loadingDays || !days}
            className="btn btn-ghost btn-sm !px-2.5"
            aria-label="Sljedećih 14 dana"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        className={cx("scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1", loadingDays && "opacity-60")}
        role="listbox"
        aria-label="Dan"
      >
        {(days ?? Array.from({ length: 7 }, (_, i) => ({ date: String(i), count: -1, first: null }))).map((d) => {
          const placeholder = d.count < 0;
          const selected = d.date === date;
          const empty = d.count === 0;
          return (
            <button
              key={d.date}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={placeholder || empty}
              onClick={() => {
                if (d.date !== date) setSlots(null);
                setDate(d.date);
                onChange(null);
              }}
              className={cx(
                "flex w-[3.6rem] shrink-0 snap-start flex-col items-center rounded-2xl border py-2.5 transition-colors",
                placeholder && "h-[4.6rem] animate-pulse border-transparent bg-surface-2",
                !placeholder && !selected && "border-line bg-surface hover:border-ink",
                selected && "border-ink bg-ink text-paper",
                empty && "opacity-40",
              )}
            >
              {!placeholder && (
                <>
                  <span className="text-xs font-medium capitalize">{dayNameShort(d.date)}</span>
                  <span className="font-display tabular text-xl font-bold leading-tight">{Number(d.date.slice(8))}</span>
                  <span className={cx("mt-0.5 size-1.5 rounded-full", d.count > 0 ? (selected ? "bg-stub" : "bg-brand") : "bg-transparent")} />
                </>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {days && !hasFree && !loadingDays && (
        <div className="mt-5 rounded-2xl bg-surface-2 p-4 text-sm">
          Nema slobodnih termina u ovih 14 dana.{" "}
          <button type="button" className="font-semibold underline" onClick={next}>
            Pogledaj sljedeće dane
          </button>
        </div>
      )}

      {date && (
        <div className="mt-6" aria-live="polite">
          <p className="mb-3 font-semibold capitalize">{formatDayLong(date)}</p>
          {loadingSlots && !slots ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-surface-2" />
              ))}
            </div>
          ) : slots && slots.length === 0 ? (
            <p className="text-sm text-muted">Svi termini za ovaj dan su popunjeni.</p>
          ) : (
            <div className={cx("space-y-5", loadingSlots && "opacity-60")}>
              {[
                ["Prije podne", morning],
                ["Poslije podne", afternoon],
              ].map(([label, list]) =>
                (list as Slot[]).length ? (
                  <div key={label as string}>
                    <p className="mb-2 text-xs font-medium text-muted">{label as string}</p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {(list as Slot[]).map((s) => (
                        <button
                          key={s.startsAt}
                          type="button"
                          className="slot"
                          aria-pressed={value?.startsAt === s.startsAt}
                          onClick={() => onChange(value?.startsAt === s.startsAt ? null : s)}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
