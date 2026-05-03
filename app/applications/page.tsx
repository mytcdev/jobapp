export const dynamic = "force-dynamic";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "My Applications", robots: { index: false, follow: false } };

import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import MatchBar from "@/components/MatchBar";
import MarkNotificationsRead from "./MarkNotificationsRead";

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:     { label: "Pending",     classes: "bg-gray-100 text-gray-600" },
  viewed:      { label: "Viewed",      classes: "bg-blue-100 text-blue-600" },
  shortlisted: { label: "Shortlisted", classes: "bg-indigo-100 text-indigo-600" },
  interview:   { label: "Interview",   classes: "bg-purple-100 text-purple-600" },
  offer:       { label: "Offer",       classes: "bg-green-100 text-green-600" },
  declined:    { label: "Declined",    classes: "bg-red-100 text-red-600" },
  expired:     { label: "Expired",     classes: "bg-gray-100 text-gray-400" },
  // legacy
  reviewed:    { label: "Reviewed",    classes: "bg-blue-100 text-blue-600" },
  rejected:    { label: "Declined",    classes: "bg-red-100 text-red-600" },
};

export default async function MyApplicationsPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session) redirect("/auth/signin?callbackUrl=/applications");

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, match_percentage, created_at, jobs(id, title, company, city, state, country, work_type)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const apps = applications ?? [];

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <MarkNotificationsRead />
      <h1 className="text-2xl font-bold">My Applications</h1>

      {apps.length === 0 && (
        <div className="bg-white border rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-3">You haven't applied to any jobs yet.</p>
          <Link href="/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Browse open positions →
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {apps.map((app) => {
          const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
          const j = job as {
            id: string; title: string; company: string;
            city?: string; state?: string; country?: string; work_type?: string;
          } | null;
          const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;

          return (
            <div key={app.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Link
                    href={`/jobs/${j?.id}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {j?.title ?? "Unknown Job"}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {j?.company}
                    {j && [j.city, j.state, j.country].filter(Boolean).length > 0
                      ? ` · ${[j.city, j.state, j.country].filter(Boolean).join(", ")}`
                      : ""}
                    {j?.work_type ? ` · ${j.work_type === "onsite" ? "On-site" : j.work_type.charAt(0).toUpperCase() + j.work_type.slice(1)}` : ""}
                  </p>
                  {app.created_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${cfg.classes}`}>
                  {cfg.label}
                </span>
              </div>
              <MatchBar percent={app.match_percentage} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
