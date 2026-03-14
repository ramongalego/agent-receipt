import { createHash, randomBytes } from "crypto";

const PREFIX = "ar_";

export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
} {
  const raw = randomBytes(32).toString("hex");
  const key = `${PREFIX}${raw}`;
  const hash = hashApiKey(key);
  const prefix = `${PREFIX}${raw.slice(0, 8)}...`;

  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
