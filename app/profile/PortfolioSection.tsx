"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PortfolioItem } from "@/lib/schema";

export default function PortfolioSection({ initial }: { initial: PortfolioItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PortfolioItem>({ title: "", url: "", description: "" });

  async function save(next: PortfolioItem[]) {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolio: next }),
    });
    setSaving(false);
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const next = [...items, form];
    setItems(next);
    setAdding(false);
    setForm({ title: "", url: "", description: "" });
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
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all">
                  {item.url}
                </a>
              )}
              {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
            </div>
            <button onClick={() => handleRemove(i)} className="text-xs text-red-500 hover:text-red-700 shrink-0">
              Remove
            </button>
          </div>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <Field label="Project Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required />
            <Field label="URL (optional)" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://github.com/..." />
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
          + Add Portfolio Item
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
