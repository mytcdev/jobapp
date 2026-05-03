import { Resend } from "resend";
import nodemailer from "nodemailer";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "KareerHub";
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  ?? "https://itjob.asia";
const LOGO_URL  = `${SITE_URL}/logo-icon.png`;

const PROVIDER = process.env.EMAIL_PROVIDER ?? "resend";

// ─── Transport abstraction ───────────────────────────────────────────────────

interface SendOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

let _resend: Resend | null = null;
let _gmail: nodemailer.Transporter | null = null;

async function sendEmail(opts: SendOptions) {
  if (PROVIDER === "gmail") {
    if (!_gmail) {
      _gmail = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER!,
          pass: process.env.GMAIL_APP_PASSWORD!,
        },
      });
    }
    await _gmail.sendMail({
      from: opts.from,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
  } else {
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
    await _resend.emails.send({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
  }
}

function getFrom() {
  if (PROVIDER === "gmail") {
    return `${SITE_NAME} <${process.env.GMAIL_USER!}>`;
  }
  const domain = process.env.RESEND_FROM_EMAIL ?? `noreply@${new URL(SITE_URL).hostname}`;
  return `${SITE_NAME} <${domain}>`;
}

// ─── Shared template ─────────────────────────────────────────────────────────

function emailTemplate(opts: {
  badge:     { label: string; bg: string; color: string };
  headline:  string;
  greeting?: string;
  body:      string;
  table?:    { label: string; value: string }[];
  cta?:      { label: string; url: string; bg: string };
  footerNote: string;
}): string {
  const tableRows = (opts.table ?? [])
    .map((row, i, arr) => {
      const border = i < arr.length - 1 ? "border-bottom:1px solid #EAECEF;" : "";
      return `
        <tr>
          <td style="padding:11px 16px;color:#888;font-size:13px;width:110px;white-space:nowrap;vertical-align:top;${border}">${row.label}</td>
          <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#111;${border}">${row.value}</td>
        </tr>`;
    })
    .join("");

  const tableBlock = opts.table?.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;border-radius:8px;margin-bottom:24px;border:1px solid #EAECEF;">${tableRows}</table>`
    : "";

  const ctaBlock = opts.cta
    ? `<a href="${opts.cta.url}" style="display:block;text-align:center;background:${opts.cta.bg};color:#fff;font-size:14px;font-weight:600;padding:14px 24px;border-radius:8px;text-decoration:none;">${opts.cta.label}</a>`
    : "";

  const greetingBlock = opts.greeting
    ? `<p style="margin:0 0 6px;font-size:15px;color:#444;">Hi <strong>${opts.greeting}</strong>,</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SITE_NAME}</title></head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F4F5F7;padding:32px 16px;">
    <tr><td align="center">

      <!-- Header -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#0F4A2E;border-radius:12px 12px 0 0;">
        <tr>
          <td style="padding:18px 28px;">
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="vertical-align:middle;">
                  <div style="background:#fff;border-radius:10px;width:40px;height:40px;line-height:0;">
                    <img src="${LOGO_URL}" width="40" height="40" alt="${SITE_NAME}" style="border-radius:10px;display:block;" />
                  </div>
                </td>
                <td style="vertical-align:middle;padding-left:12px;">
                  <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;line-height:1;">${SITE_NAME}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Card -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="padding:32px;">

          <!-- Badge -->
          <div style="margin-bottom:20px;">
            <span style="display:inline-block;background:${opts.badge.bg};color:${opts.badge.color};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:5px 13px;border-radius:100px;">${opts.badge.label}</span>
          </div>

          <!-- Headline -->
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111;line-height:1.3;">${opts.headline}</h1>

          ${greetingBlock}

          <!-- Body -->
          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">${opts.body}</p>

          ${tableBlock}
          ${ctaBlock}

        </td></tr>
      </table>

      <!-- Footer -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td style="padding:20px 0;text-align:center;font-size:12px;color:#999;line-height:1.6;">
          © ${new Date().getFullYear()} ${SITE_NAME} &nbsp;·&nbsp; ${opts.footerNote}
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Status badge/button colours ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, { badgeBg: string; btnBg: string; label: string }> = {
  pending:     { badgeBg: "#F57C00", btnBg: "#F57C00", label: "Pending" },
  viewed:      { badgeBg: "#1D4ED8", btnBg: "#1D4ED8", label: "Viewed" },
  shortlisted: { badgeBg: "#3730A3", btnBg: "#3730A3", label: "Shortlisted" },
  interview:   { badgeBg: "#7C3AED", btnBg: "#7C3AED", label: "Interview" },
  offer:       { badgeBg: "#16A34A", btnBg: "#16A34A", label: "Offer" },
  declined:    { badgeBg: "#DC2626", btnBg: "#DC2626", label: "Declined" },
  expired:     { badgeBg: "#6B7280", btnBg: "#6B7280", label: "Expired" },
};

// ─── Email functions ──────────────────────────────────────────────────────────

export async function sendStatusChangeEmail(opts: {
  to: string;
  name: string;
  jobTitle: string;
  status: string;
  jobUrl: string;
}) {
  const colors = STATUS_COLORS[opts.status] ?? { badgeBg: "#6B7280", btnBg: "#6B7280", label: opts.status };
  const label  = colors.label;

  await sendEmail({
    from: getFrom(),
    to: opts.to,
    subject: `Application update: ${opts.jobTitle} — ${label}`,
    html: emailTemplate({
      badge:    { label: `Application ${label}`, bg: colors.badgeBg, color: "#fff" },
      headline: `Your application has been ${label.toLowerCase()}`,
      greeting: opts.name,
      body:     `Your application for <strong>${opts.jobTitle}</strong> has been updated to <strong>${label}</strong>. Log in to view your application details and any next steps.`,
      cta:      { label: "View My Application →", url: `${SITE_URL}${opts.jobUrl}`, bg: colors.btnBg },
      footerNote: `You're receiving this because you applied via ${SITE_NAME}.`,
    }),
  }).catch(() => {});
}

export async function sendNewApplicationEmail(opts: {
  to: string;
  staffName: string;
  applicantName: string;
  jobTitle: string;
  applicationsUrl: string;
}) {
  await sendEmail({
    from: getFrom(),
    to: opts.to,
    subject: `New application for ${opts.jobTitle}`,
    html: emailTemplate({
      badge:    { label: "New Application", bg: "#0F4A2E", color: "#fff" },
      headline: "You have a new applicant",
      greeting: opts.staffName,
      body:     `<strong>${opts.applicantName}</strong> has just applied for your listing <strong>${opts.jobTitle}</strong>. Review their profile and match score in your dashboard.`,
      cta:      { label: "Review Application →", url: `${SITE_URL}${opts.applicationsUrl}`, bg: "#0F4A2E" },
      footerNote: `${SITE_NAME} employer notification.`,
    }),
  }).catch(() => {});
}

export async function sendJobReportEmail(opts: {
  jobTitle: string;
  jobId: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  details?: string;
}) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (adminEmails.length === 0) return;

  const reasonLabel = opts.reason.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

  const table = [
    { label: "Job",      value: `<a href="${SITE_URL}/jobs/${opts.jobId}" style="color:#0F4A2E;">${opts.jobTitle}</a>` },
    { label: "Reason",   value: reasonLabel },
    { label: "Reporter", value: `${opts.reporterName} (${opts.reporterEmail})` },
    ...(opts.details ? [{ label: "Details", value: `<span style="white-space:pre-wrap">${opts.details}</span>` }] : []),
  ];

  await sendEmail({
    from: getFrom(),
    to: adminEmails,
    subject: `[Report] ${opts.jobTitle} — ${reasonLabel}`,
    html: emailTemplate({
      badge:    { label: "Job Report", bg: "#DC2626", color: "#fff" },
      headline: "A job listing has been reported",
      body:     "A user has flagged the listing below. Please review it and take appropriate action.",
      table,
      cta:      { label: "Review in Admin →", url: `${SITE_URL}/admin/reports`, bg: "#DC2626" },
      footerNote: `${SITE_NAME} moderation alert.`,
    }),
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

  await sendEmail({
    from: getFrom(),
    to: adminEmails,
    replyTo: opts.email,
    subject: `[Contact] ${opts.subject}`,
    html: emailTemplate({
      badge:    { label: "Contact Form", bg: "#6B7280", color: "#fff" },
      headline: "New contact form submission",
      body:     "Someone has sent a message through the contact form. Reply directly to this email to respond to them.",
      table: [
        { label: "Name",    value: opts.name },
        { label: "Email",   value: `<a href="mailto:${opts.email}" style="color:#0F4A2E;">${opts.email}</a>` },
        { label: "Subject", value: opts.subject },
        { label: "Message", value: `<span style="white-space:pre-wrap">${opts.message}</span>` },
      ],
      footerNote: `${SITE_NAME} contact form submission.`,
    }),
  }).catch(() => {});
}
