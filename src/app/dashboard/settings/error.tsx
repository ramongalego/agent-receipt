"use client";

export default function SettingsError() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load settings. Refresh the page. If it keeps failing,
          email support@agentreceipt.co.
        </p>
      </div>
    </div>
  );
}
