import { Suspense } from "react";
import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import type { Service } from "@/lib/types";
import { ListSkeleton, PageHeader, PageShell } from "../page-header";
import { ServicesEditor } from "./services-editor";

export const metadata: Metadata = { title: "Usluge" };

export default function Page() {
  return (
    <PageShell>
      <PageHeader title="Usluge" description="Klijenti biraju usluge ovim redom. Trajanje određuje koliko termin zauzima u kalendaru." />
      <Suspense fallback={<ListSkeleton />}>
        <ServicesLoader />
      </Suspense>
    </PageShell>
  );
}

async function ServicesLoader() {
  const { supabase, tenant } = await requireTenant();
  const { data } = await supabase.from("services").select("*").eq("tenant_id", tenant.id).order("sort").order("name");
  return <ServicesEditor services={(data ?? []) as Service[]} />;
}
