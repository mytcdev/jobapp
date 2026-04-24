"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { MenuItem } from "@/lib/menus";

export default function Navbar({ menuItems = [] }: { menuItems?: MenuItem[] }) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isAdmin = session?.user.role === "admin" || session?.user.role === "staff";
  const isUser = session?.user.role === "user";
  const isClient = session?.user.role === "client";
  const hasNotifications = isUser || isClient;

  // Fetch unread notification count for applicants and clients
  useEffect(() => {
    if (!hasNotifications) { setUnread(0); return; }
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => {});
  }, [hasNotifications, pathname]);

  // Re-fetch instantly when a push notification arrives (SW → tab postMessage)
  useEffect(() => {
    if (!hasNotifications || !("serviceWorker" in navigator)) return;
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== "push") return;
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => setUnread(d.unread ?? 0))
        .catch(() => {});
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [hasNotifications]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const initial = session?.user.name?.[0]?.toUpperCase() ?? "U";

  return (
    <nav className="border-b bg-white relative z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg tracking-tight shrink-0">
          JobApp
        </Link>

        {/* ── Desktop nav ──────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.url}
              target={item.openNewTab ? "_blank" : undefined}
              rel={item.openNewTab ? "noopener noreferrer" : undefined}
              className="text-gray-600 hover:text-gray-900">
              {item.label}
            </Link>
          ))}

          {/* Loading skeleton */}
          {status === "loading" && (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          )}

          {/* Signed-in state */}
          {status !== "loading" && session && (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  Admin
                </Link>
              )}

              {/* Bell icon — visible for users and clients */}
              {hasNotifications && (
                <Link href="/notifications" className="relative inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-900" aria-label="Notifications">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              )}

              {/* User avatar + dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                  aria-label="Account menu"
                >
                  {initial}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border rounded-xl shadow-lg py-1 text-sm z-50">
                    <div className="px-3 py-2 border-b">
                      <p className="font-medium truncate">{session.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    </div>
                    {isUser && (
                      <>
                        <Link
                          href="/profile"
                          className="block px-3 py-2 hover:bg-gray-50 text-gray-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Edit Profile
                        </Link>
                        <Link
                          href="/applications"
                          className="block px-3 py-2 hover:bg-gray-50 text-gray-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Applications
                        </Link>
                      </>
                    )}
                    {isClient && (
                      <Link
                        href="/client"
                        className="block px-3 py-2 hover:bg-gray-50 text-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Client Dashboard
                      </Link>
                    )}
                    <div className="border-t my-1" />
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Signed-out state */}
          {status !== "loading" && !session && (
            <Link
              href="/auth/signin"
              className="bg-black text-white px-4 py-1.5 rounded-md hover:bg-gray-800"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* ── Mobile right side ────────────────────────────────────── */}
        <div className="flex md:hidden items-center gap-2">
          {status !== "loading" && session && hasNotifications && (
            <Link href="/notifications" className="relative inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-900" aria-label="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-0.5 shadow-sm text-sm">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.url}
              target={item.openNewTab ? "_blank" : undefined}
              rel={item.openNewTab ? "noopener noreferrer" : undefined}
              className="px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              {item.label}
            </Link>
          ))}

          {status !== "loading" && session ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  Admin
                </Link>
              )}
              {isUser && (
                <>
                  <Link href="/profile" className="px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                    Edit Profile
                  </Link>
                  <Link href="/applications" className="px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                    My Applications
                  </Link>
                </>
              )}
              {isClient && (
                <Link href="/client" className="px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  Client Dashboard
                </Link>
              )}
              {hasNotifications && (
                <Link href="/notifications" className="flex items-center justify-between px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  Notifications
                  {unread > 0 && (
                    <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              )}
              <div className="border-t mt-1 pt-2">
                <p className="px-2 text-xs text-gray-400 truncate mb-1">{session.user.name} · {session.user.email}</p>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : status !== "loading" ? (
            <Link href="/auth/signin" className="px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              Sign in
            </Link>
          ) : null}
        </div>
      )}
    </nav>
  );
}
