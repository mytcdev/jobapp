export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { extractProfileData, validateResumeInput } from "@/lib/llm";
import { handleAiWarning } from "@/lib/aiGuard";
import { checkRateLimit } from "@/lib/rateLimit";
import { EducationItemSchema, ExperienceItemSchema, PortfolioItemSchema } from "@/lib/schema";

// ── AI extraction ─────────────────────────────────────────────────────────────

const AIBodySchema = z.object({ bio: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(`extract:${session.user.id}`, 5, 3600);
  if (!rl.allowed)
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const parsed = AIBodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });

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
  };
  if (extracted.name) update.name = extracted.name;
  if (extracted.city) update.city = extracted.city;
  if (extracted.state) update.state = extracted.state;
  if (extracted.country) update.country = extracted.country;
  if (extracted.preferred_salary !== null) update.preferred_salary = extracted.preferred_salary;
  if (extracted.languages && extracted.languages.length > 0) update.languages = extracted.languages;
  if (extracted.education.length > 0) update.education = extracted.education;
  if (extracted.experience.length > 0) update.experience = extracted.experience;
  if (extracted.portfolio.length > 0) update.portfolio = extracted.portfolio;

  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ user: data, extracted });
}

// ── Manual update ─────────────────────────────────────────────────────────────

const ManualSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  preferred_salary: z.number().positive().nullable().optional(),
  preferred_currency: z.string().length(3).optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  education: z.array(EducationItemSchema).optional(),
  experience: z.array(ExperienceItemSchema).optional(),
  portfolio: z.array(PortfolioItemSchema).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ManualSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });

  const { data, error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
