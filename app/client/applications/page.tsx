export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-amber-100 text-amber-700",
  viewed:      "bg-blue-100 text-blue-700",
  shortlisted: "bg-indigo-100 text-indigo-700",
  interview:   "bg-purple-100 text-purple-700",
  offer:       "bg-green-100 text-green-700",
  declined:    "bg-red-100 text-red-500",
  expired:     "bg-gray-100 text-gray-400",
};

export default async function ClientApplicationsPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/client");

  const db = getSupabase();

  const { data: jobs } = await db
    .from("jobs")
    .select("id, title, status")
    .eq("owner_id", session.user.staffId)
    .order("created_at", { ascending: false });

  const jobIds = jobs?.map((j) => j.id) ?? [];

  if (!jobIds.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Applications</h1>
        <p className="text-gray-500">No jobs yet. Create a job to start receiving applications.</p>
      </div>
    );
  }

  const { data: applications } = await db
    .from("applications")
    .select("id, job_id, status")
    .in("job_id", jobIds);

  // Group counts by job
  const countsByJob = new Map<string, Record<string, number>>();
  for (const app of applications ?? []) {
    const counts = countsByJob.get(app.job_id) ?? {};
    counts[app.status] = (counts[app.status] ?? 0) + 1;
    countsByJob.set(app.job_id, counts);
  }

  const jobsWithApps = (jobs ?? []).map((j) => ({
    ...j,
    counts: countsByJob.get(j.id) ?? {},
    total: Object.values(countsByJob.get(j.id) ?? {}).reduce((a, b) => a + b, 0),
    pending: countsByJob.get(j.id)?.pending ?? 0,
  }));

  const totalApps   = applications?.length ?? 0;
  const totalPending = jobsWithApps.reduce((s, j) => s + j.pending, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalApps} total
            {totalPending > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-semibold">
                · {totalPending} unreviewed
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {jobsWithApps.map((job) => {
          const statusEntries = Object.entries(job.counts).filter(([, n]) => n > 0);
          return (
            <Link
              key={job.id}
              href={`/client/applications/${job.id}`}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,74,46,0.04)] hover:shadow-[0_8px_30px_rgba(15,74,46,0.1)] transition-all group flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                    {job.title}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {job.status === "closed" ? "Closed" : "Active"} · {job.total} application{job.total !== 1 ? "s" : ""}
                  </p>
                </div>
                {job.pending > 0 && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {job.pending} new
                  </span>
                )}
              </div>

              {/* Status breakdown */}
              {statusEntries.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {statusEntries.map(([status, count]) => (
                    <span
                      key={status}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)} · {count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No applications yet</p>
              )}

              <p className="text-xs font-semibold text-emerald-700 group-hover:text-emerald-900 mt-auto">
                View applications →
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
