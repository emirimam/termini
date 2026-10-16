"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus } from "lucide-react";
import type { Service } from "@/lib/types";
import { cx, formatDuration, formatPrice } from "@/lib/format";
import { Dialog, Notice, Toggle } from "@/components/ui";
import { deleteService, moveService, saveService } from "./actions";

export function ServicesEditor({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const router = useRouter();
  const [, start] = useTransition();

  return (
    <>
      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="font-semibold">Još nema usluga.</p>
          <p className="mt-1 text-sm text-muted">Dodajte prvu uslugu da bi klijenti mogli zakazivati.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {services.map((s, i) => (
            <li key={s.id} className={cx("flex items-center gap-3 px-4 py-3", !s.active && "opacity-50")}>
              <div className="flex flex-col">
                <button
                  type="button"
                  className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30"
                  disabled={i === 0}
                  aria-label={`Pomjeri ${s.name} gore`}
                  onClick={() => start(async () => { await moveService(s.id, -1); router.refresh(); })}
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30"
                  disabled={i === services.length - 1}
                  aria-label={`Pomjeri ${s.name} dole`}
                  onClick={() => start(async () => { await moveService(s.id, 1); router.refresh(); })}
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
              <button type="button" onClick={() => setEditing(s)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="text-sm text-muted">
                    {formatDuration(s.duration_min)}
                    {s.buffer_min > 0 && ` + ${s.buffer_min} min pauza`}
                    {!s.active && " · skriveno"}
                  </span>
                </span>
                <span className="tabular shrink-0 font-semibold">{formatPrice(s.price, s.currency) ?? "–"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="btn btn-primary mt-4" onClick={() => setEditing("new")}>
        <Plus className="size-4" /> Dodaj uslugu
      </button>

      <ServiceDialog
        key={editing === "new" ? "new" : editing?.id ?? "none"}
        service={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function ServiceDialog({ service, open, onClose }: { service: Service | null; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [duration, setDuration] = useState(String(service?.duration_min ?? 30));
  const [buffer, setBuffer] = useState(String(service?.buffer_min ?? 0));
  const [price, setPrice] = useState(service?.price != null ? String(service.price) : "");
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const done = () => {
    onClose();
    router.refresh();
  };

  return (
    <Dialog open={open} onClose={onClose} title={service ? "Uredi uslugu" : "Nova usluga"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await saveService({
              id: service?.id,
              name,
              description,
              duration_min: duration,
              buffer_min: buffer,
              price,
              active,
            });
            if (!res.ok) return setError(res.error);
            done();
          });
        }}
      >
        <div>
          <label className="label" htmlFor="sname">Naziv</label>
          <input id="sname" className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="sdesc">Opis <span className="font-normal text-muted">(nije obavezno)</span></label>
          <input id="sdesc" className="field" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="sdur">Trajanje</label>
            <div className="relative">
              <input id="sdur" type="number" min={5} max={600} step={5} className="field tabular pr-11" value={duration} onChange={(e) => setDuration(e.target.value)} required />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">min</span>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="sbuf">Pauza nakon</label>
            <div className="relative">
              <input id="sbuf" type="number" min={0} max={120} step={5} className="field tabular pr-11" value={buffer} onChange={(e) => setBuffer(e.target.value)} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">min</span>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="sprice">Cijena</label>
            <div className="relative">
              <input id="sprice" inputMode="decimal" className="field tabular pr-10" value={price} onChange={(e) => setPrice(e.target.value)} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">KM</span>
            </div>
          </div>
        </div>
        <p className="hint !mt-1">Pauza služi za čišćenje i pripremu – klijenti je ne vide, ali termin iza nje se ne može zakazati.</p>
        <Toggle checked={active} onChange={setActive} label="Prikaži klijentima za online zakazivanje" />

        {error && <Notice kind="error">{error}</Notice>}

        <div className="flex gap-2 pt-2">
          {service && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (!confirm(`Obrisati uslugu "${service.name}"?`)) return;
                  const res = await deleteService(service.id);
                  if (!res.ok) return setError(res.error);
                  done();
                })
              }
            >
              Obriši
            </button>
          )}
          <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Sačuvaj
          </button>
        </div>
      </form>
    </Dialog>
  );
}
