"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserStatus = "active" | "pending" | "blocked";

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  pending: "Pending",
  blocked: "Blocked",
};

const STATUS_STYLES: Record<UserStatus, string> = {
  active: "bg-green-50 border-green-200 text-green-700",
  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
  blocked: "bg-red-50 border-red-200 text-red-700",
};

export default function UserStatusDropdown({
  applicantId,
  currentStatus,
}: {
  applicantId: string;
  currentStatus: UserStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<UserStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newStatus: UserStatus) {
    if (newStatus === status) return;
    const label = STATUS_LABELS[newStatus].toLowerCase();
    if (!confirm(`Set this applicant's status to "${label}"?`)) return;

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/applicants/${applicantId}`, {
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
      <label className="text-xs text-gray-500 font-medium">Account Status</label>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as UserStatus)}
        disabled={loading}
        className={`border rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors ${STATUS_STYLES[status]}`}
      >
        {(Object.keys(STATUS_LABELS) as UserStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
