"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

export function Dialog({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        "m-auto max-h-[92dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]",
        wide ? "max-w-2xl" : "max-w-md",
      )}
    >
      {open && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <button type="button" onClick={onClose} className="-m-1 rounded-full p-1 text-muted hover:text-ink" aria-label="Zatvori">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  booked: "bg-surface-2 text-ink",
  confirmed: "bg-ok-soft text-ok",
  cancelled: "bg-danger-soft text-danger",
  completed: "bg-brand-soft text-brand",
  no_show: "bg-warn-soft text-ink",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  name,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  name?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={checked ? "on" : ""} />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-line",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

export function Notice({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cx(
        "rounded-xl px-4 py-3 text-sm font-medium",
        kind === "error" ? "bg-danger-soft text-danger" : "bg-ok-soft text-ok",
      )}
    >
      {children}
    </p>
  );
}
