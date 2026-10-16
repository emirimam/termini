import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { canClientCancel, getByToken } from "@/lib/booking";
import { formatDuration, formatPrice } from "@/lib/format";
import { formatDayLong, localDate, localTime } from "@/lib/time";
import { ManageAppointment } from "./manage";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ novi?: string }>;
};

export const metadata: Metadata = {
  title: "Vaš termin",
  robots: { index: false, follow: false },
};

export default function Page(props: Props) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-4 pt-16" aria-busy><div className="h-72 animate-pulse rounded-3xl bg-surface-2" /></main>}>
      <TokenPage {...props} />
    </Suspense>
  );
}

async function TokenPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { novi } = await searchParams;
  const a = await getByToken(token);
  if (!a) notFound();

  const tz = a.tenant.timezone;
  const date = localDate(a.starts_at, tz);

  return (
    <main
      className="mx-auto w-full max-w-md px-4 pb-16 pt-10 sm:pt-16"
      style={{ ["--brand" as string]: a.tenant.brand_color }}
    >
      <ManageAppointment
        token={token}
        justBooked={novi === "1"}
        status={a.status}
        canChange={canClientCancel(a)}
        cancelHours={a.tenant.cancel_until_hours}
        tenant={{
          name: a.tenant.name,
          slug: a.tenant.slug,
          phone: a.tenant.phone,
          address: [a.tenant.address, a.tenant.city].filter(Boolean).join(", ") || null,
        }}
        info={{
          service: a.service.name,
          staff: a.staff.name,
          clientName: a.client.name,
          day: formatDayLong(date),
          time: localTime(a.starts_at, tz),
          duration: formatDuration(a.service.duration_min),
          price: formatPrice(a.price ?? a.service.price, a.service.currency),
          timezone: tz,
        }}
      />
    </main>
  );
}
