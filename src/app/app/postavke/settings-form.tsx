"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import type { ReminderChannel, Tenant } from "@/lib/types";
import { cx } from "@/lib/format";
import { offsetLabel } from "@/lib/reminders/plan";
import { Notice, Toggle } from "@/components/ui";
import { saveSettings } from "./actions";

const OFFSETS = [2880, 1440, 240, 120, 60];
const CHANNELS: { value: ReminderChannel; label: string; hint: string }[] = [
  { value: "whatsapp_sms", label: "WhatsApp, pa SMS", hint: "Preporučeno. SMS samo kad WhatsApp ne prođe." },
  { value: "whatsapp", label: "Samo WhatsApp", hint: "Najjeftinije, ali ne stiže klijentima bez WhatsAppa." },
  { value: "sms", label: "Samo SMS", hint: "Stiže svima, skuplje po poruci." },
  { value: "off", label: "Isključeno", hint: "Bez potvrda i podsjetnika." },
];
const BRAND = ["#0F6B5C", "#3554C4", "#B5476B", "#C7741C", "#6B4FB3", "#13212E"];

export function SettingsForm({ tenant, bookingUrl, qrSvg }: { tenant: Tenant; bookingUrl: string; qrSvg: string }) {
  const router = useRouter();
  const [v, setV] = useState({
    name: tenant.name,
    phone: tenant.phone ?? "",
    email: tenant.email ?? "",
    address: tenant.address ?? "",
    city: tenant.city ?? "",
    description: tenant.description ?? "",
    brand_color: tenant.brand_color,
    online_booking_enabled: tenant.online_booking_enabled,
    min_notice_minutes: tenant.min_notice_minutes,
    horizon_days: tenant.horizon_days,
    slot_step_minutes: tenant.slot_step_minutes as 5 | 10 | 15 | 20 | 30 | 60,
    cancel_until_hours: tenant.cancel_until_hours,
    reminder_channel: tenant.reminder_channel,
    reminder_offsets: tenant.reminder_offsets,
    send_confirmation: tenant.send_confirmation,
    quiet_start: tenant.quiet_start.slice(0, 5),
    quiet_end: tenant.quiet_end.slice(0, 5),
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => {
    setSaved(false);
    setV((s) => ({ ...s, [k]: val }));
  };

  const qrHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;

  return (
    <form
      className="space-y-10"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const res = await saveSettings(v);
          if (!res.ok) return setError(res.error);
          setSaved(true);
          router.refresh();
        });
      }}
    >
      {/* Link za zakazivanje */}
      <section className="grid gap-5 rounded-3xl border border-line bg-surface p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">Vaš link za zakazivanje</h2>
          <p className="mt-1 text-sm text-muted">Za Instagram bio, Google profil, Facebook i poruke klijentima. QR kod odštampajte za recepciju.</p>
          <div className="mt-4 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-xl bg-surface-2 px-3 py-2.5 text-sm">{bookingUrl}</code>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={async () => {
                await navigator.clipboard.writeText(bookingUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Kopirano" : "Kopiraj"}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrHref} alt={`QR kod za ${bookingUrl}`} className="size-36 rounded-xl border border-line" />
          <a href={qrHref} download={`qr-${tenant.slug}.svg`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
            <Download className="size-3.5" /> Preuzmi QR
          </a>
        </div>
      </section>

      <Section title="Salon" description="Prikazuje se na stranici za zakazivanje i u porukama.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Naziv" id="name">
            <input id="name" className="field" value={v.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Telefon salona" id="phone">
            <input id="phone" type="tel" className="field" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="035 123 456" />
          </Field>
          <Field label="Adresa" id="address">
            <input id="address" className="field" value={v.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Grad" id="city">
            <input id="city" className="field" value={v.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Email" id="email">
            <input id="email" type="email" className="field" value={v.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <fieldset>
            <legend className="label">Boja salona</legend>
            <div className="flex flex-wrap items-center gap-2">
              {BRAND.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("brand_color", c)}
                  className={cx("size-8 rounded-full ring-offset-2 ring-offset-surface", v.brand_color.toLowerCase() === c.toLowerCase() && "ring-2 ring-ink")}
                  style={{ background: c }}
                  aria-label={`Boja ${c}`}
                />
              ))}
              <input
                type="color"
                value={v.brand_color}
                onChange={(e) => set("brand_color", e.target.value)}
                className="size-8 cursor-pointer rounded-full border border-line bg-transparent"
                aria-label="Vlastita boja"
              />
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <Field label="Kratak opis" id="description">
              <textarea id="description" className="field min-h-20" maxLength={400} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="npr. Parking ispred salona. Plaćanje karticom." />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Pravila zakazivanja">
        <div className="space-y-5">
          <Toggle checked={v.online_booking_enabled} onChange={(x) => set("online_booking_enabled", x)} label="Online zakazivanje uključeno" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Najkasnije zakazivanje prije termina" id="notice">
              <select id="notice" className="field" value={v.min_notice_minutes} onChange={(e) => set("min_notice_minutes", Number(e.target.value))}>
                <option value={0}>Bilo kad</option>
                <option value={30}>30 minuta</option>
                <option value={60}>1 sat</option>
                <option value={120}>2 sata</option>
                <option value={240}>4 sata</option>
                <option value={1440}>Dan ranije</option>
              </select>
            </Field>
            <Field label="Koliko unaprijed se može zakazati" id="horizon">
              <select id="horizon" className="field" value={v.horizon_days} onChange={(e) => set("horizon_days", Number(e.target.value))}>
                <option value={14}>2 sedmice</option>
                <option value={30}>Mjesec dana</option>
                <option value={60}>2 mjeseca</option>
                <option value={90}>3 mjeseca</option>
                <option value={180}>6 mjeseci</option>
              </select>
            </Field>
            <Field label="Razmak između ponuđenih termina" id="step">
              <select id="step" className="field" value={v.slot_step_minutes} onChange={(e) => set("slot_step_minutes", Number(e.target.value) as typeof v.slot_step_minutes)}>
                {[10, 15, 20, 30, 60].map((m) => (
                  <option key={m} value={m}>{m} minuta</option>
                ))}
              </select>
            </Field>
            <Field label="Otkazivanje i promjena online najkasnije" id="cancel">
              <select id="cancel" className="field" value={v.cancel_until_hours} onChange={(e) => set("cancel_until_hours", Number(e.target.value))}>
                <option value={0}>Do samog termina</option>
                <option value={2}>2 sata prije</option>
                <option value={6}>6 sati prije</option>
                <option value={12}>12 sati prije</option>
                <option value={24}>24 sata prije</option>
                <option value={48}>48 sati prije</option>
              </select>
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Potvrde i podsjetnici" description="Poruke stižu s brojem platforme, s nazivom vašeg salona u tekstu.">
        <div className="space-y-6">
          <fieldset>
            <legend className="label">Kanal</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CHANNELS.map((c) => (
                <label
                  key={c.value}
                  className={cx(
                    "flex cursor-pointer flex-col rounded-xl border p-3 transition-colors",
                    v.reminder_channel === c.value ? "border-ink bg-surface" : "border-line hover:border-muted",
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <input
                      type="radio"
                      name="channel"
                      className="accent-[var(--brand)]"
                      checked={v.reminder_channel === c.value}
                      onChange={() => set("reminder_channel", c.value)}
                    />
                    {c.label}
                  </span>
                  <span className="mt-0.5 pl-5 text-sm text-muted">{c.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {v.reminder_channel !== "off" && (
            <>
              <Toggle checked={v.send_confirmation} onChange={(x) => set("send_confirmation", x)} label="Pošalji potvrdu odmah nakon zakazivanja" />
              <fieldset>
                <legend className="label">Podsjetnici</legend>
                <div className="flex flex-wrap gap-2">
                  {OFFSETS.map((o) => {
                    const on = v.reminder_offsets.includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          set("reminder_offsets", on ? v.reminder_offsets.filter((x) => x !== o) : [...v.reminder_offsets, o].sort((a, b) => b - a))
                        }
                        className={cx(
                          "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                          on ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-ink",
                        )}
                      >
                        {offsetLabel(o)}
                      </button>
                    );
                  })}
                </div>
                <p className="hint">Najviše tri. Podsjetnik u 2 sata prije termina obično najviše smanjuje nedolaske.</p>
              </fieldset>
              <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
                <Field label="Tihi sati od" id="qs">
                  <input id="qs" type="time" className="field tabular" value={v.quiet_start} onChange={(e) => set("quiet_start", e.target.value)} />
                </Field>
                <Field label="do" id="qe">
                  <input id="qe" type="time" className="field tabular" value={v.quiet_end} onChange={(e) => set("quiet_end", e.target.value)} />
                </Field>
              </div>
              <p className="hint !mt-1">Podsjetnik koji bi stigao u tihim satima šalje se ranije, prije njihovog početka.</p>
            </>
          )}
        </div>
      </Section>

      <div className="sticky bottom-20 z-10 flex items-center gap-3 md:bottom-4">
        <button type="submit" className="btn btn-primary shadow-lg" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saved ? "Sačuvano" : "Sačuvaj promjene"}
        </button>
        {error && <Notice kind="error">{error}</Notice>}
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
