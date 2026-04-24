export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";

const BodySchema = z.object({
  username: z.string().min(3).max(32).regex(/^\w+$/, "Letters, numbers and _ only"),
  password: z.string().min(8),
  role: z.enum(["admin", "manager", "staff", "client"]),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("staff_accounts")
    .select("id, username, role, created_at")
    .order("created_at", { ascending: true });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { username, password, role } = parsed.data;
  const password_hash = await bcrypt.hash(password, 12);

  // Resolve the staff_accounts id of the creator
  const { data: creator } = await supabase
    .from("staff_accounts")
    .select("id")
    .eq("username", session!.user.name)
    .single();

  const { data, error: dbError } = await supabase
    .from("staff_accounts")
    .insert({
      username,
      password_hash,
      role,
      created_by: creator?.id ?? null,
    })
    .select("id, username, role, created_at")
    .single();

  if (dbError) {
    const msg = dbError.code === "23505" ? "Username already taken." : dbError.message;
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  return NextResponse.json({ staff: data }, { status: 201 });
}
