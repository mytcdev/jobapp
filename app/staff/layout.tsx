export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(getAuthOptions());
  if (!session || session.user.role !== "staff") redirect("/");

  const navLinks = [
    { href: "/staff",          label: "Dashboard" },
    { href: "/staff/profile",  label: "Profile" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-8">
      <aside className="hidden md:block w-44 shrink-0">
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">
          {session.user.name}
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="text-gray-600 hover:text-gray-900 py-1">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
