"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CompanyValues = {
  company_name?:       string | null;
  company_address?:    string | null;
  company_website?:    string | null;
  contact_email?:      string | null;
  contact_phone?:      string | null;
  featured?:           boolean | null;
  industry?:           string | null;
  company_size?:       string | null;
  founded_year?:       number | null;
  company_url?:        string | null;
  short_description?:  string | null;
};

export default function AdminCompanyForm({
  staffId,
  initial,
}: {
  staffId: string;
  initial: CompanyValues;
}) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [featured, setFeatured] = useState(!!initial.featured);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      company_name:      (fd.get("company_name")      as string).trim() || null,
      company_address:   (fd.get("company_address")   as string).trim() || null,
      company_website:   (fd.get("company_website")   as string).trim() || null,
      contact_email:     (fd.get("contact_email")     as string).trim() || null,
      contact_phone:     (fd.get("contact_phone")     as string).trim() || null,
      featured,
      industry:          (fd.get("industry")          as string).trim() || null,
      company_size:      (fd.get("company_size")      as string).trim() || null,
      founded_year:      (fd.get("founded_year")      as string) ? Number(fd.get("founded_year")) : null,
      company_url:       (fd.get("company_url")       as string).trim() || null,
      short_description: (fd.get("short_description") as string).trim() || null,
    };

    try {
      const res = await fetch(`/api/admin/staff/${staffId}/company`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      setSuccess("Company details saved.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 flex flex-col gap-4">
      {/* Featured toggle — admin only */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => setFeatured((v) => !v)}
          className={`relative w-10 h-6 rounded-full transition-colors ${featured ? "bg-emerald-600" : "bg-gray-200"}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${featured ? "translate-x-4" : ""}`} />
        </div>
        <div>
          <p className="text-sm font-medium">Featured Employer</p>
          <p className="text-xs text-gray-400">Highlighted on the platform for job seekers</p>
        </div>
      </label>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="company_name">Company Name</label>
        <input id="company_name" name="company_name" type="text" placeholder="e.g. Acme Corp"
          defaultValue={initial.company_name ?? ""}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="company_address">Company Address</label>
        <input id="company_address" name="company_address" type="text" placeholder="e.g. 123 Main St, Singapore"
          defaultValue={initial.company_address ?? ""}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="company_website">Website</label>
          <input id="company_website" name="company_website" type="text" placeholder="e.g. https://acme.com"
            defaultValue={initial.company_website ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="contact_email">Contact Email</label>
          <input id="contact_email" name="contact_email" type="text" placeholder="e.g. hr@acme.com"
            defaultValue={initial.contact_email ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="contact_phone">Contact Phone</label>
          <input id="contact_phone" name="contact_phone" type="text" placeholder="e.g. +60 12 345 6789"
            defaultValue={initial.contact_phone ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="industry">Industry</label>
          <input id="industry" name="industry" type="text" placeholder="e.g. Enterprise Software"
            defaultValue={initial.industry ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
      </div>

      <hr className="border-gray-100" />
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Company Profile</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="company_size">Company Size</label>
          <input id="company_size" name="company_size" type="text" placeholder="e.g. 50–200 Employees"
            defaultValue={initial.company_size ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="founded_year">Founded Year</label>
          <input id="founded_year" name="founded_year" type="number" placeholder="e.g. 2010"
            defaultValue={initial.founded_year?.toString() ?? ""}
            min={1900} max={new Date().getFullYear()}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="company_url">Company URL</label>
        <input id="company_url" name="company_url" type="url" placeholder="e.g. https://acme.com/about"
          defaultValue={initial.company_url ?? ""}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="short_description">Short Description</label>
        <textarea id="short_description" name="short_description" rows={3}
          placeholder="One or two sentences about the company."
          defaultValue={initial.short_description ?? ""}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none" />
      </div>

      {error   && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
      <button type="submit" disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm">
        {loading ? "Saving…" : "Save Company Details"}
      </button>
    </form>
  );
}
