"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RichEditor = dynamic(() => import("@/components/RichEditor"), { ssr: false });

type PageValues = {
  id?: string;
  slug?: string;
  title?: string;
  content?: string;
  published?: boolean;
};

export default function PageEditor({ initial }: { initial?: PageValues }) {
  const router  = useRouter();
  const isEdit  = !!initial?.id;
  const [title,     setTitle]     = useState(initial?.title ?? "");
  const [slug,      setSlug]      = useState(initial?.slug ?? "");
  const [content,   setContent]   = useState(initial?.content ?? "");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!isEdit) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url    = isEdit ? `/api/admin/cms/pages/${initial!.id}` : "/api/admin/cms/pages";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, content, published }),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      router.push("/admin/cms/pages");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="title">Page Title</label>
        <input id="title" type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Terms & Conditions" required
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="slug">
          Slug <span className="text-gray-400 font-normal">(URL: /p/slug)</span>
        </label>
        <input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. terms" required pattern="[a-z0-9-]+"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black font-mono" />
        <p className="text-xs text-gray-400">Lowercase letters, numbers and hyphens only.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Content</label>
        <RichEditor content={content} onChange={setContent} />
      </div>

      <div className="flex items-center gap-2">
        <input id="published" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)}
          className="w-4 h-4 accent-black" />
        <label htmlFor="published" className="text-sm font-medium">
          Published <span className="text-gray-400 font-normal">(visible on /p/slug)</span>
        </label>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
          {loading ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Page")}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg font-medium border hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
