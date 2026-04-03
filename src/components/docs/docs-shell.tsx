"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoIcon } from "@/components/ui/logo-icon";

type NavItem = {
  label: string;
  href: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Getting started",
    items: [
      { label: "Overview", href: "/docs#overview" },
      { label: "Quick start", href: "/docs#quick-start" },
      { label: "How it works", href: "/docs#how-it-works" },
    ],
  },
  {
    title: "SDK reference",
    items: [
      { label: "Installation", href: "/docs/sdk#installation" },
      { label: "createClient", href: "/docs/sdk#createclient" },
      { label: "wrapOpenAI", href: "/docs/sdk#wrapopenai" },
      { label: "wrapAnthropic", href: "/docs/sdk#wrapanthropic" },
      { label: "wrapGemini", href: "/docs/sdk#wrapgemini" },
      { label: "wrapMistral", href: "/docs/sdk#wrapmistral" },
      { label: "wrapVercelAI", href: "/docs/sdk#wrapvercelai" },
      { label: "startSession", href: "/docs/sdk#startsession" },
      { label: "trackTool", href: "/docs/sdk#tracktool" },
      { label: "trackDecision", href: "/docs/sdk#trackdecision" },
      { label: "trackHumanReview", href: "/docs/sdk#trackhumanreview" },
      {
        label: "trackContextChange",
        href: "/docs/sdk#trackcontextchange",
      },
    ],
  },
  {
    title: "Concepts",
    items: [
      { label: "Sessions", href: "/docs/concepts#sessions" },
      { label: "Events", href: "/docs/concepts#events" },
      { label: "Receipts", href: "/docs/concepts#receipts" },
      { label: "Hash chain", href: "/docs/concepts#hash-chain" },
      {
        label: "Compliance metadata",
        href: "/docs/concepts#compliance-metadata",
      },
      {
        label: "Decision context",
        href: "/docs/concepts#decision-context",
      },
    ],
  },
  {
    title: "Compliance",
    items: [
      { label: "EU AI Act", href: "/docs/compliance#eu-ai-act" },
      {
        label: "SOC 2 and HIPAA",
        href: "/docs/compliance#soc-2-and-hipaa",
      },
      {
        label: "GDPR and data deletion",
        href: "/docs/compliance#gdpr-and-data-deletion",
      },
    ],
  },
  {
    title: "Guides",
    items: [
      { label: "OpenAI agents", href: "/docs/guides#openai-agents" },
      {
        label: "Anthropic agents",
        href: "/docs/guides#anthropic-agents",
      },
      {
        label: "Vercel AI SDK agents",
        href: "/docs/guides#vercel-ai-sdk-agents",
      },
      {
        label: "Approval workflows",
        href: "/docs/guides#approval-workflows",
      },
      { label: "Handling errors", href: "/docs/guides#handling-errors" },
    ],
  },
  {
    title: "Pricing and limits",
    items: [
      { label: "Plans", href: "/docs/pricing#plans" },
      { label: "Session limits", href: "/docs/pricing#session-limits" },
      { label: "Retention", href: "/docs/pricing#retention" },
      { label: "Event limits", href: "/docs/pricing#event-limits" },
    ],
  },
];

type TocItem = {
  id: string;
  text: string;
};

type DocsShellProps = {
  children: React.ReactNode;
};

export function DocsShell({ children }: DocsShellProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  // Extract H2 headings from content after paint
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const raf = requestAnimationFrame(() => {
      const headings = el.querySelectorAll("h2[id]");
      const items: TocItem[] = [];
      headings.forEach((h) => {
        items.push({ id: h.id, text: h.textContent || "" });
      });
      setTocItems(items);

      const hash = window.location.hash.slice(1);
      if (hash && items.some((item) => item.id === hash)) {
        setActiveId(hash);
      } else if (items.length > 0) {
        setActiveId(items[0].id);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  // IntersectionObserver for scroll tracking
  useEffect(() => {
    const el = contentRef.current;
    if (!el || tocItems.length === 0) return;

    const headings = el.querySelectorAll("h2[id]");
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [tocItems]);

  // Close mobile menu on route change
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <nav
        className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm"
        aria-label="Docs navigation"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <LogoIcon className="h-6 w-6" />
              AgentReceipt
            </Link>
            <Link
              href="/docs"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="hidden rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              aria-label="Toggle navigation"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMobileOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close navigation"
          />
          <aside className="absolute bottom-0 left-0 top-[65px] w-72 overflow-y-auto border-r border-border bg-background p-6">
            <SidebarContent
              pathname={pathname}
              activeId={activeId}
              onLinkClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <div className="flex">
          {/* Desktop sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto border-r border-border p-6">
              <SidebarContent pathname={pathname} activeId={activeId} />
            </div>
          </aside>

          {/* Main content */}
          <main
            className="min-w-0 flex-1 px-6 py-10 sm:px-8 lg:px-12"
            ref={contentRef}
          >
            <div className="mx-auto max-w-3xl">{children}</div>
          </main>

          {/* On this page (desktop only) — always rendered to avoid layout shift */}
          <aside className="hidden w-52 shrink-0 xl:block">
            <div className="sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto p-6 pt-10">
              {tocItems.length > 0 && (
                <>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    On this page
                  </p>
                  <ul className="space-y-2">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={`block text-sm transition-colors ${
                            activeId === item.id
                              ? "font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  activeId,
  onLinkClick,
}: {
  pathname: string;
  activeId: string;
  onLinkClick?: () => void;
}) {
  return (
    <nav aria-label="Documentation sections">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const [itemPath, hash] = item.href.split("#");
              const isOnPage = pathname === itemPath;
              const isActive = isOnPage && hash === activeId;

              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={onLinkClick}
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : isOnPage
                          ? "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
