import { Resend } from "resend";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "JobApp";
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  ?? "http://localhost:3000";
const FROM      = process.env.RESEND_FROM_EMAIL ?? `noreply@${new URL(SITE_URL).hostname}`;

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

export async function sendStatusChangeEmail(opts: {
  to: string;
  name: string;
  jobTitle: string;
  status: string;
  jobUrl: string;
}) {
  const label = opts.status.charAt(0).toUpperCase() + opts.status.slice(1);
  await getResend().emails.send({
    from: `${SITE_NAME} <${FROM}>`,
    to: opts.to,
    subject: `Your application for ${opts.jobTitle} is now: ${label}`,
    html: `
      <p>Hi ${opts.name},</p>
      <p>Your application for <strong>${opts.jobTitle}</strong> has been updated to <strong>${label}</strong>.</p>
      <p><a href="${SITE_URL}${opts.jobUrl}">View your application →</a></p>
      <p style="color:#999;font-size:12px;">You're receiving this because you applied via ${SITE_NAME}.</p>
    `,
  }).catch(() => {});
}

export async function sendContactEmail(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (adminEmails.length === 0) return;
  await getResend().emails.send({
    from: `${SITE_NAME} <${FROM}>`,
    to: adminEmails,
    replyTo: opts.email,
    subject: `[Contact] ${opts.subject}`,
    html: `
      <p><strong>Name:</strong> ${opts.name}</p>
      <p><strong>Email:</strong> ${opts.email}</p>
      <p><strong>Subject:</strong> ${opts.subject}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${opts.message}</p>
      <p style="color:#999;font-size:12px;">${SITE_NAME} contact form submission</p>
    `,
  }).catch(() => {});
}

export async function sendNewApplicationEmail(opts: {
  to: string;
  staffName: string;
  applicantName: string;
  jobTitle: string;
  applicationsUrl: string;
}) {
  await getResend().emails.send({
    from: `${SITE_NAME} <${FROM}>`,
    to: opts.to,
    subject: `New application for ${opts.jobTitle}`,
    html: `
      <p>Hi ${opts.staffName},</p>
      <p><strong>${opts.applicantName}</strong> has applied for <strong>${opts.jobTitle}</strong>.</p>
      <p><a href="${SITE_URL}${opts.applicationsUrl}">Review application →</a></p>
      <p style="color:#999;font-size:12px;">${SITE_NAME} notification</p>
    `,
  }).catch(() => {});
}
