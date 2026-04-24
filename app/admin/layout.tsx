import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AdminMobileNav from "./AdminMobileNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(getAuthOptions());
  const role = session?.user.role;

  if (role !== "admin" && role !== "manager" && role !== "staff") {
    redirect("/");
  }

  // Count new (pending) applications for the notification bubble
  const { count: pendingCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const pending = pendingCount ?? 0;

  const navLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/jobs", label: "Jobs" },
    ...(role !== "manager" ? [{ href: "/admin/applications", label: "Applications", badge: pending > 0 ? pending : null }] : [{ href: "/admin/applications", label: "Applications", badge: pending > 0 ? pending : null }]),
    { href: "/admin/applicants", label: "Applicants" },
    { href: "/admin/cms/pages",  label: "Pages" },
    { href: "/admin/cms/menus",  label: "Menus" },
    ...(role === "admin" ? [{ href: "/admin/staff", label: "Users" }] : []),
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-8">
      {/* Mobile top nav */}
      <AdminMobileNav links={navLinks} />

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-44 shrink-0">
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">
          Admin
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between text-gray-600 hover:text-gray-900 py-1"
            >
              <span>{link.label}</span>
              {"badge" in link && link.badge ? (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white">
                  {link.badge > 99 ? "99+" : link.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
