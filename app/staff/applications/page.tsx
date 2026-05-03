export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import MatchBar from "@/components/MatchBar";
import StatusSelect from "@/app/admin/applications/StatusSelect";

const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-amber-100 text-amber-700",
  viewed:      "bg-blue-100 text-blue-700",
  shortlisted: "bg-indigo-100 text-indigo-700",
  interview:   "bg-purple-100 text-purple-700",
  offer:       "bg-green-100 text-green-700",
  declined:    "bg-red-100 text-red-500",
  expired:     "bg-gray-100 text-gray-400",
};

export default async function StaffApplicationsPage() {
  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, match_percentage, submitted_resume_path, created_at, jobs(title, company), users(name, email)")
    .order("created_at", { ascending: false });

  const apps = applications ?? [];
  const pending = apps.filter((a) => a.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#64748B]">
          {apps.length} total
          {pending > 0 && <span className="ml-2 font-semibold text-amber-600">· {pending} unreviewed</span>}
        </p>
      </div>

      {apps.length === 0 && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center text-[#94A3B8]">
          No applications yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {apps.map((app) => {
          const job  = (Array.isArray(app.jobs)  ? app.jobs[0]  : app.jobs)  as { title: string; company: string } | null;
          const user = (Array.isArray(app.users) ? app.users[0] : app.users) as { name: string; email: string } | null;
          const badgeCls = STATUS_BADGE[app.status] ?? "bg-gray-100 text-gray-500";

          return (
            <div key={app.id} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF4FB] text-xs font-bold text-[#3C50E0]">
                      {user?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1C2434] truncate">{user?.name ?? "Unknown"}</p>
                      <p className="text-xs text-[#64748B] truncate">{user?.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#64748B] mt-2 truncate">
                    {job?.title}{job?.company ? ` · ${job.company}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  {app.submitted_resume_path && (
                    <a
                      href={`/api/admin/applications/${app.id}/resume`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#0F4A2E] hover:underline"
                    >
                      View Resume →
                    </a>
                  )}
                </div>
              </div>

              <MatchBar percent={app.match_percentage} />

              <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
                <StatusSelect applicationId={app.id} currentStatus={app.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
