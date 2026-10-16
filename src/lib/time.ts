import { TZDate } from "@date-fns/tz";

// Svi termini se u bazi čuvaju kao timestamptz (UTC); prikaz i radno
// vrijeme računaju se u vremenskoj zoni salona.

export const DAYS = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"];
export const DAYS_SHORT = ["ned", "pon", "uto", "sri", "čet", "pet", "sub"];
// Indeks po ISO danu (1 = ponedjeljak)
export const ISO_DAYS = ["", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota", "Nedjelja"];
const MONTHS_GEN = [
  "januara", "februara", "marta", "aprila", "maja", "juna",
  "jula", "augusta", "septembra", "oktobra", "novembra", "decembra",
];
const MONTHS = [
  "januar", "februar", "mart", "april", "maj", "juni",
  "juli", "august", "septembar", "oktobar", "novembar", "decembar",
];

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Instant za lokalni datum (YYYY-MM-DD) i vrijeme (HH:MM[:SS]) u zoni tz. */
export function zonedInstant(dateStr: string, timeStr: string, tz: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const z = new TZDate(y, m - 1, d, hh, mm, 0, tz);
  return new Date(z.getTime());
}

export function inZone(d: Date | string | number, tz: string) {
  return new TZDate(new Date(d).getTime(), tz);
}

/** Lokalni datum YYYY-MM-DD za instant u zoni tz. */
export function localDate(d: Date | string | number, tz: string) {
  const z = inZone(d, tz);
  return `${z.getFullYear()}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
}

export function localTime(d: Date | string | number, tz: string) {
  const z = inZone(d, tz);
  return `${pad(z.getHours())}:${pad(z.getMinutes())}`;
}

/** Minute od ponoći u lokalnoj zoni. */
export function localMinutes(d: Date | string | number, tz: string) {
  const z = inZone(d, tz);
  return z.getHours() * 60 + z.getMinutes();
}

/** ISO dan u sedmici (1 = pon … 7 = ned) za kalendarski datum. */
export function isoWeekday(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

export function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function todayIn(tz: string) {
  return localDate(new Date(), tz);
}

export function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function isValidDateStr(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

/** "utorak, 21. oktobra" */
export function formatDayLong(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[wd]}, ${d}. ${MONTHS_GEN[m - 1]}`;
}

/** "21. 10." */
export function formatDayShort(dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${d}. ${m}.`;
}

export function formatMonthYear(dateStr: string) {
  const [y, m] = dateStr.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}.`;
}

/** "utorak, 21. oktobra u 14:30" za instant u zoni salona. */
export function formatWhen(d: Date | string, tz: string) {
  return `${formatDayLong(localDate(d, tz))} u ${localTime(d, tz)}`;
}

/** "21.10. u 14:30" – kratko, za SMS. */
export function formatWhenShort(d: Date | string, tz: string) {
  const z = inZone(d, tz);
  return `${DAYS_SHORT[z.getDay()]} ${z.getDate()}.${z.getMonth() + 1}. u ${localTime(d, tz)}`;
}

export function dayNameShort(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
