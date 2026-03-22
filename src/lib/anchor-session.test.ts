/**
 * @jest-environment node
 */

// Track all db operations
const dbCalls: { op: string; args?: unknown[] }[] = [];
let thenResults: unknown[] = [];
let thenIndex = 0;
let orderByResults: unknown[] = [];
let orderByIndex = 0;

const updateSetMock = jest.fn();

function resetDbMocks() {
  dbCalls.length = 0;
  thenResults = [];
  thenIndex = 0;
  orderByResults = [];
  orderByIndex = 0;
  updateSetMock.mockReset();
}

const chainable = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: jest.fn().mockImplementation((fn: (rows: unknown[]) => unknown) => {
    const result = thenResults[thenIndex] ?? [];
    thenIndex++;
    return Promise.resolve(fn(result as unknown[]));
  }),
  orderBy: jest.fn().mockImplementation(() => {
    const result = orderByResults[orderByIndex] ?? [];
    orderByIndex++;
    return Promise.resolve(result);
  }),
};

jest.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      chainable.select(...args);
      return chainable;
    },
    update: () => ({
      set: (...args: unknown[]) => {
        updateSetMock(...args);
        return {
          where: () => Promise.resolve(),
        };
      },
    }),
  },
}));

jest.mock("@/db/schema", () => ({
  users: {
    id: "id",
    stripePriceId: "stripe_price_id",
    stripeCurrentPeriodEnd: "stripe_current_period_end",
  },
  teams: { id: "id", ownerId: "owner_id" },
  agentSessions: {
    id: "id",
    projectId: "project_id",
    rekorStatus: "rekor_status",
  },
  events: { hash: "hash", sessionId: "session_id", timestamp: "timestamp" },
  projects: { id: "id", teamId: "team_id" },
}));

jest.mock("./billing", () => ({
  getUserPlan: jest.fn(),
}));

jest.mock("./rekor", () => ({
  anchorSessionToRekor: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { anchorSessionIfEligible } from "./anchor-session";
import { getUserPlan } from "./billing";
import { anchorSessionToRekor } from "./rekor";

const mockGetUserPlan = getUserPlan as jest.MockedFunction<typeof getUserPlan>;
const mockAnchorSession = anchorSessionToRekor as jest.MockedFunction<
  typeof anchorSessionToRekor
>;

beforeEach(() => {
  jest.clearAllMocks();
  resetDbMocks();
});

describe("anchorSessionIfEligible", () => {
  it("does nothing for Free plan sessions", async () => {
    // getTeamPlan: team lookup returns ownerId
    thenResults = [
      [{ ownerId: "user-1" }],
      [{ stripePriceId: null, stripeCurrentPeriodEnd: null }],
    ];
    mockGetUserPlan.mockReturnValue("free");

    await anchorSessionIfEligible("session-1", "project-1", "team-1");

    expect(mockAnchorSession).not.toHaveBeenCalled();
  });

  it("sets rekorStatus to failed when anchorSessionToRekor returns failure", async () => {
    // getTeamPlan: team lookup, then owner lookup
    thenResults = [
      [{ ownerId: "user-1" }],
      [
        {
          stripePriceId: "price_pro",
          stripeCurrentPeriodEnd: new Date(Date.now() + 86400000),
        },
      ],
    ];
    mockGetUserPlan.mockReturnValue("pro");

    // Events query returns via orderBy (includes name for filtering)
    orderByResults = [
      [
        { hash: "hash-1", name: "tool-call" },
        { hash: "hash-2", name: "decision" },
      ],
    ];

    mockAnchorSession.mockResolvedValue({
      success: false,
      error: "Rekor API returned an error.",
    });

    await anchorSessionIfEligible("session-1", "project-1", "team-1");

    expect(mockAnchorSession).toHaveBeenCalledWith("session-1", "hash-2");
    // Should set status to "failed"
    expect(updateSetMock).toHaveBeenCalledWith({ rekorStatus: "failed" });
  });

  it("filters out session.end events and uses the last real event hash", async () => {
    thenResults = [
      [{ ownerId: "user-1" }],
      [
        {
          stripePriceId: "price_pro",
          stripeCurrentPeriodEnd: new Date(Date.now() + 86400000),
        },
      ],
    ];
    mockGetUserPlan.mockReturnValue("pro");

    // Events include a session.end marker at the end
    orderByResults = [
      [
        { hash: "hash-1", name: "tool-call" },
        { hash: "real-final", name: "decision" },
        { hash: "end-hash", name: "session.end" },
      ],
    ];

    mockAnchorSession.mockResolvedValue({
      success: true,
      uuid: "rekor-uuid-456",
      logIndex: 50,
      anchoredAt: new Date(),
    });

    await anchorSessionIfEligible("session-1", "project-1", "team-1");

    // Should use "real-final" not "end-hash"
    expect(mockAnchorSession).toHaveBeenCalledWith("session-1", "real-final");
  });

  it("sets rekorStatus to anchored with correct UUID on success", async () => {
    // getTeamPlan: team lookup, then owner lookup
    thenResults = [
      [{ ownerId: "user-1" }],
      [
        {
          stripePriceId: "price_pro",
          stripeCurrentPeriodEnd: new Date(Date.now() + 86400000),
        },
      ],
    ];
    mockGetUserPlan.mockReturnValue("pro");

    // Events query returns via orderBy
    orderByResults = [
      [
        { hash: "hash-1", name: "tool-call" },
        { hash: "hash-2", name: "decision" },
        { hash: "final-hash", name: "tool-call" },
      ],
    ];

    const anchoredAt = new Date();
    mockAnchorSession.mockResolvedValue({
      success: true,
      uuid: "rekor-uuid-123",
      logIndex: 99,
      anchoredAt,
    });

    await anchorSessionIfEligible("session-1", "project-1", "team-1");

    expect(mockAnchorSession).toHaveBeenCalledWith("session-1", "final-hash");
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rekorUuid: "rekor-uuid-123",
        rekorLogIndex: 99,
        rekorStatus: "anchored",
      }),
    );
  });
});
