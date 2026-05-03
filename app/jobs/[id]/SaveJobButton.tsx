"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  jobId: string;
  isSignedIn: boolean;
  initialSaved: boolean;
}

export default function SaveJobButton({ jobId, isSignedIn, initialSaved }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isSignedIn) {
      router.push(`/api/auth/signin?callbackUrl=/jobs/${jobId}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, { method: "POST" });
      if (res.ok) {
        const { saved: newSaved } = await res.json();
        setSaved(newSaved);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 border-[1.5px] px-6 py-3 rounded-[10px] text-sm font-semibold transition-colors disabled:opacity-50 ${
        saved
          ? "bg-emerald-50 border-emerald-700 text-emerald-700"
          : "bg-white border-emerald-700 text-emerald-700 hover:bg-emerald-50"
      }`}
    >
      <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? "Saved" : "Save Job"}
    </button>
  );
}
