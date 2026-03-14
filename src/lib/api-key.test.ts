import { generateApiKey, hashApiKey } from "./api-key";

describe("API key utilities", () => {
  it("generates a key with the ar_ prefix", () => {
    const { key } = generateApiKey();
    expect(key.startsWith("ar_")).toBe(true);
  });

  it("generates a hash that is a 64-char hex string", () => {
    const { hash } = generateApiKey();
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates a prefix that ends with ...", () => {
    const { prefix } = generateApiKey();
    expect(prefix.startsWith("ar_")).toBe(true);
    expect(prefix.endsWith("...")).toBe(true);
  });

  it("generates unique keys", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key).not.toEqual(b.key);
    expect(a.hash).not.toEqual(b.hash);
  });

  it("hashApiKey returns consistent hashes", () => {
    const key = "ar_test123";
    expect(hashApiKey(key)).toEqual(hashApiKey(key));
  });

  it("hashApiKey returns different hashes for different keys", () => {
    expect(hashApiKey("ar_a")).not.toEqual(hashApiKey("ar_b"));
  });
});
