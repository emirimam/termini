import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex" aria-label="Termini – početna">
          <Logo />
        </Link>
        {children}
      </div>
    </main>
  );
}
