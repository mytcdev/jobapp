export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await requireStaff();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("users")
    .select("id, name, email, image, skills, city, state, country, preferred_salary, status, resume_path, created_at")
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ applicants: data });
}
