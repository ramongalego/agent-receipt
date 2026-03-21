import type { Metadata } from "next";
import { DocsShell } from "@/components/docs/docs-shell";

export const metadata: Metadata = {
  title: {
    template: "%s · AgentReceipt Docs",
    default: "Documentation · AgentReceipt",
  },
  description:
    "Learn how to integrate AgentReceipt into your AI agent. SDK reference, guides, and compliance documentation.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsShell>{children}</DocsShell>;
}
