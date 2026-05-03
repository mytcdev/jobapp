import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AdminLayoutClient, { type AdminNavLink } from "./AdminLayoutClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(getAuthOptions());
  const role = session?.user.role;

  if (role !== "admin" && role !== "manager" && role !== "staff") redirect("/");

  const { count: pendingCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const pending = pendingCount ?? 0;

  const links: AdminNavLink[] = [
    { href: "/admin",              label: "Dashboard",   icon: "dashboard",    exact: true },
    { href: "/admin/jobs",         label: "Jobs",        icon: "jobs" },
    { href: "/admin/applications", label: "Applications",icon: "applications", badge: pending > 0 ? pending : null },
    { href: "/admin/applicants",   label: "Applicants",  icon: "users" },
    { href: "/admin/categories",   label: "Categories",  icon: "categories" },
    { href: "/admin/cms/pages",    label: "Pages",       icon: "document" },
    { href: "/admin/cms/menus",    label: "Menus",       icon: "menu" },
    ...(role === "admin" || role === "manager"
      ? [{ href: "/admin/reports", label: "Reports", icon: "flag" } as AdminNavLink]
      : []),
    ...(role === "admin"
      ? [{ href: "/admin/staff", label: "Users", icon: "user-admin" } as AdminNavLink]
      : []),
  ];

  return (
    <AdminLayoutClient
      links={links}
      userName={session?.user.name ?? "Admin"}
      userRole={role ?? "staff"}
    >
      {children}
    </AdminLayoutClient>
  );
}
