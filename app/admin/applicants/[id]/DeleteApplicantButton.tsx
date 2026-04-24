"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteApplicantButton({ applicantId }: { applicantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this applicant account? Their application history will be kept.")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/applicants/${applicantId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/applicants");
      router.refresh();
    } else {
      alert("Failed to delete applicant.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
    >
      {loading ? "Deleting…" : "Delete Account"}
    </button>
  );
}
