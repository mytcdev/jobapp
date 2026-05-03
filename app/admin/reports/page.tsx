export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import ReportStatusSelect from "./ReportStatusSelect";

const REASON_LABELS: Record<string, string> = {
  inaccurate:          "Inaccurate information",
  spam_scam:           "Spam / Scam",
  offensive:           "Offensive content",
  duplicate:           "Duplicate listing",
  no_longer_available: "No longer available",
  other:               "Other",
};

const STATUS_STYLE: Record<string, string> = {
  open:      "bg-amber-100 text-amber-700",
  reviewed:  "bg-blue-100 text-blue-700",
  dismissed: "bg-gray-100 text-gray-400",
};

export default async function AdminReportsPage() {
  const session = await getServerSession(getAuthOptions());
  const role = session?.user.role;
  if (role !== "admin" && role !== "manager") redirect("/admin");

  const { data: reports } = await supabase
    .from("job_reports")
    .select("id, reason, details, status, created_at, job_id, user_id, jobs(title, company), users(name, email)")
    .order("created_at", { ascending: false });

  const list = reports ?? [];
  const openCount = list.filter((r) => r.status === "open").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Job Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {list.length} total
            {openCount > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">· {openCount} open</span>
            )}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
          <p className="font-semibold">No reports yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((report) => {
            const job  = (Array.isArray(report.jobs)  ? report.jobs[0]  : report.jobs)  as { title: string; company: string } | null;
            const user = (Array.isArray(report.users) ? report.users[0] : report.users) as { name: string; email: string } | null;
            const badgeCls = STATUS_STYLE[report.status] ?? "bg-gray-100 text-gray-400";

            return (
              <div key={report.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeCls}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                      <span className="text-xs font-bold text-gray-700 px-2.5 py-0.5 rounded-full bg-gray-100">
                        {REASON_LABELS[report.reason] ?? report.reason}
                      </span>
                    </div>
                    <Link
                      href={`/jobs/${report.job_id}`}
                      target="_blank"
                      className="block mt-2 font-bold text-gray-900 hover:text-emerald-700 transition-colors leading-snug"
                    >
                      {job?.title ?? "Unknown job"}
                      {job?.company && <span className="font-normal text-gray-400"> · {job.company}</span>}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">
                    {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* Reporter */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {user ? (
                    <span>{user.name} <span className="text-gray-400">({user.email})</span></span>
                  ) : (
                    <span className="text-gray-400 italic">Anonymous / deleted user</span>
                  )}
                </div>

                {/* Details */}
                {report.details && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 mb-3 border border-gray-100">
                    {report.details}
                  </p>
                )}

                {/* Actions row */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <Link
                    href={`/admin/jobs/${report.job_id}`}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    View job in admin →
                  </Link>
                  <ReportStatusSelect reportId={report.id} currentStatus={report.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
