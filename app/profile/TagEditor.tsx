"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  field: "skills" | "languages";
  initial: string[];
  placeholder?: string;
}

export default function TagEditor({ field, initial, placeholder }: Props) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(initial);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function save(next: string[]) {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });
    setSaving(false);
    router.refresh();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      remove(tags.length - 1);
    }
  }

  function addTag() {
    const value = input.trim();
    if (!value || tags.includes(value)) {
      setInput("");
      return;
    }
    const next = [...tags, value];
    setTags(next);
    setInput("");
    save(next);
  }

  function remove(i: number) {
    const next = tags.filter((_, idx) => idx !== i);
    setTags(next);
    save(next);
  }

  return (
    <div
      className="bg-white border rounded-xl px-3 py-2.5 flex flex-wrap gap-1.5 cursor-text min-h-[44px]"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(i); }}
            className="text-gray-400 hover:text-gray-700 leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(); }}
        placeholder={tags.length === 0 ? (placeholder ?? "Type and press Enter…") : ""}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent py-0.5"
        disabled={saving}
      />
    </div>
  );
}
