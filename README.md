# Termini

Produkcija: https://termini-one.vercel.app

Multitenant platforma za online zakazivanje termina kod frizera, brijačnica,
kozmetičara i stomatologa, s potvrdama i podsjetnicima na **WhatsApp** i **SMS**.

- Javna stranica salona: `/{slug}` – klijent bira uslugu → osobu → termin → podatke, bez registracije
- Upravljanje terminom iz poruke: `/t/{token}` – potvrda, otkazivanje, pomjeranje, dodavanje u kalendar
- Panel salona: `/app` – dnevni kalendar po osobama, klijenti (uvoz CSV/vCard), usluge, tim i radno vrijeme, poruke, postavke s QR kodom

## Tehnologija

Next.js 16 (App Router, Cache Components) · Supabase (Postgres + Auth + RLS) · Tailwind CSS 4 · Vercel

## Kako radi multitenancy

Svaka tabela ima `tenant_id`. Prijavljeni korisnici rade preko Row Level Security
politika (`is_member`, `is_admin`), pa salon nikad ne vidi tuđe podatke. Javna
rezervacija i linkovi iz poruka idu isključivo preko servera (service role) –
anonimni korisnik nema direktan pristup bazi. Preklapanje termina iste osobe
blokira sama baza (`exclude using gist`), pa ni istovremene rezervacije ne mogu
napraviti dupli termin.

## Podsjetnici

1. Pri zakazivanju se u `reminder_jobs` upišu poslovi: potvrda odmah + podsjetnici
   (podrazumijevano 24 h i 2 h prije; salon bira u postavkama).
2. Podsjetnik koji pada u tihe sate (podrazumijevano 21–08 h) pomjera se ranije.
3. `pg_cron` svakih 5 minuta poziva `/api/cron/reminders` (vidi `supabase/cron.sql`).
4. Poruka ide na WhatsApp (odobreni šablon); ako WhatsApp vrati grešku ili webhook
   javi neuspjelu isporuku, šalje se SMS.
5. Odgovori klijenata (*Dolazim* / *Otkaži termin*) stižu na `/api/webhooks/whatsapp`.

Bez podešenih kanala aplikacija radi u **probnom režimu**: poruke se samo upisuju u
dnevnik (`/app/poruke`).

## Lokalni razvoj

```bash
cp .env.example .env.local   # dopuniti SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
npm test                     # testovi logike termina, podsjetnika i uvoza
```

## Postavljanje u produkciju

1. **Supabase** – migracije iz `supabase/migrations` (već primijenjene na projekat).
   U *Authentication → URL Configuration* postaviti *Site URL* na adresu aplikacije i
   dodati `https://VAŠ-DOMEN/auth/callback` u *Redirect URLs*.
2. **Vercel** – varijable okruženja iz `.env.example`. `CRON_SECRET` generisati npr.
   s `openssl rand -hex 32`.
3. **Cron** – pokrenuti `supabase/cron.sql` (s pravim URL-om i tajnom).
4. **WhatsApp** – u Meta developer konzoli: WhatsApp Business nalog, broj telefona,
   trajni token (System User), šabloni iz `docs/whatsapp-sabloni.md`, webhook
   `https://VAŠ-DOMEN/api/webhooks/whatsapp` s `WHATSAPP_VERIFY_TOKEN`, pretplata na `messages`.
5. **SMS** – Infobip (`SMS_PROVIDER=infobip`, `INFOBIP_BASE_URL`, `INFOBIP_API_KEY`)
   ili Twilio. Za BiH je alfanumerički pošiljalac (npr. `Termini`) uglavnom potrebno registrovati kod providera.
6. Isključiti `MESSAGING_DRY_RUN`.
