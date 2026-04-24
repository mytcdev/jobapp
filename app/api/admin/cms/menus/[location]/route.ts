export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/adminGuard";
import { getSupabase } from "@/lib/supabase";

const ItemSchema = z.object({
  id:         z.string(),
  label:      z.string().min(1),
  url:        z.string().min(1),
  openNewTab: z.boolean().default(false),
});

const BodySchema = z.object({
  items: z.array(ItemSchema),
});

const LOCATIONS = ["header", "footer"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { location: string } },
) {
  const { error } = await requireManager();
  if (error) return error;

  if (!LOCATIONS.includes(params.location as typeof LOCATIONS[number])) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const { data } = await getSupabase()
    .from("nav_menus").select("items").eq("location", params.location).single();

  return NextResponse.json({ items: data?.items ?? [] });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { location: string } },
) {
  const { error } = await requireManager();
  if (error) return error;

  if (!LOCATIONS.includes(params.location as typeof LOCATIONS[number])) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { error: dbError } = await getSupabase()
    .from("nav_menus")
    .upsert({ location: params.location, items: parsed.data.items, updated_at: new Date().toISOString() });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
