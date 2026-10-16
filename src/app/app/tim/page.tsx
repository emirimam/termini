import { Suspense } from "react";
import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import type { Service, Staff, TimeOff, WorkingHours } from "@/lib/types";
import { ListSkeleton, PageHeader, PageShell } from "../page-header";
import { TeamEditor } from "./team-editor";

export const metadata: Metadata = { title: "Tim" };

export default function Page() {
  return (
    <PageShell>
      <PageHeader title="Tim" description="Ko radi, kada radi i koje usluge radi. Klijenti mogu izabrati osobu ili prvu slobodnu." />
      <Suspense fallback={<ListSkeleton />}>
        <TeamLoader />
      </Suspense>
    </PageShell>
  );
}

async function TeamLoader() {
  const { supabase, tenant } = await requireTenant();
  const [staff, services, links, hours, off] = await Promise.all([
    supabase.from("staff").select("*").eq("tenant_id", tenant.id).order("sort").order("name"),
    supabase.from("services").select("*").eq("tenant_id", tenant.id).order("sort").order("name"),
    supabase.from("staff_services").select("staff_id, service_id").eq("tenant_id", tenant.id),
    supabase.from("working_hours").select("*").eq("tenant_id", tenant.id).order("weekday").order("start_time"),
    supabase
      .from("time_off")
      .select("*")
      .eq("tenant_id", tenant.id)
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);
  return (
    <TeamEditor
      timezone={tenant.timezone}
      staff={(staff.data ?? []) as Staff[]}
      services={(services.data ?? []) as Service[]}
      links={links.data ?? []}
      hours={(hours.data ?? []) as WorkingHours[]}
      timeOff={(off.data ?? []) as TimeOff[]}
    />
  );
}
