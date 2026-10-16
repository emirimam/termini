// Parsiranje kontakata iz CSV/Excel izvoza (zarez, tačka-zarez ili tab) i
// vCard (.vcf) datoteka – izvoz iz telefona, Google kontakata ili starog
// programa ordinacije. Radi u browseru, na server idu samo očišćeni redovi.

export interface ParsedContact {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

function detectDelimiter(line: string) {
  const counts = [",", ";", "\t"].map((d) => [d, line.split(d).length] as const);
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/)[0] ?? "";
  const delim = detectDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

const HEADERS: Record<keyof ParsedContact | "first" | "last", RegExp> = {
  name: /^(ime i prezime|ime_i_prezime|name|full ?name|naziv|pacijent|klijent|kontakt|display name)$/i,
  first: /^(ime|first ?name|given ?name)$/i,
  last: /^(prezime|last ?name|family ?name|surname)$/i,
  phone: /(telefon|tel\.?|mobitel|mobilni|mob\.?|broj|phone|mobile|gsm)/i,
  email: /(e-?mail|mail)/i,
  notes: /(napomen|biljesk|bilješk|note|opis|komentar)/i,
};

export interface ColumnMap {
  name?: number;
  first?: number;
  last?: number;
  phone?: number;
  email?: number;
  notes?: number;
}

export function guessColumns(header: string[]): ColumnMap {
  const map: ColumnMap = {};
  header.forEach((h, i) => {
    const t = h.trim();
    for (const key of ["name", "first", "last", "email", "notes", "phone"] as const) {
      if (map[key] === undefined && HEADERS[key].test(t)) {
        map[key] = i;
        break;
      }
    }
  });
  return map;
}

/** Ako prvi red ne liči na zaglavlje, pogodi kolone po sadržaju. */
export function looksLikeHeader(row: string[]) {
  return row.some((c) => /[a-zčćžšđ]{3,}/i.test(c)) && !row.some((c) => /\d{6,}/.test(c.replace(/\D/g, "")));
}

export function rowsToContacts(rows: string[][], map: ColumnMap, skipHeader: boolean): ParsedContact[] {
  return rows.slice(skipHeader ? 1 : 0).map((r) => {
    const get = (i?: number) => (i === undefined ? "" : (r[i] ?? "").trim());
    const name = get(map.name) || [get(map.first), get(map.last)].filter(Boolean).join(" ");
    return { name, phone: get(map.phone), email: get(map.email) || undefined, notes: get(map.notes) || undefined };
  });
}

export function guessByContent(rows: string[][]): ColumnMap {
  const sample = rows.slice(0, 20);
  const cols = Math.max(...sample.map((r) => r.length));
  const map: ColumnMap = {};
  for (let i = 0; i < cols; i++) {
    const values = sample.map((r) => (r[i] ?? "").trim()).filter(Boolean);
    if (!values.length) continue;
    const phoneLike = values.filter((v) => v.replace(/\D/g, "").length >= 8 && /^[+\d\s\-()/.]+$/.test(v)).length;
    const mailLike = values.filter((v) => v.includes("@")).length;
    if (map.phone === undefined && phoneLike / values.length > 0.6) map.phone = i;
    else if (map.email === undefined && mailLike / values.length > 0.6) map.email = i;
    else if (map.name === undefined && values.every((v) => /[a-zčćžšđ]/i.test(v))) map.name = i;
  }
  return map;
}

/** vCard: svaki BEGIN:VCARD…END:VCARD blok, FN ili N kao ime, TEL kao broj. */
export function parseVcf(text: string): ParsedContact[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
  const out: ParsedContact[] = [];
  for (const card of cards) {
    const lines = card.split(/\r?\n/);
    const value = (prefix: RegExp) => {
      const line = lines.find((l) => prefix.test(l));
      return line ? line.slice(line.indexOf(":") + 1).trim() : "";
    };
    let name = value(/^FN[;:]/i);
    if (!name) {
      const n = value(/^N[;:]/i).split(";");
      name = [n[1], n[0]].filter(Boolean).join(" ");
    }
    const tels = lines.filter((l) => /^(item\d+\.)?TEL[;:]/i.test(l)).map((l) => l.slice(l.indexOf(":") + 1).trim());
    // Prednost mobilnim brojevima (CELL), pa prvi broj
    const cellLine = lines.find((l) => /^(item\d+\.)?TEL[;:].*CELL/i.test(l));
    const phone = cellLine ? cellLine.slice(cellLine.indexOf(":") + 1).trim() : tels[0] ?? "";
    const email = value(/^(item\d+\.)?EMAIL[;:]/i);
    const note = value(/^NOTE[;:]/i).replace(/\\n/g, " ").replace(/\\,/g, ",");
    if (name || phone) out.push({ name, phone, email: email || undefined, notes: note || undefined });
  }
  return out;
}
