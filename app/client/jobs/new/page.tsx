import ClientJobForm from "../ClientJobForm";

export default function NewClientJobPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create Job</h1>
      <ClientJobForm />
    </div>
  );
}
