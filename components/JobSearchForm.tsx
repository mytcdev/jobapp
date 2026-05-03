"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Country list ──────────────────────────────────────────────────────────────
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Belarus",
  "Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina",
  "Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia",
  "Cameroon","Canada","Chad","Chile","China","Colombia","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Fiji","Finland","France",
  "Gabon","Georgia","Germany","Ghana","Greece","Guatemala","Guinea","Haiti",
  "Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Libya","Liechtenstein","Lithuania",
  "Luxembourg","Madagascar","Malaysia","Maldives","Mali","Malta","Mauritius",
  "Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique",
  "Myanmar","Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger",
  "Nigeria","North Korea","Norway","Oman","Pakistan","Panama","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain",
  "Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tajikistan",
  "Tanzania","Thailand","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  defaultTitle?: string;
  defaultCountry?: string;
  variant?: "hero" | "bar";
}

export default function JobSearchForm({
  defaultTitle = "",
  defaultCountry = "",
  variant = "bar",
}: Props) {
  const router = useRouter();

  const [title, setTitle]     = useState(defaultTitle);
  const [country, setCountry] = useState(defaultCountry);

  // ── Title autocomplete ────────────────────────────────────────────────────
  const [suggestions, setSuggestions]   = useState<string[]>([]);
  const [showSuggest, setShowSuggest]   = useState(false);
  const [activeSuggest, setActiveSuggest] = useState(-1);
  const debouncedTitle = useDebounce(title, 200);
  const suggestRef = useRef<HTMLDivElement>(null);
  const titleRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedTitle.length < 1) { setSuggestions([]); return; }
    fetch(`/api/jobs/titles?q=${encodeURIComponent(debouncedTitle)}`)
      .then((r) => r.json())
      .then((d) => setSuggestions(d.titles ?? []))
      .catch(() => setSuggestions([]));
  }, [debouncedTitle]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function pickSuggestion(s: string) {
    setTitle(s);
    setSuggestions([]);
    setShowSuggest(false);
    setActiveSuggest(-1);
  }

  function onTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggest((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggest((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeSuggest >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeSuggest]);
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggest(false);
    const params = new URLSearchParams();
    if (title.trim())   params.set("q", title.trim());
    if (country.trim()) params.set("country", country.trim());
    router.push(`/jobs${params.toString() ? `?${params}` : ""}`);
  }

  // ── Sizing tokens ─────────────────────────────────────────────────────────
  const isHero = variant === "hero";
  const inputCls = isHero
    ? "w-full border border-gray-200 rounded-xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
    : "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white";
  const btnCls = isHero
    ? "bg-emerald-700 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-emerald-800 transition-colors whitespace-nowrap shadow-sm"
    : "bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-emerald-800 transition-colors whitespace-nowrap shadow-sm";

  const countryId = `country-list-${variant}`;

  return (
    <form
      onSubmit={handleSubmit}
      className={isHero
        ? "w-full max-w-2xl flex flex-col sm:flex-row sm:items-start gap-3"
        : "flex flex-col sm:flex-row sm:items-start gap-2 mb-6"
      }
    >
      {/* ── Title field with autocomplete ── */}
      <div className="relative w-full sm:flex-1" ref={suggestRef}>
        <input
          ref={titleRef}
          type="text"
          name="q"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setShowSuggest(true); setActiveSuggest(-1); }}
          onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
          onKeyDown={onTitleKeyDown}
          placeholder="Job title or keyword"
          autoComplete="off"
          className={inputCls}
        />

        {showSuggest && suggestions.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li
                key={s}
                onMouseDown={() => pickSuggestion(s)}
                className={`px-4 py-2.5 text-sm cursor-pointer ${
                  i === activeSuggest ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                }`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Country field with datalist ── */}
      <div className={`w-full ${isHero ? "sm:w-52" : "sm:w-48"}`}>
        <input
          type="text"
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country"
          list={countryId}
          autoComplete="off"
          className={inputCls}
        />
        <datalist id={countryId}>
          {COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 shrink-0">
        <button type="submit" className={`w-full sm:w-auto ${btnCls}`}>
          Search
        </button>
        {(defaultTitle || defaultCountry) && (
          <a
            href="/jobs"
            className={`flex items-center px-4 text-gray-500 hover:text-gray-800 whitespace-nowrap ${isHero ? "text-base" : "text-sm"}`}
          >
            Clear
          </a>
        )}
      </div>
    </form>
  );
}
