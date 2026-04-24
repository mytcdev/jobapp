import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import JobSearchForm from "@/components/JobSearchForm";
import HomeJobFeed from "@/components/HomeJobFeed";

export const metadata: Metadata = {
  title: "Find Your Next Role",
  description: "Search thousands of jobs with smart skill matching. Sign in to see your exact match percentage for every position.",
  openGraph: {
    title: "Find Your Next Role",
    description: "Smart job portal with skill matching. Find the jobs where you'll actually succeed.",
  },
};

export default async function Home() {
  const session = await getServerSession(getAuthOptions());

  // Fetch user skills if logged in
  let userSkills: string[] | null = null;
  if (session?.user?.id) {
    const { data } = await supabase
      .from("users")
      .select("skills")
      .eq("id", session.user.id)
      .single();
    userSkills = data?.skills ?? null;
  }

  // Fetch initial 10 jobs + total count
  const { data: jobs, count } = await supabase
    .from("jobs")
    .select(
      "id, title, company, city, state, country, salary_min, salary_max, salary_currency, required_skills, work_type",
      { count: "exact" },
    )
    .eq("status", "published")
    .order("id", { ascending: false })
    .range(0, 9);

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-bold tracking-tight">Find your next role.</h1>
        <p className="text-gray-500 text-lg max-w-md">
          Skill matching surfaces the jobs where you&apos;ll actually succeed.
        </p>
      </div>

      <JobSearchForm variant="hero" />

      <div className="flex gap-3">
        <Link
          href="/profile"
          className="border px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Update Profile
        </Link>
      </div>

      <HomeJobFeed
        initialJobs={jobs ?? []}
        total={count ?? 0}
        userSkills={userSkills}
      />
    </div>
  );
}
