import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";

let ran = false;

export async function runSeed() {
  if (ran) return;
  ran = true;

  const db = getSupabase();

  // Fetch the first admin (if any)
  const { data: existingAdmin } = await db
    .from("staff_accounts")
    .select("id, username")
    .eq("role", "admin")
    .limit(1)
    .single();

  // ── Resume storage bucket (always runs) ───────────────────────────────
  const bucketConfig = {
    public: false,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  };
  const { error: bucketError } = await db.storage.createBucket("resumes", bucketConfig);
  if (bucketError && bucketError.message.includes("already exists")) {
    // Force private even if bucket was previously created as public
    await db.storage.updateBucket("resumes", { public: false });
  } else if (bucketError) {
    console.error("[seed] Failed to create resumes bucket:", bucketError.message);
  }

  // ── Initial admin creation ──────────────────────────────────────────────
  const initUsername = process.env.INITIAL_ADMIN_USERNAME?.trim();
  const initPassword = process.env.INITIAL_ADMIN_PASSWORD?.trim();

  if (!existingAdmin && initUsername && initPassword) {
    const password_hash = await bcrypt.hash(initPassword, 12);
    const { error } = await db.from("staff_accounts").insert({
      username: initUsername,
      password_hash,
      role: "admin",
    });
    if (error) {
      console.error("[seed] Failed to create admin:", error.message);
    } else {
      console.log(`[seed] Admin account created → username: "${initUsername}"`);
    }
    return;
  }

  // ── Emergency password reset ────────────────────────────────────────────
  const resetPassword = process.env.RESET_ADMIN_PASSWORD?.trim();

  if (resetPassword && existingAdmin) {
    const password_hash = await bcrypt.hash(resetPassword, 12);
    const { error } = await db
      .from("staff_accounts")
      .update({ password_hash })
      .eq("id", existingAdmin.id);
    if (error) {
      console.error("[seed] Password reset failed:", error.message);
    } else {
      console.warn(
        `[seed] ⚠️  Password reset for admin "${existingAdmin.username}". ` +
          "Remove RESET_ADMIN_PASSWORD from your environment now.",
      );
    }
  }
}
