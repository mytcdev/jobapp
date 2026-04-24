"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EducationItem, ExperienceItem, PortfolioItem } from "@/lib/schema";

interface Props {
  hasUploaded: boolean;
  hasGenerated: boolean;
  activeType: "uploaded" | "generated" | null;
  // PDF generation props
  name?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  skills?: string[];
  languages?: string[];
  preferred_salary?: number;
  preferred_currency?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  portfolio?: PortfolioItem[];
}

export default function ResumeSection({
  hasUploaded: initialHasUploaded,
  hasGenerated: initialHasGenerated,
  activeType: initialActiveType,
  ...pdfProps
}: Props) {
  const router = useRouter();
  const [hasUploaded, setHasUploaded] = useState(initialHasUploaded);
  const [hasGenerated, setHasGenerated] = useState(initialHasGenerated);
  const [activeType, setActiveType] = useState(initialActiveType);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [settingActive, setSettingActive] = useState(false);

  // ── Upload handler ──────────────────────────────────────────────────────
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are allowed."); return; }
    if (file.size > 2 * 1024 * 1024) { setUploadError("File must be under 2 MB."); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/profile/resume", { method: "POST", body: fd });
      if (!res.ok) { const { error } = await res.json(); throw new Error(error ?? "Upload failed"); }
      setHasUploaded(true);
      router.refresh();
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // ── Generate handler ────────────────────────────────────────────────────
  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = buildPdf(new jsPDF({ unit: "mm", format: "a4" }), pdfProps);
      const blob = doc.output("blob");
      const fd = new FormData();
      fd.append("resume", new File([blob], "generated.pdf", { type: "application/pdf" }));
      const res = await fetch("/api/profile/resume/generate", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to save");
      setHasGenerated(true);
      router.refresh();
    } catch (err) {
      setGenError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  // ── Set active ──────────────────────────────────────────────────────────
  async function handleSetActive(type: "uploaded" | "generated") {
    setSettingActive(true);
    try {
      await fetch("/api/profile/resume", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_resume_type: type }),
      });
      setActiveType(type);
    } finally {
      setSettingActive(false);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* ── Uploaded ─────────────────────────────────────────────── */}
      <ResumeCard
        title="Uploaded Resume"
        description="Your own PDF file"
        isActive={activeType === "uploaded"}
        hasFile={hasUploaded}
        onSetActive={() => handleSetActive("uploaded")}
        settingActive={settingActive}
        viewUrl="/api/profile/resume?type=uploaded"
        error={uploadError}
        actions={
          <label className={`cursor-pointer border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading ? "Uploading…" : hasUploaded ? "Replace" : "Upload PDF"}
            <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        }
      />

      {/* ── Generated ────────────────────────────────────────────── */}
      <ResumeCard
        title="Generated Resume"
        description="Built from your profile"
        isActive={activeType === "generated"}
        hasFile={hasGenerated}
        onSetActive={() => handleSetActive("generated")}
        settingActive={settingActive}
        viewUrl="/api/profile/resume?type=generated"
        error={genError}
        actions={
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {generating ? "Generating…" : hasGenerated ? "Regenerate" : "Generate PDF"}
          </button>
        }
      />
    </div>
  );
}

function ResumeCard({
  title, description, isActive, hasFile, onSetActive, settingActive, viewUrl, error, actions,
}: {
  title: string;
  description: string;
  isActive: boolean;
  hasFile: boolean;
  onSetActive: () => void;
  settingActive: boolean;
  viewUrl: string;
  error: string;
  actions: React.ReactNode;
}) {
  return (
    <div className={`bg-white border-2 rounded-xl p-4 flex flex-col gap-3 transition-colors ${isActive ? "border-black" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        {isActive && (
          <span className="text-xs font-medium bg-black text-white px-2 py-0.5 rounded-full shrink-0">
            Active
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {actions}
        {hasFile && (
          <button
            onClick={() => window.open(viewUrl, "_blank")}
            className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            View
          </button>
        )}
      </div>

      {hasFile && !isActive && (
        <button
          onClick={onSetActive}
          disabled={settingActive}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 text-left"
        >
          Use for job applications →
        </button>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// ── PDF builder (extracted from GenerateResumeButton) ──────────────────────
function buildPdf(doc: import("jspdf").jsPDF, props: Omit<Props, "hasUploaded" | "hasGenerated" | "activeType">) {
  const W = 210;
  const marginX = 18;
  const contentW = W - marginX * 2;
  let y = 20;
  const lineH = 6;
  const sectionGap = 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(props.name || "Resume", marginX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  const meta: string[] = [];
  if (props.email) meta.push(props.email);
  const loc = [props.city, props.state, props.country].filter(Boolean).join(", ");
  if (loc) meta.push(loc);
  if (props.preferred_salary) meta.push(`${props.preferred_currency ?? "USD"} ${props.preferred_salary.toLocaleString()} / yr`);
  if (meta.length) { doc.text(meta.join("  ·  "), marginX, y); y += lineH; }

  doc.setDrawColor(200);
  doc.line(marginX, y, W - marginX, y);
  y += sectionGap;
  doc.setTextColor(0);

  function section(title: string) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(title.toUpperCase(), marginX, y); y += 1;
    doc.setDrawColor(0); doc.line(marginX, y, W - marginX, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  }

  function wrap(text: string, indent = 0) {
    const lines = doc.splitTextToSize(text, contentW - indent);
    lines.forEach((line: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, marginX + indent, y); y += lineH - 1;
    });
  }

  if (props.skills?.length) { section("Skills"); wrap(props.skills.join("  ·  ")); y += sectionGap; }
  if (props.languages?.length) { section("Languages"); wrap(props.languages.join("  ·  ")); y += sectionGap; }

  if (props.experience?.length) {
    section("Experience");
    for (const exp of props.experience) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(exp.title, marginX, y);
      const dateStr = [exp.start_date, exp.end_date].filter(Boolean).join(" – ");
      if (dateStr) { doc.setFontSize(9); doc.setTextColor(120); doc.text(dateStr, W - marginX, y, { align: "right" }); doc.setTextColor(0); }
      y += lineH - 1;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
      doc.text(exp.company, marginX, y); doc.setTextColor(0); y += lineH;
      if (exp.description) { doc.setFontSize(9); wrap(exp.description, 2); }
      y += 3;
    }
    y += sectionGap - 3;
  }

  if (props.education?.length) {
    section("Education");
    for (const edu of props.education) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(edu.school, marginX, y);
      const yearStr = [edu.start_year, edu.end_year].filter(Boolean).join(" – ");
      if (yearStr) { doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120); doc.text(yearStr, W - marginX, y, { align: "right" }); doc.setTextColor(0); }
      y += lineH - 1;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
      doc.text([edu.degree, edu.field].filter(Boolean).join(" · "), marginX, y);
      doc.setTextColor(0); y += lineH + 1;
    }
    y += sectionGap - 3;
  }

  if (props.portfolio?.length) {
    section("Portfolio");
    for (const item of props.portfolio) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(item.title, marginX, y); y += lineH - 1;
      if (item.url) { doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0, 80, 200); doc.text(item.url, marginX, y); doc.setTextColor(0); y += lineH - 1; }
      if (item.description) { doc.setFontSize(9); wrap(item.description, 2); }
      y += 3;
    }
  }

  return doc;
}
