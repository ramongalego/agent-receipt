"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
