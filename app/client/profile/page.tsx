export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import ChangePasswordForm from "./ChangePasswordForm";
import CompanyForm from "./CompanyForm";

export default async function ClientProfilePage() {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/client");

  const { data: account } = await getSupabase()
    .from("staff_accounts")
    .select("id, username, role, created_at, company_name, company_address, company_website, contact_email, contact_phone")
    .eq("id", session.user.staffId)
    .single();

  return (
    <div className="max-w-xl flex flex-col gap-8">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <section className="bg-white border rounded-xl p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-lg">Account Info</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-500">Username</p>
            <p className="font-medium">{account?.username}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="font-medium capitalize">{account?.role}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="font-medium">
              {account?.created_at ? new Date(account.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Company Details</h2>
        <CompanyForm initial={{
          company_name:    account?.company_name,
          company_address: account?.company_address,
          company_website: account?.company_website,
          contact_email:   account?.contact_email,
          contact_phone:   account?.contact_phone,
        }} />
      </section>

      <section>
        <h2 className="font-semibold mb-3">Change Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
