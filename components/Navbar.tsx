"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { MenuItem } from "@/lib/menus";
import JobSearchForm from "@/components/JobSearchForm";

export default function Navbar({ menuItems = [] }: { menuItems?: MenuItem[] }) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isAdmin = session?.user.role === "admin" || session?.user.role === "staff";
  const isUser = session?.user.role === "user";
  const isClient = session?.user.role === "client";
  const hasNotifications = isUser || isClient;

  useEffect(() => {
    if (!hasNotifications) { setUnread(0); return; }
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => {});
  }, [hasNotifications, pathname]);

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

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  const initial = session?.user.name?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-3 flex items-center justify-between gap-6">

          {/* ── Left: logo + nav links ──────────────────────────────── */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/logo-icon.png" alt="KareerHub" width={36} height={36} className="h-9 w-auto" />
              <span className="text-xl font-black tracking-tight leading-none">
                <span style={{ color: "#0F4A2E" }}>Kareer</span><span style={{ color: "#E53935" }}>H</span><span style={{ color: "#F57C00" }}>ub</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
              {menuItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <Link key={item.id} href={item.url}
                    target={item.openNewTab ? "_blank" : undefined}
                    rel={item.openNewTab ? "noopener noreferrer" : undefined}
                    className={`transition-colors pb-0.5 ${isActive ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-600 hover:text-emerald-700"}`}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Right: actions ──────────────────────────────────────── */}
          <div className="flex items-center gap-3">

            {/* Loading skeleton */}
            {status === "loading" && (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            )}

            {/* Signed-in */}
            {status !== "loading" && session && (
              <>
                {isAdmin && (
                  <Link href="/admin"
                    className="hidden md:flex items-center gap-1.5 text-sm font-semibold bg-[#0F4A2E] text-white px-4 py-2 rounded-[10px] hover:bg-emerald-900 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin
                  </Link>
                )}

                {/* Notifications bell */}
                {hasNotifications && (
                  <Link href="/notifications"
                    className="relative inline-flex items-center justify-center p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-lg transition-colors"
                    aria-label="Notifications">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </Link>
                )}

                {/* User avatar + dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0F4A2E] text-white text-sm font-bold hover:bg-emerald-900 transition-colors"
                    aria-label="Account menu"
                  >
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt={initial} className="w-9 h-9 rounded-full object-cover" />
                    ) : initial}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 text-sm z-50">
                      <div className="px-3 py-2.5 border-b border-gray-100">
                        <p className="font-semibold truncate">{session.user.name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{session.user.email}</p>
                      </div>
                      {isUser && (
                        <>
                          <Link href="/profile" className="block px-3 py-2 hover:bg-gray-50 text-gray-700" onClick={() => setUserMenuOpen(false)}>
                            Edit Profile
                          </Link>
                          <Link href="/applications" className="block px-3 py-2 hover:bg-gray-50 text-gray-700" onClick={() => setUserMenuOpen(false)}>
                            My Applications
                          </Link>
                        </>
                      )}
                      {isClient && (
                        <Link href="/client" className="block px-3 py-2 hover:bg-gray-50 text-gray-700" onClick={() => setUserMenuOpen(false)}>
                          Client Dashboard
                        </Link>
                      )}
                      {isAdmin && (
                        <Link href="/admin" className="block px-3 py-2 hover:bg-gray-50 text-gray-700 md:hidden" onClick={() => setUserMenuOpen(false)}>
                          Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-gray-100 my-1" />
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

            {/* Signed-out */}
            {status !== "loading" && !session && (
              <Link href="/auth/signin"
                className="flex items-center gap-2 text-sm font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-[10px] px-4 py-2 transition-colors">
                Sign In
              </Link>
            )}

            {/* ── Mobile burger ─────────────────────────────── */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-gray-900 hover:bg-slate-50 transition-colors"
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

        {/* ── Search sub-bar (hidden on homepage) ────────────────────── */}
        {pathname !== "/" && (
          <div className="border-t border-gray-100/80">
            <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-center">
              <button
                onClick={() => setSearchOpen((o) => !o)}
                aria-expanded={searchOpen}
                className="flex items-center gap-1.5 py-1.5 text-sm font-semibold text-gray-400 hover:text-emerald-700 transition-colors group"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                </svg>
                Search jobs
                <svg
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${searchOpen ? "rotate-180 text-emerald-600" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div
              style={{
                maxHeight: searchOpen ? "200px" : "0",
                overflow: "hidden",
                transition: "max-height 0.28s ease",
              }}
            >
              <div className="max-w-7xl mx-auto px-6 md:px-8 pb-4 pt-1">
                <JobSearchForm variant="bar" />
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile dropdown ────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-md px-4 py-3 flex flex-col gap-0.5 text-sm">
            {menuItems.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
              return (
                <Link key={item.id} href={item.url}
                  target={item.openNewTab ? "_blank" : undefined}
                  rel={item.openNewTab ? "noopener noreferrer" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-lg font-semibold ${isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-700 hover:bg-slate-50"}`}>
                  {item.label}
                </Link>
              );
            })}

            {status !== "loading" && session ? (
              <>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold">
                    Admin Panel
                  </Link>
                )}
                {isUser && (
                  <>
                    <Link href="/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold">
                      Edit Profile
                    </Link>
                    <Link href="/applications" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold">
                      My Applications
                    </Link>
                  </>
                )}
                {isClient && (
                  <Link href="/client" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold">
                    Client Dashboard
                  </Link>
                )}
                {hasNotifications && (
                  <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold">
                    Notifications
                    {unread > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </Link>
                )}
                <div className="border-t border-gray-100 mt-1 pt-2">
                  <p className="px-3 text-xs text-gray-400 truncate mb-1">{session.user.name} · {session.user.email}</p>
                  <button
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : status !== "loading" ? (
              <Link href="/auth/signin" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold">
                Sign In
              </Link>
            ) : null}
          </div>
        )}
      </nav>
    </>
  );
}
