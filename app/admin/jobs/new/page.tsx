export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import JobForm from "../JobForm";

export default async function NewJobPage() {
  const { data: clients } = await supabase
    .from("staff_accounts")
    .select("id, username, company_name")
    .eq("role", "client")
    .order("username");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Job</h1>
      <JobForm clients={clients ?? []} />
    </div>
  );
}
