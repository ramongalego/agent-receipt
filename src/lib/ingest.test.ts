/**
 * @jest-environment node
 */

const mockLimit = jest.fn();
const mockValues = jest.fn();

jest.mock("@/db", () => {
  const selectChain = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: mockLimit,
  };
  selectChain.select.mockReturnValue(selectChain);
  selectChain.from.mockReturnValue(selectChain);
  selectChain.where.mockReturnValue(selectChain);
  selectChain.orderBy.mockReturnValue(selectChain);

  const insertChain = {
    insert: jest.fn(),
    values: mockValues,
  };
  insertChain.insert.mockReturnValue(insertChain);

  return {
    db: {
      select: selectChain.select,
      from: selectChain.from,
      where: selectChain.where,
      orderBy: selectChain.orderBy,
      limit: selectChain.limit,
      insert: insertChain.insert,
      values: insertChain.values,
    },
  };
});

jest.mock("@/db/schema", () => ({
  events: { id: "id", sessionId: "session_id", hash: "hash", name: "name" },
  apiKeys: {},
  agentSessions: {},
}));

jest.mock("./hash", () => ({
  hashEvent: jest.fn().mockReturnValue("mock-hash"),
}));

jest.mock("./r2", () => ({
  putPayload: jest.fn(),
}));

jest.mock("./api-key", () => ({
  hashApiKey: jest.fn(),
}));

jest.mock("@/db/queries/api-keys", () => ({
  updateApiKeyLastUsed: jest.fn(),
}));

import { insertSystemErrorEvent } from "./ingest";
import { db } from "@/db";

const mockDb = db as unknown as {
  insert: jest.Mock;
  values: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("insertSystemErrorEvent", () => {
  it("inserts an error event when the last event has a different name", async () => {
    mockLimit.mockResolvedValue([
      { hash: "prev-hash", name: "some-other-event" },
    ]);
    mockValues.mockResolvedValue(undefined);

    await insertSystemErrorEvent(
      "session-1",
      "session.limit_reached",
      "Limit reached.",
    );

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        type: "error",
        name: "session.limit_reached",
      }),
    );
  });

  it("skips the insert when the last event already has the same name", async () => {
    mockLimit.mockResolvedValue([
      { hash: "prev-hash", name: "session.limit_reached" },
    ]);

    await insertSystemErrorEvent(
      "session-1",
      "session.limit_reached",
      "Limit reached.",
    );

    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("inserts when there are no previous events", async () => {
    mockLimit.mockResolvedValue([]);
    mockValues.mockResolvedValue(undefined);

    await insertSystemErrorEvent(
      "session-1",
      "session.limit_reached",
      "Limit reached.",
    );

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        previousHash: null,
      }),
    );
  });
});
