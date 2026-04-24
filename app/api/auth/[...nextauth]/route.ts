export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

const handler = NextAuth(getAuthOptions());
export { handler as GET, handler as POST };
