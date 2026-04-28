export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { calculateMatchScore } from "@/lib/matching";
import Badge from "@/components/Badge";
import MatchBar from "@/components/MatchBar";
import ApplyButton from "./ApplyButton";

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
    title: `${job.title}${job.company ? ` at ${job.company}` : ""}`,
    description: desc,
    openGraph: {
      title: `${job.title}${job.company ? ` at ${job.company}` : ""}`,
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

  if (session) {
    const [userResult, appResult] = await Promise.all([
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
    ]);

    if (userResult.data) {
      if (!userResult.data.onboarding_complete) {
        redirect(`/onboarding?from=/jobs/${params.id}`);
      }
      matchPercent = calculateMatchScore(
        userResult.data.skills ?? [],
        job.required_skills ?? [],
      );
      hasUploaded = !!userResult.data.resume_path;
      hasGenerated = !!userResult.data.generated_resume_path;
      activeResumeType = userResult.data.active_resume_type ?? null;
    }
    applicationStatus = appResult.data?.status ?? null;
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
    <div className="max-w-5xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{job.title}{job.company ? ` at ${job.company}` : ""}</h1>
        <p className="text-gray-500 mt-1">
          {job.company} &middot; {[job.city, job.state, job.country].filter(Boolean).join(", ")}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {job.work_type && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
              {job.work_type === "onsite" ? "On-site" : job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1)}
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

      {matchPercent !== null && (
        <div className="bg-white border rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500 mb-2">Your skill match</p>
          <MatchBar percent={matchPercent} />
        </div>
      )}

      {job.required_skills?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Required Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.required_skills.map((skill: string) => (
              <Badge key={skill} label={skill} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-semibold mb-2">About the Role</h2>
        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: job.description ?? "" }}
        />
      </div>

      <ApplyButton
        jobId={job.id}
        isSignedIn={!!session}
        applicationStatus={applicationStatus}
        hasUploaded={hasUploaded}
        hasGenerated={hasGenerated}
        activeResumeType={activeResumeType}
      />
      </div>{/* end main */}

      {/* ── Sidebar: related jobs ─────────────────────────────── */}
      <aside className="w-full lg:w-72 shrink-0">
        <div className="bg-white border rounded-xl overflow-hidden">
          <h2 className="font-semibold text-sm px-4 py-3 border-b">Related Jobs</h2>
          {related.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-4">No related jobs found.</p>
          ) : (
            <div className="divide-y">
              {related.map((r) => (
                <Link key={r.id} href={`/jobs/${r.id}`} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.company}</p>
                  {[r.city, r.country].filter(Boolean).length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{[r.city, r.country].filter(Boolean).join(", ")}</p>
                  )}
                  {r.work_type && (
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                      {r.work_type === "onsite" ? "On-site" : r.work_type.charAt(0).toUpperCase() + r.work_type.slice(1)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
          <div className="px-4 py-3 border-t">
            <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              See all jobs →
            </Link>
          </div>
        </div>
      </aside>
      </div>{/* end flex row */}
    </div>
  );
}
