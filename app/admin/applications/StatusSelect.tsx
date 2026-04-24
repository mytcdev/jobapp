"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES: { value: string; label: string }[] = [
  { value: "pending",     label: "Pending" },
  { value: "viewed",      label: "Viewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview",   label: "Interview" },
  { value: "offer",       label: "Offer" },
  { value: "declined",    label: "Declined" },
];

export default function StatusSelect({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on error
        setStatus(status);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 shrink-0"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
