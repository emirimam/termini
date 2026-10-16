"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { KIND_LABEL, type TenantKind } from "@/lib/types";
import { cx } from "@/lib/format";
import { env } from "@/lib/env";
import { createTenant, type OnboardingState } from "./actions";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const KINDS: TenantKind[] = ["salon", "barber", "beauty", "dental", "other"];

export function OnboardingForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createTenant, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [kind, setKind] = useState<TenantKind>("salon");
  const host = env.appUrl.replace(/^https?:\/\//, "");

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="label" htmlFor="name">Naziv</label>
        <input
          id="name"
          name="name"
          required
          className="field"
          placeholder="npr. Salon Lejla"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>

      <div>
        <label className="label" htmlFor="slug">Link za zakazivanje</label>
        <div className="flex items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:border-brand">
          <span className="whitespace-nowrap pl-3 text-sm text-muted">{host}/</span>
          <input
            id="slug"
            name="slug"
            required
            className="w-full bg-transparent py-3 pr-3 text-base outline-none"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <p className="hint">Ovaj link stavljate na Instagram, Google i u poruke klijentima.</p>
      </div>

      <fieldset>
        <legend className="label">Djelatnost</legend>
        <input type="hidden" name="kind" value={kind} />
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={cx(
                "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                kind === k ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-ink",
              )}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <p className="hint">Dodajemo uobičajene usluge koje kasnije možete promijeniti.</p>
      </fieldset>

      <div>
        <label className="label" htmlFor="ownerName">Vaše ime</label>
        <input id="ownerName" name="ownerName" className="field" placeholder="Prikazuje se klijentima kao osoba koja radi termin" />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full py-3" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Otvori kalendar
      </button>
    </form>
  );
}
