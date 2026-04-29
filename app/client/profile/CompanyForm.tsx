"use client";

import { useState, useRef } from "react";

type CompanyValues = {
  company_name?:    string | null;
  company_address?: string | null;
  company_website?: string | null;
  contact_email?:   string | null;
  contact_phone?:   string | null;
  company_logo?:    string | null;
};

export default function CompanyForm({ initial }: { initial: CompanyValues }) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [logo, setLogo]         = useState<string | null>(initial.company_logo ?? null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/client/profile/logo", { method: "POST", body: fd });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      const { url } = await res.json();
      setLogo(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      company_name:    (fd.get("company_name")    as string).trim() || null,
      company_address: (fd.get("company_address") as string).trim() || null,
      company_website: (fd.get("company_website") as string).trim() || null,
      contact_email:   (fd.get("contact_email")   as string).trim() || null,
      contact_phone:   (fd.get("contact_phone")   as string).trim() || null,
    };
    try {
      const res = await fetch("/api/client/profile/company", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg ?? "Failed"); }
      setSuccess("Company details saved.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 flex flex-col gap-4">
      {/* Logo upload */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Company Logo</label>
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Company logo" className="w-16 h-16 rounded-lg object-contain border bg-gray-50" />
          ) : (
            <div className="w-16 h-16 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center">
              No logo
            </div>
          )}
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
              {uploading ? "Uploading…" : logo ? "Change Logo" : "Upload Logo"}
            </button>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG or SVG. Max 2MB.</p>
          </div>
        </div>
      </div>

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
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
        {loading ? "Saving…" : "Save Company Details"}
      </button>
    </form>
  );
}
