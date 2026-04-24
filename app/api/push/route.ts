export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { z } from "zod";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth:   z.string().min(10),
  }),
});

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

function recipient(session: Session) {
  if (session.user.role === "user")   return { column: "user_id",  value: session.user.id };
  if (session.user.role === "client") return { column: "staff_id", value: session.user.staffId! };
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rec = recipient(session);
  if (!rec) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = SubscribeSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });

  const { endpoint, keys } = parsed.data;

  await supabase.from("push_subscriptions").upsert(
    { [rec.column]: rec.value, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { onConflict: "endpoint" },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = UnsubscribeSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint);

  return NextResponse.json({ ok: true });
}
