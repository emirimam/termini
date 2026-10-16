import { env } from "@/lib/env";
import { ISO_DAYS } from "@/lib/time";
import type { Service, Tenant, WorkingHours } from "@/lib/types";

// Strukturirani podaci (schema.org) – Google ih koristi za prikaz salona
// s adresom, radnim vremenom, cijenama i dugmetom za rezervaciju.

const SCHEMA_TYPE: Record<Tenant["kind"], string> = {
  salon: "HairSalon",
  barber: "HairSalon",
  beauty: "BeautySalon",
  dental: "Dentist",
  other: "LocalBusiness",
};

const SCHEMA_DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Radno vrijeme salona po danu: najraniji početak i najkasniji kraj svih osoba. */
export function salonOpeningHours(hours: WorkingHours[]) {
  const byDay = new Map<number, { opens: string; closes: string }>();
  for (const h of hours) {
    const cur = byDay.get(h.weekday);
    const opens = h.start_time.slice(0, 5);
    const closes = h.end_time.slice(0, 5);
    byDay.set(h.weekday, {
      opens: cur && cur.opens < opens ? cur.opens : opens,
      closes: cur && cur.closes > closes ? cur.closes : closes,
    });
  }
  return [...byDay.entries()].sort((a, b) => a[0] - b[0]);
}

export function openingHoursText(hours: WorkingHours[]) {
  return salonOpeningHours(hours).map(([d, h]) => `${ISO_DAYS[d]} ${h.opens}–${h.closes}`);
}

export function tenantJsonLd(tenant: Tenant, services: Service[], hours: WorkingHours[]) {
  const url = `${env.appUrl}/${tenant.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[tenant.kind],
    "@id": url,
    name: tenant.name,
    url,
    image: `${url}/opengraph-image`,
    ...(tenant.description ? { description: tenant.description } : {}),
    ...(tenant.phone ? { telephone: tenant.phone } : {}),
    ...(tenant.email ? { email: tenant.email } : {}),
    ...(tenant.address || tenant.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(tenant.address ? { streetAddress: tenant.address } : {}),
            ...(tenant.city ? { addressLocality: tenant.city } : {}),
            addressCountry: "BA",
          },
        }
      : {}),
    openingHoursSpecification: salonOpeningHours(hours).map(([d, h]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAYS[d]}`,
      opens: h.opens,
      closes: h.closes,
    })),
    ...(services.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Usluge",
            itemListElement: services.map((s) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: s.name, ...(s.description ? { description: s.description } : {}) },
              ...(s.price != null ? { price: Number(s.price).toFixed(2), priceCurrency: s.currency } : {}),
            })),
          },
        }
      : {}),
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: url, actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
      result: { "@type": "Reservation", name: "Termin" },
    },
  };
}

/** JSON za <script type="application/ld+json"> – '<' se escapuje da tekst salona ne može zatvoriti tag. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
