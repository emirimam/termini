export function formatPrice(price: number | null | undefined, currency = "BAM") {
  if (price === null || price === undefined) return null;
  const n = Number(price);
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
  return currency === "BAM" ? `${s} KM` : `${s} ${currency}`;
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
