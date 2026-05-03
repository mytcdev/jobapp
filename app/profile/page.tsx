export const dynamic = "force-dynamic";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import ManualProfileForm from "./ManualProfileForm";
import ProfileForm from "./ProfileForm";
import TagEditor from "./TagEditor";
import ExperienceSection from "./ExperienceSection";
import EducationSection from "./EducationSection";
import PortfolioSection from "./PortfolioSection";
import ResumeSection from "./ResumeSection";

export default async function ProfilePage() {
  const session = await getServerSession(getAuthOptions());
  if (!session) redirect("/auth/signin?callbackUrl=/profile");

  const { data: user } = await supabase.from("users").select("*").eq("id", session.user.id).single();

  if (user && !user.onboarding_complete) {
    redirect("/onboarding?from=/profile");
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      {/* ── Account Info ─────────────────────────────────────── */}
      <section className="bg-white border rounded-xl p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-lg">Account Info</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Field label="Name" value={user?.name} />
          <Field label="Email" value={user?.email} />
          <Field label="City" value={user?.city} />
          <Field label="State" value={user?.state} />
          <Field label="Country" value={user?.country} />
          {user?.preferred_salary && (
            <Field
              label="Preferred Salary"
              value={`${user.preferred_currency ?? "USD"} ${Number(user.preferred_salary).toLocaleString()}`}
            />
          )}
        </div>
      </section>

      {/* ── Edit Profile ─────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-3">Edit Profile</h2>
        <ManualProfileForm
          initialName={user?.name ?? ""}
          initialCity={user?.city ?? ""}
          initialState={user?.state ?? ""}
          initialCountry={user?.country ?? ""}
          initialSalary={user?.preferred_salary ?? undefined}
          initialCurrency={user?.preferred_currency ?? "USD"}
        />
      </section>

      {/* ── Skills ───────────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-1">Skills</h2>
        <p className="text-xs text-gray-400 mb-2">Type a skill and press Enter to add. Click × to remove.</p>
        <TagEditor field="skills" initial={user?.skills ?? []} placeholder="e.g. React, TypeScript…" />
      </section>

      {/* ── Languages ────────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-1">Languages</h2>
        <p className="text-xs text-gray-400 mb-2">Languages you speak. Type and press Enter to add.</p>
        <TagEditor field="languages" initial={user?.languages ?? []} placeholder="e.g. English, Mandarin…" />
      </section>

      {/* ── Experience ───────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-3">Experience</h2>
        <ExperienceSection initial={user?.experience ?? []} />
      </section>

      {/* ── Education ────────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-3">Education</h2>
        <EducationSection initial={user?.education ?? []} />
      </section>

      {/* ── Portfolio ────────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-3">Portfolio</h2>
        <PortfolioSection initial={user?.portfolio ?? []} />
      </section>

      {/* ── Resume ───────────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-1">Resume</h2>
        <p className="text-xs text-gray-400 mb-3">Choose which resume to submit with job applications.</p>
        <ResumeSection
          hasUploaded={!!user?.resume_path}
          hasGenerated={!!user?.generated_resume_path}
          activeType={user?.active_resume_type ?? null}
          name={user?.name}
          email={user?.email}
          city={user?.city}
          state={user?.state}
          country={user?.country}
          skills={user?.skills}
          languages={user?.languages}
          preferred_salary={user?.preferred_salary}
          preferred_currency={user?.preferred_currency}
          experience={user?.experience ?? []}
          education={user?.education ?? []}
          portfolio={user?.portfolio ?? []}
        />
      </section>

      {/* ── Auto-fill from Resume (on demand, end of page) ───────────── */}
      <section>
        <h2 className="font-semibold mb-1">Auto-fill from Resume</h2>
        <p className="text-xs text-gray-400 mb-3">
          Paste your full bio — we'll extract and update all fields above automatically.
        </p>
        <ProfileForm initialBio={user?.bio ?? ""} />
      </section>

    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
