export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import EditStaffForm from "./EditStaffForm";
import AdminCompanyForm from "./AdminCompanyForm";
import AdminContactForm from "./AdminContactForm";
import StaffStatusDropdown from "./StaffStatusDropdown";
import DeleteStaffButton from "../DeleteStaffButton";

const ROLE_STYLE: Record<string, string> = {
  admin:   "bg-black text-white",
  manager: "bg-indigo-100 text-indigo-700",
  staff:   "bg-gray-100 text-gray-600",
  client:  "bg-amber-100 text-amber-700",
};

export default async function EditStaffPage({ params }: { params: { id: string } }) {
  const [{ data: account }, session] = await Promise.all([
    supabase
      .from("staff_accounts")
      .select("id, username, role, status, created_at, account_contact_email, account_contact_phone, company_name, company_address, company_website, contact_email, contact_phone, featured, industry, company_size, founded_year, company_url, short_description")
      .eq("id", params.id)
      .single(),
    getServerSession(getAuthOptions()),
  ]);

  if (!account) notFound();

  const isSelf = session?.user.name === account.username;
  const sessionRole = session?.user.role;
  const canManageStatus = (sessionRole === "admin" || sessionRole === "manager") && !isSelf;

  const STATUS_BADGE: Record<string, string> = {
    active:  "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    blocked: "bg-red-100 text-red-600",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/staff" className="text-sm text-gray-400 hover:text-gray-600 mb-1 inline-block">
            ← Users
          </Link>
          <h1 className="text-2xl font-bold">{account.username}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_STYLE[account.role] ?? ROLE_STYLE.staff}`}>
              {account.role}
            </span>
            {account.status !== "active" && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[account.status] ?? ""}`}>
                {account.status}
              </span>
            )}
          </div>
        </div>
        {!isSelf && (
          <DeleteStaffButton staffId={account.id} username={account.username} />
        )}
      </div>

      {/* Account Status — admin/manager only, not for self */}
      {canManageStatus && (
        <section className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Account Status</h2>
          <StaffStatusDropdown staffId={account.id} currentStatus={(account.status ?? "active") as "active" | "pending" | "blocked"} />
        </section>
      )}

      {account.role !== "admin" && (
        <section>
          <h2 className="font-semibold mb-3">Account Contact</h2>
          <AdminContactForm
            staffId={account.id}
            initial={{
              account_contact_email: account.account_contact_email,
              account_contact_phone: account.account_contact_phone,
            }}
          />
        </section>
      )}

      {account.role === "client" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <EditStaffForm staffId={account.id} currentRole={account.role} isSelf={isSelf} />
          <div>
            <h2 className="font-semibold mb-3">Company Details</h2>
            <AdminCompanyForm staffId={account.id} initial={{
              company_name:      account.company_name,
              company_address:   account.company_address,
              company_website:   account.company_website,
              contact_email:     account.contact_email,
              contact_phone:     account.contact_phone,
              featured:          account.featured,
              industry:          account.industry,
              company_size:      account.company_size,
              founded_year:      account.founded_year,
              company_url:       account.company_url,
              short_description: account.short_description,
            }} />
          </div>
        </div>
      ) : (
        <EditStaffForm staffId={account.id} currentRole={account.role} isSelf={isSelf} />
      )}
    </div>
  );
}
