"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Notice } from "@/components/ui";
import { setTenantSuspended } from "../../actions";

export function SuspendControl({ tenantId, suspended, reason }: { tenantId: string; suspended: boolean; reason: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const apply = (value: boolean) =>
    start(async () => {
      setError(null);
      const res = await setTenantSuspended({ tenantId, suspended: value, reason: text });
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });

  if (suspended) {
    return (
      <div className="max-w-sm rounded-2xl bg-danger-soft p-4 text-sm">
        <p className="font-semibold text-danger">Salon je suspendovan</p>
        {reason && <p className="mt-1">{reason}</p>}
        <p className="mt-1 text-muted">Online zakazivanje i podsjetnici su zaustavljeni.</p>
        <button type="button" className="btn btn-primary btn-sm mt-3" disabled={pending} onClick={() => apply(false)}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Aktiviraj salon
        </button>
        {error && <div className="mt-2"><Notice kind="error">{error}</Notice></div>}
      </div>
    );
  }

  return open ? (
    <div className="w-full max-w-sm space-y-3 rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold">Suspendovati salon?</p>
      <p className="text-sm text-muted">Klijenti više neće moći zakazivati online i podsjetnici se neće slati. Salon i dalje vidi svoj kalendar.</p>
      <input className="field" placeholder="Razlog (vidi vlasnik salona)" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setOpen(false)} disabled={pending}>
          Nazad
        </button>
        <button type="button" className="btn btn-danger btn-sm flex-1" onClick={() => apply(true)} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Suspenduj
        </button>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
    </div>
  ) : (
    <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => setOpen(true)}>
      Suspenduj salon
    </button>
  );
}
