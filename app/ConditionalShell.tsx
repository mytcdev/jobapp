"use client";

import { usePathname } from "next/navigation";

const DASHBOARD_ROOTS = ["/admin", "/client", "/staff"];

export default function ConditionalShell({
  navbar,
  footer,
  children,
}: {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_ROOTS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isDashboard) return <>{children}</>;

  return (
    <>
      {navbar}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>
      {footer}
    </>
  );
}
