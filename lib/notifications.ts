import { supabase } from "@/lib/supabase";
import { pushToUser, pushToStaff } from "@/lib/webpush";
import { sendStatusChangeEmail, sendNewApplicationEmail } from "@/lib/email";

export async function notifyUser(userId: string, message: string, link: string) {
  await supabase.from("notifications").insert({ user_id: userId, message, link });
  await pushToUser(userId, { title: "JobApp", body: message, url: link });

  // Email — fire-and-forget; requires message to match status-change pattern
  const { data: user } = await supabase
    .from("users")
    .select("email, name")
    .eq("id", userId)
    .single();

  if (user?.email) {
    const match = message.match(/^Your application for (.+) is now: (\w+)\.?$/i);
    if (match) {
      await sendStatusChangeEmail({
        to: user.email,
        name: user.name ?? "Applicant",
        jobTitle: match[1],
        status: match[2],
        jobUrl: link,
      });
    }
  }
}

export async function notifyStaff(
  staffId: string,
  message: string,
  link: string,
  meta?: { applicantName?: string; jobTitle?: string },
) {
  await supabase.from("notifications").insert({ staff_id: staffId, message, link });
  await pushToStaff(staffId, { title: "JobApp", body: message, url: link });

  // Email — fire-and-forget
  const { data: staff } = await supabase
    .from("staff_accounts")
    .select("email, name")
    .eq("id", staffId)
    .single();

  if (staff?.email && meta?.applicantName && meta?.jobTitle) {
    await sendNewApplicationEmail({
      to: staff.email,
      staffName: staff.name ?? "there",
      applicantName: meta.applicantName,
      jobTitle: meta.jobTitle,
      applicationsUrl: link,
    });
  }
}
