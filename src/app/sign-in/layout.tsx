import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your AgentReceipt account to view audit trails, manage projects, and configure your AI agent monitoring.",
  alternates: {
    canonical: "/sign-in",
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
