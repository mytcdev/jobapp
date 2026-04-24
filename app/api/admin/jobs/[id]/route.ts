export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";

const JobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postal_code: z.string().optional().nullable(),
  required_skills: z.array(z.string()).min(1),
  salary_currency: z.string().default("USD"),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  status: z.enum(["draft", "pending", "published"]).default("draft"),
  work_type: z.enum(["onsite", "remote", "hybrid"]).default("onsite"),
  accepted_nationality: z.string().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const parsed = JobSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });

  const { data: job, error: dbError } = await supabase
    .from("jobs")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${params.id}`);
  return NextResponse.json({ job });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const { error: dbError } = await supabase.from("jobs").delete().eq("id", params.id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
