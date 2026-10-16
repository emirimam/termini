import { computeSlots } from "@/lib/availability";
import { planJobs, shiftBeforeQuietHours } from "@/lib/reminders/plan";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { zonedInstant, localTime, formatWhen, isoWeekday } from "@/lib/time";
import { parseCsv, guessColumns, rowsToContacts, parseVcf, looksLikeHeader } from "@/lib/contacts-import";

let fails = 0;
function eq(label: string, a: unknown, b: unknown) {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (!ok) fails++;
  console.log(ok ? "OK  " : "FAIL", label, ok ? "" : `→ got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`);
}

const tz = "Europe/Sarajevo";
// Vrijeme i zone (oktobar = CEST +2, decembar = CET +1)
eq("zonedInstant summer", zonedInstant("2026-10-20", "09:00", tz).toISOString(), "2026-10-20T07:00:00.000Z");
eq("zonedInstant winter", zonedInstant("2026-12-01", "09:00", tz).toISOString(), "2026-12-01T08:00:00.000Z");
eq("DST day (25.10.) 09:00", zonedInstant("2026-10-25", "09:00", tz).toISOString(), "2026-10-25T08:00:00.000Z");
eq("localTime", localTime("2026-10-20T07:00:00Z", tz), "09:00");
eq("isoWeekday tue", isoWeekday("2026-10-20"), 2);
eq("isoWeekday sun", isoWeekday("2026-10-25"), 7);
eq("formatWhen", formatWhen("2026-10-20T12:30:00Z", tz), "utorak, 20. oktobra u 14:30");

// Telefoni
eq("phone local", normalizePhone("061 123 456"), "+38761123456");
eq("phone 00387", normalizePhone("00387 62 123 4567"), "+387621234567");
eq("phone +387 0", normalizePhone("+387 (0)61-123-456"), "+38761123456");
eq("phone HR", normalizePhone("+385 91 234 5678"), "+385912345678");
eq("phone bad", normalizePhone("12"), null);
eq("formatPhone", formatPhone("+38761123456"), "061 123 456");

// Slobodni termini
const tenant = { timezone: tz, slot_step_minutes: 15, min_notice_minutes: 60, horizon_days: 60 };
const hours = [{ id: "h", tenant_id: "t", staff_id: "A", weekday: 2, start_time: "09:00:00", end_time: "12:00:00" }];
const now = new Date("2026-10-19T10:00:00Z");
let slots = computeSlots({ tenant, service: { duration_min: 60, buffer_min: 0 }, staffIds: ["A"], date: "2026-10-20", hours, timeOff: [], busy: [], now });
eq("slots count (09:00–11:00 by 15)", slots.length, 9);
eq("first/last", [slots[0].time, slots.at(-1)!.time], ["09:00", "11:00"]);
slots = computeSlots({
  tenant,
  service: { duration_min: 30, buffer_min: 15 },
  staffIds: ["A"],
  date: "2026-10-20",
  hours,
  timeOff: [],
  busy: [{ staff_id: "A", starts_at: "2026-10-20T08:00:00Z", blocked_until: "2026-10-20T08:45:00Z" }], // 10:00–10:45
  now,
});
eq("busy+buffer excludes", slots.map((s) => s.time), ["09:00", "09:15", "10:45", "11:00", "11:15", "11:30"]);
slots = computeSlots({
  tenant,
  service: { duration_min: 30, buffer_min: 0 },
  staffIds: ["A"],
  date: "2026-10-20",
  hours,
  timeOff: [{ id: "x", tenant_id: "t", staff_id: null, starts_at: "2026-10-19T22:00:00Z", ends_at: "2026-10-20T22:00:00Z", reason: null }],
  busy: [],
  now,
});
eq("salon closed", slots.length, 0);
slots = computeSlots({ tenant, service: { duration_min: 30, buffer_min: 0 }, staffIds: ["A"], date: "2026-10-20", hours, timeOff: [], busy: [], now: new Date("2026-10-20T07:20:00Z") });
eq("min notice (now 09:20 → first 10:30)", slots[0].time, "10:30");
slots = computeSlots({ tenant, service: { duration_min: 30, buffer_min: 0 }, staffIds: ["A"], date: "2026-10-19", hours, timeOff: [], busy: [], now });
eq("non-working day", slots.length, 0);

// Podsjetnici
const rules = { timezone: tz, reminder_channel: "whatsapp_sms" as const, reminder_offsets: [1440, 120], send_confirmation: true, quiet_start: "21:00:00", quiet_end: "08:00:00" };
let jobs = planJobs(new Date("2026-10-22T12:00:00Z"), rules, now); // čet 14:00
eq("normal plan", jobs.map((j) => [j.kind, j.send_at.toISOString()]), [
  ["confirmation", now.toISOString()],
  ["reminder", "2026-10-21T12:00:00.000Z"],
  ["reminder", "2026-10-22T10:00:00.000Z"],
]);
jobs = planJobs(new Date("2026-10-22T06:30:00Z"), rules, now); // čet 08:30 → 2h prije = 06:30 lokalno (tiho)
eq("quiet hours shift 2h → prev 20:55", jobs.map((j) => localTime(j.send_at, tz)), ["12:00", "08:30", "20:55"]);
eq("quiet shift helper", localTime(shiftBeforeQuietHours(new Date("2026-10-21T21:30:00Z"), rules), tz), "20:55");
jobs = planJobs(new Date("2026-10-19T12:00:00Z"), rules, now); // za 2h → samo potvrda
eq("booked 2h ahead → only confirmation", jobs.map((j) => j.kind), ["confirmation"]);
jobs = planJobs(new Date("2026-10-20T06:30:00Z"), rules, now); // sutra 08:30: 24h=danas 08:30 (prošlo), 2h=06:30 → 20:55 večeras
eq("next morning", jobs.map((j) => [j.kind, localTime(j.send_at, tz)]), [["confirmation", "12:00"], ["reminder", "20:55"]]);
eq("off", planJobs(new Date("2026-10-22T12:00:00Z"), { ...rules, reminder_channel: "off" }, now).length, 0);

// Uvoz
const csv = "Ime;Prezime;Mobitel;Email\nAmra;Hodžić;061 111 222;amra@x.ba\n\"Kovač, Ivan\";;+387 62 333 444;\n";
const rows = parseCsv(csv);
eq("csv header detect", looksLikeHeader(rows[0]), true);
const map = guessColumns(rows[0]);
eq("csv map", map, { first: 0, last: 1, phone: 2, email: 3 });
eq("csv contacts", rowsToContacts(rows, map, true).map((c) => [c.name, c.phone]), [["Amra Hodžić", "061 111 222"], ["Kovač, Ivan", "+387 62 333 444"]]);
const vcf = "BEGIN:VCARD\nVERSION:3.0\nFN:Lejla Begić\nTEL;TYPE=HOME:035 111 222\nTEL;TYPE=CELL:061 999 888\nEND:VCARD\nBEGIN:VCARD\nN:Jusić;Emir;;;\nTEL:062123456\nEND:VCARD";
eq("vcf", parseVcf(vcf).map((c) => [c.name, c.phone]), [["Lejla Begić", "061 999 888"], ["Emir Jusić", "062123456"]]);

console.log(fails ? `\n${fails} FAILED` : "\nAll passed");
process.exit(fails ? 1 : 0);
