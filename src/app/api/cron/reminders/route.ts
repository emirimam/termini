import { serverEnv } from "@/lib/env";
import { processDueJobs } from "@/lib/reminders/process";

// Poziva ga Supabase pg_cron (pg_net) svakih 5 minuta – vidi
// supabase/cron.sql. Zaštićeno tajnim tokenom u Authorization zaglavlju.

export const maxDuration = 60;

async function handle(request: Request) {
  const secret = serverEnv().cronSecret;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await processDueJobs(100);
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("cron reminders", e);
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
