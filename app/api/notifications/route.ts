export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function recipientFilter(session: Session | null) {
  if (!session) return null;
  if (session.user.role === "user")   return { column: "user_id",  value: session.user.id };
  if (session.user.role === "client") return { column: "staff_id", value: session.user.staffId };
  return null;
}

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  const filter = recipientFilter(session);
  if (!filter || !filter.value) return NextResponse.json({ notifications: [], unread: 0 });

  const { data } = await supabase
    .from("notifications")
    .select("id, message, link, read, created_at")
    .eq(filter.column, filter.value)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unread });
}

export async function PATCH() {
  const session = await getServerSession(getAuthOptions());
  const filter = recipientFilter(session);
  if (!filter || !filter.value) return NextResponse.json({ ok: true });

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq(filter.column, filter.value)
    .eq("read", false);

  return NextResponse.json({ ok: true });
}
