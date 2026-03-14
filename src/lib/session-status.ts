type SessionStatusInput = {
  lastEventAt: Date | string | null;
  hasError: boolean;
  hasLimitReached?: boolean;
};

export type SessionStatus = "running" | "error" | "complete";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function computeSessionStatus(input: SessionStatusInput): SessionStatus {
  if (input.hasLimitReached) {
    return "error";
  }

  if (input.hasError) {
    return "error";
  }

  if (!input.lastEventAt) {
    return "running";
  }

  const date =
    input.lastEventAt instanceof Date
      ? input.lastEventAt
      : new Date(input.lastEventAt);
  const elapsed = Date.now() - date.getTime();
  if (elapsed < FIVE_MINUTES_MS) {
    return "running";
  }

  return "complete";
}
