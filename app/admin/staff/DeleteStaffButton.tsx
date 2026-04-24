"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteStaffButton({
  staffId,
  username,
}: {
  staffId: string;
  username: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete account "${username}"? This cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/admin/staff/${staffId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
