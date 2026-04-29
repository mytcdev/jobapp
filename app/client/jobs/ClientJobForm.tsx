"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationPicker from "@/components/LocationPicker";
import SkillsInput from "@/components/SkillsInput";
import JobDescriptionEditor from "@/components/JobDescriptionEditor";
import NationalityPicker from "@/components/NationalityPicker";
import CategoryPicker from "@/components/CategoryPicker";

const CURRENCIES = ["USD", "SGD", "MYR", "GBP", "AUD", "EUR", "CAD", "INR"];
const STATUSES   = [{ value: "draft", label: "Draft" }, { value: "pending", label: "Pending Review" }, { value: "published", label: "Published" }];
const WORK_TYPES = [{ value: "onsite", label: "On-site" }, { value: "remote", label: "Remote" }, { value: "hybrid", label: "Hybrid" }];

export type ClientJobValues = {
  id?: string;
  title?: string; company?: string; description?: string;
  city?: string; state?: string; country?: string; postal_code?: string;
  required_skills?: string[];
  salary_min?: number; salary_max?: number; salary_currency?: string;
  status?: string; work_type?: string; accepted_nationality?: string | null;
  category_ids?: string[];
};

export default function ClientJobForm({ initial }: { initial?: ClientJobValues }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const skills = (fd.get("required_skills") as string).split(",").map((s) => s.trim()).filter(Boolean);
    const body: Record<string, unknown> = {
      title: fd.get("title"), company: fd.get("company"), description: fd.get("description"),
      city: fd.get("city"), state: fd.get("state"), country: fd.get("country"),
      postal_code: (fd.get("postal_code") as string)?.trim() || null,
      required_skills: skills, salary_currency: fd.get("salary_currency"),
      status: fd.get("status"), work_type: fd.get("work_type"),
      accepted_nationality: (fd.get("accepted_nationality") as string)?.trim() || null,
      category_ids: ((fd.get("category_ids") as string) ?? "").split(",").filter(Boolean),
    };
    const min = fd.get("salary_min") as string;
    const max = fd.get("salary_max") as string;
    if (min) body.salary_min = Number(min);
    if (max) body.salary_max = Number(max);

    try {
      const url = isEdit ? `/api/client/jobs/${initial!.id}` : "/api/client/jobs";
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg ?? "Failed"); }
      router.push("/client/jobs");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="title">Job Title</label>
        <input id="title" name="title" type="text" placeholder="e.g. Frontend Engineer"
          defaultValue={initial?.title ?? ""} required
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="company">Company</label>
        <input id="company" name="company" type="text" placeholder="e.g. Acme Corp"
          defaultValue={initial?.company ?? ""} required
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

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
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="salary_min">Salary Min</label>
          <input id="salary_min" name="salary_min" type="number" min={0} placeholder="e.g. 60000"
            defaultValue={initial?.salary_min?.toString() ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="salary_max">Salary Max</label>
          <input id="salary_max" name="salary_max" type="number" min={0} placeholder="e.g. 100000"
            defaultValue={initial?.salary_max?.toString() ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
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

      <NationalityPicker initialValue={initial?.accepted_nationality} />

      <CategoryPicker initialIds={initial?.category_ids ?? []} />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
        {loading ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Job")}
      </button>
    </form>
  );
}
