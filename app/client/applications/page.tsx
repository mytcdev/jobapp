export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import MatchBar from "@/components/MatchBar";
import ClientStatusSelect from "./ClientStatusSelect";


export default async function ClientApplicationsPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/client");

  const db = getSupabase();

  // Get all jobs owned by this client
  const { data: jobs } = await db
    .from("jobs")
    .select("id, title")
    .eq("owner_id", session.user.staffId);

  const jobIds = jobs?.map((j) => j.id) ?? [];
  const jobTitleMap = new Map((jobs ?? []).map((j) => [j.id, j.title]));

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
    .select("id, job_id, status, match_percentage, created_at, submitted_resume_path, users(name, email)")
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Applications{" "}
        <span className="text-gray-400 font-normal text-base">({applications?.length ?? 0})</span>
      </h1>

      {!applications?.length && <p className="text-gray-500">No applications yet.</p>}

      <div className="flex flex-col gap-3">
        {applications?.map((app) => {
          const u = (Array.isArray(app.users) ? app.users[0] : app.users) as { name: string; email: string } | null;
          const jobTitle = jobTitleMap.get(app.job_id);
          return (
            <div key={app.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium">{u?.name ?? "Anonymous"}</p>
                  <p className="text-sm text-gray-500">{u?.email}</p>
                  {jobTitle && (
                    <p className="text-xs text-gray-400 mt-0.5">for {jobTitle}</p>
                  )}
                  {app.created_at && (
                    <p className="text-xs text-gray-400">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                  )}
                  {app.submitted_resume_path && (
                    <a href={`/api/admin/applications/${app.id}/resume`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block">
                      View Resume →
                    </a>
                  )}
                </div>
                <ClientStatusSelect applicationId={app.id} currentStatus={app.status} />
              </div>
              <MatchBar percent={app.match_percentage} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
