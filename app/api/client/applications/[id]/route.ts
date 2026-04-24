export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient } from "@/lib/adminGuard";
import { getSupabase } from "@/lib/supabase";
import { ApplicationStatusSchema } from "@/lib/schema";
import { notifyUser } from "@/lib/notifications";

const BodySchema = z.object({
  status: ApplicationStatusSchema,
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, session } = await requireClient();
  if (error) return error;

  // Only the client who owns the job may update the application status
  if (session.user.role !== "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getSupabase();

  // Verify this application belongs to a job owned by the requesting client
  const { data: app } = await db
    .from("applications")
    .select("id, job_id, jobs(owner_id)")
    .eq("id", params.id)
    .single();

  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
  const ownerId = (job as { owner_id: string } | null)?.owner_id;

  if (!ownerId || ownerId !== session.user.staffId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error: dbError } = await db
    .from("applications")
    .update({ status: parsed.data.status, applicant_status_seen: false })
    .eq("id", params.id)
    .select("id, user_id, status, job_id, jobs(title)")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Notify the applicant about the status change
  const jobTitle = (Array.isArray(data.jobs) ? data.jobs[0] : data.jobs)?.title ?? "your job";
  await notifyUser(
    data.user_id,
    `Your application for ${jobTitle} is now: ${parsed.data.status}.`,
    `/jobs/${data.job_id}`,
  );

  return NextResponse.json({ application: data });
}
