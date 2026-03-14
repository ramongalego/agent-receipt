import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { generateApiKey } from "@/lib/api-key";

export async function createApiKey(projectId: string, name: string) {
  const { key, hash, prefix } = generateApiKey();

  const [row] = await db
    .insert(apiKeys)
    .values({
      projectId,
      name,
      keyHash: hash,
      keyPrefix: prefix,
    })
    .returning();

  return { key, row };
}

export function getApiKeysByProject(projectId: string) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revoked: apiKeys.revoked,
    })
    .from(apiKeys)
    .where(eq(apiKeys.projectId, projectId))
    .orderBy(apiKeys.createdAt);
}

export function revokeApiKey(keyId: string, projectId: string) {
  return db
    .update(apiKeys)
    .set({ revoked: true })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.projectId, projectId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}

export function updateApiKeyLastUsed(keyId: string) {
  return db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}
