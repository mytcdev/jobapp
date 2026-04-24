"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";
import MatchBar from "@/components/MatchBar";
import { calculateMatchScore } from "@/lib/matching";

interface Job {
  id: number;
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
}

interface Props {
  initialJobs: Job[];
  total: number;
  userSkills: string[] | null;
}

const PAGE_SIZE = 10;

function formatSalary(min?: number | null, max?: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function JobCard({ job, matchPercent }: { job: Job; matchPercent: number | null }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency ?? "USD");
  const isMatched = matchPercent !== null && matchPercent > 0;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`block border rounded-xl p-5 hover:shadow-md transition-shadow ${
        isMatched
          ? "bg-blue-50 border-blue-200"
          : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-base leading-snug">{job.title}</h3>
          <p className="text-gray-500 text-sm mt-0.5">
            {job.company}
            {[job.city, job.state, job.country].filter(Boolean).length > 0 && (
              <> &middot; {[job.city, job.state, job.country].filter(Boolean).join(", ")}</>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {salary && <div className="text-sm text-gray-600 whitespace-nowrap">{salary}</div>}
          {job.work_type && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {job.work_type === "onsite"
                ? "On-site"
                : job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1)}
            </span>
          )}
        </div>
      </div>

      {matchPercent !== null && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">Your match</p>
          <MatchBar percent={matchPercent} />
        </div>
      )}

      {job.required_skills && job.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.required_skills.map((skill) => (
            <Badge key={skill} label={skill} />
          ))}
        </div>
      )}
    </Link>
  );
}

export default function HomeJobFeed({ initialJobs, total, userSkills }: Props) {
  const [allJobs, setAllJobs] = useState<Job[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const hasMore = allJobs.length < total;

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/feed?offset=${allJobs.length}&limit=${PAGE_SIZE}`);
      const { jobs } = await res.json();
      setAllJobs((prev) => [...prev, ...jobs]);
    } finally {
      setLoading(false);
    }
  }, [allJobs.length]);

  // Split into matched (score > 0) and regular, preserving order within each group
  const withScores = allJobs.map((job) => ({
    job,
    score: userSkills ? calculateMatchScore(userSkills, job.required_skills ?? []) : null,
  }));

  const matched = withScores.filter((j) => j.score !== null && j.score > 0);
  const regular = withScores.filter((j) => j.score === null || j.score === 0);

  return (
    <div className="w-full max-w-2xl text-left">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Latest Jobs</h2>
        <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-800">
          View all →
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {matched.length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Matched for you
            </p>
            {matched.map(({ job, score }) => (
              <JobCard key={job.id} job={job} matchPercent={score} />
            ))}
            {regular.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-2">
                More listings
              </p>
            )}
          </>
        )}

        {regular.map(({ job, score }) => (
          <JobCard key={job.id} job={job} matchPercent={score} />
        ))}
      </div>

      {allJobs.length === 0 && (
        <p className="text-gray-500 text-sm">No jobs posted yet.</p>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="border px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
