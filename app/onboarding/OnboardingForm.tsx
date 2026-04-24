"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EducationItem, ExperienceItem, PortfolioItem } from "@/lib/schema";

type Tab = "bio" | "upload";

interface UserProfile {
  name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  skills?: string[] | null;
  languages?: string[] | null;
  preferred_salary?: number | null;
  preferred_currency?: string | null;
  experience?: ExperienceItem[] | null;
  education?: EducationItem[] | null;
  portfolio?: PortfolioItem[] | null;
}

interface Props {
  redirectTo: string;
  userProfile: UserProfile | null;
}

const EXAMPLE_BIO = `Jane Doe
Frontend Developer | Kuala Lumpur, Malaysia
jane.doe@email.com

EXPERIENCE
Senior Frontend Developer — Acme Tech Sdn Bhd (Mar 2021 – Present)
Lead the React/TypeScript dashboard used by 30,000+ customers. Reduced bundle size by 45% via code splitting and lazy loading. Mentored a team of 3 junior developers.

Frontend Developer — StartupX (Jun 2018 – Feb 2021)
Built and maintained Vue.js web apps. Worked in an Agile team alongside UX designers and backend engineers. Integrated REST APIs and third-party payment gateways.

EDUCATION
Bachelor of Computer Science — Universiti Malaya, 2014 – 2018

SKILLS
React, TypeScript, Vue.js, Node.js, Tailwind CSS, PostgreSQL, Docker, AWS

LANGUAGES
English (fluent), Bahasa Malaysia (native), Mandarin (conversational)

PORTFOLIO
OpenDash — https://opendash.io
An open-source analytics dashboard built with Next.js and Supabase.

SALARY
Targeting MYR 96,000/year`;

export default function OnboardingForm({ redirectTo, userProfile }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bio");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "generating">("form");
  const [showExample, setShowExample] = useState(false);

  // ── Bio / text path ──────────────────────────────────────────────────────
  async function handleBioSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bio.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Failed to save profile");
      }
      const { extracted, user } = await res.json();

      // Auto-generate resume PDF from extracted profile
      setStep("generating");
      await generateAndUploadResume({
        name: extracted.name ?? user?.name,
        email: user?.email,
        city: extracted.city ?? user?.city,
        state: extracted.state ?? user?.state,
        country: extracted.country ?? user?.country,
        skills: extracted.skills ?? [],
        languages: extracted.languages ?? [],
        preferred_salary: extracted.preferred_salary ?? user?.preferred_salary,
        preferred_currency: extracted.preferred_currency ?? user?.preferred_currency ?? "USD",
        experience: extracted.experience ?? [],
        education: extracted.education ?? [],
        portfolio: extracted.portfolio ?? [],
      });

      router.push(redirectTo);
    } catch (err) {
      setError((err as Error).message);
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  // ── PDF upload path ──────────────────────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Only PDF files are allowed."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("File must be under 2 MB."); return; }

    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/onboarding/resume", { method: "POST", body: fd });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Upload failed");
      }
      router.push(redirectTo);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  if (step === "generating") {
    return (
      <div className="bg-white border rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">⚙️</div>
        <p className="font-medium text-lg">Generating your resume…</p>
        <p className="text-sm text-gray-500 mt-1">This only takes a moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <TabButton active={tab === "bio"} onClick={() => setTab("bio")}>
          Write a bio
        </TabButton>
        <TabButton active={tab === "upload"} onClick={() => setTab("upload")}>
          Upload resume
        </TabButton>
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === "bio" ? (
          <form onSubmit={handleBioSubmit} className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">
                  Tell us about yourself
                </label>
                <button
                  type="button"
                  onClick={() => setShowExample((v) => !v)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showExample ? "Hide example" : "See example ↓"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Paste your resume text or write a bio including your skills, work experience, education, location, and salary expectations. We'll extract and fill your profile automatically.
              </p>

              {showExample && (
                <div className="mb-3 border rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Example</p>
                    <button
                      type="button"
                      onClick={() => { setBio(EXAMPLE_BIO); setShowExample(false); }}
                      className="text-xs bg-black text-white px-2.5 py-1 rounded-md hover:bg-gray-800"
                    >
                      Use this example
                    </button>
                  </div>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">{EXAMPLE_BIO}</pre>
                </div>
              )}

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={8}
                placeholder="e.g. Jane Doe, Frontend Developer in Kuala Lumpur. 5 years experience with React, TypeScript, Node.js. Worked at Acme Tech 2021–present. BSc Computer Science UM 2018. Targeting MYR 96,000/year…"
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !bio.trim()}
              className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Processing…" : "Build my profile"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-1.5">Upload your existing resume</p>
              <p className="text-xs text-gray-400 mb-4">
                We'll extract your profile details automatically. PDF only, max 2 MB.
              </p>
              <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${loading ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">
                    {loading ? "Uploading…" : "Click to choose a PDF"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF • max 2 MB</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </label>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-b-2 border-black text-black"
          : "text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

// ── PDF generation helper ────────────────────────────────────────────────────
interface PdfProps {
  name?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  skills?: string[];
  languages?: string[];
  preferred_salary?: number | null;
  preferred_currency?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  portfolio?: PortfolioItem[];
}

async function generateAndUploadResume(props: PdfProps) {
  const { jsPDF } = await import("jspdf");
  const doc = buildPdf(new jsPDF({ unit: "mm", format: "a4" }), props);
  const blob = doc.output("blob");
  const fd = new FormData();
  fd.append("resume", new File([blob], "generated.pdf", { type: "application/pdf" }));
  const res = await fetch("/api/profile/resume/generate", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Failed to generate resume");
  // Mark generated resume as the active one
  await fetch("/api/profile/resume", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active_resume_type: "generated" }),
  });
}

function buildPdf(doc: import("jspdf").jsPDF, props: PdfProps) {
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
