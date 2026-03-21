"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "./actions";

export function UpgradeButton() {
  const [pending, startTransition] = useTransition();

  function handleUpgrade() {
    startTransition(async () => {
      const result = await createCheckoutSession(
        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
      );
      if ("data" in result && result.data?.url) {
        window.location.href = result.data.url;
      } else if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button onClick={handleUpgrade} loading={pending}>
      Upgrade to Pro
    </Button>
  );
}
