import UserSidebar from "@/components/UserSidebar";

export default function SavedJobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-8 items-start">
      <UserSidebar />
      <div className="flex-1 min-w-0 w-full">{children}</div>
    </div>
  );
}
