export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/adminGuard";
import { getSupabase } from "@/lib/supabase";

const USER_STATUSES = ["active", "pending", "blocked"] as const;
const BodySchema = z.object({
  status: z.enum(USER_STATUSES),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const db = getSupabase();
  const { data, error: dbError } = await db
    .from("users")
    .select("id, name, email, image, skills, city, state, country, preferred_salary, bio, status, resume_path, created_at")
    .eq("id", params.id)
    .single();

  if (dbError || !data) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  return NextResponse.json({ applicant: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const db = getSupabase();
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data, error: dbError } = await db
    .from("users")
    .update({ status: parsed.data.status })
    .eq("id", params.id)
    .select("id, name, email, status")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ applicant: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const db = getSupabase();
  // Applications are kept (user_id becomes NULL via ON DELETE SET NULL)
  const { error: dbError } = await db.from("users").delete().eq("id", params.id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
