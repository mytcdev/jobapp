export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";

function formatSalary(min?: number | null, max?: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await supabase
    .from("staff_accounts")
    .select("company_name, short_description")
    .eq("id", params.id)
    .single();
  if (!data?.company_name) return {};
  return {
    title: `${data.company_name} — Open Positions`,
    description: data.short_description ?? `Browse open jobs at ${data.company_name}.`,
  };
}

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const [{ data: company }, { data: jobs }] = await Promise.all([
    supabase
      .from("staff_accounts")
      .select("id, company_name, company_logo, industry, company_size, founded_year, company_url, short_description, company_address, contact_email, company_website")
      .eq("id", params.id)
      .single(),
    supabase
      .from("jobs")
      .select("id, title, work_type, employment_type, salary_min, salary_max, salary_currency, required_skills, city, state, country, created_at")
      .eq("owner_id", params.id)
      .in("status", ["published", "closed"])
      .order("created_at", { ascending: false }),
  ]);

  if (!company?.company_name) notFound();

  const initial = company.company_name[0]?.toUpperCase() ?? "?";
  const allJobs = jobs ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Company hero card ───────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgba(15,74,46,0.05)] mb-8">
        <div className="flex items-start gap-5 mb-6">
          {company.company_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.company_logo} alt={company.company_name}
              className="w-20 h-20 rounded-xl border object-contain bg-white p-1 shrink-0 shadow-sm" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-emerald-50 flex items-center justify-center font-bold text-emerald-700 text-3xl shrink-0">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F4A2E] leading-tight">{company.company_name}</h1>
            {company.industry && (
              <p className="text-gray-500 text-sm mt-1">{company.industry}</p>
            )}
            {company.short_description && (
              <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-2xl">{company.short_description}</p>
            )}
          </div>
        </div>

        {/* Company details grid */}
        {(company.company_size || company.founded_year || company.company_address || company.contact_email) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-gray-100">
            {company.company_size && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Company Size</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{company.company_size}</p>
              </div>
            )}
            {company.founded_year && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Founded</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{company.founded_year}</p>
              </div>
            )}
            {company.company_address && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{company.company_address}</p>
              </div>
            )}
            {company.contact_email && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Contact</p>
                <a href={`mailto:${company.contact_email}`}
                  className="text-sm font-semibold text-emerald-700 hover:underline mt-1 block truncate">
                  {company.contact_email}
                </a>
              </div>
            )}
          </div>
        )}

        {(company.company_url || company.company_website) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={company.company_url ?? company.company_website ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Visit Company Website
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M10 2h4m0 0v4m0-4L7 9" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* ── Open positions ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          Open Positions
          <span className="ml-2 text-sm font-medium text-gray-400">({allJobs.length})</span>
        </h2>
        <Link href="/jobs" className="text-sm text-emerald-700 hover:text-emerald-900 font-semibold">
          Browse all jobs →
        </Link>
      </div>

      {allJobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">No open positions at the moment.</p>
          <p className="text-sm mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {allJobs.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
            const workLabel = job.work_type === "onsite" ? "On-site"
              : job.work_type ? job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1) : null;
            const empLabel = (job as any).employment_type ? (job as any).employment_type.replace("_", "-").replace(/^./, (c: string) => c.toUpperCase()) : null;
            const location = [job.city, job.state, job.country].filter(Boolean).join(", ");

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,74,46,0.04)] hover:shadow-[0_8px_30px_rgba(15,74,46,0.1)] transition-all group flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">
                      {job.title}
                    </h3>
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
                    {job.required_skills!.map((s: string) => <Badge key={s} label={s} />)}
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
