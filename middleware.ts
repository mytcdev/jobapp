import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

type AppToken = {
  role?: string;
  onboardingComplete?: boolean;
};

export async function middleware(req: NextRequest) {
  const token = (await getToken({ req })) as (AppToken & Record<string, unknown>) | null;
  const role = token?.role;
  const { pathname } = req.nextUrl;

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/admin", req.url));
    if (role === "client") return NextResponse.redirect(new URL("/client", req.url));
    if (role === "staff")  return NextResponse.redirect(new URL("/staff", req.url));
    if (role !== "admin" && role !== "manager") return NextResponse.redirect(new URL("/", req.url));
    // Manager cannot access user management
    if (role === "manager" && pathname.startsWith("/admin/staff")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // ── Client routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/client")) {
    if (!token) return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/client", req.url));
    if (role !== "client" && role !== "admin") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // ── Staff route ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/staff")) {
    if (!token) return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/staff", req.url));
    if (role !== "staff" && role !== "admin") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // ── Auth-required routes ──────────────────────────────────────────────────
  if (pathname.startsWith("/profile") || pathname.startsWith("/applications")) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
      );
    }
    // Internal users don't use the applicant-facing profile/applications pages
    if (role && role !== "user") return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/onboarding")) {
    if (!token) return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/onboarding", req.url));
    return NextResponse.next();
  }

  // ── Non-onboarded regular users (new social sign-ups only) ──────────────
  if (
    token &&
    role === "user" &&
    token.onboardingComplete === false &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/api")
  ) {
    const from = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/onboarding?from=${from}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets, Next.js internals, and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)",
  ],
};
