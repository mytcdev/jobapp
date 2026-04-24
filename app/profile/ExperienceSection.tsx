"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExperienceItem } from "@/lib/schema";

export default function ExperienceSection({ initial }: { initial: ExperienceItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<ExperienceItem[]>(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExperienceItem>({
    company: "", title: "", start_date: "", end_date: "", description: "",
  });

  async function save(next: ExperienceItem[]) {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experience: next }),
    });
    setSaving(false);
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const next = [...items, form];
    setItems(next);
    setAdding(false);
    setForm({ company: "", title: "", start_date: "", end_date: "", description: "" });
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
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-500">{item.company}</p>
              {(item.start_date || item.end_date) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.start_date}{item.start_date && item.end_date ? " – " : ""}{item.end_date}
                </p>
              )}
              {item.description && <p className="text-sm mt-1">{item.description}</p>}
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
            <Field label="Company" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} required />
            <Field label="Job Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required />
            <Field label="Start Date" value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} placeholder="e.g. Jan 2020" />
            <Field label="End Date" value={form.end_date} onChange={v => setForm(f => ({ ...f, end_date: v }))} placeholder="e.g. Present" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none" />
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
          + Add Experience
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
