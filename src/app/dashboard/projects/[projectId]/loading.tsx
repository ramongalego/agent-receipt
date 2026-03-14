export default function ProjectLoading() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-60 animate-pulse rounded-lg border border-border bg-muted" />
      </div>
    </div>
  );
}
