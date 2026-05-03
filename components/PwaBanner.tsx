"use client";

import { useState, useEffect, useCallback } from "react";

const DISMISS_KEY = "pwa-banner-dismissed";
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

type Mode = "android" | "ios" | null;

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function isDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    return ts ? Date.now() - Number(ts) < DISMISS_TTL : false;
  } catch {
    return false;
  }
}

export default function PwaBanner() {
  const [mode, setMode] = useState<Mode>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (!isMobile() || isStandalone() || isDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setMode("android");
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS doesn't fire beforeinstallprompt — show manual instructions
    if (isIos()) {
      // Only show if the android prompt didn't fire within 500 ms
      const t = setTimeout(() => {
        setMode((m) => (m === null ? "ios" : m));
      }, 500);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setMode(null);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
    dismiss();
  }, [deferredPrompt, dismiss]);

  if (!mode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 safe-area-bottom">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-start gap-3 max-w-lg mx-auto">
        {/* App icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/LOGO.jpg" alt="KareerHub" className="shrink-0 w-12 h-12 rounded-xl object-contain border border-gray-100" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Add KareerHub to your home screen</p>
          {mode === "android" ? (
            <p className="text-xs text-gray-500 mt-0.5">
              Install for quick access — works offline too.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">
              Tap <ShareIcon /> then <strong>&quot;Add to Home Screen&quot;</strong>.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mode === "android" && (
            <button
              onClick={install}
              className="bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Install
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      className="inline-block w-4 h-4 align-text-bottom mx-0.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
