"use client";

import { useState } from "react";

export default function RequirementsInput({ initial = [] }: { initial?: string[] }) {
  const [items, setItems] = useState<string[]>(initial.length ? initial : [""]);

  function update(i: number, val: string) {
    setItems((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  }

  function addRow() {
    setItems((prev) => [...prev, ""]);
  }

  function removeRow(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">Requirements</label>
      <div className="flex flex-col gap-2">
        {items.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              name="requirement"
              type="text"
              value={val}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`Requirement ${i + 1}`}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {items.length > 1 && (
              <button type="button" onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none px-1">
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow}
        className="self-start mt-1 text-sm text-emerald-700 hover:text-emerald-900 font-medium">
        + Add requirement
      </button>
    </div>
  );
}
