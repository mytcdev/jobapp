export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import JobForm from "../../JobForm";

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const [{ data: job, error }, { data: clients }, { data: jobCats }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.id).single(),
    supabase.from("staff_accounts").select("id, username, company_name").eq("role", "client").order("username"),
    supabase.from("job_categories").select("category_id").eq("job_id", params.id),
  ]);

  if (error || !job) notFound();

  const categoryIds = (jobCats ?? []).map((r) => r.category_id);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
      <JobForm clients={clients ?? []} initial={{
        id: job.id,
        title: job.title,
        company: job.company,
        description: job.description,
        city: job.city,
        state: job.state,
        country: job.country,
        required_skills: job.required_skills,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency,
        status: job.status,
        work_type: job.work_type,
        accepted_nationality: job.accepted_nationality,
        owner_id: job.owner_id,
        category_ids: categoryIds,
      }} />
    </div>
  );
}
