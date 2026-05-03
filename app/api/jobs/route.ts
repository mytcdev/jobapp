export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category")?.trim();

  let jobIds: string[] | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    if (cat) {
      const { data: jc } = await supabase
        .from("job_categories")
        .select("job_id")
        .eq("category_id", cat.id);
      jobIds = (jc ?? []).map((r) => r.job_id);
    }
  }

  let query = supabase
    .from("jobs")
    .select("id, title, company, city, state, country, salary_min, salary_max, salary_currency, required_skills, work_type, created_at")
    .eq("status", "published")
    .order("id", { ascending: false })
    .limit(16);

  if (jobIds !== null) {
    if (jobIds.length === 0) return NextResponse.json({ jobs: [] });
    query = query.in("id", jobIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}
