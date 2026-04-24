export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import MatchBar from "@/components/MatchBar";
import StatusSelect from "./StatusSelect";

export default async function AdminApplicationsPage() {
  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, match_percentage, submitted_resume_path, jobs(title, company), users(name, email)")
    .order("id", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Applications</h1>

      {!applications?.length && <p className="text-gray-500">No applications yet.</p>}

      <div className="flex flex-col gap-3">
        {applications?.map((app) => {
          const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
          const user = Array.isArray(app.users) ? app.users[0] : app.users;
          return (
            <div key={app.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium">{(job as { title: string } | null)?.title}</p>
                  <p className="text-sm text-gray-500">
                    {(job as { company: string } | null)?.company}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {(user as { name: string; email: string } | null)?.name}{" "}
                    &middot;{" "}
                    {(user as { name: string; email: string } | null)?.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusSelect applicationId={app.id} currentStatus={app.status} />
                  {app.submitted_resume_path && (
                    <a
                      href={`/api/admin/applications/${app.id}/resume`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View Resume →
                    </a>
                  )}
                </div>
              </div>
              <MatchBar percent={app.match_percentage} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
