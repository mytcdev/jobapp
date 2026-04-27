export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ titles: [] });

  const { data } = await supabase
    .from("jobs")
    .select("title")
    .eq("status", "published")
    .ilike("title", `%${q}%`)
    .limit(20);

  const seen: Record<string, true> = {};
  for (const j of data ?? []) if (j.title) seen[j.title] = true;
  const titles = Object.keys(seen).slice(0, 8);
  return NextResponse.json({ titles });
}
