export const dynamic = "force-dynamic";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "Complete Your Profile", robots: { index: false, follow: false } };

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const session = await getServerSession(getAuthOptions());
  if (!session) redirect(`/auth/signin?callbackUrl=/onboarding`);

  const { data: user } = await supabase
    .from("users")
    .select("onboarding_complete, name, email, city, state, country, skills, languages, preferred_salary, preferred_currency, experience, education, portfolio")
    .eq("id", session.user.id)
    .single();

  if (user?.onboarding_complete) {
    redirect(searchParams.from ?? "/jobs");
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12">
      <div className="w-full max-w-lg px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to JobApp</h1>
          <p className="text-gray-500">
            Set up your profile to get personalised job matches and apply in seconds.
          </p>
        </div>
        <OnboardingForm
          redirectTo={searchParams.from ?? "/jobs"}
          userProfile={user ?? null}
        />
      </div>
    </div>
  );
}
