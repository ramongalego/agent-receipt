import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sample AI Agent Receipt",
  description:
    "See what an AgentReceipt audit trail looks like. Every LLM call, tool call, and decision captured in a human-readable, hash-verified timeline.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Sample AI Agent Receipt \u00B7 AgentReceipt",
    description:
      "See what an AgentReceipt audit trail looks like. Every LLM call, tool call, and decision captured in a human-readable, hash-verified timeline.",
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
