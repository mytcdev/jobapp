export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { calculateMatchScore } from "@/lib/matching";
import { notifyStaff } from "@/lib/notifications";

const BodySchema = z.object({
  job_id: z.string().uuid(),
  resume_url: z.string().url().optional(),
  submitted_resume_type: z.enum(["uploaded", "generated"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { job_id, resume_url, submitted_resume_type } = parsed.data;

  // Fetch job and user in parallel
  const [jobResult, userResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", job_id).single(),
    supabase.from("users").select("*").eq("id", session.user.id).single(),
  ]);

  if (jobResult.error || !jobResult.data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (userResult.error || !userResult.data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = jobResult.data;
  const user = userResult.data;

  if (user.status === "blocked") {
    return NextResponse.json(
      { error: "Your account has been blocked. You are unable to apply for jobs." },
      { status: 403 },
    );
  }

  // Prevent duplicate applications
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", job_id)
    .eq("user_id", session.user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Already applied to this job" },
      { status: 409 },
    );
  }

  const match_percentage = calculateMatchScore(
    user.skills ?? [],
    job.required_skills ?? [],
  );

  // Resolve which resume file path to store with this application
  let submitted_resume_path: string | null = null;
  if (submitted_resume_type === "uploaded") {
    submitted_resume_path = user.resume_path ?? null;
  } else if (submitted_resume_type === "generated") {
    submitted_resume_path = user.generated_resume_path ?? null;
  } else {
    // Use active type or fall back
    if (user.active_resume_type === "generated") submitted_resume_path = user.generated_resume_path ?? null;
    else if (user.active_resume_type === "uploaded") submitted_resume_path = user.resume_path ?? null;
    else submitted_resume_path = user.resume_path ?? user.generated_resume_path ?? null;
  }

  const { data: application, error: insertError } = await supabase
    .from("applications")
    .insert({
      job_id,
      user_id: session.user.id,
      status: "pending",
      match_percentage,
      submitted_data: user, // snapshot of user profile at time of applying
      ...(resume_url && { resume_url }),
      ...(submitted_resume_path && { submitted_resume_path }),
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Notify the job's owner (client/staff) about the new application
  if (job.owner_id) {
    await notifyStaff(
      job.owner_id,
      `${user.name ?? "Someone"} applied for ${job.title}.`,
      `/client/applications`,
      { applicantName: user.name ?? "Someone", jobTitle: job.title },
    );
  }

  return NextResponse.json({ application }, { status: 201 });
}
