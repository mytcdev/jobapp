"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";
import { calculateMatchScore } from "@/lib/matching";

interface Job {
  id: string;
  title: string;
  company: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  required_skills?: string[];
  work_type?: string | null;
  employment_type?: string | null;
  created_at?: string | null;
}

interface Category { id: string; name: string; slug: string }

interface Props {
  initialJobs: Job[];
  categories: Category[];
  userSkills: string[] | null;
}

function formatSalary(min?: number | null, max?: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function timeAgo(date?: string | null) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-600", "bg-violet-100 text-violet-600",
  "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-600",
  "bg-sky-100 text-sky-600",
];

function JobCard({ job, userSkills }: { job: Job; userSkills: string[] | null }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency ?? "USD");
  const initial = job.company?.[0]?.toUpperCase() ?? "?";
  const avatarColor = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
  const matchPercent = userSkills ? calculateMatchScore(userSkills, job.required_skills ?? []) : null;
  const matchBg = matchPercent !== null
    ? matchPercent >= 75 ? "bg-emerald-700" : matchPercent >= 40 ? "bg-amber-500" : "bg-gray-400"
    : "";
  const location = [job.city, job.country].filter(Boolean).join(", ");
  const workLabel = job.work_type === "onsite" ? "On-site" : job.work_type ? job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1) : null;
  const empLabel = job.employment_type ? job.employment_type.replace("_", "-").replace(/^./, (c) => c.toUpperCase()) : null;
  const normalizedUser = (userSkills ?? []).map((s) => s.toLowerCase());

  return (
    <Link href={`/jobs/${job.id}`}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgba(15,74,46,0.05)] hover:shadow-[0_8px_30px_rgba(15,74,46,0.12)] transition-all flex flex-col gap-4 group h-full">

      {/* Header: avatar + company + match circle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${avatarColor}`}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{job.company}</p>
            {location && <p className="text-xs text-gray-400 truncate mt-0.5">{location}</p>}
          </div>
        </div>
        {matchPercent !== null && (
          <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${matchBg}`}>
            {matchPercent}%
          </div>
        )}
      </div>

      {/* Title + work type */}
      <div>
        <h3 className="font-bold text-base leading-snug line-clamp-2 text-gray-900 group-hover:text-emerald-700 transition-colors">
          {job.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {workLabel && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{workLabel}</span>
          )}
          {empLabel && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{empLabel}</span>
          )}
          {job.created_at && (
            <span className="text-xs text-gray-400">{timeAgo(job.created_at)}</span>
          )}
        </div>
      </div>

      {/* Skills */}
      {job.required_skills && job.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {job.required_skills.slice(0, 5).map((s) => (
            <Badge key={s} label={s}
              variant={userSkills ? (normalizedUser.includes(s.toLowerCase()) ? "matched" : "missing") : "default"}
            />
          ))}
        </div>
      )}

      {/* Footer: salary + apply button */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-sm font-bold text-gray-900">{salary ?? ""}</span>
        <span className="bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg group-hover:bg-emerald-800 transition-colors shrink-0">
          Apply →
        </span>
      </div>
    </Link>
  );
}

export default function HomeJobsSection({ initialJobs, categories, userSkills }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [catJobs, setCatJobs] = useState<Record<string, Job[]>>({});
  const [loading, setLoading] = useState(false);

  async function selectCategory(slug: string | null) {
    setActiveSlug(slug);
    if (!slug || catJobs[slug]) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?category=${slug}`);
      if (res.ok) {
        const { jobs } = await res.json();
        setCatJobs((prev) => ({ ...prev, [slug]: jobs }));
      }
    } finally {
      setLoading(false);
    }
  }

  const displayJobs = activeSlug && catJobs[activeSlug] ? catJobs[activeSlug] : initialJobs;

  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold">Jobs of the Day</h2>
        <p className="text-gray-500 mt-1 text-sm">Search and connect with the right candidates faster</p>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8 sm:flex-wrap sm:justify-center">
          <button
            onClick={() => selectCategory(null)}
            className={`shrink-0 text-sm px-4 py-2 rounded-full border font-semibold transition-colors ${
              !activeSlug ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button key={cat.id}
              onClick={() => selectCategory(cat.slug)}
              className={`shrink-0 text-sm px-4 py-2 rounded-full border font-semibold transition-colors ${
                activeSlug === cat.slug ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-5 h-56 animate-pulse" />
          ))}
        </div>
      ) : displayJobs.length === 0 ? (
        <p className="text-center text-gray-500">No jobs found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayJobs.slice(0, 9).map((job) => (
            <JobCard key={job.id} job={job} userSkills={userSkills} />
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <Link href="/jobs"
          className="inline-block border border-emerald-700 text-emerald-700 px-8 py-3 rounded-full text-sm font-semibold hover:bg-emerald-50 transition-colors">
          Browse All Jobs →
        </Link>
      </div>
    </section>
  );
}
