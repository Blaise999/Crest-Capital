import { Resend } from "resend";
import {
  transferSubmittedTemplate,
  transferApprovedTemplate,
  transferRejectedTemplate,
  accountBlockedTemplate,
  accountUnblockedTemplate,
  welcomeTemplate,
  receiptTemplate,
  otpTemplate,
  onboardingApprovedTemplate,
  onboardingRejectedTemplate,
  type TransferEmailPayload,
  type ReceiptPayload,
} from "./templates";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function send(to: string, subject: string, html: string) {
  const from = process.env.MAIL_FROM || "Crest Capital <noreply@crestcapital.com>";
  const resend = getResend();
  if (!resend) {
    console.log("\n[email:dev] →", to);
    console.log("[email:dev] subject:", subject);
    return { ok: true, dev: true as const };
  }
  try {
    const r = await resend.emails.send({ from, to, subject, html });
    return { ok: true, id: (r as any)?.data?.id || null };
  } catch (e: any) {
    console.warn("[email] send failed:", e?.message || e);
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function sendWelcome(to: string, firstName: string) {
  return send(to, "Welcome to Crest Capital", welcomeTemplate({ firstName }));
}
export async function sendTransferSubmitted(to: string, p: TransferEmailPayload) {
  return send(to, `Transfer ${p.reference} submitted for review`, transferSubmittedTemplate(p));
}
export async function sendTransferApproved(to: string, p: TransferEmailPayload) {
  return send(to, `Transfer ${p.reference} approved`, transferApprovedTemplate(p));
}
export async function sendTransferRejected(to: string, p: TransferEmailPayload & { reason?: string }) {
  return send(to, `Transfer ${p.reference} rejected`, transferRejectedTemplate(p));
}
export async function sendAccountBlocked(to: string, firstName: string, reason?: string) {
  return send(to, "Your Crest Capital account has been suspended", accountBlockedTemplate({ firstName, reason }));
}
export async function sendAccountUnblocked(to: string, firstName: string) {
  return send(to, "Your Crest Capital account is active again", accountUnblockedTemplate({ firstName }));
}
export async function sendReceipt(to: string, p: ReceiptPayload) {
  return send(to, `Receipt — ${p.reference}`, receiptTemplate(p));
}
export async function sendOtp(to: string, code: string, purpose: "login" | "password_reset") {
  const subject = purpose === "login"
    ? "Your Crest Capital sign-in code"
    : "Reset your Crest Capital password";
  return send(to, subject, otpTemplate({ code, purpose }));
}
export async function sendOnboardingApproved(to: string, firstName: string, iban?: string) {
  return send(to, "Welcome to Crest Capital — your account is open", onboardingApprovedTemplate({ firstName, iban }));
}
export async function sendOnboardingRejected(to: string, firstName: string, reason?: string) {
  return send(to, "Your Crest Capital application", onboardingRejectedTemplate({ firstName, reason }));
}
