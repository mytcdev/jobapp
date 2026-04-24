import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";

let _authOptions: NextAuthOptions | null = null;

export function getAuthOptions(): NextAuthOptions {
  if (_authOptions) return _authOptions;

  _authOptions = {
    // No adapter — we manage user upsert manually in the jwt callback
    session: { strategy: "jwt" },
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      }),
      CredentialsProvider({
        id: "staff-login",
        name: "Staff Login",
        credentials: {
          username: { label: "Username", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.username || !credentials?.password) return null;

          const { data: staff } = await getSupabase()
            .from("staff_accounts")
            .select("id, username, password_hash, role, status")
            .eq("username", credentials.username)
            .single();

          if (!staff) return null;

          const valid = await bcrypt.compare(
            credentials.password,
            staff.password_hash,
          );
          if (!valid) return null;

          // Refuse login for blocked accounts
          if (staff.status === "blocked") return null;

          return {
            id: staff.id,
            name: staff.username,
            email: `${staff.username}@staff.internal`,
            role: staff.role as "admin" | "staff",
          };
        },
      }),
    ],
    callbacks: {
      async signIn({ user, account }) {
        // Allow staff (credentials) login unconditionally
        if (account?.provider === "staff-login") return true;
        // Block banned OAuth users
        if (user.email) {
          const { data } = await getSupabase()
            .from("users")
            .select("status")
            .eq("email", user.email)
            .maybeSingle();
          if (data?.status === "blocked") return "/auth/signin?error=AccountBlocked";
        }
        return true;
      },
      async jwt({ token, user, account }) {
        // `user` and `account` are only present on the first sign-in
        if (!user) return token;

        const isCredentials = account?.provider === "staff-login";

        if (isCredentials) {
          // Staff login — id and role come directly from the authorize() return
          token.id = user.id;
          token.staffId = user.id; // staff_accounts row id
          const staffRole = (user as { role?: string }).role;
          const validRoles = ["admin", "manager", "staff", "client"];
          token.role = validRoles.includes(staffRole ?? "") ? staffRole : "user";
        } else {
          // OAuth login — insert on first visit, update only image on return visits
          const db = getSupabase();
          const { data: existing } = await db
            .from("users")
            .select("id, onboarding_complete")
            .eq("email", user.email!)
            .maybeSingle();

          if (existing) {
            // Returning user — preserve their custom name, just refresh image
            await db.from("users").update({ image: user.image ?? null }).eq("id", existing.id);
            token.id = existing.id;
            token.onboardingComplete = existing.onboarding_complete ?? false;
          } else {
            // First login — seed with OAuth name as a starting default
            const { data: newUser } = await db
              .from("users")
              .insert({ email: user.email!, name: user.name ?? null, image: user.image ?? null })
              .select("id, onboarding_complete")
              .single();
            token.id = newUser?.id ?? token.sub;
            token.onboardingComplete = newUser?.onboarding_complete ?? false;
          }

          token.role = "user";
        }

        return token;
      },
      async session({ session, token }) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "manager" | "staff" | "client" | "user";
        session.user.staffId = token.staffId as string | undefined;
        session.user.onboardingComplete = (token.onboardingComplete as boolean | undefined) ?? true;
        return session;
      },
      async redirect({ url, baseUrl }) {
        return url.startsWith(baseUrl) ? url : baseUrl;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  };

  return _authOptions;
}
