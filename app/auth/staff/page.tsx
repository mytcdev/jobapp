import type { Metadata } from "next";
import { Suspense } from "react";
import StaffSignInForm from "./StaffSignInForm";

export const metadata: Metadata = { title: "Staff Sign In", robots: { index: false, follow: false } };

export default function StaffSignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Suspense>
        <StaffSignInForm />
      </Suspense>
    </div>
  );
}
