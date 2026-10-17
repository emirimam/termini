import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { env } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { PROMO_VIDEO } from "@/lib/promo-video";

// Početna, registracija i javne stranice svih aktivnih salona.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // uvijek svjež spisak salona
  const base: MetadataRoute.Sitemap = [
    {
      url: env.appUrl,
      changeFrequency: "weekly",
      priority: 1,
      videos: [
        {
          title: PROMO_VIDEO.title,
          description: PROMO_VIDEO.description,
          thumbnail_loc: `${env.appUrl}${PROMO_VIDEO.poster}`,
          content_loc: `${env.appUrl}${PROMO_VIDEO.src}`,
          duration: PROMO_VIDEO.durationSeconds,
          publication_date: PROMO_VIDEO.uploadDate,
          family_friendly: "yes",
        },
      ],
    },
    { url: `${env.appUrl}/registracija`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${env.appUrl}/privatnost`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${env.appUrl}/uslovi`, changeFrequency: "yearly", priority: 0.3 },
  ];
  try {
    const { data } = await adminClient()
      .from("tenants")
      .select("slug, created_at")
      .eq("online_booking_enabled", true)
      .eq("suspended", false)
      .neq("slug", "demo-salon")
      .order("created_at");
    return [
      ...base,
      ...(data ?? []).map((t) => ({
        url: `${env.appUrl}/${t.slug}`,
        lastModified: new Date(t.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return base;
  }
}
