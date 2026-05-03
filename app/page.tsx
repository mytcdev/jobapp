import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import JobSearchForm from "@/components/JobSearchForm";
import HomeJobsSection from "@/components/HomeJobsSection";
import FeaturedEmployers, { type FeaturedClient } from "@/components/FeaturedEmployers";
import WhyKareerHub from "@/components/WhyKareerHub";

export const metadata: Metadata = {
  title: "Find Your Next Role",
  description: "Search thousands of jobs with smart skill matching. Sign in to see your exact match percentage for every position.",
};

export default async function Home() {
  const session = await getServerSession(getAuthOptions());

  let userSkills: string[] | null = null;
  if (session?.user?.id) {
    const { data } = await supabase.from("users").select("skills").eq("id", session.user.id).single();
    userSkills = data?.skills ?? null;
  }

  const [{ data: jobs, count }, { data: allCategories }, { data: featuredStaff }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, company, city, state, country, salary_min, salary_max, salary_currency, required_skills, work_type, employment_type, created_at", { count: "exact" })
      .eq("status", "published")
      .order("id", { ascending: false })
      .limit(9),
    supabase
      .from("categories")
      .select("id, name, slug, job_categories(job_id, jobs!inner(status))")
      .order("name"),
    supabase
      .from("staff_accounts")
      .select("id, company_name, company_logo, industry, short_description")
      .eq("featured", true)
      .not("company_name", "is", null),
  ]);

  const featuredIds = (featuredStaff ?? []).map((s) => s.id);
  let featuredClients: FeaturedClient[] = [];
  if (featuredIds.length > 0) {
    const { data: featuredJobs } = await supabase
      .from("jobs")
      .select("id, title, work_type, employment_type, salary_min, salary_max, salary_currency, required_skills, city, country, owner_id")
      .in("owner_id", featuredIds)
      .eq("status", "published");

    const jobsByOwner = new Map<string, typeof featuredJobs>();
    for (const job of featuredJobs ?? []) {
      const list = jobsByOwner.get(job.owner_id) ?? [];
      list.push(job);
      jobsByOwner.set(job.owner_id, list);
    }

    featuredClients = (featuredStaff ?? [])
      .map((s) => {
        const ownerJobs = jobsByOwner.get(s.id) ?? [];
        return {
          id: s.id,
          company_name: s.company_name!,
          company_logo: s.company_logo,
          industry: s.industry,
          short_description: s.short_description,
          total_jobs: ownerJobs.length,
          jobs: ownerJobs.slice(0, 3),
        };
      })
      .filter((c) => c.total_jobs > 0);
  }

  const categories = (allCategories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    count: (cat.job_categories as unknown as { jobs: { status: string } }[])
      .filter((jc) => jc.jobs?.status === "published").length,
  })).filter((c) => c.count > 0);

  const totalJobs = count ?? 0;

  return (
    <div>
      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <section
        className="rounded-[24px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 md:p-12 border border-emerald-100 mb-6"
        style={{ background: "radial-gradient(120% 60% at 0% 0%, rgba(15,74,46,0.06), transparent 60%), radial-gradient(120% 60% at 100% 100%, rgba(229,57,53,0.06), transparent 60%)" }}
      >
        {/* Left pane */}
        <div className="flex flex-col gap-5">
          <span className="inline-flex items-center gap-2 self-start bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            Your Trusted Partner for Career Success
          </span>
          <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-[#00321c]">
            Smarter Matching.<br />
            <span style={{ color: "#E53935" }}>Better</span>{" "}
            <span style={{ color: "#F57C00" }}>Careers.</span>
          </h1>
          <p className="text-lg text-[#404942] max-w-xl leading-relaxed">
            Jobs that match your skills — not just your keywords. We connect talent with opportunities and empower you to build a better future.
          </p>
          <div className="bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgba(15,74,46,0.08)] border border-gray-200">
            <JobSearchForm variant="hero" />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#404942]">
              <span className="font-semibold">Popular:</span>
              {categories.slice(0, 4).map((cat, i) => (
                <span key={cat.id} className="flex items-center gap-2">
                  {i > 0 && <span>•</span>}
                  <Link href={`/jobs?category=${cat.slug}`}
                    className="hover:text-emerald-700 underline-offset-2 hover:underline">
                    {cat.name}
                  </Link>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right pane: promo image — stacks below on mobile, side-by-side on lg */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/promo-career-success.jpg"
            alt="Your Trusted Partner for Career Success"
            className="w-full h-auto rounded-2xl shadow-[0_8px_30px_rgba(15,74,46,0.08)] border border-emerald-100 block"
          />
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-[0_8px_30px_rgba(15,74,46,0.08)] border border-emerald-100 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-slate-500">Trusted by</div>
              <div className="text-sm font-bold text-emerald-900">240+ employers</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Value-prop cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          {
            path: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z",
            title: "Find Opportunities",
            desc: "Browse thousands of curated roles matched to your skills and experience.",
          },
          {
            path: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
            title: "Smart Matching",
            desc: "AI-powered skill analysis shows your match percentage for every job.",
          },
          {
            path: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
            title: "Quick Apply",
            desc: "One-click applications with your saved resume. Never miss a deadline.",
          },
        ].map(({ path, title, desc }) => (
          <div key={title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,74,46,0.04)] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={path} />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Featured Employers ──────────────────────────────────────────── */}
      <FeaturedEmployers clients={featuredClients} />

      {/* ── Why KareerHub ───────────────────────────────────────────────── */}
      <WhyKareerHub />

      {/* ── Browse by Category ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-10">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold">Browse by Category</h2>
            <p className="text-gray-500 mt-1 text-sm">Find the job that&apos;s perfect for you — {totalJobs} new jobs available</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/jobs?category=${cat.slug}`}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-[0_4px_20px_rgba(15,74,46,0.04)] hover:shadow-[0_8px_30px_rgba(15,74,46,0.1)] hover:border-emerald-200 transition-all flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex items-center justify-center text-emerald-700 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.count} Job{cat.count !== 1 ? "s" : ""} Available</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Jobs of the Day ──────────────────────────────────────────────── */}
      <HomeJobsSection
        initialJobs={jobs ?? []}
        categories={categories}
        userSkills={userSkills}
      />

      {/* ── Hiring Banner ────────────────────────────────────────────────── */}
      <section className="rounded-3xl overflow-hidden relative mt-4 mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lifestyle-team-cheering.jpg"
          alt="Team celebrating"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-emerald-900/75" />
        <div className="relative z-10 px-8 py-14 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-2">We Are Hiring</p>
            <p className="text-4xl sm:text-5xl font-extrabold text-white leading-none">Your Dream<br />Job Awaits</p>
            <p className="text-emerald-200 mt-3">Let&apos;s Work Together &amp; Explore Opportunities</p>
          </div>
          <Link href="/jobs"
            className="shrink-0 bg-white text-emerald-900 px-8 py-3.5 rounded-full font-bold hover:bg-emerald-50 transition-colors shadow-sm text-sm">
            Browse Jobs →
          </Link>
        </div>
      </section>
    </div>
  );
}
