"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationPicker from "@/components/LocationPicker";
import SkillsInput from "@/components/SkillsInput";
import JobDescriptionEditor from "@/components/JobDescriptionEditor";
import NationalityPicker from "@/components/NationalityPicker";

const CURRENCIES = ["USD", "SGD", "MYR", "GBP", "AUD", "EUR", "CAD", "INR"];
const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
];
const WORK_TYPES = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export type JobFormValues = {
  id?: string;
  title?: string;
  company?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  required_skills?: string[];
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  status?: string;
  work_type?: string;
  accepted_nationality?: string | null;
  owner_id?: string | null;
};

export type ClientOption = { id: string; username: string; company_name: string | null };

export default function JobForm({ initial, clients }: { initial?: JobFormValues; clients?: ClientOption[] }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const skills = (fd.get("required_skills") as string)
      .split(",").map((s) => s.trim()).filter(Boolean);

    const body: Record<string, unknown> = {
      title: fd.get("title"),
      company: fd.get("company"),
      description: fd.get("description"),
      city: fd.get("city"),
      state: fd.get("state"),
      country: fd.get("country"),
      postal_code: (fd.get("postal_code") as string)?.trim() || null,
      required_skills: skills,
      salary_currency: fd.get("salary_currency"),
      status: fd.get("status"),
      work_type: fd.get("work_type"),
      accepted_nationality: (fd.get("accepted_nationality") as string)?.trim() || null,
      owner_id: (fd.get("owner_id") as string) || null,
    };
    const min = fd.get("salary_min") as string;
    const max = fd.get("salary_max") as string;
    if (min) body.salary_min = Number(min);
    if (max) body.salary_max = Number(max);

    try {
      const url = isEdit ? `/api/admin/jobs/${initial!.id}` : "/api/admin/jobs";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Failed");
      }
      if (isEdit) {
        setSaved(true);
        router.refresh();
      } else {
        router.push("/admin/jobs");
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 flex flex-col gap-4">
      <Field name="title" label="Job Title" placeholder="e.g. Senior Frontend Engineer" defaultValue={initial?.title} />
      <Field name="company" label="Company" placeholder="e.g. Acme Corp" defaultValue={initial?.company} />

      <LocationPicker
        initialCountry={initial?.country}
        initialState={initial?.state}
        initialCity={initial?.city}
        initialPostalCode={initial?.postal_code}
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="salary_currency">Currency</label>
          <select id="salary_currency" name="salary_currency" defaultValue={initial?.salary_currency ?? "USD"}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Field name="salary_min" label="Salary Min" placeholder="e.g. 80000" type="number" defaultValue={initial?.salary_min?.toString()} required={false} />
        <Field name="salary_max" label="Salary Max" placeholder="e.g. 120000" type="number" defaultValue={initial?.salary_max?.toString()} required={false} />
      </div>

      <SkillsInput initialSkills={initial?.required_skills ?? []} />

      <JobDescriptionEditor initialContent={initial?.description ?? ""} />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="work_type">Work Type</label>
          <select id="work_type" name="work_type" defaultValue={initial?.work_type ?? "onsite"}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            {WORK_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initial?.status ?? "draft"}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-2">Only <strong>Published</strong> jobs appear on the public jobs page.</p>

      <NationalityPicker initialValue={initial?.accepted_nationality} />

      {clients && clients.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="owner_id">Assign to Client</label>
          <select id="owner_id" name="owner_id" defaultValue={initial?.owner_id ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">— None (admin-owned) —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name ? `${c.company_name} (${c.username})` : c.username}
              </option>
            ))}
          </select>
        </div>
      )}

      {saved && <p className="text-green-600 text-sm">Changes saved successfully.</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
        {loading ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Job")}
      </button>
    </form>
  );
}

function Field({ name, label, placeholder, type = "text", defaultValue, required = true }: {
  name: string; label: string; placeholder: string;
  type?: string; defaultValue?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        required={required}
        min={type === "number" ? 0 : undefined}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
    </div>
  );
}
