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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EFF4FB] text-xl font-bold text-[#3C50E0]">
            {u.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{u.name ?? "—"}</h1>
              {u.status === "blocked" && (
                <span className="text-sm bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full font-medium">Blocked</span>
              )}
              {u.status === "pending" && (
                <span className="text-sm bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full font-medium">Pending</span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{u.email}</p>
            {(u.city || u.country) && (
              <p className="text-sm text-gray-400 mt-0.5">
                {[u.city, u.state, u.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UserStatusDropdown applicantId={u.id} currentStatus={u.status ?? "active"} />
          {u.resume_path && <ViewResumeButton applicantId={u.id} />}
          <DeleteApplicantButton applicantId={u.id} />
        </div>
      </div>

      {/* 2-col body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: profile details */}
        <div className="flex flex-col gap-4">
          {/* Info card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">Profile</p>
            <dl className="flex flex-col gap-2 text-sm">
              {u.preferred_salary && (
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Expected salary</dt>
                  <dd className="font-medium">${Number(u.preferred_salary).toLocaleString()}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Member since</dt>
                <dd className="font-medium">{new Date(u.created_at).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Total applications</dt>
                <dd className="font-medium">{applications.length}</dd>
              </div>
            </dl>
          </div>

          {/* Bio */}
          {u.bio && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">Bio</p>
              <p className="text-sm text-[#475569] whitespace-pre-line leading-relaxed">{u.bio}</p>
            </div>
          )}

          {/* Skills */}
          {u.skills?.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">
                Skills ({u.skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {u.skills.map((s: string) => <Badge key={s} label={s} />)}
              </div>
            </div>
          )}
        </div>

        {/* Right: applications */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl">
          <div className="border-b border-[#E2E8F0] px-5 py-4">
            <p className="font-semibold text-[#1C2434]">Applications</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{applications.length} total</p>
          </div>
          {applications.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#94A3B8]">No applications yet.</p>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {applications.map((app) => {
                const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
                return (
                  <div key={app.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[#1C2434] truncate">
                          {(job as { title: string } | null)?.title ?? "—"}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {(job as { company: string } | null)?.company}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <MatchBar percent={app.match_percentage} />
                    <p className="text-xs text-[#94A3B8] mt-1.5">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
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
