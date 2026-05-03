export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";

const STAT_CONFIGS = [
  {
    key: "jobs",
    label: "Total Jobs",
    href: "/admin/jobs",
    iconBg: "#EFF4FB",
    iconColor: "#3C50E0",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key: "users",
    label: "Total Users",
    href: "/admin/applicants",
    iconBg: "#E7F6EC",
    iconColor: "#219653",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: "applications",
    label: "Applications",
    href: "/admin/applications",
    iconBg: "#FFF3E0",
    iconColor: "#F57C00",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
      </svg>
    ),
  },
  {
    key: "pending",
    label: "Pending Review",
    href: "/admin/applications",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "interview",
    label: "Interviews",
    href: "/admin/applications",
    iconBg: "#F0ECFF",
    iconColor: "#7C3AED",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    key: "offer",
    label: "Offers",
    href: "/admin/applications",
    iconBg: "#E0F7FA",
    iconColor: "#0097A7",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default async function AdminDashboard() {
  const [jobsRes, usersRes, appsRes, recentAppsRes] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id, status"),
    supabase
      .from("applications")
      .select("id, status, created_at, jobs(title, company), users(name, email)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const statusCounts = (appsRes.data ?? []).reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  const statValues: Record<string, number> = {
    jobs:         jobsRes.count  ?? 0,
    users:        usersRes.count ?? 0,
    applications: appsRes.data?.length ?? 0,
    pending:      statusCounts.pending   ?? 0,
    interview:    statusCounts.interview ?? 0,
    offer:        statusCounts.offer     ?? 0,
  };

  const STATUS_BADGE: Record<string, string> = {
    pending:     "bg-amber-100 text-amber-700",
    viewed:      "bg-blue-100 text-blue-700",
    shortlisted: "bg-indigo-100 text-indigo-700",
    interview:   "bg-purple-100 text-purple-700",
    offer:       "bg-green-100 text-green-700",
    declined:    "bg-red-100 text-red-500",
    expired:     "bg-gray-100 text-gray-400",
  };

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
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {STAT_CONFIGS.map((cfg) => (
          <Link
            key={cfg.key}
            href={cfg.href}
            className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
              style={{ background: cfg.iconBg, color: cfg.iconColor }}
            >
              {cfg.icon}
            </div>
            <h4 className="text-2xl font-bold text-[#1C2434] leading-tight">
              {statValues[cfg.key]}
            </h4>
            <p className="mt-1 text-sm font-medium text-[#64748B]">{cfg.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent applications */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <h3 className="font-semibold text-[#1C2434]">Recent Applications</h3>
          <Link
            href="/admin/applications"
            className="text-xs font-semibold text-[#0F4A2E] hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-[#F1F5F9]">
          {(recentAppsRes.data ?? []).length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-[#94A3B8]">No applications yet.</p>
          ) : (
            (recentAppsRes.data ?? []).map((app) => {
              const job  = (Array.isArray(app.jobs)  ? app.jobs[0]  : app.jobs)  as { title: string; company: string } | null;
              const user = (Array.isArray(app.users) ? app.users[0] : app.users) as { name: string; email: string } | null;
              const badgeCls = STATUS_BADGE[app.status] ?? "bg-gray-100 text-gray-500";
              return (
                <div key={app.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF4FB] text-sm font-bold text-[#3C50E0]">
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1C2434] truncate">{user?.name ?? "Unknown"}</p>
                    <p className="text-xs text-[#64748B] truncate">{job?.title} · {job?.company}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  <span className="shrink-0 text-xs text-[#94A3B8]">{timeAgo(app.created_at)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
