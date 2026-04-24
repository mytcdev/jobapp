import { getSupabase } from "@/lib/supabase";

export const AI_MAX_WARNINGS = 3;

export interface AiWarningResult {
  warningCount: number;   // new total after increment
  warningsLeft: number;   // how many remain before blocking
  blocked: boolean;       // true if the account was just blocked or was already blocked
}

/**
 * Increment the AI warning counter for a user.
 * Automatically blocks the account when the limit is reached.
 */
export async function handleAiWarning(userId: string): Promise<AiWarningResult> {
  const db = getSupabase();

  // Read current count
  const { data: user } = await db
    .from("users")
    .select("ai_warning_count, status")
    .eq("id", userId)
    .single();

  const current = user?.ai_warning_count ?? 0;
  const newCount = current + 1;
  const shouldBlock = newCount >= AI_MAX_WARNINGS;

  const update: Record<string, unknown> = { ai_warning_count: newCount };
  if (shouldBlock) update.status = "blocked";

  await db.from("users").update(update).eq("id", userId);

  return {
    warningCount: newCount,
    warningsLeft: Math.max(0, AI_MAX_WARNINGS - newCount),
    blocked: shouldBlock,
  };
}
