"use client";

import { useState, useRef } from "react";

type CompanyValues = {
  company_name?:       string | null;
  company_address?:    string | null;
  company_website?:    string | null;
  contact_email?:      string | null;
  contact_phone?:      string | null;
  company_logo?:       string | null;
  industry?:           string | null;
  company_size?:       string | null;
  founded_year?:       number | null;
  company_url?:        string | null;
  short_description?:  string | null;
};

export default function CompanyForm({ initial }: { initial: CompanyValues }) {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [logo, setLogo]           = useState<string | null>(initial.company_logo ?? null);
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
      company_name:      (fd.get("company_name")      as string).trim() || null,
      company_address:   (fd.get("company_address")   as string).trim() || null,
      company_website:   (fd.get("company_website")   as string).trim() || null,
      contact_email:     (fd.get("contact_email")     as string).trim() || null,
      contact_phone:     (fd.get("contact_phone")     as string).trim() || null,
      industry:          (fd.get("industry")          as string).trim() || null,
      company_size:      (fd.get("company_size")      as string).trim() || null,
      founded_year:      (fd.get("founded_year")      as string) ? Number(fd.get("founded_year")) : null,
      company_url:       (fd.get("company_url")       as string).trim() || null,
      short_description: (fd.get("short_description") as string).trim() || null,
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
      {/* Logo */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Company Logo</label>
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Company logo" className="w-16 h-16 rounded-lg object-contain border bg-gray-50" />
          ) : (
            <div className="w-16 h-16 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center">No logo</div>
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
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
        {loading ? "Saving…" : "Save Company Details"}
      </button>
    </form>
  );
}
