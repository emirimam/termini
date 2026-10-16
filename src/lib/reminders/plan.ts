import type { Tenant } from "@/lib/types";
import { localDate, localMinutes, timeToMinutes, zonedInstant, addDays } from "@/lib/time";

// Planiranje poruka za termin: potvrda odmah + podsjetnici (npr. 24h i 2h prije).
// Pravila:
//  - podsjetnik koji pada u "tihe sate" (npr. 21–08h) pomjera se RANIJE,
//    na početak tihih sati (nikad kasnije – ne smije zakasniti);
//  - podsjetnik koji je već prošao ili je prekasno (manje od 5 min) se ne šalje;
//  - ako je potvrda upravo poslana, podsjetnik unutar 60 min se preskače;
//  - dva podsjetnika bliža od 90 min se spajaju (ostaje raniji).

export interface PlannedJob {
  kind: "confirmation" | "reminder";
  offset_min: number;
  send_at: Date;
}

const MIN = 60_000;

type TenantRules = Pick<
  Tenant,
  "timezone" | "reminder_channel" | "reminder_offsets" | "send_confirmation" | "quiet_start" | "quiet_end"
>;

function inQuietHours(minOfDay: number, qs: number, qe: number) {
  if (qs === qe) return false;
  return qs < qe ? minOfDay >= qs && minOfDay < qe : minOfDay >= qs || minOfDay < qe;
}

/** Pomjeri trenutak unazad na početak tihih sati ako pada unutar njih. */
export function shiftBeforeQuietHours(at: Date, tenant: TenantRules): Date {
  const tz = tenant.timezone;
  const qs = timeToMinutes(tenant.quiet_start);
  const qe = timeToMinutes(tenant.quiet_end);
  const m = localMinutes(at, tz);
  if (!inQuietHours(m, qs, qe)) return at;

  const day = localDate(at, tz);
  // Ako smo poslije ponoći (prije kraja tihih sati) a tihi sati počinju navečer,
  // početak je bio prethodnog dana.
  const startDay = qs > qe && m < qe ? addDays(day, -1) : day;
  const start = zonedInstant(startDay, tenant.quiet_start, tz);
  return new Date(start.getTime() - 5 * MIN);
}

export function planJobs(startsAt: Date, tenant: TenantRules, now = new Date(), withConfirmation = true): PlannedJob[] {
  if (tenant.reminder_channel === "off") return [];
  const jobs: PlannedJob[] = [];
  const confirmationNow = withConfirmation && tenant.send_confirmation;
  if (confirmationNow) jobs.push({ kind: "confirmation", offset_min: 0, send_at: now });

  const offsets = [...new Set(tenant.reminder_offsets)].filter((o) => o > 0).sort((a, b) => b - a);
  let lastPlanned: Date | null = null;

  for (const offset of offsets) {
    let at = new Date(startsAt.getTime() - offset * MIN);
    at = shiftBeforeQuietHours(at, tenant);

    if (at.getTime() < now.getTime() + 5 * MIN) continue; // prekasno
    if (at.getTime() >= startsAt.getTime()) continue;
    if (confirmationNow && at.getTime() - now.getTime() < 60 * MIN) continue;
    if (lastPlanned && Math.abs(at.getTime() - lastPlanned.getTime()) < 90 * MIN) continue;

    jobs.push({ kind: "reminder", offset_min: offset, send_at: at });
    lastPlanned = at;
  }
  return jobs;
}

export function offsetLabel(min: number) {
  if (min % 1440 === 0) {
    const d = min / 1440;
    return d === 1 ? "24 sata prije" : `${d} dana prije`;
  }
  if (min % 60 === 0) {
    const h = min / 60;
    return h === 1 ? "1 sat prije" : h < 5 ? `${h} sata prije` : `${h} sati prije`;
  }
  return `${min} min prije`;
}
