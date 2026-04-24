import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

async function sendToSubscriptions(
  column: "user_id" | "staff_id",
  value: string,
  payload: PushPayload,
) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq(column, value);

  if (!subs?.length) return;

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ),
    ),
  );

  // Remove expired / invalid subscriptions (410 Gone)
  const expired = subs.filter((_, i) => {
    const r = results[i];
    return r.status === "rejected" && (r.reason as any)?.statusCode === 410;
  });
  if (expired.length) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", expired.map((s) => s.id));
  }
}

export async function pushToUser(userId: string, payload: PushPayload) {
  await sendToSubscriptions("user_id", userId, payload);
}

export async function pushToStaff(staffId: string, payload: PushPayload) {
  await sendToSubscriptions("staff_id", staffId, payload);
}
