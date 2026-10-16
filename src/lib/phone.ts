// Normalizacija brojeva telefona u E.164 format (+38761123456).
// Podrazumijevana država je BiH (+387), ali prihvata i druge međunarodne brojeve.

const DEFAULT_CC = "387";

export function normalizePhone(input: string, defaultCountryCode = DEFAULT_CC): string | null {
  if (!input) return null;
  let s = input.trim().replace(/[\s\-().\/]/g, "");
  if (!s) return null;

  if (s.startsWith("+")) {
    s = "+" + s.slice(1).replace(/\D/g, "");
  } else if (s.startsWith("00")) {
    s = "+" + s.slice(2).replace(/\D/g, "");
  } else {
    s = s.replace(/\D/g, "");
    if (s.startsWith("0")) s = s.slice(1);
    // Lokalni broj bez pozivnog: 61 123 456 -> +387 61 123 456
    s = "+" + defaultCountryCode + s;
  }

  // BiH: nakon +387 ide 8–9 cifara
  if (s.startsWith("+387")) {
    const rest = s.slice(4).replace(/^0/, "");
    if (rest.length < 8 || rest.length > 9) return null;
    return "+387" + rest;
  }
  if (!/^\+[1-9]\d{6,14}$/.test(s)) return null;
  return s;
}

// +38761123456 -> 061 123 456 (za prikaz u BiH), ostalo ostaje međunarodno.
export function formatPhone(e164: string): string {
  if (e164.startsWith("+387")) {
    const n = "0" + e164.slice(4);
    if (n.length === 9) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
    if (n.length === 10) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
    return n;
  }
  return e164;
}

// Za WhatsApp API broj ide bez '+'.
export function waId(e164: string) {
  return e164.replace(/^\+/, "");
}
