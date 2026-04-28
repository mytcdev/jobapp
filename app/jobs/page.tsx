export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";
import JobSearchForm from "@/components/JobSearchForm";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string; country?: string };
}): Promise<Metadata> {
  const q = searchParams.q?.trim();
  const country = searchParams.country?.trim();
  const parts = [q, country].filter(Boolean);
  const suffix = parts.length ? ` – ${parts.join(", ")}` : "";
  return {
    title: `Open Positions${suffix}`,
    description: `Browse open job positions${q ? ` for "${q}"` : ""}${country ? ` in ${country}` : ""}. Find your skill match with smart job matching.`,
  };
}

function formatSalary(min?: number | null, max?: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}


export default async function JobsPage({
  searchParams,
}: {
  searchParams: { q?: string; country?: string };
}) {
  const session = await getServerSession(getAuthOptions());

  const q       = searchParams.q?.trim() ?? "";
  const country = searchParams.country?.trim() ?? "";

  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, company, city, state, country, salary_min, salary_max, salary_currency, required_skills, work_type")
    .eq("status", "published")
    .order("id", { ascending: false });

  if (q)       jobsQuery = jobsQuery.ilike("title", `%${q}%`);
  if (country) jobsQuery = jobsQuery.ilike("country", `%${country}%`);

  // Fetch applied job IDs for the logged-in user in parallel
  const [{ data: jobs }, { data: applications }] = await Promise.all([
    jobsQuery,
    session
      ? supabase
          .from("applications")
          .select("job_id")
          .eq("user_id", session.user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const appliedSet = new Set((applications ?? []).map((a) => a.job_id));

  const hasFilter = q || country;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Open Positions</h1>

      <JobSearchForm variant="bar" defaultTitle={q} defaultCountry={country} />

      {hasFilter && (
        <p className="text-sm text-gray-500 mb-4">
          {jobs?.length ?? 0} result{jobs?.length === 1 ? "" : "s"}
          {q && <> for <span className="font-medium text-gray-800">&ldquo;{q}&rdquo;</span></>}
          {country && <> in <span className="font-medium text-gray-800">{country}</span></>}
        </p>
      )}

      {!jobs?.length && (
        <p className="text-gray-500">{hasFilter ? "No jobs match your search." : "No jobs posted yet."}</p>
      )}

      <div className="flex flex-col gap-4">
        {jobs?.map((job) => {
          const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
          const applied = appliedSet.has(job.id);

          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg">{job.title}{job.company ? ` at ${job.company}` : ""}</h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {job.company} &middot; {[job.city, job.state, job.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {applied && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                      Applied
                    </span>
                  )}
                  {salary && <div className="text-sm text-gray-600 whitespace-nowrap">{salary}</div>}
                  {job.work_type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                      {job.work_type === "onsite" ? "On-site" : job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1)}
                    </span>
                  )}
                </div>
              </div>

              {job.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.required_skills.map((skill: string) => (
                    <Badge key={skill} label={skill} />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
