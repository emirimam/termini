"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signIn, signUp, type AuthState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/app"} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">Lozinka</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          required
          className="field"
        />
        {mode === "signup" && <p className="hint">Najmanje 8 znakova.</p>}
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state?.info && (
        <p role="status" className="rounded-xl bg-ok-soft px-4 py-3 text-sm font-medium text-ok">
          {state.info}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full py-3" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {mode === "login" ? "Prijavi se" : "Napravi nalog"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Nemate nalog?{" "}
            <Link href="/registracija" className="font-semibold text-brand hover:underline">
              Registrujte salon
            </Link>
          </>
        ) : (
          <>
            Već imate nalog?{" "}
            <Link href="/prijava" className="font-semibold text-brand hover:underline">
              Prijavite se
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
