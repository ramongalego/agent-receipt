export default function BillingLoading() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="mb-8 h-48 animate-pulse rounded-lg border border-border bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-border bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
