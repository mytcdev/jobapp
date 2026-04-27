"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EducationItem, ExperienceItem, PortfolioItem } from "@/lib/schema";

interface Props {
  name?: string;
  email?: string;
  city?: string;
  state?: string;
  languages?: string[];
  country?: string;
  skills?: string[];
  preferred_salary?: number;
  preferred_currency?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  portfolio?: PortfolioItem[];
}

export default function GenerateResumeButton(props: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setStatus("idle");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      const W = 210;
      const marginX = 18;
      const contentW = W - marginX * 2;
      let y = 20;

      const lineH = 6;
      const sectionGap = 8;

      // ── Header ──────────────────────────────────────────────────────────
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
      if (props.preferred_salary) {
        meta.push(`${props.preferred_currency ?? "USD"} ${props.preferred_salary.toLocaleString()} / yr`);
      }
      if (meta.length) {
        doc.text(meta.join("  ·  "), marginX, y);
        y += lineH;
      }

      const section = (title: string) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title.toUpperCase(), marginX, y);
        y += 1;
        doc.setDrawColor(0);
        doc.line(marginX, y, W - marginX, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      };

      const wrap = (text: string, indent = 0) => {
        const lines = doc.splitTextToSize(text, contentW - indent);
        lines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, marginX + indent, y);
          y += lineH - 1;
        });
      };

      doc.setDrawColor(200);
      doc.line(marginX, y, W - marginX, y);
      y += sectionGap;
      doc.setTextColor(0);

      // ── Skills ──────────────────────────────────────────────────────────
      if (props.skills?.length) {
        section("Skills");
        wrap(props.skills.join("  ·  "));
        y += sectionGap;
      }

      // ── Languages ───────────────────────────────────────────────────────
      if (props.languages?.length) {
        section("Languages");
        wrap(props.languages.join("  ·  "));
        y += sectionGap;
      }

      // ── Experience ──────────────────────────────────────────────────────
      if (props.experience?.length) {
        section("Experience");
        for (const exp of props.experience) {
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(exp.title, marginX, y);
          doc.setFont("helvetica", "normal");
          const dateStr = [exp.start_date, exp.end_date].filter(Boolean).join(" – ");
          if (dateStr) {
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(dateStr, W - marginX, y, { align: "right" });
            doc.setTextColor(0);
          }
          y += lineH - 1;
          doc.setFontSize(9);
          doc.setTextColor(80);
          doc.text(exp.company, marginX, y);
          doc.setTextColor(0);
          y += lineH;
          if (exp.description) {
            doc.setFontSize(9);
            wrap(exp.description, 2);
          }
          y += 3;
        }
        y += sectionGap - 3;
      }

      // ── Education ───────────────────────────────────────────────────────
      if (props.education?.length) {
        section("Education");
        for (const edu of props.education) {
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(edu.school, marginX, y);
          const yearStr = [edu.start_year, edu.end_year].filter(Boolean).join(" – ");
          if (yearStr) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(yearStr, W - marginX, y, { align: "right" });
            doc.setTextColor(0);
          }
          y += lineH - 1;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(80);
          doc.text([edu.degree, edu.field].filter(Boolean).join(" · "), marginX, y);
          doc.setTextColor(0);
          y += lineH + 1;
        }
        y += sectionGap - 3;
      }

      // ── Portfolio ───────────────────────────────────────────────────────
      if (props.portfolio?.length) {
        section("Portfolio");
        for (const item of props.portfolio) {
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(item.title, marginX, y);
          y += lineH - 1;
          if (item.url) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(0, 80, 200);
            doc.text(item.url, marginX, y);
            doc.setTextColor(0);
            y += lineH - 1;
          }
          if (item.description) {
            doc.setFontSize(9);
            wrap(item.description, 2);
          }
          y += 3;
        }
      }

      // Upload generated PDF to its own separate storage path
      const blob = doc.output("blob");
      const fd = new FormData();
      fd.append("resume", new File([blob], "generated.pdf", { type: "application/pdf" }));
      const res = await fetch("/api/profile/resume/generate", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to save resume");

      setStatus("success");
      router.refresh();
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Resume PDF"}
        </button>
        {status === "success" && (
          <button
            onClick={() => window.open("/api/profile/resume?type=generated", "_blank")}
            className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            View Generated
          </button>
        )}
      </div>
      {status === "success" && <p className="text-green-600 text-sm">Resume generated and saved.</p>}
      {status === "error" && <p className="text-red-500 text-sm">{errorMsg}</p>}
    </div>
  );
}
