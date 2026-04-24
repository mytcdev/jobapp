export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MatchBar from "@/components/MatchBar";
import Badge from "@/components/Badge";
import StatusSelect from "../../applications/StatusSelect";

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const workTypeLabel: Record<string, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export default async function AdminJobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [jobResult, appsResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.id).single(),
    supabase
      .from("applications")
      .select("id, status, match_percentage, created_at, submitted_resume_path, users(id, name, email)")
      .eq("job_id", params.id)
      .order("match_percentage", { ascending: false }),
  ]);

  if (jobResult.error || !jobResult.data) notFound();
  const job = jobResult.data;

  // Fetch owner separately to avoid PostgREST join cache issues
  let owner: { id: string; username: string; company_name: string | null } | null = null;
  if (job.owner_id) {
    const { data } = await supabase
      .from("staff_accounts")
      .select("id, username, company_name")
      .eq("id", job.owner_id)
      .single();
    owner = data ?? null;
  }
  const applications = appsResult.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Job summary ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-500 mt-0.5">
            {job.company} &middot;{" "}
            {[job.city, job.state, job.country].filter(Boolean).join(", ")}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {job.status}
            </span>
            {job.work_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                {workTypeLabel[job.work_type] ?? job.work_type}
              </span>
            )}
            {owner && (
              <Link href={`/admin/staff/${owner.id}`}
                className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium hover:bg-amber-100">
                Client: {owner.company_name ?? owner.username}
              </Link>
            )}
          </div>
          {job.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {job.required_skills.map((s: string) => <Badge key={s} label={s} />)}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Created {fmtDate(job.created_at)}
            {job.updated_at && job.updated_at !== job.created_at && (
              <> &middot; Updated {fmtDate(job.updated_at)}</>
            )}
          </p>
        </div>
        <Link
          href={`/admin/jobs/${job.id}/edit`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 shrink-0"
        >
          Edit Job
        </Link>
      </div>

      {/* ── Applicants ──────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Applicants{" "}
          <span className="text-gray-400 font-normal text-base">
            ({applications.length})
          </span>
        </h2>

        {applications.length === 0 && (
          <p className="text-gray-500">No applications yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {applications.map((app) => {
            const user = Array.isArray(app.users) ? app.users[0] : app.users;
            const u = user as { id: string; name: string; email: string } | null;
            return (
              <div key={app.id} className="bg-white border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <Link
                      href={`/admin/applicants/${u?.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {u?.name ?? "Unknown"}
                    </Link>
                    <p className="text-sm text-gray-500">{u?.email}</p>
                    {app.created_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    )}
                    {app.submitted_resume_path && (
                      <a
                        href={`/api/admin/applications/${app.id}/resume`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                      >
                        View Resume →
                      </a>
                    )}
                  </div>
                  <StatusSelect
                    applicationId={app.id}
                    currentStatus={app.status}
                  />
                </div>
                <MatchBar percent={app.match_percentage} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
