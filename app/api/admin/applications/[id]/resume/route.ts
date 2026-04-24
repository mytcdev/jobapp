export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const BUCKET = "resumes";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const role = session.user.role;
  const allowed = role === "admin" || role === "manager" || role === "staff" || role === "client";
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  const db = getSupabase();

  const { data: app, error } = await db
    .from("applications")
    .select("submitted_resume_path, job_id, jobs(owner_id)")
    .eq("id", params.id)
    .single();

  if (error || !app) return new NextResponse("Not found", { status: 404 });
  if (!app.submitted_resume_path) return new NextResponse("No resume attached", { status: 404 });

  // Clients may only access resumes for applications on their own jobs
  if (role === "client") {
    const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
    const ownerId = (job as { owner_id: string } | null)?.owner_id;
    if (!ownerId || ownerId !== session.user.staffId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const { data, error: downloadError } = await db.storage
    .from(BUCKET)
    .download(app.submitted_resume_path);

  if (downloadError) return new NextResponse(downloadError.message, { status: 500 });

  const buffer = await data.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"resume.pdf\"",
      "Cache-Control": "no-store",
    },
  });
}
