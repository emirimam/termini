import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import type { Tenant } from "@/lib/types";

export interface TenantRow {
  tenant: Tenant;
  owners: string[];
  stats: {
    appointments_total: number;
    appointments_30d: number;
    upcoming: number;
    no_shows_30d: number;
    clients: number;
    staff: number;
    wa_month: number;
    sms_month: number;
    failed_month: number;
    last_booking_at: string | null;
  };
}

/** Email adrese korisnika po ID-u (Supabase Auth admin API, samo server). */
async function userEmails(): Promise<Map<string, string>> {
  const db = adminClient();
  const map = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data.users.length) break;
    for (const u of data.users) if (u.email) map.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return map;
}

export async function loadTenantRows(): Promise<TenantRow[]> {
  const db = adminClient();
  const [tenants, stats, members, emails] = await Promise.all([
    db.from("tenants").select("*").order("created_at", { ascending: false }),
    db.rpc("platform_tenant_stats"),
    db.from("tenant_members").select("tenant_id, user_id, role"),
    userEmails(),
  ]);
  const statMap = new Map((stats.data ?? []).map((s) => [s.tenant_id, s]));
  return ((tenants.data ?? []) as Tenant[]).map((t) => {
    const s = statMap.get(t.id);
    return {
      tenant: t,
      owners: (members.data ?? [])
        .filter((m) => m.tenant_id === t.id && m.role === "owner")
        .map((m) => emails.get(m.user_id) ?? "nepoznat korisnik"),
      stats: {
        appointments_total: Number(s?.appointments_total ?? 0),
        appointments_30d: Number(s?.appointments_30d ?? 0),
        upcoming: Number(s?.upcoming ?? 0),
        no_shows_30d: Number(s?.no_shows_30d ?? 0),
        clients: Number(s?.clients ?? 0),
        staff: Number(s?.staff ?? 0),
        wa_month: Number(s?.wa_month ?? 0),
        sms_month: Number(s?.sms_month ?? 0),
        failed_month: Number(s?.failed_month ?? 0),
        last_booking_at: s?.last_booking_at ?? null,
      },
    };
  });
}
