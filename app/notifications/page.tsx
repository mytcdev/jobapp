export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import PushSubscribe from "@/components/PushSubscribe";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Pending",      cls: "bg-gray-100 text-gray-600" },
  viewed:      { label: "Viewed",       cls: "bg-blue-100 text-blue-700" },
  shortlisted: { label: "Shortlisted",  cls: "bg-green-100 text-green-700" },
  interview:   { label: "Interview",    cls: "bg-purple-100 text-purple-700" },
  offer:       { label: "Offer",        cls: "bg-emerald-100 text-emerald-700" },
  declined:    { label: "Declined",     cls: "bg-red-100 text-red-600" },
  expired:     { label: "Expired",      cls: "bg-gray-100 text-gray-400" },
  reviewed:    { label: "Under Review", cls: "bg-blue-100 text-blue-700" },
  rejected:    { label: "Rejected",     cls: "bg-red-100 text-red-600" },
};

// Splits "Your application for X is now: interview." into
// { before: "Your application for X is now: ", status: "interview", after: "" }
function parseStatusMessage(message: string) {
  const match = message.match(/^([\s\S]*?is now:\s*)(\w+)(\.?)$/i);
  if (!match) return null;
  return { before: match[1], status: match[2].toLowerCase(), after: match[3] };
}

function NotificationMessage({ message }: { message: string }) {
  const parsed = parseStatusMessage(message);
  if (!parsed) return <span>{message}</span>;

  const badge = STATUS_BADGE[parsed.status];
  return (
    <span>
      {parsed.before}
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mx-1 ${badge?.cls ?? "bg-gray-100 text-gray-600"}`}>
        {badge?.label ?? parsed.status}
      </span>
      {parsed.after}
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default async function NotificationsPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session) redirect("/auth/signin");

  const role = session.user.role;
  if (role !== "user" && role !== "client") redirect("/");

  const column = role === "user" ? "user_id" : "staff_id";
  const value  = role === "user" ? session.user.id : session.user.staffId;
  if (!value) redirect("/");

  const [{ data }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, message, link, read, created_at")
      .eq(column, value)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("notifications")
      .update({ read: true })
      .eq(column, value)
      .eq("read", false),
  ]);

  const notifications = data ?? [];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <PushSubscribe />
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y border rounded-xl overflow-hidden bg-white">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link}
              className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors ${
                !n.read ? "bg-blue-50 hover:bg-blue-50/70" : ""
              }`}
            >
              <div className="mt-1.5 shrink-0">
                <span className={`block w-2 h-2 rounded-full ${!n.read ? "bg-blue-500" : "bg-transparent"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">
                  <NotificationMessage message={n.message} />
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
              </div>
              <span className="text-xs text-blue-600 shrink-0 mt-0.5">View →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
