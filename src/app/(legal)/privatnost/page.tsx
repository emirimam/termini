import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { LEGAL_UPDATED, OPERATOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politika privatnosti",
  description: "Kako Termini prikuplja, koristi i štiti lične podatke vlasnika salona i njihovih klijenata.",
  alternates: { canonical: "/privatnost" },
};

export default function Page() {
  return (
    <article>
      <h1>Politika privatnosti</h1>
      <p className="mt-3 text-sm text-muted">Posljednja izmjena: {LEGAL_UPDATED}</p>

      <p className="mt-8">
        Ova politika objašnjava koje lične podatke obrađuje platforma {OPERATOR.product} ({env.appUrl.replace(/^https?:\/\//, "")}),
        u koje svrhe, s kim ih dijelimo i koja prava imate. Odnosi se na vlasnike i osoblje salona i ordinacija koji
        koriste platformu, kao i na njihove klijente koji zakazuju termine.
      </p>

      <h2 id="ko">1. Ko obrađuje podatke</h2>
      <p>
        Platformu vodi <strong>{OPERATOR.name}</strong>, {OPERATOR.place} (u daljem tekstu: „mi“). Za sva pitanja o
        privatnosti pišite na <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
      </p>
      <h3>Dvije različite uloge</h3>
      <ul>
        <li>
          <strong>Podaci o salonima i njihovim korisničkim nalozima</strong> (email, naziv salona, podešavanja): za njih smo mi
          odgovorni kao kontrolor.
        </li>
        <li>
          <strong>Podaci o klijentima salona</strong> (ime, broj telefona, termini, bilješke): kontrolor je salon ili ordinacija
          kod koje klijent zakazuje. Mi te podatke obrađujemo samo po nalogu salona i isključivo da bismo pružili uslugu
          zakazivanja i podsjetnika. Klijenti se za svoja prava prvo mogu obratiti salonu, a mogu i nama.
        </li>
      </ul>

      <h2 id="podaci">2. Koje podatke prikupljamo</h2>
      <table>
        <thead>
          <tr>
            <th>Ko</th>
            <th>Podaci</th>
            <th>Odakle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vlasnik i osoblje salona</td>
            <td>Email, lozinka (čuva se samo u šifrovanom obliku), ime, podaci o salonu (naziv, adresa, telefon, usluge, radno vrijeme)</td>
            <td>Od vas pri registraciji ili od Googlea ako se prijavite Google nalogom (ime, email, profilna slika)</td>
          </tr>
          <tr>
            <td>Klijent salona</td>
            <td>Ime i prezime, broj mobitela, po želji email i napomena uz termin, termini (datum, usluga, osoba, status), saglasnost za poruke</td>
            <td>Od klijenta pri online zakazivanju ili od salona (ručni unos ili uvoz kontakata)</td>
          </tr>
          <tr>
            <td>Poruke</td>
            <td>Tekst i status poslanih potvrda i podsjetnika, odgovori klijenata na WhatsApp poruke (npr. „Dolazim“)</td>
            <td>Nastaju radom platforme</td>
          </tr>
          <tr>
            <td>Tehnički podaci</td>
            <td>IP adresa, vrsta preglednika, vrijeme pristupa u sistemskim zapisima (logovima)</td>
            <td>Automatski, pri korištenju stranice</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-4">
        Ne tražimo i ne trebamo posebne kategorije podataka. Stomatološke ordinacije i saloni ne bi trebali u napomene
        upisivati zdravstvene ili druge osjetljive podatke; za medicinsku dokumentaciju koristite namjenski program ordinacije.
      </p>

      <h2 id="svrhe">3. Zašto koristimo podatke i na kojem osnovu</h2>
      <ul>
        <li>
          <strong>Pružanje usluge</strong> – vođenje naloga, kalendara, online zakazivanja i upravljanja terminom. Osnov: ugovor
          (Uslovi korištenja) sa salonom; za klijente, zakoniti interes salona da organizuje svoje termine.
        </li>
        <li>
          <strong>Potvrde i podsjetnici</strong> putem WhatsAppa i SMS-a. Osnov: saglasnost klijenta, koju daje označavanjem
          polja pri zakazivanju i može je povući u svakom trenutku (javite se salonu ili nama).
        </li>
        <li>
          <strong>Sigurnost i sprječavanje zloupotrebe</strong> (npr. ograničenje broja online termina, blokiranje). Osnov:
          zakoniti interes.
        </li>
        <li>
          <strong>Ispunjavanje zakonskih obaveza</strong>, ako ih imamo. Osnov: zakon.
        </li>
      </ul>
      <p>
        Ne prodajemo podatke, ne koristimo ih za oglašavanje i ne šaljemo klijentima salona marketinške poruke.
      </p>

      <h2 id="dijeljenje">4. S kim dijelimo podatke</h2>
      <p>Podatke dijelimo samo s pružaocima usluga bez kojih platforma ne može raditi:</p>
      <ul>
        <li><strong>Supabase</strong> – baza podataka i prijava korisnika; podaci se čuvaju u data centru u Frankfurtu (EU).</li>
        <li><strong>Vercel</strong> – hosting aplikacije; serverska obrada u Frankfurtu (EU), statični sadržaj preko globalne mreže.</li>
        <li><strong>Meta (WhatsApp Business)</strong> – slanje potvrda i podsjetnika na WhatsApp.</li>
        <li><strong>Pružalac SMS usluge</strong> (npr. Infobip) – slanje SMS poruka kada WhatsApp nije dostupan.</li>
        <li><strong>Google</strong> – samo ako se vlasnik salona prijavljuje Google nalogom.</li>
      </ul>
      <p>
        Neki od ovih pružalaca mogu obrađivati podatke i izvan BiH i EU (npr. u SAD-u). U tim slučajevima se oslanjamo na
        njihove standardne ugovorne klauzule i druge zaštitne mjere koje nude. Podatke možemo otkriti i nadležnim organima
        kada to zahtijeva zakon.
      </p>

      <h2 id="cuvanje">5. Koliko dugo čuvamo podatke</h2>
      <ul>
        <li>Podaci o nalogu i salonu – dok je nalog aktivan i do 30 dana nakon zahtjeva za brisanje.</li>
        <li>Podaci o klijentima i terminima – dok ih salon ne obriše ili dok salon koristi platformu; po gašenju naloga brišu se u roku od 30 dana.</li>
        <li>Dnevnik poruka – do 12 mjeseci, radi rješavanja reklamacija i obračuna poruka.</li>
        <li>Sistemski zapisi (logovi) – kratko, obično nekoliko dana do nekoliko sedmica, prema pravilima pružaoca hostinga.</li>
      </ul>

      <h2 id="sigurnost">6. Kako štitimo podatke</h2>
      <p>
        Sav promet ide šifrovano (HTTPS). Svaki salon vidi isključivo svoje podatke – to je osigurano pravilima na nivou baze
        (Row Level Security). Lozinke se ne čuvaju u čitljivom obliku. Linkovi za upravljanje terminom sadrže dug, nasumičan
        kod koji je teško pogoditi. Nijedan sistem nije potpuno siguran, ali ćemo vas bez odgađanja obavijestiti ako dođe do
        povrede podataka koja vas se tiče.
      </p>

      <h2 id="kolacici">7. Kolačići</h2>
      <p>
        Koristimo samo neophodne kolačiće za prijavu u panel salona (održavanje sesije). Ne koristimo kolačiće za praćenje
        ni oglašavanje, pa za njih ne tražimo posebnu saglasnost. Klijenti koji samo zakazuju termin ne dobijaju kolačiće za
        prijavu.
      </p>

      <h2 id="prava">8. Vaša prava</h2>
      <p>U skladu s propisima o zaštiti ličnih podataka koji se primjenjuju u Bosni i Hercegovini i, gdje je primjenjivo, Općom uredbom EU o zaštiti podataka (GDPR), imate pravo da:</p>
      <ul>
        <li>saznate koje podatke o vama obrađujemo i dobijete kopiju,</li>
        <li>tražite ispravku netačnih podataka,</li>
        <li>tražite brisanje podataka,</li>
        <li>povučete saglasnost za poruke u bilo kojem trenutku,</li>
        <li>uložite prigovor na obradu ili tražite ograničenje obrade,</li>
        <li>podnesete pritužbu nadležnom nadzornom organu (u BiH: Agencija za zaštitu ličnih/osobnih podataka u BiH).</li>
      </ul>
      <p>
        Zahtjev pošaljite na <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. Odgovaramo u roku od 30 dana. Ako ste
        klijent salona, zahtjev možete uputiti i direktno salonu.
      </p>

      <h2 id="djeca">9. Djeca</h2>
      <p>
        Nalog salona mogu otvoriti samo punoljetne osobe. Termine za maloljetnu osobu treba da zakaže roditelj ili staratelj.
      </p>

      <h2 id="izmjene">10. Izmjene politike</h2>
      <p>
        Politiku možemo povremeno ažurirati. Datum posljednje izmjene je naveden na vrhu. O značajnim izmjenama vlasnike salona
        obavještavamo emailom ili u aplikaciji. Pogledajte i <Link href="/uslovi">Uslove korištenja</Link>.
      </p>
    </article>
  );
}
