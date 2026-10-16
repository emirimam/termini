"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ban, FileUp, Loader2, Plus, Search } from "lucide-react";
import type { Client } from "@/lib/types";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { cx } from "@/lib/format";
import { Dialog, Notice, Toggle } from "@/components/ui";
import {
  guessByContent,
  guessColumns,
  looksLikeHeader,
  parseCsv,
  parseVcf,
  rowsToContacts,
  type ParsedContact,
} from "@/lib/contacts-import";
import { importClients, saveClient } from "./actions";

export function ClientsView({ clients, total, query }: { clients: Client[]; total: number; query: string }) {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState(query);
  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (q === query) return;
    const t = setTimeout(() => router.replace(q ? `${path}?q=${encodeURIComponent(q)}` : path), 250);
    return () => clearTimeout(t);
  }, [q, query, path, router]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            className="field !pl-9"
            placeholder="Traži po imenu ili broju"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Traži klijente"
          />
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setImportOpen(true)}>
          <FileUp className="size-4" /> Uvezi
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Dodaj
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          {query ? (
            <p className="text-muted">Nema klijenta za „{query}“.</p>
          ) : (
            <>
              <p className="font-semibold">Još nema klijenata.</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Klijenti se dodaju sami kad zakažu online. Postojeće kontakte možete uvesti iz Excela, CSV-a ili telefona (.vcf).
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {clients.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setEditing(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="truncate">{c.name}</span>
                      {c.blocked && <Ban className="size-3.5 shrink-0 text-danger" aria-label="Blokiran" />}
                    </span>
                    {c.notes && <span className="block truncate text-sm text-muted">{c.notes}</span>}
                  </span>
                  {c.no_show_count > 0 && (
                    <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold" title="Broj nedolazaka">
                      {c.no_show_count}× nije došao
                    </span>
                  )}
                  <span className="tabular shrink-0 text-sm text-muted">{formatPhone(c.phone)}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            {clients.length < total ? `Prikazano ${clients.length} od ${total}. Suzite pretragu.` : `Ukupno ${total}.`}
          </p>
        </>
      )}

      <ClientDialog
        key={editing === "new" ? "new" : editing?.id ?? "none"}
        open={editing !== null}
        client={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
      />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}

function ClientDialog({ open, client, onClose }: { open: boolean; client: Client | null; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(client?.name ?? "");
  const [phone, setPhone] = useState(client ? formatPhone(client.phone) : "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [consent, setConsent] = useState(client?.messaging_consent ?? true);
  const [blocked, setBlocked] = useState(client?.blocked ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onClose={onClose} title={client ? client.name : "Novi klijent"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await saveClient({ id: client?.id, name, phone, email, notes, messaging_consent: consent, blocked });
            if (!res.ok) return setError(res.error);
            onClose();
            router.refresh();
          });
        }}
      >
        <div>
          <label className="label" htmlFor="cname">Ime i prezime</label>
          <input id="cname" className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="cphone">Mobitel</label>
          <input id="cphone" type="tel" className="field tabular" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="cemail">Email <span className="font-normal text-muted">(nije obavezno)</span></label>
          <input id="cemail" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cnotes">Bilješka</label>
          <textarea id="cnotes" className="field min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Vidi samo salon" />
        </div>
        <Toggle checked={consent} onChange={setConsent} label="Šalji potvrde i podsjetnike" />
        <Toggle checked={blocked} onChange={setBlocked} label="Blokiraj online zakazivanje" />
        {error && <Notice kind="error">{error}</Notice>}
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Sačuvaj
        </button>
      </form>
    </Dialog>
  );
}

function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [contacts, setContacts] = useState<ParsedContact[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const valid = contacts?.filter((c) => c.name.trim() && normalizePhone(c.phone)) ?? [];

  async function onFile(file: File) {
    setError(null);
    setResult(null);
    setFileName(file.name);
    if (/\.xlsx?$/i.test(file.name)) {
      setError("Excel datoteku sačuvajte kao CSV (Datoteka → Sačuvaj kao → CSV) pa je uvezite.");
      setContacts(null);
      return;
    }
    const text = await file.text();
    if (/\.vcf$/i.test(file.name) || /BEGIN:VCARD/i.test(text.slice(0, 200))) {
      setContacts(parseVcf(text));
      return;
    }
    const rows = parseCsv(text);
    if (!rows.length) {
      setError("Datoteka je prazna.");
      return;
    }
    const header = looksLikeHeader(rows[0]);
    let map = header ? guessColumns(rows[0]) : {};
    if (map.phone === undefined || (map.name === undefined && map.first === undefined)) {
      map = { ...guessByContent(rows.slice(header ? 1 : 0)), ...map };
    }
    if (map.phone === undefined) {
      setError("Nismo pronašli kolonu s brojem telefona. Provjerite da prvi red ima naslove kolona (npr. Ime, Telefon).");
      setContacts(null);
      return;
    }
    setContacts(rowsToContacts(rows, map, header));
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        setContacts(null);
        setResult(null);
        setError(null);
        onClose();
      }}
      title="Uvoz kontakata"
      wide
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Podržano: CSV iz Excela ili starog programa ordinacije, Google kontakti (CSV) i kontakti iz telefona (.vcf).
          Brojevi se pretvaraju u format +387, a postojeći klijenti (isti broj) se ne dupliraju.
        </p>
        <label
          className={cx(
            "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 text-center hover:border-brand",
          )}
        >
          <FileUp className="size-6 text-muted" aria-hidden />
          <span className="font-semibold">{fileName || "Izaberite datoteku"}</span>
          <span className="text-sm text-muted">.csv, .txt ili .vcf</span>
          <input
            type="file"
            accept=".csv,.txt,.vcf,.xlsx,.xls,text/csv,text/vcard"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>

        {error && <Notice kind="error">{error}</Notice>}

        {contacts && !result && (
          <>
            <p className="text-sm">
              Pronađeno <strong>{contacts.length}</strong> kontakata, od toga <strong>{valid.length}</strong> s ispravnim brojem.
            </p>
            <div className="max-h-56 overflow-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-2 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Ime</th>
                    <th className="px-3 py-2 font-semibold">Telefon</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 50).map((c, i) => {
                    const ok = c.name.trim() && normalizePhone(c.phone);
                    return (
                      <tr key={i} className={cx("border-t border-line", !ok && "text-danger")}>
                        <td className="px-3 py-1.5">{c.name || "—"}</td>
                        <td className="tabular px-3 py-1.5">{ok ? formatPhone(normalizePhone(c.phone)!) : c.phone || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={pending || valid.length === 0}
              onClick={() =>
                start(async () => {
                  const res = await importClients(valid);
                  if (!res.ok) return setError(res.error);
                  const { added, skipped, invalid } = res.data;
                  setResult(`Dodano ${added} klijenata.${skipped ? ` ${skipped} već postoji.` : ""}${invalid ? ` ${invalid} bez ispravnog broja.` : ""}`);
                  router.refresh();
                })
              }
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Uvezi {valid.length} kontakata
            </button>
          </>
        )}

        {result && <Notice kind="ok">{result}</Notice>}
      </div>
    </Dialog>
  );
}
