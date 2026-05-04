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
    .select("id, username, role, created_at, account_contact_email, account_contact_phone, company_name, company_address, company_website, contact_email, contact_phone, company_logo, industry, company_size, founded_year, company_url, short_description")
    .eq("id", session.user.staffId)
    .single();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: account info + password */}
        <div className="flex flex-col gap-6">
          <section className="bg-white border rounded-xl p-6 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Account Info</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Username</p>
                <p className="font-medium">{account?.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="font-medium">
                  {account?.created_at ? new Date(account.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Contact Email</p>
                <p className="font-medium">{account?.account_contact_email ?? <span className="text-gray-400 font-normal">Not set</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Contact Phone</p>
                <p className="font-medium">{account?.account_contact_phone ?? <span className="text-gray-400 font-normal">Not set</span>}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-3">Change Password</h2>
            <ChangePasswordForm />
          </section>
        </div>

        {/* Right: company details */}
        <section>
          <h2 className="font-semibold mb-3">Company Details</h2>
          <CompanyForm initial={{
            company_name:      account?.company_name,
            company_address:   account?.company_address,
            company_website:   account?.company_website,
            contact_email:     account?.contact_email,
            contact_phone:     account?.contact_phone,
            company_logo:      account?.company_logo,
            industry:          account?.industry,
            company_size:      account?.company_size,
            founded_year:      account?.founded_year,
            company_url:       account?.company_url,
            short_description: account?.short_description,
          }} />
        </section>
      </div>
    </div>
  );
}
