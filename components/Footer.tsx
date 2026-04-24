import Link from "next/link";
import type { MenuItem } from "@/lib/menus";

export default function Footer({ items }: { items: MenuItem[] }) {
  if (!items.length) return null;

  return (
    <footer className="border-t bg-white mt-16">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            target={item.openNewTab ? "_blank" : undefined}
            rel={item.openNewTab ? "noopener noreferrer" : undefined}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
