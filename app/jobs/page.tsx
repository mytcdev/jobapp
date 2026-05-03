export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";
import JobSearchForm from "@/components/JobSearchForm";
import { calculateMatchScore } from "@/lib/matching";

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
  })).filter((cat) => cat.count > 0);

  // Resolve category slug → id for filtering
  const activeCat = categories.find((c) => c.slug === catSlug);

  // Build jobs query
  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, company, city, state, country, salary_min, salary_max, salary_currency, required_skills, work_type, employment_type, status")
    .in("status", ["published", "closed"])
    .order("id", { ascending: false });

  if (q)       jobsQuery = jobsQuery.ilike("title", `%${q}%`);
  if (country) jobsQuery = jobsQuery.ilike("country", `%${country}%`);

  const [{ data: allJobs }, { data: applications }, { data: userData }] = await Promise.all([
    jobsQuery,
    session
      ? supabase.from("applications").select("job_id").eq("user_id", session.user.id)
      : Promise.resolve({ data: [] }),
    session?.user?.id
      ? supabase.from("users").select("skills").eq("id", session.user.id).single()
      : Promise.resolve({ data: null }),
  ]);
  const userSkills: string[] | null = userData?.skills ?? null;

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
        <aside className="w-full lg:w-56 shrink-0">
          <div className="bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(15,74,46,0.05)] overflow-hidden">
            <h2 className="font-bold text-xs uppercase tracking-wider px-4 py-3 border-b border-gray-100 text-gray-500">Categories</h2>
            <ul>
              <li>
                <Link href={catUrl("")}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${!catSlug ? "font-bold text-emerald-700 bg-emerald-50" : "text-gray-700 hover:bg-gray-50 hover:text-emerald-700"}`}>
                  <span>All Jobs</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${!catSlug ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{(allJobs ?? []).length}</span>
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={catUrl(cat.slug)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${catSlug === cat.slug ? "font-bold text-emerald-700 bg-emerald-50" : "text-gray-700 hover:bg-gray-50 hover:text-emerald-700"}`}>
                    <span>{cat.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${catSlug === cat.slug ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{cat.count}</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
            const applied = appliedSet.has(job.id);
            const matchPercent = userSkills ? calculateMatchScore(userSkills, job.required_skills ?? []) : null;
            const matchBg = matchPercent !== null
              ? matchPercent >= 75 ? "bg-emerald-700" : matchPercent >= 40 ? "bg-amber-500" : "bg-gray-400"
              : "";
            const initial = job.company?.[0]?.toUpperCase() ?? "?";
            const avatarColors = ["bg-rose-100 text-rose-600","bg-violet-100 text-violet-600","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-600","bg-sky-100 text-sky-600"];
            const avatarColor = avatarColors[initial.charCodeAt(0) % avatarColors.length];
            const normalizedUser = (userSkills ?? []).map((s) => s.toLowerCase());
            const isClosed = job.status === "closed";
            const workLabel = job.work_type === "onsite" ? "On-site" : job.work_type ? job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1) : null;
            const empLabel = job.employment_type ? job.employment_type.replace("_", "-").replace(/^./, (c: string) => c.toUpperCase()) : null;

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,74,46,0.04)] hover:shadow-[0_8px_30px_rgba(15,74,46,0.1)] transition-all group flex flex-col">
                {/* Top: avatar + title + match circle */}
                <div className="flex items-start gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${avatarColor}`}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">{job.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {job.company}{[job.city, job.state, job.country].filter(Boolean).length > 0 && ` · ${[job.city, job.state, job.country].filter(Boolean).join(", ")}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {workLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{workLabel}</span>
                      )}
                      {empLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{empLabel}</span>
                      )}
                      {isClosed && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Closed</span>
                      )}
                      {applied && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">Applied</span>
                      )}
                    </div>
                  </div>
                  {matchPercent !== null && (
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${matchBg}`}>
                      {matchPercent}%
                    </div>
                  )}
                </div>

                {/* Skills */}
                {job.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.required_skills.map((skill: string) => (
                      <Badge key={skill} label={skill}
                        variant={userSkills ? (normalizedUser.includes(skill.toLowerCase()) ? "matched" : "missing") : "default"}
                      />
                    ))}
                  </div>
                )}

                {/* Bottom: salary + apply */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                  <span className="text-sm font-bold text-gray-900">{salary ?? ""}</span>
                  <span className="bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg group-hover:bg-emerald-800 transition-colors">
                    View Job →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
