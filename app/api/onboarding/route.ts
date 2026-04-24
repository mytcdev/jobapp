export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { extractProfileData, validateResumeInput } from "@/lib/llm";
import { handleAiWarning } from "@/lib/aiGuard";
import { checkRateLimit } from "@/lib/rateLimit";

const BodySchema = z.object({ bio: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(`extract:${session.user.id}`, 5, 3600);
  if (!rl.allowed)
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { bio } = parsed.data;

  // Validate input is English resume content before extracting
  const validation = await validateResumeInput(bio);
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
      : `Please enter resume or professional profile content only. Warning ${warn.warningCount} of 3 — ${warn.warningsLeft} remaining before your account is blocked.`;
    return NextResponse.json(
      { error: message, warning: true, warningCount: warn.warningCount, blocked: warn.blocked },
      { status: 400 },
    );
  }

  const extracted = await extractProfileData(bio);

  const update: Record<string, unknown> = {
    bio,
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

  const { data: user, error } = await getSupabase()
    .from("users")
    .update(update)
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ extracted, user });
}
