import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import ClientMobileNav from "./ClientMobileNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(getAuthOptions());
  if (!session || (session.user.role !== "client" && session.user.role !== "admin")) {
    redirect("/");
  }

  // Notification count: pending applications on this client's jobs
  let pendingCount = 0;
  if (session.user.staffId) {
    const { data: jobs } = await getSupabase()
      .from("jobs")
      .select("id")
      .eq("owner_id", session.user.staffId);
    if (jobs?.length) {
      const { count } = await getSupabase()
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("job_id", jobs.map((j) => j.id))
        .eq("status", "pending");
      pendingCount = count ?? 0;
    }
  }

  const navLinks = [
    { href: "/client",              label: "Dashboard" },
    { href: "/client/jobs",         label: "My Jobs" },
    { href: "/client/applications", label: "Applications", badge: pendingCount > 0 ? pendingCount : null },
    { href: "/client/profile",      label: "Profile" },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-8">
      <ClientMobileNav links={navLinks} />

      <aside className="hidden md:block w-44 shrink-0">
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">
          {session.user.name}
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
