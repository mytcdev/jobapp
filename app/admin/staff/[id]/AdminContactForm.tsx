"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminContactForm({
  staffId,
  initial,
}: {
  staffId: string;
  initial: { account_contact_email?: string | null; account_contact_phone?: string | null };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccess("");
    const fd = new FormData(e.currentTarget);
    const account_contact_email = (fd.get("account_contact_email") as string).trim();
    if (!account_contact_email) { setError("Contact email is required."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_contact_email,
          account_contact_phone: (fd.get("account_contact_phone") as string).trim() || null,
        }),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      setSuccess("Contact info saved.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="account_contact_email">
            Contact Email <span className="text-red-500">*</span>
          </label>
          <input
            id="account_contact_email"
            name="account_contact_email"
            type="email"
            placeholder="e.g. person@email.com"
            defaultValue={initial.account_contact_email ?? ""}
            required
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="account_contact_phone">
            Contact Phone <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="account_contact_phone"
            name="account_contact_phone"
            type="tel"
            placeholder="e.g. +60 12 345 6789"
            defaultValue={initial.account_contact_phone ?? ""}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>
      {error   && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? "Saving…" : "Save Contact Info"}
      </button>
    </form>
  );
}
