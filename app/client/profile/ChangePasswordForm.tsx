"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fd = new FormData(e.currentTarget);
    const current  = fd.get("current") as string;
    const next     = fd.get("next") as string;
    const confirm  = fd.get("confirm") as string;

    if (next !== confirm) { setError("New passwords do not match."); return; }
    if (next.length < 8)  { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/client/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Failed");
      }
      setSuccess("Password updated.");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 flex flex-col gap-4 max-w-sm">
      {[
        { name: "current",  label: "Current Password",     placeholder: "••••••••" },
        { name: "next",     label: "New Password",         placeholder: "Min 8 characters" },
        { name: "confirm",  label: "Confirm New Password", placeholder: "••••••••" },
      ].map(({ name, label, placeholder }) => (
        <div key={name} className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor={name}>{label}</label>
          <input id={name} name={name} type="password" placeholder={placeholder} required
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
      ))}
      {error   && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
      <button type="submit" disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
        {loading ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
