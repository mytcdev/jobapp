"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteClientJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/client/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/client/jobs");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50">
      {loading ? "Deleting…" : "Delete Job"}
    </button>
  );
}
