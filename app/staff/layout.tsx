import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AdminLayoutClient, { type AdminNavLink } from "@/app/admin/AdminLayoutClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(getAuthOptions());
  const role = session?.user.role;

  if (role !== "admin" && role !== "manager" && role !== "staff") redirect("/");

  const { count: pendingCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const pending = pendingCount ?? 0;

  const links: AdminNavLink[] = [
    { href: "/staff",              label: "Dashboard",    icon: "dashboard",    exact: true },
    { href: "/staff/jobs",         label: "Jobs",         icon: "jobs" },
    { href: "/staff/applications", label: "Applications", icon: "applications", badge: pending > 0 ? pending : null },
    { href: "/staff/applicants",   label: "Applicants",   icon: "users" },
    { href: "/staff/profile",      label: "Profile",      icon: "user-admin" },
  ];

  return (
    <AdminLayoutClient
      links={links}
      userName={session?.user.name ?? "Staff"}
      userRole={role ?? "staff"}
    >
      {children}
    </AdminLayoutClient>
  );
}
