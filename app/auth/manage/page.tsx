import { Suspense } from "react";
import StaffSignInForm from "../staff/StaffSignInForm";

export default function ManageSignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Suspense>
        <StaffSignInForm />
      </Suspense>
    </div>
  );
}
