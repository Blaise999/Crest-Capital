import { supabaseAdmin } from "./supabase/admin";

type Kind =
  | "transfer_submitted"
  | "transfer_approved"
  | "transfer_rejected"
  | "account_blocked"
  | "account_unblocked"
  | "credit"
  | "debit"
  | "welcome"
  | "security"
  | "info";

/**
 * Insert a notification for a user. Best-effort — failures are logged but never thrown.
 */
export async function notify(
  userId: string,
  kind: Kind,
  title: string,
  body?: string,
  metadata?: Record<string, any>
) {
  try {
    const sb = supabaseAdmin();
    await sb.from("notifications").insert({
      user_id: userId,
      kind,
      title,
      body: body || null,
      metadata: metadata || null,
    });
  } catch (e) {
    console.warn("[notify] failed:", (e as any)?.message || e);
  }
}
