import { Suspense } from "react";
import { requireTenant } from "@/lib/tenant";
import { addDays, isValidDateStr, isoWeekday, todayIn, zonedInstant } from "@/lib/time";
import type { AppointmentStatus, Service, Staff, WorkingHours } from "@/lib/types";
import { DayCalendar, type CalendarAppointment } from "./day-calendar";

type Props = { searchParams: Promise<{ datum?: string; dobrodosli?: string }> };

export default function Page({ searchParams }: Props) {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function CalendarLoader({ searchParams }: Props) {
  const { datum, dobrodosli } = await searchParams;
  const { supabase, tenant } = await requireTenant();
  const tz = tenant.timezone;
  const today = todayIn(tz);
  const date = datum && isValidDateStr(datum) ? datum : today;
  const from = zonedInstant(date, "00:00", tz).toISOString();
  const to = zonedInstant(addDays(date, 1), "00:00", tz).toISOString();

  const [staffRes, servicesRes, hoursRes, apptRes, offRes] = await Promise.all([
    supabase.from("staff").select("*").eq("tenant_id", tenant.id).eq("active", true).order("sort").order("name"),
    supabase.from("services").select("*").eq("tenant_id", tenant.id).eq("active", true).order("sort").order("name"),
    supabase.from("working_hours").select("*").eq("tenant_id", tenant.id).eq("weekday", isoWeekday(date)),
    supabase
      .from("appointments")
      .select("id, staff_id, starts_at, ends_at, status, notes, source, price, client:clients(id, name, phone, no_show_count), service:services(id, name)")
      .eq("tenant_id", tenant.id)
      .gte("starts_at", from)
      .lt("starts_at", to)
      .order("starts_at"),
    supabase
      .from("time_off")
      .select("staff_id, starts_at, ends_at, reason")
      .eq("tenant_id", tenant.id)
      .lt("starts_at", to)
      .gt("ends_at", from),
  ]);

  const appointments = (apptRes.data ?? []).map((a) => ({
    ...a,
    status: a.status as AppointmentStatus,
  })) as unknown as CalendarAppointment[];

  return (
    <DayCalendar
      key={date}
      date={date}
      today={today}
      timezone={tz}
      slug={tenant.slug}
      welcome={dobrodosli === "1"}
      staff={(staffRes.data ?? []) as Staff[]}
      services={(servicesRes.data ?? []) as Service[]}
      hours={(hoursRes.data ?? []) as WorkingHours[]}
      appointments={appointments}
      timeOff={offRes.data ?? []}
      slotStep={tenant.slot_step_minutes}
    />
  );
}

function CalendarSkeleton() {
  return (
    <div className="p-4 md:p-8" aria-busy>
      <div className="h-10 w-64 animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-6 h-[70dvh] animate-pulse rounded-3xl bg-surface-2" />
    </div>
  );
}
