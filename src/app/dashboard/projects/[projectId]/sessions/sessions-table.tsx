"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormattedDate } from "@/components/ui/formatted-date";
import type { SessionStatus } from "@/lib/session-status";

type SessionRow = {
  id: string;
  name: string | null;
  startedAt: Date;
  lastEventAt: Date | string | null;
  eventCount: number;
  status: SessionStatus;
  duration: string;
};

type SessionsTableProps = {
  sessions: SessionRow[];
  projectId: string;
};

export function SessionsTable({ sessions, projectId }: SessionsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const name = s.name || "Untitled session";
      const matchesSearch =
        !search || name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, statusFilter]);

  const hasFilters = search !== "" || statusFilter !== "all";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring sm:w-auto sm:max-w-xs"
        />
        <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No sessions match your filters"
          description="Try changing your search or status filter."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 sm:px-6">Name</th>
                  <th className="px-4 py-3 sm:px-6">Started</th>
                  <th className="px-4 py-3 sm:px-6">Duration</th>
                  <th className="px-4 py-3 sm:px-6">Events</th>
                  <th className="px-4 py-3 sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <Link
                        href={`/dashboard/projects/${projectId}/sessions/${s.id}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {s.name || "Untitled session"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <FormattedDate date={s.startedAt} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {s.duration}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {s.eventCount}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <Badge
                        variant={
                          s.status === "complete"
                            ? "success"
                            : s.status === "error"
                              ? "error"
                              : "info"
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "complete", label: "Complete" },
  { value: "error", label: "Error" },
];

function StatusDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = STATUS_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-w-[120px] items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {selected?.label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 min-w-full rounded-lg border border-border bg-card py-1 shadow-lg">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${
                value === option.value
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
