"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type MenuItem = { id: string; label: string; url: string; openNewTab: boolean };
type Location = "header" | "footer";

function SortableItem({
  item,
  onUpdate,
  onRemove,
}: {
  item: MenuItem;
  onUpdate: (id: string, field: keyof MenuItem, value: string | boolean) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}
      className="bg-white border rounded-xl px-3 py-3 flex items-center gap-3">
      {/* Drag handle */}
      <button type="button" {...attributes} {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
        </svg>
      </button>

      <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
        <input
          type="text"
          value={item.label}
          onChange={(e) => onUpdate(item.id, "label", e.target.value)}
          placeholder="Label"
          className="border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <input
          type="text"
          value={item.url}
          onChange={(e) => onUpdate(item.id, "url", e.target.value)}
          placeholder="URL e.g. /jobs or https://…"
          className="border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <label className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={item.openNewTab}
          onChange={(e) => onUpdate(item.id, "openNewTab", e.target.checked)}
          className="accent-black"
        />
        New tab
      </label>

      <button type="button" onClick={() => onRemove(item.id)}
        className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function MenuPanel({ location, initial }: { location: Location; initial: MenuItem[] }) {
  const [items,   setItems]   = useState<MenuItem[]>(initial);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  function addItem() {
    setItems((prev) => [...prev, {
      id: crypto.randomUUID(),
      label: "", url: "", openNewTab: false,
    }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof MenuItem, value: string | boolean) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  async function save() {
    setError(""); setSaved(false); setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/menus/${location}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) { const { error: msg } = await res.json(); throw new Error(msg); }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-xl">
          No items yet. Add one below.
        </p>
      )}

      <button type="button" onClick={addItem}
        className="text-sm text-gray-600 hover:text-gray-900 border border-dashed rounded-xl py-2 hover:bg-gray-50 transition-colors">
        + Add Item
      </button>

      {error  && <p className="text-red-500 text-sm">{error}</p>}

      <button type="button" onClick={save} disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm">
        {loading ? "Saving…" : saved ? "Saved ✓" : "Save Menu"}
      </button>
    </div>
  );
}

export default function MenuEditor({
  headerItems,
  footerItems,
}: {
  headerItems: MenuItem[];
  footerItems: MenuItem[];
}) {
  const [tab, setTab] = useState<Location>("header");

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["header", "footer"] as Location[]).map((loc) => (
          <button key={loc} type="button" onClick={() => setTab(loc)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === loc ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}>
            {loc}
          </button>
        ))}
      </div>

      {tab === "header"
        ? <MenuPanel key="header" location="header" initial={headerItems} />
        : <MenuPanel key="footer" location="footer" initial={footerItems} />
      }
    </div>
  );
}
