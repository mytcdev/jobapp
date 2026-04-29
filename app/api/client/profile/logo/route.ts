export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const BUCKET = "company-logos";
const MAX_MB = 2;

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
  if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: `Max file size is ${MAX_MB}MB` }, { status: 400 });

  const db = getSupabase();

  // Ensure bucket exists
  const { error: bucketError } = await db.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_MB * 1024 * 1024, allowedMimeTypes: ["image/*"] });
  if (bucketError && !bucketError.message.includes("already exists")) {
    return NextResponse.json({ error: bucketError.message }, { status: 500 });
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${session.user.staffId}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(path);

  // Save URL to staff_accounts
  await db.from("staff_accounts").update({ company_logo: publicUrl }).eq("id", session.user.staffId);

  return NextResponse.json({ url: publicUrl });
}
