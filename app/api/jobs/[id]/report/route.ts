import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { sendJobReportEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  reason: z.enum([
    "inaccurate",
    "spam_scam",
    "offensive",
    "duplicate",
    "no_longer_available",
    "other",
  ]),
  details: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const db = getSupabase();

  // Verify job exists
  const { data: job } = await db
    .from("jobs")
    .select("id, title")
    .eq("id", params.id)
    .single();
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Prevent duplicate reports from the same user on the same job
  const { data: existing } = await db
    .from("job_reports")
    .select("id")
    .eq("job_id", params.id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Already reported" }, { status: 409 });
  }

  const { error } = await db.from("job_reports").insert({
    job_id: params.id,
    user_id: session.user.id,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }

  // Fetch reporter info for the notification email
  const { data: reporter } = await db
    .from("users")
    .select("name, email")
    .eq("id", session.user.id)
    .single();

  sendJobReportEmail({
    jobTitle: job.title,
    jobId: params.id,
    reporterName: reporter?.name ?? "Unknown",
    reporterEmail: reporter?.email ?? "Unknown",
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  return NextResponse.json({ ok: true });
}
