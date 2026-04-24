export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

export default async function AdminDashboard() {
  const [jobs, applications, users] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id, status", { count: "exact" }),
    supabase.from("users").select("id", { count: "exact", head: true }),
  ]);

  const statusCounts = (applications.data ?? []).reduce<Record<string, number>>(
    (acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const stats = [
    { label: "Total Jobs", value: jobs.count ?? 0 },
    { label: "Total Users", value: users.count ?? 0 },
    { label: "Applications", value: applications.count ?? 0 },
    { label: "Pending Review", value: statusCounts.pending ?? 0 },
    { label: "Interviews", value: statusCounts.interview ?? 0 },
    { label: "Offers", value: statusCounts.offer ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-5">
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
