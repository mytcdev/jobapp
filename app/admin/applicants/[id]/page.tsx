export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";
import MatchBar from "@/components/MatchBar";
import UserStatusDropdown from "./UserStatusDropdown";
import ViewResumeButton from "./ViewResumeButton";
import DeleteApplicantButton from "./DeleteApplicantButton";

export default async function ApplicantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [userResult, appsResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, image, skills, city, state, country, preferred_salary, bio, status, resume_path, created_at")
      .eq("id", params.id)
      .single(),
    supabase
      .from("applications")
      .select("id, status, match_percentage, created_at, jobs(title, company)")
      .eq("user_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (userResult.error || !userResult.data) notFound();
  const u = userResult.data;
  const applications = appsResult.data ?? [];

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{u.name ?? "—"}</h1>
            {u.status === "blocked" && (
              <span className="text-sm bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full font-medium">
                Blocked
              </span>
            )}
            {u.status === "pending" && (
              <span className="text-sm bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full font-medium">
                Pending
              </span>
            )}
          </div>
          <p className="text-gray-500">{u.email}</p>
          {(u.city || u.country) && (
            <p className="text-sm text-gray-400 mt-0.5">
              {[u.city, u.state, u.country].filter(Boolean).join(", ")}
            </p>
          )}
          {u.preferred_salary && (
            <p className="text-sm text-gray-500 mt-0.5">
              Preferred salary: ${Number(u.preferred_salary).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0 items-end">
          <UserStatusDropdown applicantId={u.id} currentStatus={u.status ?? "active"} />
          {u.resume_path && <ViewResumeButton applicantId={u.id} />}
          <DeleteApplicantButton applicantId={u.id} />
        </div>
      </div>

      {/* Bio */}
      {u.bio && (
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm font-medium mb-1">Bio</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{u.bio}</p>
        </div>
      )}

      {/* Skills */}
      {u.skills?.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {u.skills.map((s: string) => <Badge key={s} label={s} />)}
          </div>
        </div>
      )}

      {/* Applications */}
      <div>
        <p className="text-sm font-medium mb-2">
          Applications ({applications.length})
        </p>
        {applications.length === 0 && (
          <p className="text-sm text-gray-400">No applications yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {applications.map((app) => {
            const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
            return (
              <div key={app.id} className="bg-white border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{(job as { title: string } | null)?.title}</p>
                    <p className="text-xs text-gray-500">{(job as { company: string } | null)?.company}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <MatchBar percent={app.match_percentage} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    reviewed: "bg-blue-100 text-blue-600",
    interview: "bg-purple-100 text-purple-600",
    offer: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] ?? styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
