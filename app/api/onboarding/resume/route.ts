export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { extractProfileData, validateResumeInput } from "@/lib/llm";
import { handleAiWarning } from "@/lib/aiGuard";
import { extractPdfText } from "@/lib/pdf";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const BUCKET = "resumes";

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(`extract:${session.user.id}`, 5, 3600);
  if (!rl.allowed)
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const formData = await req.formData();
  const file = formData.get("resume") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.type !== "application/pdf")
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File exceeds 2 MB limit" }, { status: 400 });

  // Extract text from PDF and validate before running AI extraction
  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractPdfText(buffer);

  const validation = await validateResumeInput(text);
  if (!validation.valid) {
    if (validation.reason === "not_english") {
      return NextResponse.json(
        { error: "Only English resumes are supported at this time." },
        { status: 400 },
      );
    }
    const warn = await handleAiWarning(session.user.id);
    const message = warn.blocked
      ? "Your account has been blocked due to repeated misuse of the profile extractor."
      : `The uploaded file does not appear to be a resume. Warning ${warn.warningCount} of 3 — ${warn.warningsLeft} remaining before your account is blocked.`;
    return NextResponse.json(
      { error: message, warning: true, warningCount: warn.warningCount, blocked: warn.blocked },
      { status: 400 },
    );
  }

  const extracted = await extractProfileData(text);

  // Build profile update
  const update: Record<string, unknown> = {
    bio: text.slice(0, 2000), // store truncated text as bio
    skills: extracted.skills,
    preferred_currency: extracted.preferred_currency,
    onboarding_complete: true,
  };
  if (extracted.name) update.name = extracted.name;
  if (extracted.city) update.city = extracted.city;
  if (extracted.state) update.state = extracted.state;
  if (extracted.country) update.country = extracted.country;
  if (extracted.preferred_salary !== null) update.preferred_salary = extracted.preferred_salary;
  if (extracted.languages?.length) update.languages = extracted.languages;
  if (extracted.education?.length) update.education = extracted.education;
  if (extracted.experience?.length) update.experience = extracted.experience;
  if (extracted.portfolio?.length) update.portfolio = extracted.portfolio;

  // Upload PDF to storage
  const path = `${session.user.id}/uploaded.pdf`;
  const db = getSupabase();

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: "application/pdf" });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  update.resume_path = path;
  update.active_resume_type = "uploaded";

  const { data: user, error } = await db
    .from("users")
    .update(update)
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ extracted, user });
}
