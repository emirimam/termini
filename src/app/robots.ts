import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel, linkovi za upravljanje terminom i API ne smiju u pretragu.
      disallow: ["/app", "/admin", "/onboarding", "/t/", "/api/", "/auth/"],
    },
    sitemap: `${env.appUrl}/sitemap.xml`,
    host: env.appUrl,
  };
}
