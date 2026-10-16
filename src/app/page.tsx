import Link from "next/link";
import { Logo } from "@/components/logo";
import { env } from "@/lib/env";
import { jsonLdString } from "@/lib/seo";

const FAQ: [string, string][] = [
  [
    "Da li klijenti moraju instalirati aplikaciju?",
    "Ne. Klijent otvori link vašeg salona u browseru na telefonu, izabere uslugu, osobu i vrijeme, upiše ime i broj mobitela. Registracija nije potrebna.",
  ],
  [
    "Kako stižu potvrde i podsjetnici?",
    "Potvrda stiže odmah nakon zakazivanja, a podsjetnik dan ranije i dva sata prije termina (vremena birate sami). Poruka ide na WhatsApp, a ako klijent nema WhatsApp, šalje se SMS.",
  ],
  [
    "Šta ako klijent ne može doći?",
    "U poruci ima dugme za otkazivanje ili promjenu termina. Otkazani termin se odmah oslobađa za druge klijente, a vi određujete do kada je online otkazivanje moguće.",
  ],
  [
    "Može li više frizera ili doktora raditi u istom salonu?",
    "Da. Svaka osoba ima svoje radno vrijeme, pauze, odsustva i usluge koje radi. Klijent bira osobu ili prvu slobodnu, a kalendar prikazuje sve kolone jednu do druge.",
  ],
  [
    "Mogu li prebaciti postojeće klijente?",
    "Možete uvesti kontakte iz Excela (CSV), Google kontakata ili telefona (.vcf). Brojevi se automatski pretvaraju u ispravan format, a duplikati se preskaču.",
  ],
  [
    "Da li je moguće dvostruko zakazivanje?",
    "Nije. Sistem ne dozvoljava dva termina kod iste osobe u isto vrijeme, čak ni kad dva klijenta zakazuju u istoj sekundi.",
  ],
];


export default function Home() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Termini",
      url: env.appUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "bs",
      description:
        "Online zakazivanje termina za frizerske salone, brijačnice, kozmetičare i stomatološke ordinacije, s podsjetnicima na WhatsApp i SMS.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BAM" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return (
    <div className="min-h-dvh">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/prijava" className="btn btn-ghost btn-sm">Prijava</Link>
          <Link href="/registracija" className="btn btn-primary btn-sm">Registruj salon</Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 md:grid-cols-[1.1fr_1fr] md:px-8 md:pt-20">
          <div>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] sm:text-6xl">
              Klijenti zakazuju sami. Podsjetnik stiže na WhatsApp.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              Online termini za frizere, brijačnice, kozmetičare i stomatološke ordinacije. Klijent izabere uslugu i vrijeme
              za pola minute, bez aplikacije i bez registracije – a vi dobijete pun kalendar i manje praznih stolica.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/registracija" className="btn btn-primary px-6 py-3 text-base">
                Napravi besplatan nalog
              </Link>
              <a href="#kako" className="btn btn-ghost px-6 py-3 text-base">
                Kako radi
              </a>
            </div>
          </div>

          {/* Primjer poruke i karte termina – ono što klijent stvarno vidi */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="ticket rotate-[-2deg] overflow-hidden shadow-xl">
              <div className="p-6">
                <p className="text-sm text-muted">Salon Lejla, Tuzla</p>
                <p className="mt-1 text-lg font-semibold">Žensko šišanje i feniranje</p>
                <p className="mt-4 text-sm text-muted">četvrtak, 23. oktobra</p>
                <p className="font-display tabular mt-1 inline-block rounded-xl bg-stub px-3 py-1 text-5xl font-bold text-stub-ink">14:30</p>
              </div>
              <div className="ticket-perf" />
              <div className="flex justify-between p-6 text-sm">
                <span className="text-muted">Kod Amre · 1 h 15 min</span>
                <span className="tabular font-semibold">40 KM</span>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-2 w-64 rotate-[2deg] rounded-2xl rounded-br-sm bg-[#dcf8c6] p-3 text-sm text-[#111b21] shadow-lg sm:-right-10">
              <p>
                Zdravo Mirela, podsjećamo vas na termin u Salon Lejla: četvrtak u 14:30. Molimo potvrdite dolazak.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-center text-[0.8rem] font-semibold text-[#027eb5]">
                <span className="rounded-lg bg-white/80 py-1.5">Dolazim</span>
                <span className="rounded-lg bg-white/80 py-1.5">Otkaži termin</span>
              </div>
            </div>
          </div>
        </section>

        <section id="kako" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
            <h2 className="font-display text-3xl font-bold">Postavljeno za pet minuta</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                ["Upišite usluge i radno vrijeme", "Za frizere, brijačnice i ordinacije dodajemo uobičajene usluge, vi samo prilagodite cijene i trajanje."],
                ["Podijelite svoj link", "Stavite ga na Instagram i Google, ili odštampajte QR kod za recepciju. Klijent bira uslugu, osobu i vrijeme."],
                ["Podsjetnici idu sami", "Potvrda odmah, podsjetnik dan ranije i dva sata prije. Klijent jednim dodirom potvrdi ili otkaže."],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span className="font-display grid size-10 place-items-center rounded-full bg-ink text-lg font-bold text-paper">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-x-12 gap-y-8 px-4 py-16 md:grid-cols-2 md:px-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Manje nedolazaka, manje telefoniranja</h2>
            <p className="mt-4 text-muted">
              Termin koji klijent zaboravi je prazna stolica. Podsjetnik na WhatsApp vidi skoro svako, a ko nema WhatsApp
              dobije SMS. Kad klijent otkaže, termin se odmah oslobađa za nekog drugog.
            </p>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            {[
              ["Bez aplikacije za klijente", "Zakazivanje radi u browseru na svakom telefonu."],
              ["Kalendar za cijeli tim", "Svaka osoba ima svoje radno vrijeme, usluge i pauze."],
              ["Uvoz postojećih kontakata", "Iz Excela, starog programa ordinacije ili telefona."],
              ["Nikad dva klijenta u isto vrijeme", "Sistem ne dozvoljava preklapanje termina."],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-semibold">{t}</dt>
                <dd className="mt-1 text-sm text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-20 md:px-8" aria-labelledby="pitanja">
          <h2 id="pitanja" className="font-display text-3xl font-bold">Česta pitanja</h2>
          <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {q}
                    <span aria-hidden className="text-muted transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
          <div className="rounded-3xl bg-ink px-6 py-12 text-paper md:px-12">
            <h2 className="font-display max-w-xl text-3xl font-bold">Prvi online termin može stići još danas.</h2>
            <Link href="/registracija" className="btn mt-6 bg-stub px-6 py-3 text-base text-stub-ink hover:opacity-90">
              Registruj salon besplatno
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted md:px-8">
          <span>Termini</span>
          <Link href="/prijava" className="hover:text-ink">Prijava za salone</Link>
        </div>
      </footer>
    </div>
  );
}
