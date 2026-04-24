"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink { href: string; label: string; badge?: number | null; }

export default function ClientMobileNav({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden mb-4">
      <div className="flex items-center justify-between border-b pb-3 mb-3">
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Client Portal</p>
        <button onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
          Menu
        </button>
      </div>
      {open && (
        <nav className="flex gap-2 flex-wrap text-sm">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/client" && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-colors ${
                  active ? "bg-black text-white" : "bg-white border text-gray-600 hover:text-gray-900"
                }`}>
                {link.label}
                {link.badge ? (
                  <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full bg-red-500 text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
