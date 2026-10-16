import { Suspense } from "react";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { requireTenant } from "@/lib/tenant";
import { env } from "@/lib/env";
import { PageHeader, PageShell } from "../page-header";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Postavke" };

export default function Page() {
  return (
    <PageShell>
      <PageHeader title="Postavke" />
      <Suspense fallback={<div className="h-[60dvh] animate-pulse rounded-2xl bg-surface-2" />}>
        <SettingsLoader />
      </Suspense>
    </PageShell>
  );
}

async function SettingsLoader() {
  const { tenant } = await requireTenant();
  const url = `${env.appUrl}/${tenant.slug}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, width: 240, color: { dark: "#13212e", light: "#ffffff" } });
  return <SettingsForm tenant={tenant} bookingUrl={url} qrSvg={qr} />;
}
