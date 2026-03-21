"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createPortalSession } from "./actions";

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();

  function handleManage() {
    startTransition(async () => {
      const result = await createPortalSession();
      if ("data" in result && result.data?.url) {
        window.location.href = result.data.url;
      } else if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button variant="secondary" onClick={handleManage} loading={pending}>
      Manage billing
    </Button>
  );
}
