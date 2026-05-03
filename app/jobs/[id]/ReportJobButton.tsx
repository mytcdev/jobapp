"use client";

import { useState } from "react";

const REASONS = [
  { value: "inaccurate",          label: "Inaccurate job information" },
  { value: "spam_scam",           label: "Spam or scam" },
  { value: "offensive",           label: "Offensive or inappropriate content" },
  { value: "duplicate",           label: "Duplicate listing" },
  { value: "no_longer_available", label: "Job no longer available" },
  { value: "other",               label: "Other" },
];

export default function ReportJobButton({ jobId }: { jobId: string }) {
  const [open, setOpen]       = useState(false);
  const [reason, setReason]   = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      if (res.status === 409) { setError("You have already reported this job."); return; }
      if (!res.ok) { setError("Something went wrong. Please try again."); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setReason("");
    setDetails("");
    setError("");
    setDone(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium py-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
        Report this job
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {done ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Report Submitted</h2>
                <p className="text-sm text-gray-400">Thank you. Our team will review this listing.</p>
                <button
                  onClick={handleClose}
                  className="mt-5 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Report this job</h2>
                <p className="text-sm text-gray-400 mb-5">Help us keep listings accurate and safe.</p>

                <div className="space-y-2 mb-4">
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        reason === r.value
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-red-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{r.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Additional details <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Provide any context that may help our team..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-700"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 mb-3 font-medium">{error}</p>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reason || loading}
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    {loading ? "Submitting…" : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
