export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import ClientJobForm from "../ClientJobForm";

export default async function NewClientJobPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/client");

  const { data: profile } = await getSupabase()
    .from("staff_accounts")
    .select("company_name, company_address, company_website")
    .eq("id", session.user.staffId)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Job</h1>
      <ClientJobForm initial={{
        company: profile?.company_name ?? "",
      }} />
    </div>
  );
}
