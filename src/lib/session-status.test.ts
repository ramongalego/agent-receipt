import { computeSessionStatus } from "./session-status";

describe("computeSessionStatus", () => {
  it("returns 'error' if session has an error event", () => {
    const result = computeSessionStatus({
      lastEventAt: new Date(),
      hasError: true,
    });
    expect(result).toBe("error");
  });

  it("returns 'running' if last event was less than 3 minutes ago", () => {
    const result = computeSessionStatus({
      lastEventAt: new Date(Date.now() - 60_000), // 1 minute ago
      hasError: false,
    });
    expect(result).toBe("running");
  });

  it("returns 'complete' if last event was more than 3 minutes ago and no errors", () => {
    const result = computeSessionStatus({
      lastEventAt: new Date(Date.now() - 10 * 60_000), // 10 minutes ago
      hasError: false,
    });
    expect(result).toBe("complete");
  });

  it("returns 'running' if no events yet", () => {
    const result = computeSessionStatus({
      lastEventAt: null,
      hasError: false,
    });
    expect(result).toBe("running");
  });

  it("returns 'error' even if last event is old when there is an error", () => {
    const result = computeSessionStatus({
      lastEventAt: new Date(Date.now() - 10 * 60_000),
      hasError: true,
    });
    expect(result).toBe("error");
  });

  it("returns 'error' when session has a limit_reached event, even if recent", () => {
    const result = computeSessionStatus({
      lastEventAt: new Date(Date.now() - 60_000),
      hasError: false,
      hasLimitReached: true,
    });
    expect(result).toBe("error");
  });

  it("returns 'error' when session has a limit_reached event, even if old with no errors", () => {
    const result = computeSessionStatus({
      lastEventAt: new Date(Date.now() - 10 * 60_000),
      hasError: false,
      hasLimitReached: true,
    });
    expect(result).toBe("error");
  });

  it("returns 'complete' immediately when explicitlyCompletedAt is set", () => {
    const result = computeSessionStatus({
      lastEventAt: new Date(), // just now, would normally be "running"
      hasError: false,
      explicitlyCompletedAt: new Date(),
    });
    expect(result).toBe("complete");
  });

  it("uses 3 minute threshold when explicitlyCompletedAt is null", () => {
    const result = computeSessionStatus({
      lastEventAt: new Date(Date.now() - 60_000), // 1 min ago
      hasError: false,
      explicitlyCompletedAt: null,
    });
    expect(result).toBe("running");
  });
});
