import { env } from "@/lib/env";

/** Promo video sa početne stranice – jedan izvor za stranicu, JSON-LD i video sitemap. */
export const PROMO_VIDEO = {
  title: "Termini – online zakazivanje za salone i ordinacije (promo, 46 s)",
  description:
    "Kako klijenti sami zakažu termin za 30 sekundi, bez aplikacije i poziva, i kako im podsjetnik stiže na WhatsApp 24 i 2 sata prije termina, uz SMS kada nemaju WhatsApp. Za frizere, brijačnice, kozmetičare i stomatologe u BiH.",
  src: "/video/termini-promo.mp4",
  poster: "/video/termini-promo.jpg",
  captions: "/video/termini-promo.bs.vtt",
  width: 1280,
  height: 720,
  durationSeconds: 46,
  uploadDate: "2026-10-17",
};

export function promoVideoJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: PROMO_VIDEO.title,
    description: PROMO_VIDEO.description,
    thumbnailUrl: [`${env.appUrl}${PROMO_VIDEO.poster}`],
    contentUrl: `${env.appUrl}${PROMO_VIDEO.src}`,
    embedUrl: `${env.appUrl}/#video`,
    uploadDate: `${PROMO_VIDEO.uploadDate}T12:00:00+02:00`,
    duration: `PT${PROMO_VIDEO.durationSeconds}S`,
    inLanguage: "bs",
    width: PROMO_VIDEO.width,
    height: PROMO_VIDEO.height,
    publisher: { "@type": "Organization", name: "Termini", url: env.appUrl },
  };
}
