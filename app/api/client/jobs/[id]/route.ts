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
  status: z.enum(["draft", "pending", "published"]).default("draft"),
  work_type: z.enum(["onsite", "remote", "hybrid"]).default("onsite"),
  accepted_nationality: z.string().optional().nullable(),
  category_ids: z.array(z.string().uuid()).optional().default([]),
});

async function syncCategories(jobId: string, categoryIds: string[]) {
  const db = getSupabase();
  await db.from("job_categories").delete().eq("job_id", jobId);
  if (categoryIds.length === 0) return;
  await db.from("job_categories").insert(
    categoryIds.map((category_id) => ({ job_id: jobId, category_id }))
  );
}

async function ownsJob(staffId: string, jobId: string) {
  const { data } = await getSupabase()
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("owner_id", staffId)
    .single();
  return !!data;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireClient();
  if (error) return error;

  if (!(await ownsJob(session!.user.staffId!, params.id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = JobSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });

  const { category_ids, ...jobData } = parsed.data;
  const { data: job, error: dbError } = await getSupabase()
    .from("jobs")
    .update(jobData)
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await syncCategories(params.id, category_ids);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${params.id}`);
  return NextResponse.json({ job });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireClient();
  if (error) return error;

  if (!(await ownsJob(session!.user.staffId!, params.id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error: dbError } = await getSupabase().from("jobs").delete().eq("id", params.id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  revalidatePath("/jobs");
  return new NextResponse(null, { status: 204 });
}
