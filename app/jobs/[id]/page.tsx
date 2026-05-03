export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { calculateMatchScore } from "@/lib/matching";
import Badge from "@/components/Badge";
import MatchCircle from "@/components/MatchCircle";
import ApplyButton from "./ApplyButton";
import SaveJobButton from "./SaveJobButton";
import ShareJobButton from "./ShareJobButton";
import ReportJobButton from "./ReportJobButton";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data: job } = await supabase
    .from("jobs")
    .select("title, company, description, country")
    .eq("id", params.id)
    .single();
  if (!job) return {};
  const location = [job.company, job.country].filter(Boolean).join(" · ");
  const desc = (job.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: job.title,
    description: desc,
    openGraph: {
      title: job.title,
      description: desc,
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [jobResult, session, relatedResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.id).single(),
    getServerSession(getAuthOptions()),
    supabase
      .from("jobs")
      .select("id, title, company, city, state, country, required_skills, work_type, salary_min, salary_max, salary_currency")
      .eq("status", "published")
      .neq("id", params.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (jobResult.error || !jobResult.data) notFound();
  const job = jobResult.data;

  // Fetch company profile from owner's account if job has an owner
  let companyLogo: string | null = null;
  let companyProfile: {
    industry?: string | null;
    company_size?: string | null;
    founded_year?: number | null;
    company_url?: string | null;
    short_description?: string | null;
    featured?: boolean | null;
  } | null = null;
  if (job.owner_id) {
    const { data: owner } = await supabase
      .from("staff_accounts")
      .select("company_logo, industry, company_size, founded_year, company_url, short_description, featured")
      .eq("id", job.owner_id)
      .single();
    companyLogo = owner?.company_logo ?? null;
    if (owner) companyProfile = owner;
  }

  // Score related jobs by skill overlap + same-country bonus
  const jobSkills: string[] = job.required_skills ?? [];
  const related = (relatedResult.data ?? [])
    .map((r) => {
      const overlap = (r.required_skills ?? []).filter((s: string) => jobSkills.includes(s)).length;
      const countryBonus = r.country === job.country ? 1 : 0;
      return { ...r, _score: overlap * 2 + countryBonus };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  // If signed in, fetch user data + check if already applied
  let matchPercent: number | null = null;
  let applicationStatus: string | null = null;
  let hasUploaded = false;
  let hasGenerated = false;
  let activeResumeType: "uploaded" | "generated" | null = null;
  let userSkills: string[] | null = null;
  let isSaved = false;

  if (session) {
    const [userResult, appResult, savedResult] = await Promise.all([
      supabase
        .from("users")
        .select("skills, onboarding_complete, resume_path, generated_resume_path, active_resume_type")
        .eq("id", session.user.id)
        .single(),
      supabase
        .from("applications")
        .select("id, status")
        .eq("job_id", job.id)
        .eq("user_id", session.user.id)
        .single(),
      supabase
        .from("saved_jobs")
        .select("id")
        .eq("job_id", job.id)
        .eq("user_id", session.user.id)
        .single(),
    ]);

    if (userResult.data) {
      if (!userResult.data.onboarding_complete) {
        redirect(`/onboarding?from=/jobs/${params.id}`);
      }
      userSkills = userResult.data.skills ?? null;
      matchPercent = calculateMatchScore(
        userSkills ?? [],
        job.required_skills ?? [],
      );
      hasUploaded = !!userResult.data.resume_path;
      hasGenerated = !!userResult.data.generated_resume_path;
      activeResumeType = userResult.data.active_resume_type ?? null;
    }
    applicationStatus = appResult.data?.status ?? null;
    isSaved = !!savedResult.data;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description ?? "",
    hiringOrganization: { "@type": "Organization", name: job.company },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city ?? undefined,
        addressRegion: job.state ?? undefined,
        addressCountry: job.country ?? undefined,
      },
    },
    ...(job.work_type === "remote" ? { jobLocationType: "TELECOMMUTE" } : {}),
    ...(job.salary_min
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salary_currency ?? "USD",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary_min,
              maxValue: job.salary_max ?? undefined,
              unitText: "YEAR",
            },
          },
        }
      : {}),
    datePosted: new Date().toISOString().split("T")[0],
    employmentType: job.work_type?.toUpperCase() ?? undefined,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0">
      <div className="mb-6">
        {/* Company identity */}
        {job.company && (
          <div className="flex items-center gap-3 mb-3">
            {companyLogo ? (
              <img src={companyLogo} alt={job.company} className="w-12 h-12 rounded-lg object-contain border bg-white p-1 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg shrink-0">
                {job.company[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{job.company}</p>
              <p className="text-sm text-gray-500">{[job.city, job.state, job.country].filter(Boolean).join(", ")}</p>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold">{job.title}</h1>
        {!job.company && (
          <p className="text-gray-500 mt-1">{[job.city, job.state, job.country].filter(Boolean).join(", ")}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {job.work_type && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {job.work_type === "onsite" ? "On-site" : job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1)}
            </span>
          )}
          {job.employment_type && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              {job.employment_type.replace("_", "-").replace(/^./, (c: string) => c.toUpperCase())}
            </span>
          )}
          {job.status === "closed" && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 font-semibold">
              Applications Closed
            </span>
          )}
          {job.accepted_nationality && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
              Open to citizens of {job.accepted_nationality}
            </span>
          )}
        </div>

        {(job.salary_min || job.salary_max) && (
          <p className="text-gray-700 mt-1 font-medium">
            {job.salary_min && job.salary_max
              ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`
              : job.salary_min
              ? `From $${job.salary_min.toLocaleString()}`
              : `Up to $${job.salary_max!.toLocaleString()}`}
          </p>
        )}
      </div>

      {job.required_skills?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 shadow-[0_4px_20px_rgba(15,74,46,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Skills Analysis</h2>
            {matchPercent !== null && <MatchCircle percent={matchPercent} />}
          </div>

          {userSkills ? (() => {
            const normalizedUser = userSkills.map((s) => s.toLowerCase());
            const matched = job.required_skills.filter((s: string) => normalizedUser.includes(s.toLowerCase()));
            const missing = job.required_skills.filter((s: string) => !normalizedUser.includes(s.toLowerCase()));
            const matchBoost = missing.length > 0
              ? Math.round((1 / job.required_skills.length) * 100)
              : 0;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strong Match panel */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Strong Match</p>
                      <p className="text-xs text-gray-600">Skills you already have</p>
                    </div>
                  </div>
                  {matched.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {matched.map((s: string) => <Badge key={s} label={s} variant="matched" />)}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No direct skill matches yet.</p>
                  )}
                </div>

                {/* Growth Path panel */}
                {missing.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                          <path d="M8 3v10M8 3l-3 3M8 3l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Growth Path</p>
                        <p className="text-xs text-gray-600">Skills to develop</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {missing.map((s: string) => <Badge key={s} label={s} variant="missing" />)}
                    </div>
                    <p className="text-xs text-amber-800 bg-white/60 rounded-lg p-2 border border-amber-100">
                      <span className="font-bold">Pro tip:</span> Adding these could boost your match by up to{" "}
                      <span className="font-bold">{matchBoost}%</span> per skill.
                    </p>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.map((skill: string) => (
                <Badge key={skill} label={skill} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-semibold mb-2">About the Role</h2>
        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: job.description ?? "" }}
        />
      </div>

      {job.requirements?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 shadow-[0_4px_20px_rgba(15,74,46,0.05)]">
          <h2 className="font-bold text-gray-900 mb-4">Requirements</h2>
          <ul className="space-y-2">
            {job.requirements.map((req: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {job.status === "closed" ? (
          <div className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold text-sm cursor-not-allowed select-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Applications Closed
          </div>
        ) : (
          <>
            <ApplyButton
              jobId={job.id}
              isSignedIn={!!session}
              applicationStatus={applicationStatus}
              hasUploaded={hasUploaded}
              hasGenerated={hasGenerated}
              activeResumeType={activeResumeType}
            />
            <SaveJobButton jobId={job.id} isSignedIn={!!session} initialSaved={isSaved} />
          </>
        )}
        <ShareJobButton
          title={job.title}
          company={job.company ?? ""}
          jobUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/jobs/${job.id}`}
        />
      </div>
      {session && !session.user.staffId && (
        <div className="mt-3">
          <ReportJobButton jobId={job.id} />
        </div>
      )}
      </div>{/* end main */}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">

        {/* Company card */}
        {job.company && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_4px_20px_rgba(15,74,46,0.05)]">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
              {companyLogo ? (
                <img src={companyLogo} alt={job.company} className="w-12 h-12 rounded-lg border object-contain bg-white p-0.5 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                  {job.company[0].toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{job.company}</h3>
                {companyProfile?.featured && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 2.5l1 2 2.5.5-1.8 1.7.4 2.3L5 8l-2.1 1 .4-2.3L1.5 5l2.5-.5z" />
                    </svg>
                    Verified Employer
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 text-sm mb-4">
              {companyProfile?.industry && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Industry</span>
                  <span className="font-medium text-gray-800">{companyProfile.industry}</span>
                </div>
              )}
              {companyProfile?.company_size && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Company Size</span>
                  <span className="font-medium text-gray-800">{companyProfile.company_size}</span>
                </div>
              )}
              {companyProfile?.founded_year && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Founded</span>
                  <span className="font-medium text-gray-800">{companyProfile.founded_year}</span>
                </div>
              )}
            </div>
            {companyProfile?.short_description && (
              <p className="text-xs text-gray-500 mb-3">{companyProfile.short_description}</p>
            )}
            {companyProfile?.company_url && (
              <a href={companyProfile.company_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline">
                View Company Profile
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M10 2h4m0 0v4m0-4L7 9" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Related jobs */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(15,74,46,0.05)]">
          <h2 className="font-bold text-xs uppercase tracking-wider text-gray-500 px-4 py-3 border-b border-gray-100">Related Jobs</h2>
          {related.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-4">No related jobs found.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {related.map((r) => (
                <Link key={r.id} href={`/jobs/${r.id}`} className="block px-4 py-3 hover:bg-emerald-50 transition-colors group">
                  <p className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.company}</p>
                  {[r.city, r.country].filter(Boolean).length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{[r.city, r.country].filter(Boolean).join(", ")}</p>
                  )}
                  {r.work_type && (
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {r.work_type === "onsite" ? "On-site" : r.work_type.charAt(0).toUpperCase() + r.work_type.slice(1)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
          <div className="px-4 py-3 border-t border-gray-100">
            <Link href="/jobs" className="text-sm text-emerald-700 hover:text-emerald-900 font-semibold">
              See all jobs →
            </Link>
          </div>
        </div>
      </aside>
      </div>{/* end flex row */}
    </div>
  );
}
