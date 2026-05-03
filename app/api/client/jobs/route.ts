export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClient } from "@/lib/adminGuard";
import { getSupabase } from "@/lib/supabase";

const JobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postal_code: z.string().optional().nullable(),
  required_skills: z.array(z.string()).min(1),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  salary_currency: z.string().default("USD"),
  status: z.enum(["draft", "pending", "published", "closed"]).default("draft"),
  work_type: z.enum(["onsite", "remote", "hybrid"]).default("onsite"),
  employment_type: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]).optional().nullable(),
  accepted_nationality: z.string().optional().nullable(),
  category_ids: z.array(z.string().uuid()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
});

async function syncCategories(jobId: string, categoryIds: string[]) {
  const db = getSupabase();
  await db.from("job_categories").delete().eq("job_id", jobId);
  if (categoryIds.length === 0) return;
  await db.from("job_categories").insert(
    categoryIds.map((category_id) => ({ job_id: jobId, category_id }))
  );
}

export async function GET() {
  const { session, error } = await requireClient();
  if (error) return error;

  const db = getSupabase();
  const { data, error: dbError } = await db
    .from("jobs")
    .select("id, title, company, status, work_type, city, state, country, required_skills, created_at")
    .eq("owner_id", session!.user.staffId!)
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireClient();
  if (error) return error;

  const parsed = JobSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });

  const { category_ids, ...jobData } = parsed.data;
  const db = getSupabase();
  const { data: job, error: dbError } = await db
    .from("jobs")
    .insert({ ...jobData, owner_id: session!.user.staffId! })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await syncCategories(job.id, category_ids);
  revalidatePath("/jobs");
  return NextResponse.json({ job }, { status: 201 });
}
