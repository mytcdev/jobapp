export const dynamic = "force-dynamic";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "Saved Jobs", robots: { index: false, follow: false } };

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";

function formatSalary(min?: number | null, max?: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default async function SavedJobsPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session) redirect("/auth/signin?callbackUrl=/saved-jobs");

  const { data: saved } = await supabase
    .from("saved_jobs")
    .select("job_id, created_at, jobs(id, title, company, city, state, country, work_type, employment_type, salary_min, salary_max, salary_currency, required_skills, status)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const jobs = (saved ?? [])
    .map((s) => {
      const job = Array.isArray(s.jobs) ? s.jobs[0] : s.jobs;
      return job && job.status === "published" ? { ...job, savedAt: s.created_at } : null;
    })
    .filter(Boolean) as Array<{
      id: string; title: string; company: string;
      city?: string | null; state?: string | null; country?: string | null;
      work_type?: string | null;
      employment_type?: string | null;
      salary_min?: number | null; salary_max?: number | null; salary_currency?: string | null;
      required_skills?: string[] | null;
      savedAt: string;
    }>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>

      {jobs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-[0_4px_20px_rgba(15,74,46,0.04)]">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="font-semibold text-gray-400">No saved jobs yet</p>
          <p className="text-sm text-gray-400 mt-1">Bookmark jobs you like and they&apos;ll appear here.</p>
          <Link href="/jobs" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900">
            Browse jobs →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency ?? "USD");
            const location = [job.city, job.state, job.country].filter(Boolean).join(", ");
            const workLabel = job.work_type === "onsite" ? "On-site"
              : job.work_type ? job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1) : null;
            const empLabel = job.employment_type ? job.employment_type.replace("_", "-").replace(/^./, (c: string) => c.toUpperCase()) : null;

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,74,46,0.04)] hover:shadow-[0_8px_30px_rgba(15,74,46,0.1)] transition-all group flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
                    {location && <p className="text-xs text-gray-400 mt-0.5">{location}</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {workLabel && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {workLabel}
                      </span>
                    )}
                    {empLabel && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {empLabel}
                      </span>
                    )}
                  </div>
                </div>

                {(job.required_skills?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills!.slice(0, 5).map((s) => <Badge key={s} label={s} />)}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                  <span className="text-sm font-bold text-gray-900">{salary ?? ""}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg group-hover:bg-emerald-100 transition-colors">
                    View Job →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
