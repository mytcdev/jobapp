export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";
import DeleteJobButton from "./DeleteJobButton";

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusStyle: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  pending: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
};

const workTypeLabel: Record<string, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export default async function AdminJobsPage() {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company, city, state, country, required_skills, status, salary_currency, salary_min, salary_max, work_type, created_at, updated_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link href="/admin/jobs/new"
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          + New Job
        </Link>
      </div>

      {!jobs?.length && <p className="text-gray-500">No jobs yet.</p>}

      <div className="flex flex-col gap-3">
        {jobs?.map((job) => (
          <div key={job.id} className="bg-white border rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">{job.title}{job.company ? ` at ${job.company}` : ""}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[job.status] ?? statusStyle.draft}`}>
                  {job.status}
                </span>
                {job.work_type && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                    {workTypeLabel[job.work_type] ?? job.work_type}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {job.company} &middot; {[job.city, job.state, job.country].filter(Boolean).join(", ")}
              </p>
              {(job.salary_min || job.salary_max) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {job.salary_currency} {job.salary_min?.toLocaleString()} {job.salary_max ? `– ${job.salary_max.toLocaleString()}` : ""}
                </p>
              )}
              {job.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.required_skills.map((s: string) => <Badge key={s} label={s} />)}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Created {fmtDate(job.created_at)}
                {job.updated_at && job.updated_at !== job.created_at && (
                  <> &middot; Updated {fmtDate(job.updated_at)}</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href={`/jobs/${job.id}`} target="_blank"
                className="text-sm font-medium text-gray-400 hover:text-gray-700">
                ↗ Frontend
              </Link>
              <Link href={`/admin/jobs/${job.id}`}
                className="text-sm font-medium text-gray-600 hover:text-gray-900">
                View
              </Link>
              <Link href={`/admin/jobs/${job.id}/edit`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Edit
              </Link>
              <DeleteJobButton jobId={job.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
