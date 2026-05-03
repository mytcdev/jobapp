import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import ClientLayoutClient, { type ClientNavLink } from "./ClientLayoutClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(getAuthOptions());
  if (!session || (session.user.role !== "client" && session.user.role !== "admin")) redirect("/");

  const db = getSupabase();
  const staffId = session.user.staffId;

  let pendingCount = 0;
  let companyName: string | null = null;
  let logoUrl: string | null = null;

  if (staffId) {
    const [jobsRes, staffRes] = await Promise.all([
      db.from("jobs").select("id").eq("owner_id", staffId),
      db.from("staff_accounts").select("company_name, company_logo").eq("id", staffId).single(),
    ]);

    companyName = staffRes.data?.company_name ?? null;
    logoUrl     = staffRes.data?.company_logo  ?? null;

    if (jobsRes.data?.length) {
      const { count } = await db
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("job_id", jobsRes.data.map((j) => j.id))
        .eq("status", "pending");
      pendingCount = count ?? 0;
    }
  }

  const links: ClientNavLink[] = [
    { href: "/client",              label: "Dashboard",   icon: "dashboard",    exact: true },
    { href: "/client/jobs",         label: "My Jobs",     icon: "jobs" },
    { href: "/client/applications", label: "Applications",icon: "applications", badge: pendingCount > 0 ? pendingCount : null },
    { href: "/client/profile",      label: "Profile",     icon: "building" },
  ];

  return (
    <ClientLayoutClient
      links={links}
      userName={session.user.name ?? "Employer"}
      companyName={companyName}
      logoUrl={logoUrl}
    >
      {children}
    </ClientLayoutClient>
  );
}
