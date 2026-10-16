-- Slanje podsjetnika svakih 5 minuta (Supabase pg_cron + pg_net).
-- Pokrenuti JEDNOM nakon prvog deploya, u Supabase SQL Editoru.
-- Zamijenite <APP_URL> (npr. https://termini.vercel.app) i <CRON_SECRET>
-- (ista vrijednost kao varijabla CRON_SECRET na Vercelu).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Tajna se čuva u Vaultu, ne u tekstu cron posla.
select vault.create_secret('<CRON_SECRET>', 'termini_cron_secret');
select vault.create_secret('<APP_URL>', 'termini_app_url');

select cron.schedule(
  'termini-podsjetnici',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'termini_app_url') || '/api/cron/reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'termini_cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- Provjera:  select * from cron.job;
-- Historija: select * from cron.job_run_details order by start_time desc limit 10;
-- Odgovori:  select * from net._http_response order by created desc limit 10;
