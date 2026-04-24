export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/adminGuard";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaff();
  if (error) return error;

  const { data: user } = await getSupabase()
    .from("users")
    .select("resume_path")
    .eq("id", params.id)
    .single();

  if (!user?.resume_path)
    return new NextResponse("No resume on file", { status: 404 });

  const { data, error: downloadError } = await getSupabase()
    .storage.from("resumes")
    .download(user.resume_path);

  if (downloadError) return new NextResponse(downloadError.message, { status: 500 });

  const buffer = await data.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"resume.pdf\"",
      "Cache-Control": "no-store",
    },
  });
}
