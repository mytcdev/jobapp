"use client";

import { useState } from "react";

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

export default function ProfileForm({ initialBio }: { initialBio: string }) {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showExample, setShowExample] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed");
      }
      setStatus("success");
      setOpen(false);
      window.location.reload();
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        {status === "success" && (
          <p className="text-green-600 text-sm">Profile updated from resume.</p>
        )}
        <button
          onClick={() => setOpen(true)}
          className="border border-dashed rounded-xl py-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 w-full"
        >
          Auto-fill from Resume
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="bio">Bio / Resume Text</label>
          <button
            type="button"
            onClick={() => setShowExample((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showExample ? "Hide example" : "See example ↓"}
          </button>
        </div>

        {showExample && (
          <div className="border rounded-lg bg-gray-50 p-3">
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
          id="bio"
          rows={6}
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="e.g. Jane Doe, Frontend Developer in Kuala Lumpur. 5 years experience with React, TypeScript, Node.js. Worked at Acme Tech 2021–present. BSc Computer Science UM 2018. Targeting MYR 96,000/year…"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
          required
        />
        <p className="text-xs text-gray-400">
          Include name, location, work history, education, skills, languages and salary expectations. We'll extract and update your profile automatically.
        </p>
      </div>

      {status === "error" && <p className="text-red-500 text-sm">{errorMsg}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="bg-black text-white py-2 px-5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
          {loading ? "Extracting…" : "Extract & Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="border py-2 px-4 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
