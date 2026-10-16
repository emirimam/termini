import { Suspense } from "react";
import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import type { Client } from "@/lib/types";
import { ListSkeleton, PageHeader, PageShell } from "../page-header";
import { ClientsView } from "./clients-view";

export const metadata: Metadata = { title: "Klijenti" };

type Props = { searchParams: Promise<{ q?: string }> };

export default function Page({ searchParams }: Props) {
  return (
    <PageShell>
      <PageHeader title="Klijenti" description="Svi koji su zakazali online ili ste ih vi upisali. Uvezite postojeće kontakte iz telefona ili Excela." />
      <Suspense fallback={<ListSkeleton />}>
        <ClientsLoader searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function ClientsLoader({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const { supabase, tenant } = await requireTenant();
  const term = q.replace(/[,()*%\\:."']/g, " ").trim();

  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenant.id)
    .order("name")
    .limit(200);
  if (term.length >= 2) {
    const digits = term.replace(/\D/g, "").replace(/^0/, "");
    query = query.or(digits.length >= 3 ? `name.ilike.%${term}%,phone.ilike.%${digits}%` : `name.ilike.%${term}%`);
  }
  const { data, count } = await query;

  return <ClientsView clients={(data ?? []) as Client[]} total={count ?? 0} query={q} />;
}
