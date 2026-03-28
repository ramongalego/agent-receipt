"use client";

import { useState, useMemo, useCallback } from "react";
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

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "complete", label: "Complete" },
  { value: "error", label: "Error" },
];

const TIME_OPTIONS: { value: string; label: string; days: number | null }[] = [
  { value: "all", label: "All time", days: null },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 3 months", days: 90 },
];

function getStatusVariant(status: SessionStatus): "success" | "error" | "info" {
  if (status === "complete") return "success";
  if (status === "error") return "error";
  return "info";
}

export function SessionsTable({ sessions, projectId }: SessionsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [now] = useState(() => Date.now());
  const timeOption = TIME_OPTIONS.find((o) => o.value === timeFilter);
  const cutoffMs = timeOption?.days != null ? timeOption.days * 86_400_000 : 0;

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    const cutoff = cutoffMs > 0 ? new Date(now - cutoffMs) : null;

    return sessions.filter((s) => {
      const name = s.name || "Untitled session";
      const matchesSearch =
        !searchLower || name.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesTime = !cutoff || new Date(s.startedAt) >= cutoff;
      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [sessions, search, statusFilter, cutoffMs, now]);

  const { paged, totalPages, safePage } = useMemo(() => {
    const tp = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const sp = Math.min(page, tp);
    const p = filtered.slice((sp - 1) * PAGE_SIZE, sp * PAGE_SIZE);
    return { paged: p, totalPages: tp, safePage: sp };
  }, [filtered, page]);

  const hasFilters =
    search !== "" || statusFilter !== "all" || timeFilter !== "all";

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const selectStatus = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const selectTime = useCallback((value: string) => {
    setTimeFilter(value);
    setPage(1);
  }, []);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <span className="mx-1 hidden h-4 w-px bg-border sm:block" />

        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectStatus(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === option.value
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-border" />

        {TIME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectTime(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              timeFilter === option.value
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTimeFilter("all");
              setPage(1);
            }}
            className="ml-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No sessions match your filters"
          description="Try changing your search or filters."
        />
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="w-[40%] px-4 py-3 sm:px-6">Name</th>
                    <th className="w-[20%] px-4 py-3 sm:px-6">Started</th>
                    <th className="w-[12%] px-4 py-3 sm:px-6">Duration</th>
                    <th className="w-[12%] px-4 py-3 sm:px-6">Events</th>
                    <th className="w-[16%] px-4 py-3 sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="px-4 py-4 sm:px-6">
                        <Link
                          href={`/dashboard/projects/${projectId}/sessions/${s.id}`}
                          className="block truncate text-sm font-medium text-foreground hover:underline"
                        >
                          {s.name || "Untitled session"}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                        <FormattedDate date={s.startedAt} />
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                        {s.duration}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                        {s.eventCount}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <Badge variant={getStatusVariant(s.status)}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);
  return pages;
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  const btnBase =
    "flex h-8 min-w-8 items-center justify-center rounded-lg text-sm transition-colors";
  const btnNav = `${btnBase} border border-border bg-card px-3 font-medium shadow-sm enabled:text-card-foreground enabled:hover:bg-muted disabled:text-muted-foreground disabled:opacity-50`;
  const btnPage = (active: boolean) =>
    active
      ? `${btnBase} bg-foreground text-background font-semibold`
      : `${btnBase} text-muted-foreground hover:bg-muted hover:text-foreground`;

  return (
    <div className="mt-6 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <span className="text-xs text-muted-foreground">
        {from}&ndash;{to} of {totalItems}
      </span>

      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className={btnNav}
          aria-label="First page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={btnNav}
          aria-label="Previous page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-8 min-w-8 items-center justify-center text-sm text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={btnPage(p === currentPage)}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={btnNav}
          aria-label="Next page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className={btnNav}
          aria-label="Last page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>

      <div />
    </div>
  );
}
