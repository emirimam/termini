import { getCatalog, getTenantBySlug } from "@/lib/booking";
import { KIND_LABEL } from "@/lib/types";
import { ogSize, renderOg } from "@/lib/og";

export const alt = "Online zakazivanje termina";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    return renderOg({ eyebrow: "Termini", title: "Online zakazivanje", subtitle: "Izaberite uslugu i vrijeme za pola minute." });
  }
  const { services } = await getCatalog(tenant);
  const list = services.slice(0, 3).map((s) => s.name).join(", ");
  return renderOg({
    eyebrow: [KIND_LABEL[tenant.kind], tenant.city].filter(Boolean).join(", "),
    title: tenant.name,
    subtitle: list ? `Zakažite online: ${list}` : "Zakažite termin online za pola minute.",
    brand: tenant.brand_color,
  });
}
