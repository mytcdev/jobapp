export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/adminGuard";
import { getSupabase } from "@/lib/supabase";

const BodySchema = z.object({
  slug:      z.string().min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  title:     z.string().min(1),
  content:   z.string(),
  published: z.boolean().default(false),
});

export async function GET() {
  const { error } = await requireStaff();
  if (error) return error;

  const { data, error: dbError } = await getSupabase()
    .from("cms_pages")
    .select("id, slug, title, published, updated_at")
    .order("created_at", { ascending: true });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ pages: data });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireStaff();
  if (error) return error;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { data: staffRow } = await getSupabase()
    .from("staff_accounts").select("id").eq("username", session!.user.name).single();

  const { data, error: dbError } = await getSupabase()
    .from("cms_pages")
    .insert({ ...parsed.data, created_by: staffRow?.id, updated_by: staffRow?.id })
    .select()
    .single();

  if (dbError) {
    const msg = dbError.code === "23505" ? "Slug already exists." : dbError.message;
    return NextResponse.json({ error: msg }, { status: 409 });
  }
  return NextResponse.json({ page: data }, { status: 201 });
}
