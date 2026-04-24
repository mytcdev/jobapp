"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountStatus = "active" | "pending" | "blocked";

const STATUS_LABELS: Record<AccountStatus, string> = {
  active:  "Active",
  pending: "Pending",
  blocked: "Blocked",
};

const STATUS_STYLES: Record<AccountStatus, string> = {
  active:  "bg-green-50 border-green-200 text-green-700",
  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
  blocked: "bg-red-50 border-red-200 text-red-700",
};

export default function StaffStatusDropdown({
  staffId,
  currentStatus,
}: {
  staffId: string;
  currentStatus: AccountStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AccountStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newStatus: AccountStatus) {
    if (newStatus === status) return;
    if (!confirm(`Set this account's status to "${STATUS_LABELS[newStatus]}"?`)) return;

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/staff/${staffId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to update status");
      setLoading(false);
      return;
    }

    setStatus(newStatus);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Account Status</label>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as AccountStatus)}
        disabled={loading}
        className={`border rounded-lg px-3 py-2 text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors ${STATUS_STYLES[status]}`}
      >
        {(Object.keys(STATUS_LABELS) as AccountStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
