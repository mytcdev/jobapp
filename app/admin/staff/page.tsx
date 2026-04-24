export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CreateUserForm from "./CreateStaffForm";

const ROLE_STYLE: Record<string, string> = {
  admin:   "bg-black text-white",
  manager: "bg-indigo-100 text-indigo-700",
  staff:   "bg-gray-100 text-gray-600",
  client:  "bg-amber-100 text-amber-700",
};

export default async function AdminUsersPage() {
  const { data: users } = await supabase
    .from("staff_accounts")
    .select("id, username, role, status, created_at")
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-xl flex flex-col gap-8">
      <h1 className="text-2xl font-bold">User Management</h1>

      <div className="flex flex-col gap-2">
        {users?.map((u) => (
          <Link
            key={u.id}
            href={`/admin/staff/${u.id}`}
            className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{u.username}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_STYLE[u.role] ?? ROLE_STYLE.staff}`}>
                {u.role}
              </span>
              {u.status === "blocked" && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  Blocked
                </span>
              )}
              {u.status === "pending" && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                  Pending
                </span>
              )}
            </div>
            <span className="text-sm text-gray-400">Edit →</span>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Create User</h2>
        <CreateUserForm />
      </div>
    </div>
  );
}
