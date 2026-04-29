"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string };

interface Props {
  initialIds?: string[];
  name?: string;
}

export default function CategoryPicker({ initialIds = [], name = "category_ids" }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>(Array.isArray(initialIds) ? initialIds : []);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">Categories</label>
      <input type="hidden" name={name} value={selected.join(",")} />
      {categories.length === 0 ? (
        <p className="text-xs text-gray-400">No categories found. Add them in Admin → Categories.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggle(cat.id)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-400">Select all categories that apply.</p>
    </div>
  );
}
