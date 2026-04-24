export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";
import { ApplicationStatusSchema } from "@/lib/schema";
import { notifyUser } from "@/lib/notifications";

const BodySchema = z.object({
  status: ApplicationStatusSchema,
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data: application, error: dbError } = await supabase
    .from("applications")
    .update({ status: parsed.data.status, applicant_status_seen: false })
    .eq("id", params.id)
    .select("id, user_id, status, job_id, jobs(title)")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Notify the applicant about the status change
  const jobTitle = (Array.isArray(application.jobs) ? application.jobs[0] : application.jobs)?.title ?? "your job";
  await notifyUser(
    application.user_id,
    `Your application for ${jobTitle} is now: ${parsed.data.status}.`,
    `/jobs/${application.job_id}`,
  );

  return NextResponse.json({ application });
}
