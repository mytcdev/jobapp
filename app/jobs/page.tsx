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
  searchParams: { q?: string; country?: string; category?: string };
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
  searchParams: { q?: string; country?: string; category?: string };
}) {
  const session = await getServerSession(getAuthOptions());

  const q        = searchParams.q?.trim() ?? "";
  const country  = searchParams.country?.trim() ?? "";
  const catSlug  = searchParams.category?.trim() ?? "";

  // Fetch categories with published job counts
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name, slug, job_categories(job_id, jobs!inner(status))")
    .order("name");

  const categories = (allCategories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    count: (cat.job_categories as unknown as { jobs: { status: string } }[])
      .filter((jc) => jc.jobs?.status === "published").length,
  }));

  // Resolve category slug → id for filtering
  const activeCat = categories.find((c) => c.slug === catSlug);

  // Build jobs query
  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, company, city, state, country, salary_min, salary_max, salary_currency, required_skills, work_type")
    .eq("status", "published")
    .order("id", { ascending: false });

  if (q)       jobsQuery = jobsQuery.ilike("title", `%${q}%`);
  if (country) jobsQuery = jobsQuery.ilike("country", `%${country}%`);

  const [{ data: allJobs }, { data: applications }] = await Promise.all([
    jobsQuery,
    session
      ? supabase.from("applications").select("job_id").eq("user_id", session.user.id)
      : Promise.resolve({ data: [] }),
  ]);

  // Filter by category client-side after fetching category job IDs
  let jobs = allJobs ?? [];
  if (activeCat) {
    const { data: catJobIds } = await supabase
      .from("job_categories")
      .select("job_id")
      .eq("category_id", activeCat.id);
    const idSet = new Set((catJobIds ?? []).map((r) => r.job_id));
    jobs = jobs.filter((j) => idSet.has(j.id));
  }

  const appliedSet = new Set((applications ?? []).map((a) => a.job_id));
  const hasFilter = q || country || catSlug;

  // Build URL helper that preserves other params
  function catUrl(slug: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (slug) params.set("category", slug);
    const qs = params.toString();
    return `/jobs${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* ── Category sidebar ─────────────────────────── */}
      {categories.length > 0 && (
        <aside className="w-full lg:w-52 shrink-0">
          <div className="bg-white border rounded-xl overflow-hidden">
            <h2 className="font-semibold text-sm px-4 py-3 border-b">Categories</h2>
            <ul className="divide-y">
              <li>
                <Link href={catUrl("")}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${!catSlug ? "font-semibold text-black" : "text-gray-700"}`}>
                  <span>All Jobs</span>
                  <span className="text-xs text-gray-400">{(allJobs ?? []).length}</span>
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={catUrl(cat.slug)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${catSlug === cat.slug ? "font-semibold text-black" : "text-gray-700"}`}>
                    <span>{cat.name}</span>
                    <span className="text-xs text-gray-400">{cat.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

      {/* ── Main content ─────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold mb-4">
          {activeCat ? activeCat.name : "Open Positions"}
        </h1>

        <JobSearchForm variant="bar" defaultTitle={q} defaultCountry={country} />

        {hasFilter && (
          <p className="text-sm text-gray-500 mb-4">
            {jobs.length} result{jobs.length === 1 ? "" : "s"}
            {q && <> for <span className="font-medium text-gray-800">&ldquo;{q}&rdquo;</span></>}
            {country && <> in <span className="font-medium text-gray-800">{country}</span></>}
            {activeCat && <> in <span className="font-medium text-gray-800">{activeCat.name}</span></>}
          </p>
        )}

        {!jobs.length && (
          <p className="text-gray-500">{hasFilter ? "No jobs match your search." : "No jobs posted yet."}</p>
        )}

        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
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
                    <h2 className="font-semibold text-lg">{job.title}</h2>
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
    </div>
  );
}
