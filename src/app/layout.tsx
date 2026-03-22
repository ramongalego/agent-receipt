import type { Metadata } from "next";
import { cookies } from "next/headers";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value;
  const isDark = theme !== "light";

  return (
    <html lang="en" className={isDark ? "dark" : ""} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t){document.cookie='theme='+t+';path=/;max-age=31536000';var d=t!=='light';document.documentElement.classList.toggle('dark',d);}})();`,
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
