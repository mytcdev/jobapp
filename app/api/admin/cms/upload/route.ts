export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/adminGuard";
import { getSupabase } from "@/lib/supabase";

const ALLOWED = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/svg+xml", "image/avif", "image/bmp",
  "image/tiff", "image/ico", "image/x-icon",
];

export async function POST(req: NextRequest) {
  const { error } = await requireStaff();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, SVG, AVIF, BMP, TIFF.` },
      { status: 400 },
    );
  }

  const ext    = file.name.split(".").pop() ?? "jpg";
  const path   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const db = getSupabase();
  const { error: uploadError } = await db
    .storage.from("cms-images").upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // Public bucket — get the direct public URL
  const { data: { publicUrl } } = db.storage.from("cms-images").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
