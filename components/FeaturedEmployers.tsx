"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";

interface Job {
  id: string;
  title: string;
  work_type?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  required_skills?: string[] | null;
  city?: string | null;
  country?: string | null;
}

export interface FeaturedClient {
  id: string;
  company_name: string;
  company_logo?: string | null;
  industry?: string | null;
  short_description?: string | null;
  total_jobs: number;
  jobs: Job[];
}

function formatSalary(min?: number | null, max?: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function FeaturedEmployers({ clients }: { clients: FeaturedClient[] }) {
  const [current, setCurrent] = useState(0);

  if (clients.length === 0) return null;

  const client = clients[current];
  const initial = client.company_name[0]?.toUpperCase() ?? "?";

  function prev() { setCurrent((c) => (c - 1 + clients.length) % clients.length); }
  function next() { setCurrent((c) => (c + 1) % clients.length); }

  return (
    <section className="py-10 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold px-3 py-1 rounded-full mb-2">
            🔥 Featured Employer
          </span>
          <div className="flex items-center gap-3 mt-1">
            {client.company_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.company_logo} alt={client.company_name}
                className="w-10 h-10 rounded-lg border object-contain bg-white p-0.5 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center font-bold text-emerald-700 text-lg shrink-0">
                {initial}
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F4A2E] leading-tight">
                {client.company_name} — Now Hiring
              </h2>
              {client.industry && (
                <p className="text-xs text-gray-400 mt-0.5">{client.industry}</p>
              )}
            </div>
          </div>
          {client.short_description && (
            <p className="text-gray-500 text-sm mt-2 max-w-xl">{client.short_description}</p>
          )}
        </div>

        <Link href={`/company/${client.id}`}
          className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#0F4A2E] hover:text-emerald-800 transition-colors shrink-0 mt-1">
          See all roles →
        </Link>
      </div>

      {/* Job cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {client.jobs.map((job) => {
          const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency ?? "USD");
          const workLabel = job.work_type === "onsite" ? "On-site"
            : job.work_type ? job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1) : null;
          const empLabel = job.employment_type ? job.employment_type.replace("_", "-").replace(/^./, (c) => c.toUpperCase()) : null;
          const location = [job.city, job.country].filter(Boolean).join(", ");

          return (
            <Link key={job.id} href={`/jobs/${job.id}`}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,74,46,0.05)] hover:shadow-[0_8px_30px_rgba(15,74,46,0.12)] transition-all group flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {client.company_logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={client.company_logo} alt={client.company_name}
                    className="w-9 h-9 rounded-lg border object-contain bg-white p-0.5 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center font-bold text-emerald-700 shrink-0">
                    {initial}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                    {job.title}
                  </h3>
                  {location && <p className="text-xs text-gray-400 mt-0.5">{location}</p>}
                </div>
              </div>

              {(job.required_skills?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.required_skills!.slice(0, 4).map((s) => (
                    <Badge key={s} label={s} />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-2">
                  {workLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {workLabel}
                    </span>
                  )}
                  {empLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                      {empLabel}
                    </span>
                  )}
                </div>
                {salary && <span className="text-sm font-bold text-gray-900">{salary}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer: more link + slider controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href={`/company/${client.id}`}
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
          More jobs from {client.company_name}
          {client.total_jobs > 3 && ` (${client.total_jobs} total)`} →
        </Link>

        {clients.length > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={prev}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg leading-none">
              ‹
            </button>
            {clients.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-emerald-700" : "bg-gray-200 hover:bg-gray-300"}`} />
            ))}
            <button onClick={next}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg leading-none">
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
