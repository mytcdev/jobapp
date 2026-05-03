export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import Badge from "@/components/Badge";

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLE: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-500",
  pending:   "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
};

export default async function ClientJobsPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/client");

  const db = getSupabase();
  const { data: jobs } = await db
    .from("jobs")
    .select("id, title, company, status, work_type, city, state, country, required_skills, created_at, updated_at")
    .eq("owner_id", session.user.staffId)
    .order("created_at", { ascending: false });

  // Count applications per job
  const jobIds = jobs?.map((j) => j.id) ?? [];
  const { data: appCounts } = jobIds.length
    ? await db
        .from("applications")
        .select("job_id")
        .in("job_id", jobIds)
    : { data: [] };

  const countMap = new Map<string, number>();
  for (const a of appCounts ?? []) {
    countMap.set(a.job_id, (countMap.get(a.job_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <Link href="/client/jobs/new"
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          + New Job
        </Link>
      </div>

      {!jobs?.length && <p className="text-gray-500">No jobs yet. Create your first one.</p>}

      <div className="flex flex-col gap-3">
        {jobs?.map((job) => (
          <div key={job.id} className="bg-white border rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">{job.title}{job.company ? ` at ${job.company}` : ""}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[job.status] ?? STATUS_STYLE.draft}`}>
                  {job.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{job.company} &middot; {[job.city, job.state, job.country].filter(Boolean).join(", ")}</p>
              {job.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.required_skills.slice(0, 5).map((s: string) => <Badge key={s} label={s} />)}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Created {fmtDate(job.created_at)}
                {job.updated_at && job.updated_at !== job.created_at && (
                  <> &middot; Updated {fmtDate(job.updated_at)}</>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-xs text-gray-500">
                {countMap.get(job.id) ?? 0} applicant{(countMap.get(job.id) ?? 0) !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-3">
                <Link href={`/jobs/${job.id}`} target="_blank"
                  className="text-sm font-medium text-gray-400 hover:text-gray-700">Frontend ↗</Link>
                <Link href={`/client/jobs/${job.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800">View Applicants</Link>
                <Link href={`/client/jobs/${job.id}/edit`}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900">Edit</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
