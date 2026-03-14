export default function ProjectSettingsLoading() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          <div>
            <div className="mb-2 h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
          <div>
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
