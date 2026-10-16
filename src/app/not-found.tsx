import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display tabular text-6xl font-bold">404</p>
        <h1 className="mt-3 text-xl font-semibold">Ova stranica ne postoji.</h1>
        <p className="mt-1 text-muted">Provjerite link koji ste dobili od salona.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Na početnu
        </Link>
      </div>
    </main>
  );
}
