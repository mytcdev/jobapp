"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "pending",     label: "Pending" },
  { value: "viewed",      label: "Viewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview",   label: "Interview" },
  { value: "offer",       label: "Offer" },
  { value: "declined",    label: "Declined" },
];

export default function ClientStatusSelect({
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
    const prev = status;
    const newStatus = e.target.value;
    setStatus(newStatus);
    setSaving(true);
    try {
      const res = await fetch(`/api/client/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setStatus(prev);
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
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 bg-white"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
