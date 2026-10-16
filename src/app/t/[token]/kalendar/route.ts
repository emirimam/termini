import { getByToken } from "@/lib/booking";
import { env } from "@/lib/env";

// .ics datoteka za dodavanje termina u Google/Apple/Outlook kalendar.

function icsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const a = await getByToken(token);
  if (!a) return new Response("Termin nije pronađen", { status: 404 });

  const location = [a.tenant.address, a.tenant.city].filter(Boolean).join(", ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Termini//BS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.id}@termini`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(a.starts_at)}`,
    `DTEND:${icsDate(a.ends_at)}`,
    `SUMMARY:${esc(`${a.service.name} – ${a.tenant.name}`)}`,
    location ? `LOCATION:${esc(location)}` : "",
    `DESCRIPTION:${esc(`Promjena ili otkazivanje: ${env.appUrl}/t/${token}`)}`,
    a.status === "cancelled" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(a.service.name)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="termin.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
