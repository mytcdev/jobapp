"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_MB = 2;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function ResumeUpload({ hasResume }: { hasResume: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess(false);

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File must be under ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/profile/resume", { method: "POST", body: fd });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Upload failed");
      }
      setSuccess(true);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleView() {
    window.open("/api/profile/resume", "_blank");
  }

  return (
    <div className="bg-white border rounded-xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : hasResume ? "Replace Resume" : "Upload Resume"}
        </button>

        {hasResume && (
          <button
            onClick={handleView}
            className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            View Resume
          </button>
        )}

        <span className="text-xs text-gray-400">PDF only · max {MAX_MB} MB</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleUpload}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">Resume uploaded successfully.</p>}
    </div>
  );
}
