import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { sendAppointmentMessage } from "@/lib/messaging/send";
import type { MessageContext } from "@/lib/messaging/content";
import type { Appointment, Client, ReminderJob, Service, Staff, Tenant } from "@/lib/types";

// Obrada dospjelih poslova. Poziva se iz /api/cron/reminders (Supabase pg_cron
// svakih par minuta) i odmah nakon rezervacije (after()) za potvrdu.

type AppointmentFull = Appointment & {
  client: Client;
  service: Service;
  staff: Staff;
  tenant: Tenant;
};

export async function loadAppointmentFull(id: string): Promise<AppointmentFull | null> {
  const { data, error } = await adminClient()
    .from("appointments")
    .select("*, client:clients(*), service:services(*), staff:staff(*), tenant:tenants(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AppointmentFull | null;
}

export function contextFor(a: AppointmentFull): MessageContext {
  return {
    clientName: a.client.name,
    tenantName: a.tenant.name,
    tenantSlug: a.tenant.slug,
    tenantPhone: a.tenant.phone,
    serviceName: a.service.name,
    staffName: a.staff.name,
    startsAt: a.starts_at,
    timezone: a.tenant.timezone,
    manageToken: a.manage_token,
  };
}

async function finish(job: ReminderJob, patch: Partial<ReminderJob>) {
  await adminClient().from("reminder_jobs").update(patch).eq("id", job.id);
}

async function processJob(job: ReminderJob) {
  const a = await loadAppointmentFull(job.appointment_id);
  if (!a) return finish(job, { status: "skipped", last_error: "Termin ne postoji" });

  const active = a.status === "booked" || a.status === "confirmed";
  if (job.kind !== "cancellation" && !active) {
    return finish(job, { status: "skipped", last_error: `Termin je ${a.status}` });
  }
  if (job.kind === "reminder" && new Date(a.starts_at).getTime() <= Date.now()) {
    return finish(job, { status: "skipped", last_error: "Termin je već počeo" });
  }
  if (a.tenant.suspended) {
    return finish(job, { status: "skipped", last_error: "Salon je suspendovan" });
  }
  if (a.tenant.reminder_channel === "off") {
    return finish(job, { status: "skipped", last_error: "Podsjetnici su isključeni" });
  }
  if (!a.client.messaging_consent) {
    return finish(job, { status: "skipped", last_error: "Klijent nije dao saglasnost za poruke" });
  }

  try {
    const res = await sendAppointmentMessage({
      tenantId: a.tenant_id,
      appointmentId: a.id,
      clientId: a.client_id,
      jobId: job.id,
      phone: a.client.phone,
      kind: job.kind,
      channelPolicy: a.tenant.reminder_channel,
      ctx: contextFor(a),
    });
    await finish(job, {
      status: "sent",
      channel_used: res.channel,
      sent_at: new Date().toISOString(),
      last_error: res.dryRun ? "Probni režim" : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Do 3 pokušaja s pauzom od 5 minuta, osim ako je termin blizu.
    const retry = job.attempts < 3 && new Date(a.starts_at).getTime() - Date.now() > 30 * 60_000;
    await finish(job, {
      status: retry ? "pending" : "failed",
      last_error: msg.slice(0, 500),
      ...(retry ? { send_at: new Date(Date.now() + 5 * 60_000).toISOString() } : {}),
    });
  }
}

export async function processDueJobs(limit = 50) {
  const db = adminClient();
  await db.rpc("requeue_stuck_jobs");
  const { data, error } = await db.rpc("claim_reminder_jobs", { p_limit: limit });
  if (error) throw new Error(error.message);
  const jobs = (data ?? []) as ReminderJob[];

  // Paralelno u manjim grupama da ne udarimo rate limit providera.
  const results = { processed: jobs.length };
  for (let i = 0; i < jobs.length; i += 5) {
    await Promise.all(jobs.slice(i, i + 5).map((j) => processJob(j).catch((e) => console.error("job", j.id, e))));
  }
  return results;
}
