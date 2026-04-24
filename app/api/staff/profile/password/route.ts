export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const BodySchema = z.object({
  current: z.string().min(1),
  next:    z.string().min(8),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId || session.user.role !== "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { current, next } = parsed.data;
  const db = getSupabase();

  const { data: account } = await db
    .from("staff_accounts")
    .select("password_hash")
    .eq("id", session.user.staffId)
    .single();

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const valid = await bcrypt.compare(current, account.password_hash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  const password_hash = await bcrypt.hash(next, 12);
  const { error } = await db
    .from("staff_accounts")
    .update({ password_hash })
    .eq("id", session.user.staffId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
