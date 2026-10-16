// Znak: kartica termina sa zarezom (perforacija) – isti motiv kao "ulaznica"
// u potvrdi termina.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <path
          d="M6 6h20a2 2 0 0 1 2 2v5a3 3 0 0 0 0 6v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5a3 3 0 0 0 0-6V8a2 2 0 0 1 2-2Z"
          fill="var(--brand)"
        />
        <rect x="10" y="12.5" width="12" height="7" rx="2" fill="var(--stub)" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">Termini</span>
    </span>
  );
}
