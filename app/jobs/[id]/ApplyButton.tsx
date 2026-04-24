"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ResumeType = "uploaded" | "generated";

const STATUS_DISPLAY: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Application Pending",  cls: "bg-gray-100 text-gray-600" },
  viewed:      { label: "Application Viewed",   cls: "bg-blue-100 text-blue-700" },
  shortlisted: { label: "Shortlisted",          cls: "bg-green-100 text-green-700" },
  interview:   { label: "Interview Stage",      cls: "bg-purple-100 text-purple-700" },
  offer:       { label: "Offer Extended",       cls: "bg-emerald-100 text-emerald-700" },
  declined:    { label: "Not Selected",         cls: "bg-red-100 text-red-600" },
  reviewed:    { label: "Under Review",         cls: "bg-blue-100 text-blue-700" },
  rejected:    { label: "Not Selected",         cls: "bg-red-100 text-red-600" },
};

export default function ApplyButton({
  jobId,
  isSignedIn,
  applicationStatus,
  hasUploaded,
  hasGenerated,
  activeResumeType,
}: {
  jobId: string;
  isSignedIn: boolean;
  applicationStatus: string | null;
  hasUploaded?: boolean;
  hasGenerated?: boolean;
  activeResumeType?: "uploaded" | "generated" | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "select">("idle");
  const [selected, setSelected] = useState<ResumeType | null>(
    activeResumeType ?? (hasUploaded ? "uploaded" : hasGenerated ? "generated" : null),
  );

  if (!isSignedIn) {
    return (
      <a
        href={`/auth/signin?callbackUrl=/jobs/${jobId}`}
        className="inline-block bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
      >
        Sign in to Apply
      </a>
    );
  }

  if (applicationStatus) {
    const display = STATUS_DISPLAY[applicationStatus] ?? { label: applicationStatus, cls: "bg-gray-100 text-gray-600" };
    return (
      <div className="flex flex-col gap-1">
        <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm w-fit ${display.cls}`}>
          <span className="w-2 h-2 rounded-full bg-current opacity-70" />
          {display.label}
        </span>
        <p className="text-xs text-gray-400">You have applied for this position.</p>
      </div>
    );
  }

  const hasBoth = hasUploaded && hasGenerated;

  async function submitApplication(resumeType: ResumeType | null) {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { job_id: jobId };
      if (resumeType) body.submitted_resume_type = resumeType;
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Failed to apply");
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setStep("idle");
    }
  }

  function handleApplyClick() {
    if (hasBoth) {
      setStep("select");
    } else {
      const type = hasUploaded ? "uploaded" : hasGenerated ? "generated" : null;
      submitApplication(type);
    }
  }

  if (step === "select") {
    return (
      <div className="flex flex-col gap-3 max-w-sm">
        <p className="text-sm font-medium">Which resume would you like to submit?</p>
        <div className="flex flex-col gap-2">
          <ResumeOption
            label="Uploaded Resume"
            description="Your own PDF file"
            checked={selected === "uploaded"}
            onSelect={() => setSelected("uploaded")}
          />
          <ResumeOption
            label="Generated Resume"
            description="Built from your profile"
            checked={selected === "generated"}
            onSelect={() => setSelected("generated")}
          />
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => selected && submitApplication(selected)}
            disabled={loading || !selected}
            className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Applying…" : "Submit Application"}
          </button>
          <button
            onClick={() => setStep("idle")}
            className="border px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleApplyClick}
        disabled={loading}
        className="inline-block bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? "Applying…" : "Apply Now"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

function ResumeOption({
  label,
  description,
  checked,
  onSelect,
}: {
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-start gap-3 w-full text-left border rounded-lg p-3 transition-colors ${
        checked ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"
      }`}
    >
      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${checked ? "border-black bg-black" : "border-gray-300"}`} />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </button>
  );
}
