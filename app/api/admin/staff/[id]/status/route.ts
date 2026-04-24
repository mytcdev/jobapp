export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";

const BodySchema = z.object({
  status: z.enum(["active", "pending", "blocked"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, session: adminSession } = await requireManager();
  if (error) return error;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  // Prevent self-blocking
  const session = await getServerSession(getAuthOptions());
  const { data: target } = await supabase
    .from("staff_accounts")
    .select("username")
    .eq("id", params.id)
    .single();

  if (target?.username === session?.user.name) {
    return NextResponse.json({ error: "You cannot change your own account status." }, { status: 400 });
  }

  const { data, error: dbError } = await supabase
    .from("staff_accounts")
    .update({ status: parsed.data.status })
    .eq("id", params.id)
    .select("id, username, status")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}
