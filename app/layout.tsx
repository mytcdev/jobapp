export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getMenu } from "@/lib/menus";
import SwRegister from "@/components/SwRegister";
import PwaBanner from "@/components/PwaBanner";
import ConditionalShell from "./ConditionalShell";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kareerhub.example.com";
const SITE_NAME = "KareerHub";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Smarter Matching. Better Careers.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Smart job portal with skill matching. Browse thousands of open positions and see your exact match percentage for every job.",
  keywords: ["jobs", "job search", "career", "skill matching", "hiring", "remote jobs"],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Find Your Next Role`,
    description: "Smart job portal with skill matching. Browse open positions and see your exact skill match.",
    url: SITE_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} – Find Your Next Role`,
    description: "Smart job portal with skill matching.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headerItems, footerItems] = await Promise.all([
    getMenu("header"),
    getMenu("footer"),
  ]);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#f9f9fc] text-gray-900 min-h-screen flex flex-col">
        <Providers>
          <ConditionalShell
            navbar={<Navbar menuItems={headerItems} />}
            footer={<Footer items={footerItems} />}
          >
            {children}
          </ConditionalShell>
          <PwaBanner />
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
