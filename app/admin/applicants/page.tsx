export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";

export default async function AdminApplicantsPage() {
  const { data: applicants } = await supabase
    .from("users")
    .select("id, name, email, skills, city, state, country, status, resume_path")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Applicants</h1>

      {!applicants?.length && <p className="text-gray-500">No applicants yet.</p>}

      <div className="flex flex-col gap-3">
        {applicants?.map((a) => (
          <Link
            key={a.id}
            href={`/admin/applicants/${a.id}`}
            className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{a.name ?? "—"}</p>
                  {a.status === "blocked" && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      Blocked
                    </span>
                  )}
                  {a.status === "pending" && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                      Pending
                    </span>
                  )}
                  {a.resume_path && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      Resume
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{a.email}</p>
                {(a.city || a.country) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[a.city, a.state, a.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {a.skills?.length ?? 0} skill{a.skills?.length === 1 ? "" : "s"}
              </span>
            </div>
            {a.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {a.skills.slice(0, 6).map((s: string) => <Badge key={s} label={s} />)}
                {a.skills.length > 6 && (
                  <span className="text-xs text-gray-400 self-center">+{a.skills.length - 6} more</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
