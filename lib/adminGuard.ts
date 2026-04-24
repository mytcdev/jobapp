import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAuthOptions } from "@/lib/auth";

type Role = "admin" | "manager" | "staff" | "client";

async function guard(allowed: Role[]) {
  const session = await getServerSession(getAuthOptions());
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!allowed.includes(session.user.role as Role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

/** Admin only — user management, creating admin accounts */
export const requireAdmin  = () => guard(["admin"]);

/** Admin or Manager — job/application management */
export const requireManager = () => guard(["admin", "manager"]);

/** Admin, Manager, Staff — legacy alias kept for compatibility */
export const requireStaff  = () => guard(["admin", "manager", "staff"]);

/** Admin, Manager, or Client */
export const requireClient = () => guard(["admin", "manager", "client"]);

/** Any authenticated internal user */
export const requireAny    = () => guard(["admin", "manager", "staff", "client"]);
