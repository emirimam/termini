export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10">{children}</div>;
}

export function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}
