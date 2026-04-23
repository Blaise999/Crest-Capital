import { NextRequest } from "next/server";
import { requireUser, requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { genReference, fmtMoney } from "@/lib/utils";
import { sendTransferSubmitted } from "@/lib/email";
import { notify } from "@/lib/notify";

const ALLOWED_RAILS = ["sepa", "sepa_instant", "internal", "swift"] as const;

export async function GET() {
  try {
    const u = await requireUser();
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("transfers")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return fail(500, error.message);
    return ok({ transfers: data || [] });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();

    const body = await req.json();
    const {
      rail,
      amount,
      currency,
      account_type,
      beneficiary_name,
      beneficiary_iban,
      beneficiary_bic,
      beneficiary_email,
      beneficiary_country,
      beneficiary_address,
      intermediary_bank,
      reference,
      memo,
    } = body || {};

    const accType = account_type === "savings" ? "savings" : "checking";
    if (!ALLOWED_RAILS.includes(rail)) return fail(400, "Invalid rail");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return fail(400, "Invalid amount");
    if (!beneficiary_name) return fail(400, "Beneficiary name required");

    const sb = supabaseAdmin();
    const { data: sender } = await sb
      .from("users")
      .select("id, email, first_name, balance_checking, balance_savings, blocked")
      .eq("id", u.id)
      .single();
    if (!sender) return fail(500, "Account not found");
    if (sender.blocked) return fail(403, "Account suspended");

    const balance = accType === "savings" ? Number(sender.balance_savings) : Number(sender.balance_checking);

    // For SWIFT in a non-EUR currency, convert to EUR via live FX.
    // Balance check, ledger debit, and fee are all in EUR since the Crest account is EUR.
    let amtInEur = amt;
    let fxRate: number | null = null;
    if (rail === "swift" && currency && String(currency).toUpperCase() !== "EUR") {
      const { convertToEur, fxRateEurTo } = await import("@/lib/fx");
      amtInEur = await convertToEur(amt, String(currency));
      fxRate = await fxRateEurTo(String(currency)); // 1 EUR = fxRate <currency>
      amtInEur = Math.round(amtInEur * 100) / 100;
    }
    if (balance < amtInEur) return fail(400, `Insufficient ${accType} balance`);

    let beneficiary_user_id: string | null = null;
    if (rail === "internal") {
      if (!beneficiary_email) return fail(400, "Recipient email required");
      const { data: rec } = await sb
        .from("users")
        .select("id, blocked")
        .ilike("email", beneficiary_email)
        .maybeSingle();
      if (!rec) return fail(404, "No Crest Capital user found with that email");
      if (rec.id === u.id) return fail(400, "You can't send money to yourself");
      if (rec.blocked) return fail(400, "Recipient account is not active");
      beneficiary_user_id = rec.id;
    } else if (rail === "swift") {
      if (!beneficiary_iban) return fail(400, "Beneficiary IBAN required");
      if (!beneficiary_bic) return fail(400, "Beneficiary BIC / SWIFT code required");
      if (!beneficiary_country) return fail(400, "Beneficiary country required");
    } else {
      if (!beneficiary_iban) return fail(400, "Beneficiary IBAN required");
    }

    const reference_id = genReference("TR");
    const fee = rail === "swift" ? 4.5 : 0;

    const { data: transfer, error: tErr } = await sb
      .from("transfers")
      .insert({
        reference_id,
        user_id: u.id,
        rail,
        direction: "debit",
        account_type: accType,
        amount: amt,
        currency: currency || "EUR",
        fee,
        beneficiary_name,
        beneficiary_iban: beneficiary_iban || null,
        beneficiary_bic: beneficiary_bic || null,
        beneficiary_email: beneficiary_email || null,
        beneficiary_user_id,
        beneficiary_country: beneficiary_country || null,
        beneficiary_address: beneficiary_address || null,
        intermediary_bank: intermediary_bank || null,
        reference: reference || null,
        memo: memo || null,
        status: "pending_admin",
      })
      .select("*")
      .single();

    if (tErr || !transfer) return fail(500, tErr?.message || "Could not submit transfer");

    // Post a ledger row immediately so the transaction shows up in the user's
    // activity as "pending". The balance is NOT moved yet — that happens on
    // admin approval.
    await sb.from("transactions").insert({
      user_id: u.id,
      transfer_id: transfer.id,
      account_type: accType,
      direction: "debit",
      amount: amtInEur, // EUR — matches what we'll debit on approval
      currency: "EUR",
      rail,
      category: "Transfer",
      counterparty_name: beneficiary_name,
      counterparty_iban: beneficiary_iban || null,
      counterparty_email: beneficiary_email || null,
      description:
        fxRate && currency !== "EUR"
          ? `${amt.toFixed(2)} ${currency} @ ${fxRate.toFixed(4)} → EUR · ${reference || memo || "Transfer out"}`
          : reference || memo || "Transfer out",
      merchant: beneficiary_name,
      reference: reference_id,
      status: "pending",
    });

    sendTransferSubmitted(sender.email, {
      firstName: sender.first_name || "there",
      reference: transfer.reference_id,
      amount: amt,
      currency: transfer.currency,
      beneficiaryName: beneficiary_name,
      rail,
    }).catch(() => {});

    await notify(
      u.id,
      "transfer_submitted",
      `Transfer ${transfer.reference_id} submitted`,
      `${fmtMoney(amt, transfer.currency)} to ${beneficiary_name} — under review.`,
      { transfer_id: transfer.id, reference: transfer.reference_id, amount: amt, rail, account_type: accType }
    );

    return ok({ transfer });
  } catch (e) {
    return handleError(e);
  }
}
