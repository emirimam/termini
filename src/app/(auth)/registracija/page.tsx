import type { Metadata } from "next";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Registracija" };

export default function Page() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Registrujte salon</h1>
      <p className="mb-8 mt-1 text-muted">Besplatno. Prvi online termin za pet minuta.</p>
      <AuthForm mode="signup" />
    </>
  );
}
