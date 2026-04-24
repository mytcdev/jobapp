export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getMenu } from "@/lib/menus";
import SwRegister from "@/components/SwRegister";
import PwaBanner from "@/components/PwaBanner";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobapp.example.com";
const SITE_NAME = "JobApp";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Find Your Next Role`,
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
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <Providers>
          <Navbar menuItems={headerItems} />
          <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>
          <Footer items={footerItems} />
          <PwaBanner />
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
