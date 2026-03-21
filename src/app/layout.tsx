import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agentreceipt.co";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "AgentReceipt \u00B7 Immutable Audit Trails for AI Agents",
    template: "%s \u00B7 AgentReceipt",
  },
  description:
    "AgentReceipt captures every action your AI agent takes and stores it as a tamper-proof, human-readable receipt. Built for compliance, audits, and accountability.",
  openGraph: {
    title: "AgentReceipt \u00B7 Immutable Audit Trails for AI Agents",
    description:
      "Capture every action your AI agent takes as a tamper-proof, human-readable receipt. Built for compliance and accountability.",
    url: appUrl,
    type: "website",
    siteName: "AgentReceipt",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentReceipt \u00B7 Immutable Audit Trails for AI Agents",
    description:
      "Capture every action your AI agent takes as a tamper-proof, human-readable receipt.",
  },
  alternates: {
    canonical: appUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var d=t!=='light';if(d)document.documentElement.classList.add('dark');})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Analytics />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
