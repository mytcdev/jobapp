export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const jobId  = params.id;

  const { data: existing } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .single();

  if (existing) {
    await supabase.from("saved_jobs").delete().eq("id", existing.id);
    return NextResponse.json({ saved: false });
  }

  await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId });
  return NextResponse.json({ saved: true });
}
