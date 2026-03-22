"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type AnchorTriggerProps = {
  shouldAnchor: boolean;
  sessionId: string;
};

export function AnchorTrigger({ shouldAnchor, sessionId }: AnchorTriggerProps) {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (!shouldAnchor || fired.current) return;
    fired.current = true;

    fetch("/api/anchor-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .catch(() => {
        // Silently ignore fetch errors
      })
      .finally(() => {
        router.refresh();
      });
  }, [shouldAnchor, sessionId, router]);

  return null;
}
