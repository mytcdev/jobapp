import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendContactEmail } from "@/lib/email";

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  // honeypot — must be empty
  website: z.string().max(0),
});

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const { allowed } = await checkRateLimit(`contact:${ip}`, 3, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    // Honeypot triggered or validation failed — return 200 to not tip off bots
    if (body?.website) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;
  await sendContactEmail({ name, email, subject, message });

  return NextResponse.json({ ok: true });
}
