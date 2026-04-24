"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlockButton({
  applicantId,
  isBlocked,
}: {
  applicantId: string;
  isBlocked: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const action = isBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} this applicant?`)) return;
    setLoading(true);
    await fetch(`/api/admin/applicants/${applicantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_blocked: !isBlocked }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
        isBlocked
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-red-600 text-white hover:bg-red-700"
      }`}
    >
      {loading ? "…" : isBlocked ? "Unblock" : "Block"}
    </button>
  );
}
