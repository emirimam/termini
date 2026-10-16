import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Termini – online zakazivanje za salone i ordinacije",
    template: "%s · Termini",
  },
  description:
    "Online zakazivanje termina za frizere, brijačnice, kozmetičare i stomatologe, s podsjetnicima na WhatsApp i SMS.",
  applicationName: "Termini",
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
