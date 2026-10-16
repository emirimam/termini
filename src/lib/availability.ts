import type { Service, Tenant, TimeOff, WorkingHours } from "@/lib/types";
import { isoWeekday, localTime, zonedInstant, addDays } from "@/lib/time";

// Čista funkcija za računanje slobodnih termina – bez pristupa bazi,
// pa je lako testirati i koristiti i za javnu rezervaciju i za admin.

export interface BusyInterval {
  staff_id: string;
  starts_at: string;
  blocked_until: string;
}

export interface Slot {
  time: string; // "09:30" lokalno
  startsAt: string; // ISO UTC
  staffIds: string[]; // ko je slobodan u tom terminu
}

interface Input {
  tenant: Pick<Tenant, "timezone" | "slot_step_minutes" | "min_notice_minutes" | "horizon_days">;
  service: Pick<Service, "duration_min" | "buffer_min">;
  staffIds: string[];
  date: string; // YYYY-MM-DD lokalno
  hours: WorkingHours[];
  timeOff: TimeOff[];
  busy: BusyInterval[];
  now?: Date;
  ignoreNotice?: boolean; // admin može zakazati i "odmah"
}

const MIN = 60_000;

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export function computeSlots(input: Input): Slot[] {
  const { tenant, service, staffIds, date, hours, timeOff, busy } = input;
  const tz = tenant.timezone;
  const now = input.now ?? new Date();
  const weekday = isoWeekday(date);
  const step = tenant.slot_step_minutes * MIN;
  const duration = service.duration_min * MIN;
  const blocked = (service.duration_min + service.buffer_min) * MIN;
  const earliest = input.ignoreNotice ? now.getTime() : now.getTime() + tenant.min_notice_minutes * MIN;

  // Dan izvan horizonta rezervacije (npr. više od 60 dana unaprijed)
  const dayStart = zonedInstant(date, "00:00", tz).getTime();
  const limit = now.getTime() + tenant.horizon_days * 24 * 60 * MIN;
  if (!input.ignoreNotice && dayStart > limit) return [];
  if (zonedInstant(addDays(date, 1), "00:00", tz).getTime() < now.getTime()) return [];

  const byStart = new Map<number, Set<string>>();

  for (const staffId of staffIds) {
    const windows = hours
      .filter((h) => h.staff_id === staffId && h.weekday === weekday)
      .map((h) => ({
        start: zonedInstant(date, h.start_time, tz).getTime(),
        end: zonedInstant(date, h.end_time, tz).getTime(),
      }));
    if (!windows.length) continue;

    const off = timeOff
      .filter((t) => t.staff_id === null || t.staff_id === staffId)
      .map((t) => ({ start: Date.parse(t.starts_at), end: Date.parse(t.ends_at) }));
    const taken = busy
      .filter((b) => b.staff_id === staffId)
      .map((b) => ({ start: Date.parse(b.starts_at), end: Date.parse(b.blocked_until) }));

    for (const w of windows) {
      for (let t = w.start; t + duration <= w.end; t += step) {
        if (t < earliest) continue;
        const end = t + blocked;
        if (off.some((o) => overlaps(t, end, o.start, o.end))) continue;
        if (taken.some((b) => overlaps(t, end, b.start, b.end))) continue;
        if (!byStart.has(t)) byStart.set(t, new Set());
        byStart.get(t)!.add(staffId);
      }
    }
  }

  return [...byStart.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, ids]) => ({
      time: localTime(t, tz),
      startsAt: new Date(t).toISOString(),
      staffIds: [...ids],
    }));
}
