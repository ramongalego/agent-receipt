import { hashEvent, verifyChain } from "./hash";

describe("hashEvent", () => {
  it("returns a 64-char hex string", () => {
    const hash = hashEvent({ type: "llm_call", name: "test" }, null);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns different hashes for different data", () => {
    const a = hashEvent({ type: "llm_call" }, null);
    const b = hashEvent({ type: "tool_call" }, null);
    expect(a).not.toEqual(b);
  });

  it("returns different hashes for different previous hashes", () => {
    const data = { type: "llm_call" };
    const a = hashEvent(data, null);
    const b = hashEvent(data, "abc123");
    expect(a).not.toEqual(b);
  });

  it("returns consistent hashes for the same input", () => {
    const data = { type: "llm_call", name: "test" };
    const a = hashEvent(data, "prev");
    const b = hashEvent(data, "prev");
    expect(a).toEqual(b);
  });
});

describe("verifyChain", () => {
  it("returns true for an empty chain", () => {
    expect(verifyChain([])).toBe(true);
  });

  it("returns true for a single event", () => {
    expect(verifyChain([{ hash: "abc", previousHash: null }])).toBe(true);
  });

  it("returns true for a valid chain", () => {
    const chain = [
      { hash: "aaa", previousHash: null },
      { hash: "bbb", previousHash: "aaa" },
      { hash: "ccc", previousHash: "bbb" },
    ];
    expect(verifyChain(chain)).toBe(true);
  });

  it("returns false for a broken chain", () => {
    const chain = [
      { hash: "aaa", previousHash: null },
      { hash: "bbb", previousHash: "WRONG" },
      { hash: "ccc", previousHash: "bbb" },
    ];
    expect(verifyChain(chain)).toBe(false);
  });
});
