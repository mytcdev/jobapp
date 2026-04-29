"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; slug: string };

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function CategoriesManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      const created = await res.json();
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName(""); setSlug("");
      router.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleEdit(id: string) {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), slug: editSlug.trim() }),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
      setEditId(null);
      router.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? It will be removed from all jobs.")) return;
    setError("");
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) { const { error: msg } = await res.json(); setError(msg); return; }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white border rounded-xl p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-sm">Add Category</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Name</label>
            <input
              value={name} required placeholder="e.g. Software"
              onChange={(e) => { setName(e.target.value); setSlug(toSlug(e.target.value)); }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Slug</label>
            <input
              value={slug} required placeholder="e.g. software"
              onChange={(e) => setSlug(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
          {loading ? "Adding…" : "Add Category"}
        </button>
      </form>

      {/* List */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">No categories yet.</p>
        ) : (
          <ul className="divide-y">
            {categories.map((cat) => (
              <li key={cat.id} className="px-4 py-3">
                {editId === cat.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={editName} onChange={(e) => { setEditName(e.target.value); setEditSlug(toSlug(e.target.value)); }}
                        className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                      <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)}
                        className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                    </div>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(cat.id)} disabled={loading}
                        className="text-xs px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
                        Save
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-gray-400">/jobs?category={cat.slug}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditSlug(cat.slug); setError(""); }}
                        className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-50">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(cat.id)}
                        className="text-xs px-3 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
