export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";

const STATUS_STYLE: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-500",
  pending:   "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  closed:    "bg-red-50 text-red-500",
};

const WORK_TYPE_LABEL: Record<string, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function StaffJobsPage() {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company, city, state, country, required_skills, status, salary_currency, salary_min, salary_max, work_type, employment_type, created_at")
    .order("created_at", { ascending: false });

  const published = jobs?.filter((j) => j.status === "published").length ?? 0;
  const draft     = jobs?.filter((j) => j.status === "draft").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-[#64748B] mt-0.5">
            {jobs?.length ?? 0} total · {published} live · {draft} draft
          </p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="flex items-center gap-1.5 rounded-lg bg-[#0F4A2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a3a22] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Job
        </Link>
      </div>

      {!jobs?.length && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center text-[#94A3B8]">
          No jobs yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {jobs?.map((job) => (
          <div key={job.id} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-[#1C2434]">{job.title}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[job.status] ?? STATUS_STYLE.draft}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                  {job.work_type && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                      {WORK_TYPE_LABEL[job.work_type] ?? job.work_type}
                    </span>
                  )}
                  {job.employment_type && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                      {job.employment_type.replace(/_/g, "-").replace(/^./, (c: string) => c.toUpperCase())}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#64748B]">
                  {job.company}
                  {[job.city, job.country].filter(Boolean).length > 0 && (
                    <> · {[job.city, job.state, job.country].filter(Boolean).join(", ")}</>
                  )}
                </p>
                {(job.salary_min || job.salary_max) && (
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {job.salary_currency} {job.salary_min?.toLocaleString()}
                    {job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : ""}
                  </p>
                )}
                {job.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(job.required_skills as string[]).slice(0, 5).map((s) => <Badge key={s} label={s} />)}
                    {job.required_skills.length > 5 && (
                      <span className="text-xs text-[#94A3B8] self-center">+{job.required_skills.length - 5}</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-[#94A3B8] mt-2">Posted {fmtDate(job.created_at)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/jobs/${job.id}`}
                  target="_blank"
                  className="text-xs font-medium text-[#64748B] hover:text-[#1C2434] transition-colors"
                >
                  Preview ↗
                </Link>
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#1C2434] hover:bg-[#F1F5F9] transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
