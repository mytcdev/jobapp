"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "client",  label: "Client",  desc: "Can manage their own jobs and view applications" },
  { value: "manager", label: "Manager", desc: "Can manage all jobs and users" },
  { value: "staff",   label: "Staff",   desc: "Profile access only" },
  { value: "admin",   label: "Admin",   desc: "Full access" },
];

export default function CreateUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fd.get("username"),
          password: fd.get("password"),
          role: fd.get("role"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create account");
      setSuccess(`Account "${json.staff.username}" created.`);
      (e.target as HTMLFormElement).reset();
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
        <label className="text-sm font-medium" htmlFor="username">Username</label>
        <input id="username" name="username" type="text" required minLength={3} maxLength={32}
          placeholder="e.g. jane_ops"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        <p className="text-xs text-gray-400">Letters, numbers and _ only.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8}
          placeholder="Min. 8 characters"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="role">Role</label>
        <select id="role" name="role" defaultValue="client"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <button type="submit" disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
        {loading ? "Creating…" : "Create User"}
      </button>
    </form>
  );
}
