"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CompanyValues = {
  company_name?:    string | null;
  company_address?: string | null;
  company_website?: string | null;
  contact_email?:   string | null;
  contact_phone?:   string | null;
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      company_name:    (fd.get("company_name")    as string).trim() || null,
      company_address: (fd.get("company_address") as string).trim() || null,
      company_website: (fd.get("company_website") as string).trim() || null,
      contact_email:   (fd.get("contact_email")   as string).trim() || null,
      contact_phone:   (fd.get("contact_phone")   as string).trim() || null,
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
      {[
        { name: "company_name",    label: "Company Name",    placeholder: "e.g. Acme Corp",              defaultValue: initial.company_name },
        { name: "company_address", label: "Company Address", placeholder: "e.g. 123 Main St, Singapore", defaultValue: initial.company_address },
        { name: "company_website", label: "Website",         placeholder: "e.g. https://acme.com",       defaultValue: initial.company_website },
        { name: "contact_email",   label: "Contact Email",   placeholder: "e.g. hr@acme.com",            defaultValue: initial.contact_email },
        { name: "contact_phone",   label: "Contact Phone",   placeholder: "e.g. +60 12 345 6789",        defaultValue: initial.contact_phone },
      ].map(({ name, label, placeholder, defaultValue }) => (
        <div key={name} className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={name}>{label}</label>
          <input id={name} name={name} type="text" placeholder={placeholder}
            defaultValue={defaultValue ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
      ))}
      {error   && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
      <button type="submit" disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm">
        {loading ? "Saving…" : "Save Company Details"}
      </button>
    </form>
  );
}
