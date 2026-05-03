export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const BodySchema = z.object({
  company_name:      z.string().nullable(),
  company_address:   z.string().nullable(),
  company_website:   z.string().nullable(),
  contact_email:     z.string().nullable(),
  contact_phone:     z.string().nullable(),
  industry:          z.string().nullable().optional(),
  company_size:      z.string().nullable().optional(),
  founded_year:      z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
  company_url:       z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("staff_accounts")
    .update(parsed.data)
    .eq("id", session.user.staffId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
