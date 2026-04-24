"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EducationItem } from "@/lib/schema";

export default function EducationSection({ initial }: { initial: EducationItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<EducationItem[]>(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EducationItem>({
    school: "", degree: "", field: "", start_year: "", end_year: "",
  });

  async function save(next: EducationItem[]) {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ education: next }),
    });
    setSaving(false);
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const next = [...items, form];
    setItems(next);
    setAdding(false);
    setForm({ school: "", degree: "", field: "", start_year: "", end_year: "" });
    await save(next);
  }

  async function handleRemove(i: number) {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    await save(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white border rounded-xl p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-medium">{item.school}</p>
              <p className="text-sm text-gray-500">
                {[item.degree, item.field].filter(Boolean).join(" · ")}
              </p>
              {(item.start_year || item.end_year) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.start_year}{item.start_year && item.end_year ? " – " : ""}{item.end_year}
                </p>
              )}
            </div>
            <button onClick={() => handleRemove(i)} className="text-xs text-red-500 hover:text-red-700 shrink-0">
              Remove
            </button>
          </div>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="School / University" value={form.school} onChange={v => setForm(f => ({ ...f, school: v }))} required />
            <Field label="Degree" value={form.degree} onChange={v => setForm(f => ({ ...f, degree: v }))} placeholder="e.g. Bachelor's" />
            <Field label="Field of Study" value={form.field} onChange={v => setForm(f => ({ ...f, field: v }))} placeholder="e.g. Computer Science" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start Year" value={form.start_year} onChange={v => setForm(f => ({ ...f, start_year: v }))} placeholder="2015" />
              <Field label="End Year" value={form.end_year} onChange={v => setForm(f => ({ ...f, end_year: v }))} placeholder="2019" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Saving…" : "Add"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="border px-4 py-1.5 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="border border-dashed rounded-xl py-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700">
          + Add Education
        </button>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} required={required}
        placeholder={placeholder}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
    </div>
  );
}
