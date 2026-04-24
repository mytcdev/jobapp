"use client";

export default function ViewResumeButton({ applicantId }: { applicantId: string }) {
  return (
    <button
      onClick={() => window.open(`/api/admin/applicants/${applicantId}/resume`, "_blank")}
      className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
    >
      View Resume
    </button>
  );
}
