import { Resend } from "resend";

const FROM = "Expert Mobile <noreply@expertmobile.ca>";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function formatDateTime(date: Date, timezone = "America/Edmonton") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    weekday: "long", month: "long", day: "numeric",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

// ─── Templates ────────────────────────────────────────────────────────────────

function bookingCreatedHtml(data: {
  customerName: string;
  installerName: string;
  serviceNames: string[];
  scheduledStart: Date;
  address: string | null;
  timezone: string;
}) {
  return `
<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a2e">
  <div style="background:#3E3573;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Booking Confirmed</h1>
  </div>
  <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p>Hi ${data.customerName},</p>
    <p>Your booking has been created with <strong>${data.installerName}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#6b7280;width:140px">Date &amp; Time</td><td style="padding:8px 0;font-weight:600">${formatDateTime(data.scheduledStart, data.timezone)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Services</td><td style="padding:8px 0">${data.serviceNames.join(", ")}</td></tr>
      ${data.address ? `<tr><td style="padding:8px 0;color:#6b7280">Address</td><td style="padding:8px 0">${data.address}</td></tr>` : ""}
    </table>
    <p style="color:#6b7280;font-size:14px">If you need to make changes, please contact us at <a href="tel:+17805551000" style="color:#3E3573">780-555-1000</a>.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px">Expert Mobile Communications · Grande Prairie, AB</p>
  </div>
</div>`;
}

function bookingAssignedHtml(data: {
  installerName: string;
  customerName: string;
  customerPhone: string | null;
  serviceNames: string[];
  scheduledStart: Date;
  address: string | null;
  timezone: string;
}) {
  return `
<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a2e">
  <div style="background:#3E3573;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">New Job Assigned</h1>
  </div>
  <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p>Hi ${data.installerName},</p>
    <p>You have been assigned a new job.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#6b7280;width:140px">Customer</td><td style="padding:8px 0;font-weight:600">${data.customerName}</td></tr>
      ${data.customerPhone ? `<tr><td style="padding:8px 0;color:#6b7280">Phone</td><td style="padding:8px 0"><a href="tel:${data.customerPhone}" style="color:#3E3573">${data.customerPhone}</a></td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#6b7280">Date &amp; Time</td><td style="padding:8px 0;font-weight:600">${formatDateTime(data.scheduledStart, data.timezone)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Services</td><td style="padding:8px 0">${data.serviceNames.join(", ")}</td></tr>
      ${data.address ? `<tr><td style="padding:8px 0;color:#6b7280">Address</td><td style="padding:8px 0">${data.address}</td></tr>` : ""}
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px">Expert Mobile Communications · Grande Prairie, AB</p>
  </div>
</div>`;
}

function bookingCancelledHtml(data: {
  recipientName: string;
  customerName: string;
  scheduledStart: Date;
  timezone: string;
}) {
  return `
<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a2e">
  <div style="background:#dc2626;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Booking Cancelled</h1>
  </div>
  <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p>Hi ${data.recipientName},</p>
    <p>The booking for <strong>${data.customerName}</strong> on <strong>${formatDateTime(data.scheduledStart, data.timezone)}</strong> has been cancelled.</p>
    <p style="color:#6b7280;font-size:14px">Please contact us if you have any questions: <a href="tel:+17805551000" style="color:#3E3573">780-555-1000</a>.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px">Expert Mobile Communications · Grande Prairie, AB</p>
  </div>
</div>`;
}

// ─── Send functions ────────────────────────────────────────────────────────────

export async function sendBookingCreatedEmail(params: {
  customerEmail: string | null;
  customerName: string;
  installerName: string;
  serviceNames: string[];
  scheduledStart: Date;
  address: string | null;
  timezone: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.customerEmail) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.customerEmail,
      subject: `Booking Confirmed — ${formatDateTime(params.scheduledStart, params.timezone)}`,
      html: bookingCreatedHtml(params),
    });
  } catch (err) {
    console.error("[email] sendBookingCreatedEmail failed:", err);
  }
}

export async function sendBookingAssignedEmail(params: {
  installerEmail: string | null;
  installerName: string;
  customerName: string;
  customerPhone: string | null;
  serviceNames: string[];
  scheduledStart: Date;
  address: string | null;
  timezone: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.installerEmail) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.installerEmail,
      subject: `New Job: ${params.customerName} — ${formatDateTime(params.scheduledStart, params.timezone)}`,
      html: bookingAssignedHtml(params),
    });
  } catch (err) {
    console.error("[email] sendBookingAssignedEmail failed:", err);
  }
}

export async function sendBookingCancelledEmail(params: {
  recipientEmail: string | null;
  recipientName: string;
  customerName: string;
  scheduledStart: Date;
  timezone: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.recipientEmail) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.recipientEmail,
      subject: `Booking Cancelled — ${params.customerName}`,
      html: bookingCancelledHtml(params),
    });
  } catch (err) {
    console.error("[email] sendBookingCancelledEmail failed:", err);
  }
}
