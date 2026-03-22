type SessionStatusInput = {
  lastEventAt: Date | string | null;
  hasError: boolean;
  hasLimitReached?: boolean;
  explicitlyCompletedAt?: Date | string | null;
};

export type SessionStatus = "running" | "error" | "complete";

const THREE_MINUTES_MS = 3 * 60 * 1000;

export function computeSessionStatus(input: SessionStatusInput): SessionStatus {
  if (input.hasLimitReached) {
    return "error";
  }

  if (input.hasError) {
    return "error";
  }

  if (input.explicitlyCompletedAt) {
    return "complete";
  }

  if (!input.lastEventAt) {
    return "running";
  }

  const date =
    input.lastEventAt instanceof Date
      ? input.lastEventAt
      : new Date(input.lastEventAt);
  const elapsed = Date.now() - date.getTime();
  if (elapsed < THREE_MINUTES_MS) {
    return "running";
  }

  return "complete";
}
