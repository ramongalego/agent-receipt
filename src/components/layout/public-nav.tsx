import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function PublicNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6"
    >
      <Link
        href="/"
        className="text-lg font-semibold tracking-tight text-foreground"
      >
        AgentReceipt
      </Link>
      <div className="flex items-center gap-5">
        <ThemeToggle />
        <Link
          href="/sign-in"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
}
