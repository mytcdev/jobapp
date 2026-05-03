export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

function StatCard({
  label,
  value,
  sub,
  href,
  iconBg,
  iconColor,
  icon,
}: {
  label: string;
  value: number;
  sub?: string;
  href: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <h4 className="text-2xl font-bold text-[#1C2434] leading-tight">{value}</h4>
      <p className="mt-1 text-sm font-medium text-[#64748B]">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-[#94A3B8]">{sub}</p>}
    </Link>
  );
}

export default async function ClientDashboard() {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/auth/signin");

  const db = getSupabase();
  const staffId = session.user.staffId;

  const [{ data: staff }, { data: jobs }] = await Promise.all([
    db.from("staff").select("company_name, company_logo_url, company_industry, company_description").eq("id", staffId).single(),
    db.from("jobs").select("id, title, status, created_at").eq("owner_id", staffId).order("created_at", { ascending: false }),
  ]);

  const jobIds = jobs?.map((j) => j.id) ?? [];
  const { data: applications } = jobIds.length
    ? await db.from("applications").select("id, job_id, status, created_at, users(name, email)").in("job_id", jobIds)
    : { data: [] };

  const jobList = jobs ?? [];
  const appList = applications ?? [];

  const totalJobs    = jobList.length;
  const activeJobs   = jobList.filter((j) => j.status === "published").length;
  const closedJobs   = jobList.filter((j) => j.status === "closed").length;
  const totalApps    = appList.length;
  const pendingApps  = appList.filter((a) => a.status === "pending").length;
  const inProgress   = appList.filter((a) => ["shortlisted", "interview", "offer"].includes(a.status)).length;

  const recentPending = appList
    .filter((a) => a.status === "pending")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentJobs = jobList.slice(0, 6);

  const pendingByJob = new Map<string, number>();
  for (const a of appList) {
    if (a.status === "pending") pendingByJob.set(a.job_id, (pendingByJob.get(a.job_id) ?? 0) + 1);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins  < 1)  return "just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="space-y-8">
      {/* Company hero */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm border-[#E2E8F0] flex items-start gap-5">
        {staff?.company_logo_url ? (
          <img
            src={staff.company_logo_url}
            alt={staff.company_name ?? "Logo"}
            className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-extrabold shrink-0">
            {staff?.company_name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
            {staff?.company_name ?? "Your Company"}
          </h1>
          {staff?.company_industry && (
            <p className="text-sm text-emerald-700 font-semibold mt-0.5">{staff.company_industry}</p>
          )}
          {staff?.company_description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{staff.company_description}</p>
          )}
        </div>
        <Link
          href="/client/profile"
          className="shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-200 rounded-xl px-3 py-1.5 transition-colors hover:bg-emerald-50"
        >
          Edit Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Jobs" value={totalJobs} sub={`${activeJobs} active`} href="/client/jobs"
          iconBg="#EFF4FB" iconColor="#3C50E0"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>}
        />
        <StatCard
          label="Applications" value={totalApps}
          sub={pendingApps > 0 ? `${pendingApps} unreviewed` : "all reviewed"}
          href="/client/applications"
          iconBg={pendingApps > 0 ? "#FEF3C7" : "#FFF3E0"} iconColor={pendingApps > 0 ? "#D97706" : "#F57C00"}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" /></svg>}
        />
        <StatCard
          label="In Progress" value={inProgress} sub="shortlisted · interview · offer" href="/client/applications"
          iconBg="#F0ECFF" iconColor="#7C3AED"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>}
        />
        <StatCard
          label="Closed Jobs" value={closedJobs} sub="no longer accepting" href="/client/jobs"
          iconBg="#FEE2E2" iconColor="#DC2626"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
        />
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Applications */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm border-[#E2E8F0] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">New Applications</h2>
            {pendingApps > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {pendingApps} unreviewed
              </span>
            )}
          </div>

          {recentPending.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No new applications.</p>
          ) : (
            <div className="space-y-3">
              {recentPending.map((app) => {
                const u = (Array.isArray(app.users) ? app.users[0] : app.users) as { name: string; email: string } | null;
                const job = jobList.find((j) => j.id === app.job_id);
                return (
                  <Link
                    key={app.id}
                    href={`/client/applications/${app.job_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {u?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u?.name ?? "Applicant"}</p>
                      <p className="text-xs text-gray-400 truncate">{job?.title ?? "Unknown job"}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(app.created_at)}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/client/applications"
            className="mt-auto text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            View all applications →
          </Link>
        </div>

        {/* My Jobs */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm border-[#E2E8F0] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">My Jobs</h2>
            <Link
              href="/client/jobs/new"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-200 rounded-xl px-3 py-1.5 transition-colors hover:bg-emerald-50"
            >
              + Post Job
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No jobs yet.</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => {
                const pending = pendingByJob.get(job.id) ?? 0;
                const statusColor =
                  job.status === "published" ? "bg-emerald-100 text-emerald-700" :
                  job.status === "closed"    ? "bg-red-50 text-red-500" :
                  job.status === "pending"   ? "bg-amber-100 text-amber-700" :
                                               "bg-gray-100 text-gray-400";
                return (
                  <Link
                    key={job.id}
                    href={`/client/jobs/${job.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                        {job.title}
                      </p>
                    </div>
                    {pending > 0 && (
                      <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                        {pending} new
                      </span>
                    )}
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/client/jobs"
            className="mt-auto text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            Manage all jobs →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/client/jobs/new",
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            ),
            label: "Post New Job",
            desc: "Create a new job listing",
            color: "text-emerald-700 bg-emerald-50",
          },
          {
            href: "/client/profile",
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ),
            label: "Edit Company Profile",
            desc: "Update company info & logo",
            color: "text-blue-700 bg-blue-50",
          },
          {
            href: "/client/applications",
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            label: "Review Applications",
            desc: pendingApps > 0 ? `${pendingApps} awaiting review` : "All caught up",
            color: "text-amber-700 bg-amber-50",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm border-[#E2E8F0] hover:shadow-[0_8px_30px_rgba(15,74,46,0.1)] transition-all flex items-start gap-4 group"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
              {action.icon}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
                {action.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
