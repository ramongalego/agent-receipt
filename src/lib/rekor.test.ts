/**
 * @jest-environment node
 */

// Mock r2 module before imports
jest.mock("./r2", () => ({
  putRekorProof: jest.fn().mockResolvedValue({ ok: true }),
}));

// Store original env
const originalEnv = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  // Restore env before each test
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

import { anchorSessionToRekor } from "./rekor";
import { putRekorProof } from "./r2";

const mockPutRekorProof = putRekorProof as jest.MockedFunction<
  typeof putRekorProof
>;

// Generate real test keys for the tests
import { generateKeyPairSync } from "crypto";

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256",
  publicKeyEncoding: { type: "spki", format: "pem" } as const,
  privateKeyEncoding: { type: "pkcs8", format: "pem" } as const,
});

const PRIVATE_KEY_B64 = Buffer.from(privateKey).toString("base64");
const PUBLIC_KEY_B64 = Buffer.from(publicKey).toString("base64");

function setRekorEnv() {
  process.env.REKOR_PRIVATE_KEY = PRIVATE_KEY_B64;
  process.env.REKOR_PUBLIC_KEY = PUBLIC_KEY_B64;
}

describe("anchorSessionToRekor", () => {
  it("returns failure when REKOR_PRIVATE_KEY is missing", async () => {
    delete process.env.REKOR_PRIVATE_KEY;
    delete process.env.REKOR_PUBLIC_KEY;

    const result = await anchorSessionToRekor(
      "session-1",
      "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Rekor signing keys not configured.");
    }
  });

  it("returns failure when REKOR_PUBLIC_KEY is missing", async () => {
    process.env.REKOR_PRIVATE_KEY = PRIVATE_KEY_B64;
    delete process.env.REKOR_PUBLIC_KEY;

    const result = await anchorSessionToRekor(
      "session-1",
      "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Rekor signing keys not configured.");
    }
  });

  it("returns failure when fetch times out", async () => {
    setRekorEnv();

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        reject(err);
      });
    });

    const result = await anchorSessionToRekor(
      "session-1",
      "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("The operation was aborted");
    }

    global.fetch = originalFetch;
  });

  it("returns failure when Rekor returns a non-200 response", async () => {
    setRekorEnv();

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const result = await anchorSessionToRekor(
      "session-1",
      "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Rekor API 500: Internal Server Error");
    }

    global.fetch = originalFetch;
  });

  it("returns success with UUID and logIndex on valid response", async () => {
    setRekorEnv();

    const mockUuid = "deadbeef1234567890abcdef";
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          [mockUuid]: {
            logIndex: 42,
          },
        }),
    });

    const result = await anchorSessionToRekor(
      "session-1",
      "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.uuid).toBe(mockUuid);
      expect(result.logIndex).toBe(42);
      expect(result.anchoredAt).toBeInstanceOf(Date);
    }

    // Should store proof in R2
    expect(mockPutRekorProof).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({ [mockUuid]: expect.anything() }),
    );

    global.fetch = originalFetch;
  });
});
