import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "Termini – online zakazivanje termina za frizere, kozmetičare i stomatologe",
    template: "%s · Termini",
  },
  description:
    "Online zakazivanje termina za frizerske salone, brijačnice, kozmetičare i stomatološke ordinacije u BiH. Klijenti zakazuju sami, a podsjetnik stiže na WhatsApp ili SMS.",
  applicationName: "Termini",
  keywords: [
    "online zakazivanje termina",
    "zakazivanje frizer",
    "zakazivanje zubar",
    "softver za frizerske salone",
    "program za stomatološke ordinacije",
    "podsjetnik WhatsApp",
    "rezervacija termina BiH",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Termini",
    locale: "bs_BA",
    url: "/",
    title: "Termini – klijenti zakazuju sami, podsjetnik stiže na WhatsApp",
    description: "Online termini za frizere, brijačnice, kozmetičare i stomatologe. Bez aplikacije za klijente.",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1419" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bs">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
