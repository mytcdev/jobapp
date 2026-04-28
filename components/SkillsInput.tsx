"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  initialSkills?: string[];
  name?: string;
}

export default function SkillsInput({ initialSkills = [], name = "required_skills" }: Props) {
  const [skills, setSkills]           = useState<string[]>(Array.isArray(initialSkills) ? initialSkills : []);
  const [input, setInput]             = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx]     = useState(-1);
  const [open, setOpen]               = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/jobs/skills?q=${encodeURIComponent(q)}`);
      const { skills: all } = await res.json();
      const filtered = (all as string[]).filter((s) => !skills.includes(s));
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
      setActiveIdx(-1);
    }, 200);
  }, [skills]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setInput("");
    setSuggestions([]);
    setOpen(false);
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
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
        addSkill(suggestions[activeIdx]);
      } else if (input.trim()) {
        addSkill(input);
      }
    } else if (e.key === "Backspace" && !input && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-1" ref={wrapperRef}>
      <label className="text-sm font-medium">Required Skills</label>

      {/* Hidden input carries the comma-separated value for FormData */}
      <input type="hidden" name={name} value={skills.join(", ")} />

      <div
        className="border rounded-lg px-3 py-2 flex flex-wrap gap-1.5 min-h-[42px] cursor-text focus-within:ring-2 focus-within:ring-black"
        onClick={() => (wrapperRef.current?.querySelector("input[type=text]") as HTMLInputElement | null)?.focus()}
      >
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
            {s}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeSkill(s); }}
              className="text-gray-400 hover:text-gray-700 leading-none"
              aria-label={`Remove ${s}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); fetchSuggestions(e.target.value); }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={skills.length === 0 ? "Type a skill and press Enter or comma…" : ""}
          className="flex-1 min-w-[140px] text-sm outline-none bg-transparent"
        />
      </div>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <div className="relative">
          <ul className="absolute z-20 top-1 left-0 right-0 bg-white border rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto text-sm">
            {suggestions.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); addSkill(s); }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${i === activeIdx ? "bg-gray-50 font-medium" : ""}`}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400">Type to search existing skills or add a new one. Press Enter or comma to add.</p>
    </div>
  );
}
