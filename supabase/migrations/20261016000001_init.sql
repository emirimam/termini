-- Termini: multitenant platforma za zakazivanje termina
-- Šema: saloni/ordinacije (tenants), osoblje, usluge, radno vrijeme, klijenti,
-- termini, poslovi podsjetnika i dnevnik poruka. Sve tabele imaju tenant_id i RLS.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  name text not null check (char_length(name) between 2 and 80),
  kind text not null default 'salon' check (kind in ('salon', 'dental', 'barber', 'beauty', 'other')),
  timezone text not null default 'Europe/Sarajevo',
  phone text,
  email text,
  address text,
  city text,
  description text,
  brand_color text not null default '#0F6B5C' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_url text,
  -- pravila rezervacije
  min_notice_minutes int not null default 60 check (min_notice_minutes between 0 and 10080),
  horizon_days int not null default 60 check (horizon_days between 1 and 365),
  slot_step_minutes int not null default 15 check (slot_step_minutes in (5, 10, 15, 20, 30, 60)),
  cancel_until_hours int not null default 12 check (cancel_until_hours between 0 and 168),
  online_booking_enabled boolean not null default true,
  -- podsjetnici
  reminder_channel text not null default 'whatsapp_sms'
    check (reminder_channel in ('whatsapp_sms', 'whatsapp', 'sms', 'off')),
  reminder_offsets int[] not null default '{1440,120}',
  send_confirmation boolean not null default true,
  quiet_start time not null default '21:00',
  quiet_end time not null default '08:00',
  created_at timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_members_user_idx on public.tenant_members(user_id);

-- ---------------------------------------------------------------------------
-- Osoblje, usluge, radno vrijeme
-- ---------------------------------------------------------------------------
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  title text,
  color text not null default '#0F6B5C',
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index staff_tenant_idx on public.staff(tenant_id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  duration_min int not null check (duration_min between 5 and 600),
  buffer_min int not null default 0 check (buffer_min between 0 and 120),
  price numeric(10, 2),
  currency text not null default 'BAM',
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index services_tenant_idx on public.services(tenant_id);

create table public.staff_services (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);
create index staff_services_service_idx on public.staff_services(service_id);

-- weekday: 1 = ponedjeljak ... 7 = nedjelja (ISO)
create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index working_hours_staff_idx on public.working_hours(staff_id, weekday);

-- staff_id null = cijeli salon zatvoren (praznik, godišnji odmor)
create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);
create index time_off_tenant_idx on public.time_off(tenant_id, starts_at);

-- ---------------------------------------------------------------------------
-- Klijenti i termini
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  email text,
  notes text,
  messaging_consent boolean not null default true,
  no_show_count int not null default 0,
  blocked boolean not null default false,
  source text not null default 'online' check (source in ('online', 'admin', 'import')),
  created_at timestamptz not null default now(),
  unique (tenant_id, phone)
);
create index clients_tenant_name_idx on public.clients(tenant_id, name);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- kraj blokade = ends_at + buffer usluge (računa aplikacija)
  blocked_until timestamptz not null,
  status text not null default 'booked'
    check (status in ('booked', 'confirmed', 'cancelled', 'completed', 'no_show')),
  source text not null default 'online' check (source in ('online', 'admin')),
  price numeric(10, 2),
  notes text,
  manage_token uuid not null unique default gen_random_uuid(),
  cancelled_by text check (cancelled_by in ('client', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (blocked_until >= ends_at),
  -- nemoguće dvostruko zakazivanje istog osoblja u isto vrijeme
  constraint appointments_no_overlap exclude using gist (
    staff_id with =,
    tstzrange(starts_at, blocked_until, '[)') with &&
  ) where (status in ('booked', 'confirmed'))
);
create index appointments_tenant_time_idx on public.appointments(tenant_id, starts_at);
create index appointments_client_idx on public.appointments(client_id);

-- ---------------------------------------------------------------------------
-- Podsjetnici i poruke
-- ---------------------------------------------------------------------------
create table public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  kind text not null check (kind in ('confirmation', 'reminder', 'cancellation')),
  offset_min int not null default 0,
  send_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'skipped', 'cancelled')),
  attempts int not null default 0,
  last_error text,
  channel_used text check (channel_used in ('whatsapp', 'sms')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index reminder_jobs_due_idx on public.reminder_jobs(send_at) where status = 'pending';
create index reminder_jobs_appt_idx on public.reminder_jobs(appointment_id);

create table public.message_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  job_id uuid references public.reminder_jobs(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'sms')),
  direction text not null default 'out' check (direction in ('out', 'in')),
  phone text not null,
  template text,
  body text,
  provider_message_id text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'read', 'failed', 'received')),
  error text,
  fallback_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index message_log_tenant_idx on public.message_log(tenant_id, created_at desc);
create index message_log_provider_idx on public.message_log(provider_message_id);

-- ---------------------------------------------------------------------------
-- Pomoćne funkcije
-- ---------------------------------------------------------------------------
create or replace function public.is_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = t and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_admin(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = t and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();
create trigger message_log_touch before update on public.message_log
  for each row execute function public.touch_updated_at();

-- Kreiranje salona: vlasnik, prvi član osoblja, radno vrijeme pon–pet 08–16, sub 08–13.
create or replace function public.create_tenant(
  p_name text,
  p_slug text,
  p_kind text,
  p_owner_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_staff uuid;
  d int;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.tenants (name, slug, kind)
  values (p_name, lower(p_slug), coalesce(p_kind, 'salon'))
  returning id into v_tenant;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (v_tenant, auth.uid(), 'owner');

  insert into public.staff (tenant_id, name, sort)
  values (v_tenant, coalesce(nullif(trim(p_owner_name), ''), p_name), 0)
  returning id into v_staff;

  for d in 1..5 loop
    insert into public.working_hours (tenant_id, staff_id, weekday, start_time, end_time)
    values (v_tenant, v_staff, d, '08:00', '16:00');
  end loop;
  insert into public.working_hours (tenant_id, staff_id, weekday, start_time, end_time)
  values (v_tenant, v_staff, 6, '08:00', '13:00');

  return v_tenant;
end $$;

revoke all on function public.create_tenant(text, text, text, text) from public, anon;
grant execute on function public.create_tenant(text, text, text, text) to authenticated;

-- Worker preuzima dospjele poslove bez dupliranja (više paralelnih poziva je sigurno).
create or replace function public.claim_reminder_jobs(p_limit int default 50)
returns setof public.reminder_jobs
language sql
security definer
set search_path = public
as $$
  update public.reminder_jobs j
  set status = 'processing', attempts = j.attempts + 1
  where j.id in (
    select id from public.reminder_jobs
    where status = 'pending' and send_at <= now()
    order by send_at
    limit p_limit
    for update skip locked
  )
  returning j.*;
$$;

-- Poslovi koji su zapeli u 'processing' (npr. pad servera) vraćaju se u red.
create or replace function public.requeue_stuck_jobs()
returns int
language sql
security definer
set search_path = public
as $$
  with r as (
    update public.reminder_jobs
    set status = case when attempts >= 3 then 'failed' else 'pending' end,
        last_error = coalesce(last_error, 'stuck in processing')
    where status = 'processing' and send_at < now() - interval '10 minutes'
    returning 1
  )
  select count(*)::int from r;
$$;

revoke all on function public.claim_reminder_jobs(int) from public, anon, authenticated;
revoke all on function public.requeue_stuck_jobs() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Javna rezervacija ide isključivo preko servera (service role), anon nema pristup.
-- ---------------------------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.staff_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.message_log enable row level security;

create policy tenants_select on public.tenants for select to authenticated
  using (public.is_member(id));
create policy tenants_update on public.tenants for update to authenticated
  using (public.is_admin(id)) with check (public.is_admin(id));

create policy members_select on public.tenant_members for select to authenticated
  using (user_id = auth.uid() or public.is_admin(tenant_id));

-- Tabele kojima upravljaju vlasnik/admin; osoblje ih samo čita.
do $$
declare t text;
begin
  foreach t in array array['staff', 'services', 'staff_services', 'working_hours', 'time_off']
  loop
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated using (public.is_member(tenant_id));
       create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.is_admin(tenant_id));
       create policy %1$s_update on public.%1$s for update to authenticated using (public.is_admin(tenant_id)) with check (public.is_admin(tenant_id));
       create policy %1$s_delete on public.%1$s for delete to authenticated using (public.is_admin(tenant_id));',
      t);
  end loop;
end $$;

-- Klijente i termine vodi svako osoblje salona.
do $$
declare t text;
begin
  foreach t in array array['clients', 'appointments']
  loop
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated using (public.is_member(tenant_id));
       create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.is_member(tenant_id));
       create policy %1$s_update on public.%1$s for update to authenticated using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));
       create policy %1$s_delete on public.%1$s for delete to authenticated using (public.is_admin(tenant_id));',
      t);
  end loop;
end $$;

create policy reminder_jobs_select on public.reminder_jobs for select to authenticated
  using (public.is_member(tenant_id));
create policy message_log_select on public.message_log for select to authenticated
  using (public.is_member(tenant_id));
