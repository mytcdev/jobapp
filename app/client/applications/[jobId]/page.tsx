export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import MatchBar from "@/components/MatchBar";
import ClientStatusSelect from "../ClientStatusSelect";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const STATUS_STYLE: Record<string, { badge: string; card: string }> = {
  pending:     { badge: "bg-amber-100 text-amber-700",    card: "border-l-4 border-l-amber-400 bg-amber-50/40" },
  viewed:      { badge: "bg-blue-100 text-blue-700",      card: "" },
  shortlisted: { badge: "bg-indigo-100 text-indigo-700",  card: "border-l-4 border-l-indigo-400" },
  interview:   { badge: "bg-purple-100 text-purple-700",  card: "border-l-4 border-l-purple-400" },
  offer:       { badge: "bg-green-100 text-green-700",    card: "border-l-4 border-l-green-500" },
  declined:    { badge: "bg-red-100 text-red-500",        card: "opacity-60" },
  expired:     { badge: "bg-gray-100 text-gray-400",      card: "opacity-50" },
};

export default async function JobApplicationsPage({
  params,
}: {
  params: { jobId: string };
}) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/client");

  const db = getSupabase();

  const { data: job } = await db
    .from("jobs")
    .select("id, title, status")
    .eq("id", params.jobId)
    .eq("owner_id", session.user.staffId)
    .single();

  if (!job) notFound();

  const { data: applications } = await db
    .from("applications")
    .select("id, status, match_percentage, created_at, submitted_resume_path, users(name, email, skills)")
    .eq("job_id", params.jobId)
    .order("created_at", { ascending: false });

  const apps = applications ?? [];
  const pending = apps.filter((a) => a.status === "pending").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/client/applications"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Jobs
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{job.title}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {apps.length} application{apps.length !== 1 ? "s" : ""}
              {pending > 0 && (
                <span className="ml-2 font-semibold text-amber-600">· {pending} unreviewed</span>
              )}
            </p>
          </div>
          {job.status === "closed" && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-500 font-semibold border border-red-100">
              Closed
            </span>
          )}
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold">No applications yet</p>
          <p className="text-sm mt-1">Share the job to start receiving applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => {
            const u = (Array.isArray(app.users) ? app.users[0] : app.users) as {
              name: string; email: string; skills?: string[] | null;
            } | null;
            const style = STATUS_STYLE[app.status] ?? { badge: "bg-gray-100 text-gray-500", card: "" };
            const isPending = app.status === "pending";

            return (
              <div
                key={app.id}
                className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,74,46,0.04)] flex flex-col gap-4 ${style.card}`}
              >
                {/* Applicant header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {u?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 leading-tight truncate">
                          {u?.name ?? "Anonymous"}
                          {isPending && (
                            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400 align-middle" />
                          )}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{u?.email}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>

                {/* Match bar */}
                <MatchBar percent={app.match_percentage} />

                {/* Meta row */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Applied {timeAgo(app.created_at)}</span>
                  {app.submitted_resume_path && (
                    <a
                      href={`/api/admin/applications/${app.id}/resume`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold hover:text-emerald-900 transition-colors"
                    >
                      View Resume →
                    </a>
                  )}
                </div>

                {/* Status selector */}
                <div className="pt-3 border-t border-gray-100">
                  <ClientStatusSelect applicationId={app.id} currentStatus={app.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
