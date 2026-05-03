import Link from "next/link";
import Image from "next/image";
import type { MenuItem } from "@/lib/menus";

export default function Footer({ items }: { items: MenuItem[] }) {
  return (
    <footer className="bg-emerald-900 border-t border-emerald-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image src="/logo-icon.png" alt="KareerHub" width={36} height={36} className="h-9 w-auto bg-white rounded-lg p-1" />
          <div>
            <span className="text-lg font-black tracking-tight leading-none">
              <span style={{ color: "#80b995" }}>Kareer</span><span style={{ color: "#E53935" }}>H</span><span style={{ color: "#F57C00" }}>ub</span>
            </span>
            <p className="text-emerald-400 text-xs mt-0.5">Smarter Matching. Better Careers.</p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target={item.openNewTab ? "_blank" : undefined}
                rel={item.openNewTab ? "noopener noreferrer" : undefined}
                className="text-sm text-emerald-200/70 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <p className="text-xs text-emerald-200/40">© {new Date().getFullYear()} KareerHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
