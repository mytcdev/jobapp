export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
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

  const path = `${session.user.id}/uploaded.pdf`;
  const db = getSupabase();

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: "application/pdf" });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  await db.from("users").update({ resume_path: path }).eq("id", session.user.id);

  return NextResponse.json({ resume_path: path });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const type = req.nextUrl.searchParams.get("type"); // "uploaded" | "generated" | null

  const { data: user } = await getSupabase()
    .from("users")
    .select("resume_path, generated_resume_path, active_resume_type")
    .eq("id", session.user.id)
    .single();

  let path: string | null = null;
  if (type === "uploaded") {
    path = user?.resume_path ?? null;
  } else if (type === "generated") {
    path = user?.generated_resume_path ?? null;
  } else {
    // Serve whichever the user marked as active, falling back to whichever exists
    if (user?.active_resume_type === "generated") path = user?.generated_resume_path ?? null;
    else if (user?.active_resume_type === "uploaded") path = user?.resume_path ?? null;
    else path = user?.resume_path ?? user?.generated_resume_path ?? null;
  }

  if (!path) return new NextResponse("No resume found", { status: 404 });

  const { data, error } = await getSupabase().storage.from(BUCKET).download(path);
  if (error) return new NextResponse(error.message, { status: 500 });

  const buffer = await data.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"resume.pdf\"",
      "Cache-Control": "no-store",
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { active_resume_type } = await req.json();
  if (active_resume_type !== "uploaded" && active_resume_type !== "generated")
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const { error } = await getSupabase()
    .from("users")
    .update({ active_resume_type })
    .eq("id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
