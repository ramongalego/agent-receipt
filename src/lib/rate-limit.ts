import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting is disabled.",
    );
    return null;
  }

  return new Redis({ url, token });
}

const redis = createRedis();

function createLimiter(
  prefix: string,
  limit: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
  });
}

export const ingestRateLimit = createLimiter("rl:ingest", 300, "1 m");
export const signInRateLimit = createLimiter("rl:signin", 10, "15 m");
export const inviteRateLimit = createLimiter("rl:invite", 5, "1 h");

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<{ success: boolean }> {
  if (!limiter) return { success: true };
  const result = await limiter.limit(key);
  return { success: result.success };
}
