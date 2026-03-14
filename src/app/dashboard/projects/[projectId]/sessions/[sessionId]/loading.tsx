export default function SessionDetailLoading() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
          <div className="h-64 animate-pulse rounded-lg border border-border bg-muted" />
        </div>
      </div>
    </div>
  );
}
