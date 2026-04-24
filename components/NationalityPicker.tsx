"use client";

import { useState, useRef, useEffect } from "react";
import { Country } from "country-state-city";

const ALL_COUNTRY_NAMES = Country.getAllCountries().map((c) => c.name);

interface Props {
  initialValue?: string | null;
  name?: string;
}

export default function NationalityPicker({ initialValue = "", name = "accepted_nationality" }: Props) {
  const parse = (v: string | null | undefined) =>
    (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const [selected, setSelected] = useState<string[]>(() => parse(initialValue));
  const [input, setInput]       = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx]     = useState(-1);
  const [open, setOpen]               = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function updateSuggestions(q: string) {
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    const filtered = ALL_COUNTRY_NAMES.filter(
      (n) => n.toLowerCase().includes(q.toLowerCase()) && !selected.includes(n),
    ).slice(0, 10);
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
    setActiveIdx(-1);
  }

  function addCountry(name: string) {
    if (!name.trim() || selected.includes(name)) return;
    setSelected((prev) => [...prev, name]);
    setInput("");
    setSuggestions([]);
    setOpen(false);
  }

  function removeCountry(name: string) {
    setSelected((prev) => prev.filter((c) => c !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        addCountry(suggestions[activeIdx]);
      } else if (input.trim()) {
        addCountry(input.trim());
      }
    } else if (e.key === "Backspace" && !input && selected.length > 0) {
      removeCountry(selected[selected.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const inputCls = "border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex flex-col gap-1" ref={wrapperRef}>
      <label className="text-sm font-medium">Open to citizens of</label>

      {/* Hidden input carries comma-separated value for FormData */}
      <input type="hidden" name={name} value={selected.join(", ") || ""} />

      <div
        className={`${inputCls} flex flex-wrap gap-1.5 min-h-[42px] cursor-text focus-within:ring-2 focus-within:ring-black`}
        onClick={() => (wrapperRef.current?.querySelector("input[type=text]") as HTMLInputElement | null)?.focus()}
      >
        {selected.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
            {c}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeCountry(c); }}
              className="text-gray-400 hover:text-gray-700 leading-none"
              aria-label={`Remove ${c}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); updateSuggestions(e.target.value); }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={selected.length === 0 ? "Type to search countries, leave blank for all…" : ""}
          className="flex-1 min-w-[160px] text-sm outline-none bg-transparent"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="relative">
          <ul className="absolute z-20 top-1 left-0 right-0 bg-white border rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto text-sm">
            {suggestions.map((c, i) => (
              <li key={c}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); addCountry(c); }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${i === activeIdx ? "bg-gray-50 font-medium" : ""}`}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400">Leave empty to accept all nationalities.</p>
    </div>
  );
}
