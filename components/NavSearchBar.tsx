"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import JobSearchForm from "@/components/JobSearchForm";

export default function NavSearchBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Hero already has search; hide here on homepage
  if (pathname === "/") return null;

  return (
    <div className="bg-white border-b border-gray-100 shadow-[0_1px_0_rgba(15,74,46,0.04)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Trigger tag */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full flex items-center gap-2.5 py-2.5 text-sm text-gray-400 hover:text-emerald-700 transition-colors group"
        >
          <svg
            className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-emerald-600 transition-colors"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <span className="font-medium">Search jobs&hellip;</span>
          <svg
            className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-emerald-600" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Slide-down form */}
        <div
          ref={formRef}
          style={{
            maxHeight: open ? "240px" : "0",
            overflow: "hidden",
            transition: "max-height 0.28s ease",
          }}
        >
          <div className="pb-4">
            <JobSearchForm variant="bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
