import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_UPDATED, OPERATOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Uslovi korištenja",
  description: "Uslovi korištenja platforme Termini za online zakazivanje termina.",
  alternates: { canonical: "/uslovi" },
};

export default function Page() {
  return (
    <article>
      <h1>Uslovi korištenja</h1>
      <p className="mt-3 text-sm text-muted">Posljednja izmjena: {LEGAL_UPDATED}</p>

      <p className="mt-8">
        Ovi uslovi uređuju korištenje platforme {OPERATOR.product} koju vodi <strong>{OPERATOR.name}</strong>,{" "}
        {OPERATOR.place} („mi“). Registracijom ili korištenjem platforme prihvatate ove uslove i{" "}
        <Link href="/privatnost">Politiku privatnosti</Link>.
      </p>

      <h2 id="usluga">1. Šta je usluga</h2>
      <p>
        {OPERATOR.product} omogućava salonima, brijačnicama, kozmetičarima, stomatološkim ordinacijama i sličnim djelatnostima
        („salon“) da primaju online termine, vode kalendar i klijente, te da klijentima šalju potvrde i podsjetnike putem
        WhatsAppa i SMS-a. Klijenti zakazuju bez naloga, preko javne stranice salona.
      </p>

      <h2 id="nalog">2. Nalog</h2>
      <ul>
        <li>Nalog može otvoriti punoljetna osoba koja je ovlaštena da zastupa salon.</li>
        <li>Podaci pri registraciji moraju biti tačni. Odgovorni ste za čuvanje lozinke i za sve radnje na svom nalogu.</li>
        <li>Ako primijetite neovlašten pristup, odmah nam javite na <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.</li>
      </ul>

      <h2 id="obaveze">3. Obaveze salona</h2>
      <p>Salon je kontrolor podataka o svojim klijentima i odgovoran je da:</p>
      <ul>
        <li>ima zakonit osnov za unos i uvoz podataka o klijentima (uključujući uvoz iz Excela ili telefona),</li>
        <li>šalje poruke samo klijentima koji su dali saglasnost za potvrde i podsjetnike,</li>
        <li>platformu koristi samo za poruke vezane za termine, a ne za reklame ili masovne poruke,</li>
        <li>u napomene ne upisuje zdravstvene i druge osjetljive podatke,</li>
        <li>na svojoj stranici objavi tačne usluge, cijene i radno vrijeme,</li>
        <li>klijentima pruži informacije o obradi podataka i odgovara na njihove zahtjeve u vezi s podacima.</li>
      </ul>

      <h2 id="zabrane">4. Nedozvoljeno korištenje</h2>
      <p>Nije dozvoljeno:</p>
      <ul>
        <li>slati neželjene, uvredljive, prevarantske ili nezakonite poruke,</li>
        <li>predstavljati se kao drugi salon, osoba ili brend,</li>
        <li>pokušavati pristupiti tuđim podacima, zaobići sigurnosne mjere ili opteretiti sistem,</li>
        <li>kopirati, preprodavati ili praviti izvedena djela od platforme bez naše dozvole.</li>
      </ul>
      <p>
        U slučaju kršenja ovih uslova možemo privremeno suspendovati ili ugasiti nalog. Suspendovan salon zadržava pristup
        kalendaru, ali online zakazivanje i poruke se zaustavljaju.
      </p>

      <h2 id="poruke">5. Poruke i cijene</h2>
      <p>
        Registracija i osnovno korištenje su trenutno besplatni. Slanje WhatsApp i SMS poruka nosi stvarne troškove, pa
        možemo uvesti ograničenja ili plaćene pakete poruka. O cijenama i promjenama obavijestićemo vas unaprijed, najmanje
        30 dana prije nego što počnu da važe; nijedan trošak vam neće biti naplaćen bez vaše saglasnosti.
      </p>
      <p>
        Isporuka poruka zavisi od Mete (WhatsApp), mobilnih operatera i drugih pružalaca usluga. Ne garantujemo da će svaka
        poruka biti isporučena ili pročitana na vrijeme.
      </p>

      <h2 id="dostupnost">6. Dostupnost i izmjene usluge</h2>
      <p>
        Trudimo se da platforma radi neprekidno, ali može doći do prekida zbog održavanja, kvarova ili problema kod pružalaca
        usluga. Funkcije platforme možemo mijenjati, dodavati ili ukidati. Za veće promjene koje utiču na vaš rad
        obavijestićemo vas unaprijed.
      </p>

      <h2 id="podaci">7. Vaši podaci</h2>
      <p>
        Podaci o vašem salonu i klijentima pripadaju vama. Možete ih u svakom trenutku izmijeniti ili obrisati u aplikaciji,
        a za izvoz ili potpuno brisanje naloga pišite nam. Po gašenju naloga podatke brišemo u roku od 30 dana, osim ako zakon
        ne zahtijeva duže čuvanje. Više u <Link href="/privatnost">Politici privatnosti</Link>.
      </p>

      <h2 id="odgovornost">8. Ograničenje odgovornosti</h2>
      <p>
        Platforma se pruža „kakva jeste“. Koliko zakon dozvoljava, ne odgovaramo za izgubljenu zaradu, propuštene termine,
        nedolaske klijenata, neisporučene poruke ni posrednu štetu nastalu korištenjem ili nemogućnošću korištenja
        platforme. Salon je odgovoran za odnos sa svojim klijentima, za pružene usluge i za tačnost podataka koje objavi.
        Ništa u ovim uslovima ne isključuje odgovornost koju zakon ne dozvoljava isključiti.
      </p>

      <h2 id="raskid">9. Prestanak korištenja</h2>
      <p>
        Korištenje možete prekinuti u bilo kojem trenutku tako što nam pošaljete zahtjev za gašenje naloga. Mi možemo ugasiti
        nalog uz prethodnu obavijest od 30 dana, ili odmah u slučaju ozbiljnog kršenja ovih uslova.
      </p>

      <h2 id="izmjene">10. Izmjene uslova</h2>
      <p>
        Uslove možemo ažurirati. O značajnim izmjenama obavijestićemo vas emailom ili u aplikaciji najmanje 15 dana prije nego
        što počnu da važe. Nastavak korištenja nakon toga znači da prihvatate izmijenjene uslove.
      </p>

      <h2 id="pravo">11. Mjerodavno pravo</h2>
      <p>
        Na ove uslove primjenjuje se pravo Bosne i Hercegovine. Sporove ćemo nastojati riješiti dogovorom; ako to ne uspije,
        nadležan je stvarno nadležni sud u Tuzli, osim ako propisi o zaštiti potrošača ne određuju drugačije.
      </p>

      <h2 id="kontakt">12. Kontakt</h2>
      <p>
        {OPERATOR.name}, {OPERATOR.place} – <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
      </p>
    </article>
  );
}
