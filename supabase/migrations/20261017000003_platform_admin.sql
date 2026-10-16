-- Administratori platforme (vlasnik Terminija) i suspendovanje salona.

create table public.platform_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
-- RLS bez politika: tabelu čita samo server (service role).
alter table public.platform_admins enable row level security;

insert into public.platform_admins (email) values ('emirimamovice@gmail.com');

alter table public.tenants add column suspended boolean not null default false;
alter table public.tenants add column suspended_reason text;

-- Statistika po salonu za admin panel (jedan upit umjesto N).
create or replace function public.platform_tenant_stats()
returns table (
  tenant_id uuid,
  appointments_total bigint,
  appointments_30d bigint,
  upcoming bigint,
  no_shows_30d bigint,
  clients bigint,
  staff bigint,
  wa_month bigint,
  sms_month bigint,
  failed_month bigint,
  last_booking_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    (select count(*) from appointments a where a.tenant_id = t.id),
    (select count(*) from appointments a where a.tenant_id = t.id and a.created_at >= now() - interval '30 days'),
    (select count(*) from appointments a where a.tenant_id = t.id and a.starts_at >= now() and a.status in ('booked','confirmed')),
    (select count(*) from appointments a where a.tenant_id = t.id and a.status = 'no_show' and a.starts_at >= now() - interval '30 days'),
    (select count(*) from clients c where c.tenant_id = t.id),
    (select count(*) from staff s where s.tenant_id = t.id and s.active),
    (select count(*) from message_log m where m.tenant_id = t.id and m.direction = 'out' and m.channel = 'whatsapp' and m.status <> 'failed' and m.created_at >= date_trunc('month', now())),
    (select count(*) from message_log m where m.tenant_id = t.id and m.direction = 'out' and m.channel = 'sms' and m.status <> 'failed' and m.created_at >= date_trunc('month', now())),
    (select count(*) from message_log m where m.tenant_id = t.id and m.direction = 'out' and m.status = 'failed' and m.created_at >= date_trunc('month', now())),
    (select max(a.created_at) from appointments a where a.tenant_id = t.id)
  from tenants t;
$$;

revoke all on function public.platform_tenant_stats() from public, anon, authenticated;
