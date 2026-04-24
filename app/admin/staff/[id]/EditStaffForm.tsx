"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "admin",   label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff",   label: "Staff" },
  { value: "client",  label: "Client" },
];

export default function EditStaffForm({
  staffId,
  currentRole,
  isSelf,
}: {
  staffId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [roleLoading, setRoleLoading]   = useState(false);
  const [pwLoading,   setPwLoading]     = useState(false);
  const [roleError,   setRoleError]     = useState("");
  const [pwError,     setPwError]       = useState("");
  const [roleSuccess, setRoleSuccess]   = useState("");
  const [pwSuccess,   setPwSuccess]     = useState("");

  async function handleRoleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRoleError(""); setRoleSuccess("");
    setRoleLoading(true);
    const fd   = new FormData(e.currentTarget);
    const role = fd.get("role") as string;
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      setRoleSuccess("Role updated.");
      router.refresh();
    } catch (err) {
      setRoleError((err as Error).message);
    } finally {
      setRoleLoading(false);
    }
  }

  async function handlePwSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    const fd      = new FormData(e.currentTarget);
    const pw      = fd.get("password") as string;
    const confirm = fd.get("confirm") as string;
    if (pw !== confirm) { setPwError("Passwords do not match."); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      setPwSuccess("Password updated.");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Role */}
      {!isSelf && (
        <section className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Change Role</h2>
          <form onSubmit={handleRoleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="role">Role</label>
              <select id="role" name="role" defaultValue={currentRole}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {roleError   && <p className="text-red-500 text-sm">{roleError}</p>}
            {roleSuccess && <p className="text-green-600 text-sm">{roleSuccess}</p>}
            <button type="submit" disabled={roleLoading}
              className="bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm">
              {roleLoading ? "Saving…" : "Update Role"}
            </button>
          </form>
        </section>
      )}

      {/* Password */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Reset Password</h2>
        <form onSubmit={handlePwSubmit} className="flex flex-col gap-3">
          {[
            { name: "password", label: "New Password",     placeholder: "Min 8 characters" },
            { name: "confirm",  label: "Confirm Password", placeholder: "••••••••" },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor={name}>{label}</label>
              <input id={name} name={name} type="password" placeholder={placeholder} required minLength={8}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
          ))}
          {pwError   && <p className="text-red-500 text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">{pwSuccess}</p>}
          <button type="submit" disabled={pwLoading}
            className="bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm">
            {pwLoading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </section>
    </div>
  );
}
