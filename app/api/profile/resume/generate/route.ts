export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const MAX_SIZE = 2 * 1024 * 1024;
const BUCKET = "resumes";

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("resume") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.type !== "application/pdf")
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File exceeds 2 MB limit" }, { status: 400 });

  const path = `${session.user.id}/generated.pdf`;
  const db = getSupabase();

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: "application/pdf" });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  await db
    .from("users")
    .update({ generated_resume_path: path })
    .eq("id", session.user.id);

  return NextResponse.json({ generated_resume_path: path });
}
