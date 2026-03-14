import { createHash } from "crypto";

export function hashEvent(
  eventData: Record<string, unknown>,
  previousHash: string | null,
): string {
  const payload = JSON.stringify({
    ...eventData,
    previousHash: previousHash ?? "GENESIS",
  });

  return createHash("sha256").update(payload).digest("hex");
}

export function verifyChain(
  events: { hash: string; previousHash: string | null }[],
): boolean {
  for (let i = 1; i < events.length; i++) {
    if (events[i].previousHash !== events[i - 1].hash) {
      return false;
    }
  }
  return true;
}
