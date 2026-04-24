export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";

const PatchSchema = z.object({
  role:     z.enum(["admin", "manager", "staff", "client"]).optional(),
  password: z.string().min(8).optional(),
}).refine((d) => d.role !== undefined || d.password !== undefined, {
  message: "Provide role or password",
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.role)     update.role = parsed.data.role;
  if (parsed.data.password) update.password_hash = await bcrypt.hash(parsed.data.password, 12);

  const { data, error: dbError } = await supabase
    .from("staff_accounts")
    .update(update)
    .eq("id", params.id)
    .select("id, username, role, created_at")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  // Prevent self-deletion
  const session = await getServerSession(getAuthOptions());
  const { data: target } = await supabase
    .from("staff_accounts")
    .select("username")
    .eq("id", params.id)
    .single();

  if (target?.username === session?.user.name) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from("staff_accounts")
    .delete()
    .eq("id", params.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
