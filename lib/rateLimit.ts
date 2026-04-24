import { getSupabase } from "@/lib/supabase";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Sliding-window rate limiter backed by Supabase.
 * @param key    Unique key, e.g. `extract:${userId}`
 * @param limit  Max requests allowed per window
 * @param windowSeconds  Window duration in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const db = getSupabase();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const { data } = await db
    .from("rate_limits")
    .select("count, window_start")
    .eq("key", key)
    .single();

  // If no record or window has expired, reset
  if (!data || new Date(data.window_start) < windowStart) {
    await db.from("rate_limits").upsert(
      { key, count: 1, window_start: now.toISOString() },
      { onConflict: "key" },
    );
    return { allowed: true, remaining: limit - 1 };
  }

  if (data.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await db.from("rate_limits").update({ count: data.count + 1 }).eq("key", key);
  return { allowed: true, remaining: limit - data.count - 1 };
}
