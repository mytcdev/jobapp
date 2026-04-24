export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import Link from "next/link";

export default async function StaffDashboardPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session || session.user.role !== "staff") redirect("/");

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Welcome, {session.user.name}</h1>
      <p className="text-gray-500 mb-6">Staff portal</p>
      <Link href="/staff/profile"
        className="inline-block bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
        Manage Profile
      </Link>
    </div>
  );
}
