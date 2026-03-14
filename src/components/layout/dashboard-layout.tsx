"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  { label: "Projects", href: "/dashboard", icon: ProjectsIcon },
  { label: "Billing", href: "/dashboard/billing", icon: BillingIcon },
  { label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return (
      pathname === href ||
      (href === "/dashboard" && pathname.startsWith("/dashboard/projects"))
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link
          href="/dashboard"
          className="text-lg font-semibold text-foreground"
        >
          AgentReceipt
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="border-b border-border bg-card px-3 py-3 md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </nav>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
          <div className="sticky top-0 flex h-screen flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between px-5 py-5">
                <Link
                  href="/dashboard"
                  className="text-lg font-semibold text-foreground tracking-tight"
                >
                  AgentReceipt
                </Link>
                <ThemeToggle />
              </div>
              <nav className="px-3 space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-accent-foreground" />
                      )}
                      <item.icon />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="border-t border-border px-3 py-4">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <SignOutIcon />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-h-screen flex-1">{children}</main>
      </div>
    </div>
  );
}

function ProjectsIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <path d="M1 10h22" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
