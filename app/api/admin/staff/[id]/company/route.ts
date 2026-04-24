export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";

const BodySchema = z.object({
  company_name:    z.string().nullable(),
  company_address: z.string().nullable(),
  company_website: z.string().nullable(),
  contact_email:   z.string().nullable(),
  contact_phone:   z.string().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireManager();
  if (error) return error;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from("staff_accounts")
    .update(parsed.data)
    .eq("id", params.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
