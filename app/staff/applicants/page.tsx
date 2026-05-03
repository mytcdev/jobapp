export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";

export default async function StaffApplicantsPage() {
  const { data: applicants } = await supabase
    .from("users")
    .select("id, name, email, skills, city, state, country, status, resume_path")
    .order("created_at", { ascending: false });

  return (
    <div>
      <p className="text-sm text-[#64748B] mb-6">{applicants?.length ?? 0} registered applicants</p>

      {!applicants?.length && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center text-[#94A3B8]">
          No applicants yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {applicants?.map((a) => (
          <Link
            key={a.id}
            href={`/admin/applicants/${a.id}`}
            className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF4FB] text-sm font-bold text-[#3C50E0]">
                  {a.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#1C2434]">{a.name ?? "—"}</p>
                    {a.status === "blocked" && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Blocked</span>
                    )}
                    {a.resume_path && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Resume</span>
                    )}
                  </div>
                  <p className="text-sm text-[#64748B] truncate">{a.email}</p>
                  {(a.city || a.country) && (
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {[a.city, a.state, a.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-[#94A3B8]">
                {a.skills?.length ?? 0} skill{a.skills?.length === 1 ? "" : "s"}
              </span>
            </div>

            {a.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {(a.skills as string[]).slice(0, 6).map((s) => <Badge key={s} label={s} />)}
                {a.skills.length > 6 && (
                  <span className="text-xs text-[#94A3B8] self-center">+{a.skills.length - 6} more</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
