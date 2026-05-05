import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name, middle_name, last_name,
      date_of_birth, place_of_birth, nationality, phone,
      street, street_number, postal_code, city, country,
      employment_status, employer, occupation, monthly_income, source_of_funds,
      tax_id, id_document_type, id_document_number,
      email, password,
    } = body || {};

    if (!email || !password) return fail(400, "Email and password required");
    if (!first_name || !last_name) return fail(400, "First and last name required");
    if (!date_of_birth) return fail(400, "Date of birth required");
    if (!phone) return fail(400, "Phone required");
    if (!street || !street_number || !postal_code || !city) return fail(400, "Address incomplete");
    if (!employment_status) return fail(400, "Employment status required");
    if (!tax_id) return fail(400, "Tax ID required");
    if (!id_document_number) return fail(400, "ID document number required");
    if (String(password).length < 8) return fail(400, "Password must be at least 8 characters");
    if (!/.+@.+\..+/.test(email)) return fail(400, "Enter a valid email");

    const sb = supabaseAdmin();
    const { data: existing } = await sb
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existing) return fail(409, "An account with this email already exists");

    const password_hash = await hashPassword(password);

    const { data, error } = await sb
      .from("users")
      .insert({
        email: String(email).toLowerCase(),
        password_hash,
        role: "user",
        first_name, middle_name: middle_name || null, last_name,
        date_of_birth,
        place_of_birth: place_of_birth || null,
        nationality: nationality || null,
        phone,
        street, street_number,
        postal_code, city,
        country: country || "Germany",
        employment_status,
        employer: employer || null,
        occupation: occupation || null,
        monthly_income: monthly_income || null,
        source_of_funds: source_of_funds || null,
        tax_id,
        id_document_type: id_document_type || "id_card",
        id_document_number,
        // no IBAN yet — assigned on approval
        iban: null,
        balance_checking: 0,
        balance_savings: 0,
        onboarding_status: "PENDING_REVIEW",
        email_verified: false,
      })
      .select("id, email, role, first_name, onboarding_status")
      .single();

    if (error || !data) {
      if (error?.code === "23505") return fail(409, "An account with this email already exists");
      return fail(500, error?.message || "Could not submit application");
    }

    // Sign the user in so they can land on /pending-review
    const token = signSession({ id: data.id, role: "user" });
    await setSessionCookie(token);

    // Welcome email only — the notifications bell stays empty until there's
    // actual activity (admin approval, transfers, admin-seeded transactions, etc.)
    // deferEmail() uses Next's after() so the runtime keeps the function alive
    // long enough to actually send the mail (the old fire-and-forget pattern
    // could be paused by the Lambda freeze and end up sending 20+ minutes late).
    const { sendWelcome, deferEmail } = await import("@/lib/email");
    deferEmail(() => sendWelcome(data.email, data.first_name || "there"));

    return ok({ user: data });
  } catch (e) {
    return handleError(e);
  }
}
