export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);
  const limit  = parseInt(req.nextUrl.searchParams.get("limit")  ?? "10", 10);

  const { data, count, error } = await supabase
    .from("jobs")
    .select(
      "id, title, company, city, state, country, salary_min, salary_max, salary_currency, required_skills, work_type",
      { count: "exact" },
    )
    .eq("status", "published")
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data ?? [], total: count ?? 0 });
}
