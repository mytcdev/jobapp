export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import MatchBar from "@/components/MatchBar";
import Badge from "@/components/Badge";

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_CFG: Record<string, { label: string; classes: string }> = {
  pending:     { label: "Pending",     classes: "bg-gray-100 text-gray-600" },
  viewed:      { label: "Viewed",      classes: "bg-blue-100 text-blue-600" },
  shortlisted: { label: "Shortlisted", classes: "bg-indigo-100 text-indigo-600" },
  interview:   { label: "Interview",   classes: "bg-purple-100 text-purple-600" },
  offer:       { label: "Offer",       classes: "bg-green-100 text-green-600" },
  declined:    { label: "Declined",    classes: "bg-red-100 text-red-600" },
};

export default async function ClientJobDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/client");

  const db = getSupabase();
  const { data: job, error } = await db
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", session.user.staffId)
    .single();

  if (error || !job) notFound();

  const { data: applications } = await db
    .from("applications")
    .select("id, status, match_percentage, created_at, submitted_resume_path, users(name, email)")
    .eq("job_id", params.id)
    .order("match_percentage", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      {/* Job summary */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-500 mt-0.5">{job.company} &middot; {[job.city, job.state, job.country].filter(Boolean).join(", ")}</p>
          {job.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
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
        <Link href={`/client/jobs/${job.id}/edit`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 shrink-0">Edit</Link>
      </div>

      {/* Applicants */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Applicants <span className="text-gray-400 font-normal text-base">({applications?.length ?? 0})</span>
        </h2>

        {!applications?.length && <p className="text-gray-500">No applications yet.</p>}

        <div className="flex flex-col gap-3">
          {applications?.map((app) => {
            const u = (Array.isArray(app.users) ? app.users[0] : app.users) as { name: string; email: string } | null;
            const cfg = STATUS_CFG[app.status] ?? STATUS_CFG.pending;
            return (
              <div key={app.id} className="bg-white border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium">{u?.name ?? "Anonymous"}</p>
                    <p className="text-sm text-gray-500">{u?.email}</p>
                    {app.created_at && (
                      <p className="text-xs text-gray-400 mt-0.5">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                    )}
                    {app.submitted_resume_path && (
                      <a href={`/api/admin/applications/${app.id}/resume`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block">
                        View Resume →
                      </a>
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
    </div>
  );
}
