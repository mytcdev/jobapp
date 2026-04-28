export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  const [jobsResult, usersResult] = await Promise.all([
    supabase.from("jobs").select("required_skills"),
    supabase.from("users").select("skills"),
  ]);

  if (jobsResult.error) console.error("[skills] jobs query error:", jobsResult.error.message);
  if (usersResult.error) console.error("[skills] users query error:", usersResult.error.message);

  const seen: Record<string, true> = {};
  for (const row of jobsResult.data ?? [])
    for (const s of row.required_skills ?? []) seen[s] = true;
  for (const row of usersResult.data ?? [])
    for (const s of row.skills ?? []) seen[s] = true;

  const sorted = Object.keys(seen).sort();
  const filtered = q
    ? sorted.filter((s) => s.toLowerCase().includes(q))
    : sorted;

  return NextResponse.json({ skills: filtered.slice(0, 20) });
}
