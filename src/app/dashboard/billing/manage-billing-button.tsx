"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createPortalSession } from "./actions";

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();

  function handleManage() {
    startTransition(async () => {
      const result = await createPortalSession();
      if ("data" in result && result.data?.url) {
        window.location.href = result.data.url;
      }
    });
  }

  return (
    <Button variant="secondary" onClick={handleManage} loading={pending}>
      Manage billing
    </Button>
  );
}
