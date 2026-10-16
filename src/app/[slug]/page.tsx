import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { getCatalog, getTenantBySlug } from "@/lib/booking";
import { initials } from "@/lib/format";
import { BookingFlow } from "./booking-flow";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Salon nije pronađen" };
  return {
    title: `Zakaži termin – ${tenant.name}`,
    description: tenant.description ?? `Online zakazivanje termina u ${tenant.name}.`,
  };
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<BookingSkeleton />}>
      <TenantBooking params={params} />
    </Suspense>
  );
}

async function TenantBooking({ params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const catalog = await getCatalog(tenant);

  return (
    <main
      className="mx-auto w-full max-w-xl px-4 pb-28 pt-8 sm:pt-12"
      style={{ ["--brand" as string]: tenant.brand_color, ["--brand-ink" as string]: "#ffffff" }}
    >
      <header className="mb-8 flex items-start gap-4">
        <div
          aria-hidden
          className="font-display grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-xl font-bold text-brand-ink"
        >
          {initials(tenant.name)}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] font-bold leading-tight sm:text-3xl">{tenant.name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {(tenant.address || tenant.city) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden />
                {[tenant.address, tenant.city].filter(Boolean).join(", ")}
              </span>
            )}
            {tenant.phone && (
              <a href={`tel:${tenant.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                <Phone className="size-3.5" aria-hidden />
                {tenant.phone}
              </a>
            )}
          </div>
          {tenant.description && <p className="mt-3 max-w-prose text-[0.95rem] text-muted">{tenant.description}</p>}
        </div>
      </header>

      {!tenant.online_booking_enabled ? (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="font-semibold">Online zakazivanje je trenutno isključeno.</p>
          <p className="mt-1 text-muted">
            Za termin nazovite {tenant.phone ? <a className="underline" href={`tel:${tenant.phone}`}>{tenant.phone}</a> : "salon"}.
          </p>
        </div>
      ) : catalog.services.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="font-semibold">Usluge još nisu objavljene.</p>
          <p className="mt-1 text-muted">Pokušajte ponovo uskoro ili se javite salonu telefonom.</p>
        </div>
      ) : (
        <BookingFlow
          slug={tenant.slug}
          tenantName={tenant.name}
          timezone={tenant.timezone}
          services={catalog.services}
          staff={catalog.staff}
          links={catalog.links}
        />
      )}

      <footer className="mt-16 text-center text-xs text-muted">
        Zakazivanje pokreće <Link href="/" className="underline-offset-2 hover:underline">Termini</Link>
      </footer>
    </main>
  );
}

function BookingSkeleton() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-12" aria-busy>
      <div className="flex items-center gap-4">
        <div className="size-14 animate-pulse rounded-2xl bg-surface-2" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-2" />
      </div>
      <div className="mt-10 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    </main>
  );
}
