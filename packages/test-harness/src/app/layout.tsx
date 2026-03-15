import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TestLord",
  description: "AgentReceipt SDK test harness",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#0a0a0f",
          color: "#e4e4e7",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
