export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Public image proxy — no auth required so images render in public pages too
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return new NextResponse("Missing path", { status: 400 });

  const { data, error } = await getSupabase()
    .storage.from("resumes").download(path);
  if (error || !data) return new NextResponse("Not found", { status: 404 });

  const buf = Buffer.from(await data.arrayBuffer());
  return new NextResponse(buf, {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
