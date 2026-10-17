import Link from "next/link";
import { ArrowRight, Check, CheckCheck } from "lucide-react";
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

// Primjeri usluga po djelatnosti – ono što se automatski upiše pri registraciji.
const SEGMENTS: { name: string; line: string; services: [string, string][] }[] = [
  {
    name: "Frizerski saloni",
    line: "Svaka frizerka sa svojim rasporedom i uslugama.",
    services: [["Žensko šišanje", "45 min"], ["Feniranje", "30 min"], ["Farbanje", "2 h"]],
  },
  {
    name: "Brijačnice",
    line: "Kratki termini, puno klijenata – bez telefoniranja.",
    services: [["Šišanje", "30 min"], ["Brada", "20 min"], ["Šišanje i brada", "45 min"]],
  },
  {
    name: "Kozmetički saloni",
    line: "Duži tretmani i pauza za pripremu između klijenata.",
    services: [["Manikir", "45 min"], ["Pedikir", "1 h"], ["Tretman lica", "1 h"]],
  },
  {
    name: "Stomatološke ordinacije",
    line: "Pauza za dezinfekciju se računa sama nakon svakog pacijenta.",
    services: [["Pregled", "30 min"], ["Plombiranje", "45 min"], ["Uklanjanje kamenca", "45 min"]],
  },
];

const DAYS = [
  ["pon", "20"],
  ["uto", "21"],
  ["sri", "22"],
  ["čet", "23"],
  ["pet", "24"],
];
const SLOTS = ["09:00", "09:45", "11:15", "12:00", "13:30", "14:30", "15:15", "16:00"];

// Mini kalendar vlasnika: tri kolone, termini u bojama osoblja.
const CAL: { name: string; color: string; items: { top: number; h: number; who: string; what: string; online?: boolean }[] }[] = [
  {
    name: "Amra",
    color: "#0F6B5C",
    items: [
      { top: 0, h: 45, who: "Lejla H.", what: "Žensko šišanje", online: true },
      { top: 60, h: 30, who: "Sara K.", what: "Feniranje" },
      { top: 135, h: 45, who: "Mirela H.", what: "Šišanje i feniranje", online: true },
    ],
  },
  {
    name: "Dino",
    color: "#3554C4",
    items: [
      { top: 15, h: 30, who: "Adnan M.", what: "Šišanje", online: true },
      { top: 60, h: 45, who: "Haris B.", what: "Šišanje i brada", online: true },
      { top: 150, h: 30, who: "Edin S.", what: "Brada" },
    ],
  },
  {
    name: "Selma",
    color: "#B5476B",
    items: [
      { top: 0, h: 120, who: "Ajla P.", what: "Farbanje", online: true },
      { top: 135, h: 45, who: "Nina D.", what: "Manikir" },
    ],
  },
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
    <div className="landing min-h-dvh overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />

      <header className="sticky top-0 z-30 border-b border-transparent bg-paper/80 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5 md:px-8">
          <Link href="/" aria-label="Termini – početna">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex" aria-label="Sekcije">
            <a href="#kako" className="hover:text-ink">Kako radi</a>
            <a href="#za-koga" className="hover:text-ink">Za koga</a>
            <a href="#pitanja" className="hover:text-ink">Pitanja</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/prijava" className="btn btn-sm text-ink hover:bg-surface-2">Prijava</Link>
            <Link href="/registracija" className="btn btn-primary btn-sm">Registruj salon</Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-12 md:px-8 lg:grid-cols-[1.3fr_1fr] lg:pb-24 lg:pt-20">
            <div>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium">
                <span className="size-2 rounded-full bg-[#25d366]" aria-hidden />
                Podsjetnici na WhatsApp i SMS
              </p>
              <h1 className="hero-title font-display font-bold">
                Klijenti zakazuju sami. Vi radite.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                Online termini za frizere, brijačnice, kozmetičare i stomatologe. Klijent izabere uslugu i vrijeme za pola
                minute, a podsjetnik dan ranije i dva sata prije stigne sam na WhatsApp.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/registracija" className="btn btn-primary px-7 py-3.5 text-base shadow-[0_10px_30px_-12px_rgba(15,107,92,0.7)]">
                  Registruj salon besplatno
                </Link>
                <Link href="/demo-salon" className="btn px-5 py-3.5 text-base text-ink hover:bg-surface-2">
                  Isprobaj kao klijent
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                {["Bez aplikacije za klijente", "Bez kartice", "Spremno za 5 minuta"].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-brand" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <HeroVisual />
          </div>
        </section>

        {/* KAKO RADI */}
        <section id="kako" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Od registracije do prvog termina za pet minuta</h2>
            </div>
            <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
              {[
                ["Upišite usluge i radno vrijeme", "Za vašu djelatnost odmah dodajemo uobičajene usluge. Prilagodite cijene, trajanje i ko šta radi."],
                ["Podijelite svoj link", "Stavite ga na Instagram i Google profil ili odštampajte QR kod za recepciju."],
                ["Termini i podsjetnici idu sami", "Klijent zakaže, dobije potvrdu, a dan ranije i dva sata prije i podsjetnik s dugmetom za otkazivanje."],
              ].map(([title, text], i) => (
                <li key={title} className="bg-surface p-7 sm:p-8">
                  <span className="font-display tabular text-6xl font-bold text-brand/25">{i + 1}</span>
                  <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PODSJETNICI – tamna sekcija */}
        <section className="on-ink bg-ink text-paper">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 md:px-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Zaboravljeni termin je prazna stolica.
              </h2>
              <p className="mt-5 max-w-lg text-lg text-muted">
                Podsjetnik stiže tamo gdje klijenti stvarno čitaju poruke. Jednim dodirom potvrde dolazak ili oslobode termin za
                nekog drugog.
              </p>
              <dl className="mt-10 grid gap-6 sm:grid-cols-2">
                {[
                  ["WhatsApp, pa SMS", "Ako klijent nema WhatsApp, poruka automatski ide kao SMS."],
                  ["Vi birate vrijeme", "Dan ranije, dva sata prije ili oboje."],
                  ["Nikad u ponoć", "Podsjetnik koji bi pao noću šalje se ranije navečer."],
                  ["Otkazivanje oslobađa termin", "Slobodno vrijeme se odmah nudi drugim klijentima."],
                ].map(([t, d]) => (
                  <div key={t} className="border-l-2 border-stub pl-4">
                    <dt className="font-semibold">{t}</dt>
                    <dd className="mt-1 text-sm text-muted">{d}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <ChatMock />
          </div>
        </section>

        {/* KALENDAR ZA SALON */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 md:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:order-2">
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Cijeli tim u jednom kalendaru</h2>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Online termini se upisuju sami, a telefonske upišete jednim klikom na prazno mjesto. Sistem ne dozvoljava dva
              klijenta kod iste osobe u isto vrijeme.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Radno vrijeme, pauze i godišnji odmori za svaku osobu",
                "Uvoz postojećih kontakata iz Excela ili telefona",
                "Klijenti koji često ne dođu su označeni",
                "Radi na telefonu, tabletu i računaru",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <CalendarMock />
        </section>

        {/* ZA KOGA */}
        <section id="za-koga" className="scroll-mt-20 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-24 md:px-8">
            <h2 className="font-display max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">Napravljeno za salone i ordinacije</h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SEGMENTS.map((s) => (
                <article key={s.name} className="flex flex-col rounded-3xl bg-paper p-6">
                  <h3 className="font-display text-xl font-bold">{s.name}</h3>
                  <p className="mt-2 text-sm text-muted">{s.line}</p>
                  <ul className="mt-6 space-y-1.5 border-t border-dashed border-line pt-5 text-sm">
                    {s.services.map(([n, d]) => (
                      <li key={n} className="flex justify-between gap-3">
                        <span>{n}</span>
                        <span className="tabular text-muted">{d}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PITANJA */}
        <section id="pitanja" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 md:px-8" aria-labelledby="pitanja-naslov">
          <h2 id="pitanja-naslov" className="font-display text-4xl font-bold tracking-tight">Česta pitanja</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-prose pr-12 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* POZIV */}
        <section className="px-4 pb-24 md:px-8">
          <div className="on-ink relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-paper sm:px-14">
            <div className="relative z-10 max-w-xl">
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Prvi online termin može stići još danas.</h2>
              <p className="mt-4 text-lg text-muted">Registracija je besplatna. Link za klijente dobijete odmah.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/registracija" className="btn bg-stub px-7 py-3.5 text-base text-stub-ink hover:brightness-95">
                  Registruj salon
                </Link>
                <Link href="/demo-salon" className="btn px-5 py-3.5 text-base text-paper hover:bg-white/10">
                  Pogledaj demo salon
                </Link>
              </div>
            </div>
            <div aria-hidden className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 rotate-[-8deg] lg:block">
              <div className="grid grid-cols-3 gap-3 opacity-90">
                {["09:00", "09:45", "10:30", "11:15", "14:30", "15:15", "16:00", "16:45", "17:30"].map((t, i) => (
                  <span
                    key={t}
                    className={
                      i === 4
                        ? "font-display tabular rounded-2xl bg-stub px-6 py-4 text-3xl font-bold text-stub-ink"
                        : "font-display tabular rounded-2xl border border-white/15 px-6 py-4 text-3xl font-bold text-white/30"
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:px-8">
          <Logo />
          <nav className="flex gap-5" aria-label="Podnožje">
            <Link href="/demo-salon" className="hover:text-ink">Demo salon</Link>
            <Link href="/prijava" className="hover:text-ink">Prijava za salone</Link>
            <Link href="/registracija" className="hover:text-ink">Registracija</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Telefon s ekranom za zakazivanje + potvrda + WhatsApp podsjetnik. */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] pb-16 pt-12" aria-label="Primjer: klijent zakazuje termin na telefonu i dobija podsjetnik na WhatsApp" role="img">
      <div className="dot-grid absolute inset-0 -z-0 rounded-[3rem] [mask-image:radial-gradient(closest-side,black,transparent)]" aria-hidden />

      <div className="phone relative z-10 mx-auto w-[280px] overflow-hidden sm:w-[300px]">
        <div className="px-5 pb-6 pt-7">
          <div className="flex items-center gap-3">
            <span className="font-display grid size-10 place-items-center rounded-xl bg-brand text-sm font-bold text-brand-ink">SL</span>
            <div>
              <p className="font-display font-bold leading-tight">Salon Lejla</p>
              <p className="text-xs text-muted">Tuzla</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-line px-3.5 py-2.5">
            <p className="text-[0.7rem] text-muted">Usluga</p>
            <p className="text-sm font-semibold">Žensko šišanje, 45 min</p>
          </div>

          <p className="mt-5 text-sm font-semibold">Četvrtak, 23. oktobra</p>
          <div className="mt-2.5 flex gap-1.5">
            {DAYS.map(([d, n]) => (
              <span
                key={n}
                className={
                  n === "23"
                    ? "flex w-11 flex-col items-center rounded-xl bg-ink py-1.5 text-paper"
                    : "flex w-11 flex-col items-center rounded-xl border border-line py-1.5"
                }
              >
                <span className="text-[0.65rem]">{d}</span>
                <span className="font-display tabular text-base font-bold leading-none">{n}</span>
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {SLOTS.map((t) => (
              <span
                key={t}
                className={
                  t === "14:30"
                    ? "hero-pick slot !py-1.5 text-center !text-sm"
                    : "slot !py-1.5 text-center !text-sm"
                }
                aria-pressed={t === "14:30"}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-5 rounded-full bg-brand py-2.5 text-center text-sm font-semibold text-brand-ink">Zakaži termin</div>
        </div>
      </div>

      {/* Obavijest salonu */}
      <div className="hero-pop delay-1 absolute -right-2 top-0 z-20 w-56 rounded-2xl border border-line bg-surface p-3 shadow-xl sm:-right-8">
        <p className="text-[0.7rem] font-medium text-muted">Novi online termin</p>
        <p className="mt-0.5 text-sm font-semibold">Mirela H. · čet u 14:30</p>
        <p className="text-xs text-muted">Žensko šišanje kod Amre</p>
      </div>

      {/* WhatsApp podsjetnik */}
      <div className="hero-pop delay-2 absolute -left-2 bottom-0 z-20 w-64 rounded-2xl rounded-bl-sm bg-[#dcf8c6] p-3 text-[0.82rem] leading-snug text-[#111b21] shadow-xl sm:-left-10">
        <p>
          Zdravo Mirela, podsjećamo vas na termin u <strong>Salon Lejla</strong> sutra u 14:30.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-center text-[0.78rem] font-semibold text-[#027eb5]">
          <span className="rounded-lg bg-white/85 py-1.5">Dolazim</span>
          <span className="rounded-lg bg-white/85 py-1.5">Otkaži termin</span>
        </div>
        <p className="mt-1 flex items-center justify-end gap-1 text-[0.65rem] text-[#667781]">
          14:30 <CheckCheck className="size-3.5 text-[#53bdeb]" aria-hidden />
        </p>
      </div>
    </div>
  );
}

/** Razgovor na WhatsAppu: podsjetnik, klijent potvrdi, stiže odgovor. */
function ChatMock() {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] bg-[#0b141a] shadow-2xl ring-1 ring-white/10" role="img" aria-label="Primjer WhatsApp razgovora s podsjetnikom i potvrdom dolaska">
      <div className="flex items-center gap-3 bg-[#202c33] px-5 py-3.5">
        <span className="grid size-9 place-items-center rounded-full bg-brand">
          <span className="h-2 w-3.5 rounded-sm bg-stub" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#e9edef]">Termini</p>
          <p className="text-xs text-[#8696a0]">poslovni nalog</p>
        </div>
      </div>
      <div className="space-y-3 px-4 py-6 text-[0.9rem] leading-snug">
        <p className="mx-auto w-fit rounded-md bg-[#182229] px-2.5 py-1 text-xs text-[#8696a0]">Danas</p>
        <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#202c33] p-3 text-[#e9edef]">
          Zdravo Adnan, podsjećamo vas na termin u <strong>Barber Dino</strong>: Šišanje i brada, danas u 16:00.
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-center text-sm font-semibold text-[#53bdeb]">
            <span className="rounded-lg bg-[#2a3942] py-1.5">Dolazim</span>
            <span className="rounded-lg bg-[#2a3942] py-1.5">Otkaži termin</span>
          </div>
          <p className="mt-1 text-right text-[0.65rem] text-[#8696a0]">14:00</p>
        </div>
        <div className="ml-auto w-fit rounded-xl rounded-tr-sm bg-[#005c4b] px-3 py-2 text-[#e9edef]">
          Dolazim
          <span className="ml-3 inline-flex items-center gap-0.5 align-bottom text-[0.65rem] text-[#8696a0]">
            14:03 <CheckCheck className="size-3.5 text-[#53bdeb]" aria-hidden />
          </span>
        </div>
        <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#202c33] p-3 text-[#e9edef]">
          Hvala! Vaš dolazak je potvrđen. Vidimo se u 16:00.
          <p className="mt-1 text-right text-[0.65rem] text-[#8696a0]">14:03</p>
        </div>
      </div>
    </div>
  );
}

/** Pogled vlasnika: dan po kolonama osoblja. */
function CalendarMock() {
  const hours = ["09", "10", "11", "12"];
  const PX = 1.15; // piksela po minuti
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-[0_30px_60px_-30px_rgba(19,33,46,0.35)] sm:p-5" role="img" aria-label="Primjer dnevnog kalendara salona s tri osobe">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-bold">Danas</p>
          <p className="text-xs text-muted">8 termina, 5 online</p>
        </div>
        <span className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-ink">+ Novi termin</span>
      </div>
      <div className="flex">
        <div className="relative w-9 shrink-0" style={{ height: 180 * PX + 8 }}>
          {hours.map((h, i) => (
            <span key={h} className="tabular absolute -translate-y-1/2 text-[0.65rem] text-muted" style={{ top: i * 60 * PX }}>
              {h}:00
            </span>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {CAL.map((col) => (
            <div key={col.name} className="min-w-0">
              <p className="mb-1.5 flex items-center gap-1.5 truncate text-xs font-semibold">
                <span className="size-2 rounded-full" style={{ background: col.color }} />
                {col.name}
              </p>
              <div
                className="relative rounded-lg bg-paper"
                style={{
                  height: 180 * PX + 8,
                  backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px ${60 * PX}px)`,
                }}
              >
                {col.items.map((it) => (
                  <div
                    key={it.who}
                    className="absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] px-1.5 py-1"
                    style={{
                      top: it.top * PX + 2,
                      height: it.h * PX - 3,
                      borderLeftColor: col.color,
                      background: `color-mix(in oklab, ${col.color} 14%, white)`,
                    }}
                  >
                    <p className="truncate text-[0.68rem] font-semibold leading-tight">{it.who}</p>
                    {it.h >= 40 && <p className="truncate text-[0.6rem] leading-tight text-muted">{it.what}</p>}
                    {it.online && it.h >= 45 && (
                      <span className="mt-0.5 inline-block rounded bg-white/80 px-1 text-[0.55rem] font-medium text-muted">online</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
