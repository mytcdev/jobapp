export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/adminGuard";
import { getSupabase } from "@/lib/supabase";

const BodySchema = z.object({
  slug:      z.string().min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  title:     z.string().min(1),
  content:   z.string(),
  published: z.boolean(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const { data, error: dbError } = await getSupabase()
    .from("cms_pages").select("*").eq("id", params.id).single();
  if (dbError || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ page: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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
    .update({ ...parsed.data, updated_by: staffRow?.id, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) {
    const msg = dbError.code === "23505" ? "Slug already exists." : dbError.message;
    return NextResponse.json({ error: msg }, { status: 409 });
  }
  return NextResponse.json({ page: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const { error: dbError } = await getSupabase()
    .from("cms_pages").delete().eq("id", params.id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
