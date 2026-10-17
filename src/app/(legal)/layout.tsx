import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-8">
          <Link href="/" aria-label="Termini – početna">
            <Logo />
          </Link>
          <nav className="flex gap-5 text-sm font-medium text-muted">
            <Link href="/privatnost" className="hover:text-ink">Privatnost</Link>
            <Link href="/uslovi" className="hover:text-ink">Uslovi korištenja</Link>
          </nav>
        </div>
      </header>
      <main className="legal mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">{children}</main>
    </div>
  );
}
