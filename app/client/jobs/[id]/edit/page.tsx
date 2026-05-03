export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import ClientJobForm from "../../ClientJobForm";
import DeleteClientJobButton from "./DeleteClientJobButton";

export default async function EditClientJobPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user.staffId) redirect("/client");

  const db = getSupabase();
  const [{ data: job, error }, { data: jobCats }] = await Promise.all([
    db.from("jobs").select("*").eq("id", params.id).eq("owner_id", session.user.staffId).single(),
    db.from("job_categories").select("category_id").eq("job_id", params.id),
  ]);

  if (error || !job) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Job</h1>
        <DeleteClientJobButton jobId={job.id} />
      </div>
      <ClientJobForm initial={{
        id: job.id, title: job.title, company: job.company, description: job.description,
        city: job.city, state: job.state, country: job.country,
        required_skills: job.required_skills, salary_min: job.salary_min, salary_max: job.salary_max,
        salary_currency: job.salary_currency, status: job.status, work_type: job.work_type,
        accepted_nationality: job.accepted_nationality,
        category_ids: (jobCats ?? []).map((r) => r.category_id),
      }} />
    </div>
  );
}
