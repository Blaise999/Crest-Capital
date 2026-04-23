import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase/admin";

const OTP_TTL_MINUTES = 10;

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function storeOtp(email: string, code: string, purpose: "login" | "password_reset") {
  const sb = supabaseAdmin();
  const code_hash = await bcrypt.hash(code, 8);
  const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  await sb
    .from("otp_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("email", email.toLowerCase())
    .eq("purpose", purpose)
    .is("used_at", null);

  await sb.from("otp_codes").insert({
    email: email.toLowerCase(),
    code_hash,
    purpose,
    expires_at,
  });
}

/**
 * Verifies an OTP.
 * In development (no RESEND_API_KEY), "000000" is always accepted.
 */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: "login" | "password_reset"
): Promise<boolean> {
  const devBypass = !process.env.RESEND_API_KEY && code === "000000";

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("otp_codes")
    .select("id, code_hash, expires_at, used_at")
    .eq("email", email.toLowerCase())
    .eq("purpose", purpose)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (devBypass) {
    if (data) {
      await sb
        .from("otp_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", data.id);
    }
    return true;
  }

  if (!data) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;

  const ok = await bcrypt.compare(code, data.code_hash);
  if (!ok) return false;

  await sb
    .from("otp_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);
  return true;
}
