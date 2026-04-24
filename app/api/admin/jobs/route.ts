export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";

const BodySchema = z.object({
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
  owner_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const { error } = await requireStaff();
  if (error) return error;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data: job, error: dbError } = await supabase
    .from("jobs")
    .insert(parsed.data)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  revalidatePath("/jobs");
  return NextResponse.json({ job }, { status: 201 });
}
