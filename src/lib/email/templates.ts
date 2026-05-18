/* ------------------------------------------------------------------------- */
/*  Crest Capital — transactional email templates                            */
/*                                                                           */
/*  Designed to render well in:                                              */
/*    Gmail (web + iOS + Android), Apple Mail, Outlook 2016+,                */
/*    Outlook.com, Yahoo, Proton.                                            */
/*                                                                           */
/*  Rules followed:                                                          */
/*    - Tables for layout (Outlook hates flexbox).                           */
/*    - Inline CSS only.                                                     */
/*    - 600px max width, mobile-friendly (single column).                    */
/*    - System fonts (no @import; many clients strip <style>).               */
/* ------------------------------------------------------------------------- */

export type TransferEmailPayload = {
  firstName: string;
  reference: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  rail: string;
  reason?: string;
};

const BRAND = {
  // Real Crest Capital brand — matches /public/logo.svg
  brand: "#2f66ff",
  brandDark: "#0c2672",
  green: "#2f66ff", // kept as alias so existing references stay valid
  greenDark: "#0c2672",
  ink900: "#0a0c10",
  ink700: "#3d4753",
  ink500: "#6b7686",
  ink400: "#8491a0",
  ink200: "#dde2e8",
  ink100: "#eef1f4",
  bg: "#f3f5f7",
  white: "#ffffff",
  // Status palette
  amberBg: "#fff7e6",
  amberFg: "#8a5a00",
  blueBg: "#eef4ff",
  blueFg: "#1a4bf0",
  redBg: "#fdecec",
  redFg: "#a11a1a",
  greenBg: "#e9f0ff",
  greenFg: "#1a4bf0",
};

/**
 * The Crest Capital logo, inlined as a base64 data URI so it renders without
 * an external image host. Apple Mail / iOS Mail / most webmail render data
 * URIs; Outlook (mso) ignores them, so the shell provides an mso fallback.
 * This is the exact artwork from /public/logo.svg.
 */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><defs><linearGradient id="cc" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2f66ff"/><stop offset="100%" stop-color="#0c2672"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#cc)"/><path d="M11 47 L24 28 L32 37 L42 21 L53 47 Z" fill="#ffffff" opacity="0.95"/><path d="M24 28 L32 37 L28 42 L20 35 Z" fill="#ffffff" opacity="0.55"/><circle cx="47" cy="18" r="2.4" fill="#ffffff"/></svg>`;

const LOGO_DATA_URI =
  "data:image/svg+xml;base64," + Buffer.from(LOGO_SVG).toString("base64");

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[m]
  );
}

function fmt(n: number, cur = "EUR") {
  const rounded = Math.round(Number(n || 0));
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${cur} ${rounded.toLocaleString("de-DE")}`;
  }
}

function railLabel(rail: string) {
  if (rail === "sepa_instant") return "SEPA Instant";
  if (rail === "sepa") return "SEPA Transfer";
  if (rail === "internal") return "Internal Transfer";
  if (rail === "swift") return "SWIFT Wire";
  return String(rail || "").toUpperCase();
}

/* -------------------------- shell ---------------------------------------- */

function shell({
  inner,
  preheader,
  accent,
}: {
  inner: string;
  preheader: string;
  accent?: { color: string; label: string };
}) {
  // Logo: rendered as a coloured square + brand wordmark, table-based so Outlook keeps it in line.
  const accentBar = accent
    ? `<tr><td style="height:4px;line-height:4px;font-size:0;background:${accent.color};">&nbsp;</td></tr>`
    : `<tr><td style="height:4px;line-height:4px;font-size:0;background:${BRAND.green};">&nbsp;</td></tr>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light only"/>
<meta name="supported-color-schemes" content="light"/>
<title>Crest Capital</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink900};-webkit-font-smoothing:antialiased;">
<div style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${escape(preheader)}</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};">
  <tr><td align="center" style="padding:32px 16px 40px 16px;">

    <!-- Card -->
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.05),0 8px 24px rgba(15,23,42,.06);">

      ${accentBar}

      <!-- Brand bar -->
      <tr><td style="padding:26px 32px 0 32px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding-right:11px;vertical-align:middle;">
              <!--[if !mso]><!-->
              <img src="${LOGO_DATA_URI}" width="36" height="36" alt="Crest Capital"
                   style="display:block;width:36px;height:36px;border-radius:10px;" />
              <!--<![endif]-->
              <!--[if mso]>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="width:36px;height:36px;background:${BRAND.brand};border-radius:10px;line-height:36px;text-align:center;color:#fff;font-weight:800;font-size:16px;font-family:Arial,sans-serif;">C</td></tr></table>
              <![endif]-->
            </td>
            <td style="vertical-align:middle;">
              <div style="font-weight:800;font-size:18px;letter-spacing:-0.02em;color:${BRAND.ink900};line-height:1;">Crest Capital</div>
              <div style="margin-top:3px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.ink400};line-height:1;">Finance at its peak</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:24px 32px 8px 32px;">${inner}</td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 32px 28px 32px;border-top:1px solid ${BRAND.ink100};">
        <p style="margin:0 0 6px 0;font-size:12px;line-height:18px;color:${BRAND.ink500};">
          <strong style="color:${BRAND.ink700};">Crest Capital AG</strong> — Friedrichstraße 1, 10117 Berlin, Germany
        </p>
        <p style="margin:0 0 10px 0;font-size:12px;line-height:18px;color:${BRAND.ink500};">
          Supervised by BaFin and the Deutsche Bundesbank · Deposits protected up to €100,000.
        </p>
        <p style="margin:0;font-size:11.5px;line-height:17px;color:${BRAND.ink400};">
          This is a transactional notification from Crest Capital. If you didn't expect it, please contact <a href="mailto:support@crestcapital.com" style="color:${BRAND.ink500};text-decoration:underline;">support@crestcapital.com</a>.
        </p>
      </td></tr>

    </table>

  </td></tr>
</table>

</body>
</html>`;
}

/* -------------------------- pieces --------------------------------------- */

function h1(t: string) {
  return `<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;letter-spacing:-0.015em;color:${BRAND.ink900};line-height:1.25;">${t}</h1>`;
}
function p(t: string) {
  return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:${BRAND.ink700};">${t}</p>`;
}
function muted(t: string) {
  return `<p style="margin:0 0 14px 0;font-size:13px;line-height:1.55;color:${BRAND.ink500};">${t}</p>`;
}

function eyebrow(text: string, color = BRAND.ink400) {
  return `<div style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${color};">${escape(text)}</div>`;
}

/** Big amount block — used in receipts / approvals. */
function amountBlock(amount: number, currency: string, sublabel?: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 6px 0;background:${BRAND.bg};border-radius:14px;">
    <tr><td style="padding:18px 20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.ink400};">Amount</div>
      <div style="margin-top:4px;font-size:30px;font-weight:800;color:${BRAND.ink900};letter-spacing:-0.02em;line-height:1.1;">${escape(fmt(amount, currency))}</div>
      ${sublabel ? `<div style="margin-top:4px;font-size:12.5px;color:${BRAND.ink500};">${escape(sublabel)}</div>` : ""}
    </td></tr>
  </table>`;
}

/** Detail card — k/v rows with nice spacing & dividers. */
function card(rows: [string, string][]) {
  const lines = rows
    .map(
      ([k, v], i) =>
        `<tr>
          <td style="padding:11px 0;${i > 0 ? `border-top:1px solid ${BRAND.ink100};` : ""}color:${BRAND.ink500};font-size:13px;line-height:1.4;width:42%;">${escape(k)}</td>
          <td style="padding:11px 0;${i > 0 ? `border-top:1px solid ${BRAND.ink100};` : ""}color:${BRAND.ink900};font-size:14px;text-align:right;font-weight:600;line-height:1.4;word-break:break-word;">${escape(v)}</td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.white};border:1px solid ${BRAND.ink100};border-radius:12px;padding:4px 16px;margin:12px 0 18px 0;">${lines}</table>`;
}

function badge(text: string, bg: string, fg: string) {
  return `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${bg};color:${fg};font-size:11.5px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;">${escape(text)}</span>`;
}

/* -------------------------- WELCOME -------------------------------------- */

export function welcomeTemplate({ firstName }: { firstName: string }) {
  return shell({
    inner: `
    ${h1(`Welcome, ${escape(firstName || "there")}`)}
    ${p("Your Crest Capital application has been received. We're reviewing it now — most are approved within a few business hours.")}
    ${p("Once approved you'll be able to send SEPA, SEPA Instant and SWIFT transfers, organise savings into Spaces, and use your Crest Capital debit Mastercard anywhere.")}
    ${muted("You'll get another email the moment your account is opened.")}
    `,
    preheader: "Your Crest Capital application has been received.",
  });
}

/* -------------------------- TRANSFERS ------------------------------------ */

export function transferSubmittedTemplate(p_: TransferEmailPayload) {
  return shell({
    accent: { color: BRAND.amberFg, label: "Pending" },
    inner: `
    ${eyebrow("Transfer submitted")}
    ${h1("We've received your transfer")}
    ${p(`Hi ${escape(p_.firstName)}, your ${escape(railLabel(p_.rail))} of <strong>${escape(fmt(p_.amount, p_.currency))}</strong> to <strong>${escape(p_.beneficiaryName)}</strong> is now under review by our compliance team.`)}
    ${amountBlock(p_.amount, p_.currency, `to ${p_.beneficiaryName}`)}
    ${card([
      ["Reference", p_.reference],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Under review"],
    ])}
    ${p("Most transfers are reviewed within minutes during business hours. You'll get another email the moment the review is complete.")}
    <p style="margin:6px 0 0 0;">${badge("Pending review", BRAND.amberBg, BRAND.amberFg)}</p>
    `,
    preheader: `Transfer ${p_.reference} is under review.`,
  });
}

export function transferApprovedTemplate(p_: TransferEmailPayload) {
  return shell({
    accent: { color: BRAND.green, label: "Approved" },
    inner: `
    ${eyebrow("Transfer approved", BRAND.greenFg)}
    ${h1("Your transfer is on its way")}
    ${p(`Good news, ${escape(p_.firstName)} — your transfer to <strong>${escape(p_.beneficiaryName)}</strong> has been approved and is being settled.`)}
    ${amountBlock(p_.amount, p_.currency, `to ${p_.beneficiaryName}`)}
    ${card([
      ["Reference", p_.reference],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Approved"],
    ])}
    ${muted("A separate receipt has also been emailed to you for your records.")}
    <p style="margin:6px 0 0 0;">${badge("Approved", BRAND.greenBg, BRAND.greenFg)}</p>
    `,
    preheader: `Transfer ${p_.reference} approved — ${fmt(p_.amount, p_.currency)} to ${p_.beneficiaryName}.`,
  });
}

export function transferRejectedTemplate(p_: TransferEmailPayload) {
  const reason = p_.reason
    ? card([["Reason", p_.reason]])
    : "";
  return shell({
    accent: { color: BRAND.redFg, label: "Rejected" },
    inner: `
    ${eyebrow("Transfer rejected", BRAND.redFg)}
    ${h1("We weren't able to approve this transfer")}
    ${p(`Hi ${escape(p_.firstName)}, your transfer to <strong>${escape(p_.beneficiaryName)}</strong> couldn't be approved. <strong>No funds were moved</strong> — your balance is unchanged.`)}
    ${amountBlock(p_.amount, p_.currency, `to ${p_.beneficiaryName}`)}
    ${card([
      ["Reference", p_.reference],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Rejected"],
    ])}
    ${reason}
    ${p("If you believe this was a mistake, please contact <a href=\"mailto:support@crestcapital.com\" style=\"color:" + BRAND.blueFg + ";text-decoration:underline;\">support@crestcapital.com</a> and reference the ID above.")}
    <p style="margin:6px 0 0 0;">${badge("Rejected", BRAND.redBg, BRAND.redFg)}</p>
    `,
    preheader: `Transfer ${p_.reference} was not approved. No funds moved.`,
  });
}

/* -------------------------- ACCOUNT STATE -------------------------------- */

export function accountBlockedTemplate({ firstName, reason }: { firstName: string; reason?: string }) {
  const reasonRows = reason ? card([["Reason", reason]]) : "";
  return shell({
    accent: { color: BRAND.redFg, label: "Suspended" },
    inner: `
    ${eyebrow("Account suspended", BRAND.redFg)}
    ${h1("Your account has been suspended")}
    ${p(`Hi ${escape(firstName)}, your Crest Capital account has been temporarily suspended by our compliance team. Until this is resolved you won't be able to initiate transfers or use your card.`)}
    ${reasonRows}
    ${p("Please contact <a href=\"mailto:support@crestcapital.com\" style=\"color:" + BRAND.blueFg + ";text-decoration:underline;\">support@crestcapital.com</a> as soon as possible so we can review your case together.")}
    <p style="margin:6px 0 0 0;">${badge("Account suspended", BRAND.redBg, BRAND.redFg)}</p>
    `,
    preheader: "Your Crest Capital account has been suspended.",
  });
}

export function accountUnblockedTemplate({ firstName }: { firstName: string }) {
  return shell({
    accent: { color: BRAND.green, label: "Active" },
    inner: `
    ${eyebrow("Account active", BRAND.greenFg)}
    ${h1("Your account is active again")}
    ${p(`Good news, ${escape(firstName)} — the suspension on your Crest Capital account has been lifted. You can sign in, transfer money and use your card as normal.`)}
    <p style="margin:6px 0 0 0;">${badge("Active", BRAND.greenBg, BRAND.greenFg)}</p>
    `,
    preheader: "Your Crest Capital account is active again.",
  });
}

/* -------------------------- OTP ------------------------------------------ */

export function otpTemplate({
  code,
  purpose,
  context,
}: {
  code: string;
  purpose: "login" | "password_reset" | "transfer";
  context?: { amount?: string; beneficiary?: string };
}) {
  const title =
    purpose === "login"
      ? "Your sign-in code"
      : purpose === "transfer"
      ? "Authorise your transfer"
      : "Reset your password";

  const body =
    purpose === "login"
      ? "Enter this 6-digit code to finish signing in to Crest Capital."
      : purpose === "transfer"
      ? "For your security, confirm this payment by entering the 6-digit code below in the app. The transfer will not be sent until you do."
      : "Enter this 6-digit code to set a new password on your Crest Capital account.";

  // Spaced groups: "123 456" — easier to read & retype.
  const safe = String(code || "").replace(/\D/g, "").slice(0, 6);
  const display = safe.length === 6 ? `${safe.slice(0, 3)} ${safe.slice(3)}` : safe;

  const txnCard =
    purpose === "transfer" && context
      ? card(
          [
            context.amount ? (["Amount", context.amount] as [string, string]) : null,
            context.beneficiary
              ? (["To", context.beneficiary] as [string, string])
              : null,
          ].filter(Boolean) as [string, string][]
        )
      : "";

  return shell({
    accent:
      purpose === "transfer"
        ? { color: BRAND.brand, label: "Authorise" }
        : undefined,
    inner: `
    ${eyebrow(
      purpose === "login"
        ? "Sign-in"
        : purpose === "transfer"
        ? "Payment authorisation"
        : "Password reset"
    )}
    ${h1(title)}
    ${p(body)}
    ${txnCard}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0;">
      <tr><td align="center">
        <div style="display:inline-block;background:${BRAND.bg};border:1px solid ${BRAND.ink200};border-radius:14px;padding:18px 28px;font-size:34px;letter-spacing:0.18em;font-weight:800;color:${BRAND.ink900};font-family:'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;">${escape(display)}</div>
      </td></tr>
    </table>
    ${muted(
      purpose === "transfer"
        ? "This code expires in 10 minutes. If you didn't start this payment, do NOT share this code — contact support@crestcapital.com immediately and your account will be secured."
        : "This code expires in 10 minutes. If you didn't request it, you can safely ignore this email — no changes will be made to your account."
    )}
    `,
    preheader:
      purpose === "transfer"
        ? `Authorise your transfer — code ${display} (expires in 10 minutes).`
        : `${title} — code expires in 10 minutes.`,
  });
}

/* -------------------------- ONBOARDING ----------------------------------- */

export function onboardingApprovedTemplate({ firstName, iban }: { firstName: string; iban?: string }) {
  return shell({
    accent: { color: BRAND.green, label: "Approved" },
    inner: `
    ${eyebrow("Application approved", BRAND.greenFg)}
    ${h1(`Welcome aboard, ${escape(firstName)}`)}
    ${p("Your Crest Capital application has been reviewed and approved. Your account is now live and ready to use.")}
    ${iban ? card([["Your German IBAN", iban]]) : ""}
    ${p("You can now sign in, receive money, send SEPA / SEPA Instant / SWIFT transfers, and organise your balance into Spaces. On first sign-in we'll ask for a one-time code — that's normal, it keeps your account safe.")}
    <p style="margin:6px 0 0 0;">${badge("Account open", BRAND.greenBg, BRAND.greenFg)}</p>
    `,
    preheader: "Welcome to Crest Capital — your account is open.",
  });
}

export function onboardingRejectedTemplate({ firstName, reason }: { firstName: string; reason?: string }) {
  const reasonRows = reason ? card([["Reason", reason]]) : "";
  return shell({
    accent: { color: BRAND.redFg, label: "Not approved" },
    inner: `
    ${eyebrow("Application update", BRAND.redFg)}
    ${h1("We couldn't approve your application")}
    ${p(`Hi ${escape(firstName)}, after reviewing your application we're unable to open a Crest Capital account for you at this time.`)}
    ${reasonRows}
    ${p("If you believe this is a mistake or you'd like us to reconsider with updated information, please contact our compliance team at <a href=\"mailto:support@crestcapital.com\" style=\"color:" + BRAND.blueFg + ";text-decoration:underline;\">support@crestcapital.com</a>.")}
    <p style="margin:6px 0 0 0;">${badge("Not approved", BRAND.redBg, BRAND.redFg)}</p>
    `,
    preheader: "Your Crest Capital application was not approved.",
  });
}

/* -------------------------- RECEIPT -------------------------------------- */

export type ReceiptPayload = {
  firstName: string;
  reference: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  beneficiaryIban?: string;
  beneficiaryBic?: string;
  beneficiaryCountry?: string;
  rail: string;
  fee?: number;
  completedAt: string;
  senderName: string;
  senderIban?: string;
  reference_note?: string;
};

export function receiptTemplate(p_: ReceiptPayload) {
  const when = (() => {
    try {
      return new Date(p_.completedAt).toLocaleString("de-DE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return p_.completedAt;
    }
  })();

  const txnRows: [string, string][] = [
    ["Reference", p_.reference],
    ["Status", "Completed"],
    ["Date", when],
    ["Method", railLabel(p_.rail)],
  ];
  if (p_.fee && p_.fee > 0) txnRows.push(["Fee", fmt(p_.fee, p_.currency)]);

  const senderRows: [string, string][] = [["Name", p_.senderName]];
  if (p_.senderIban) senderRows.push(["IBAN", p_.senderIban]);

  const benRows: [string, string][] = [["Name", p_.beneficiaryName]];
  if (p_.beneficiaryIban) benRows.push(["IBAN", p_.beneficiaryIban]);
  if (p_.beneficiaryBic) benRows.push(["BIC / SWIFT", p_.beneficiaryBic]);
  if (p_.beneficiaryCountry) benRows.push(["Country", p_.beneficiaryCountry]);
  if (p_.reference_note) benRows.push(["Reference", p_.reference_note]);

  return shell({
    accent: { color: BRAND.brand, label: "Receipt" },
    inner: `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 18px 0;background:linear-gradient(135deg,${BRAND.brand},${BRAND.brandDark});border-radius:14px;">
      <tr><td style="padding:20px 22px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Official payment receipt</div>
              <div style="margin-top:6px;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;line-height:1.1;">${escape(fmt(p_.amount, p_.currency))}</div>
              <div style="margin-top:3px;font-size:12.5px;color:rgba(255,255,255,0.8);">paid to ${escape(p_.beneficiaryName)}</div>
            </td>
            <td style="vertical-align:middle;text-align:right;">
              <img src="${LOGO_DATA_URI}" width="44" height="44" alt="Crest Capital" style="display:inline-block;width:44px;height:44px;border-radius:11px;" />
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${p(`Hi ${escape(p_.firstName)}, your transfer has settled. This is your official receipt — please keep it for your records. You can show this email or your in-app receipt as proof of payment.`)}

    ${eyebrow("Transaction")}
    ${card(txnRows)}

    ${eyebrow("From")}
    ${card(senderRows)}

    ${eyebrow("Beneficiary")}
    ${card(benRows)}

    <p style="margin:6px 0 0 0;">${badge("Settled", BRAND.greenBg, BRAND.greenFg)}</p>
    ${muted(`Receipt number ${escape(p_.reference)}. Crest Capital AG, Friedrichstraße 1, 10117 Berlin — supervised by BaFin and the Deutsche Bundesbank. This receipt was generated automatically and is valid without a signature.`)}
    `,
    preheader: `Receipt ${p_.reference} — ${fmt(p_.amount, p_.currency)} to ${p_.beneficiaryName}.`,
  });
}

/* -------------------------- TRANSACTION POSTED --------------------------- */

export type TransactionPostedPayload = {
  firstName: string;
  direction: "credit" | "debit";
  amount: number;
  currency: string;
  amountFmt: string;
  counterparty?: string;
  category?: string;
  accountType: "checking" | "savings";
  description?: string;
  reference?: string;
};

export function transactionPostedTemplate(p_: TransactionPostedPayload) {
  const isCredit = p_.direction === "credit";
  const accent = isCredit ? BRAND.green : BRAND.ink700;
  const accentFg = isCredit ? BRAND.greenFg : BRAND.ink700;
  const acctLabel = p_.accountType === "savings" ? "Savings account" : "Current account";

  const rows: [string, string][] = [
    [isCredit ? "From" : "To", p_.counterparty || "—"],
    ["Account", acctLabel],
  ];
  if (p_.category) rows.push(["Category", p_.category]);
  if (p_.description) rows.push(["Description", p_.description]);
  if (p_.reference) rows.push(["Reference", p_.reference]);

  return shell({
    accent: { color: accent, label: isCredit ? "Credit" : "Debit" },
    inner: `
    ${eyebrow(isCredit ? "Money in" : "Money out", accentFg)}
    ${h1(isCredit ? `You received ${escape(p_.amountFmt)}` : `${escape(p_.amountFmt)} was debited`)}
    ${p(`Hi ${escape(p_.firstName)}, a transaction has just posted to your ${acctLabel.toLowerCase()}.`)}
    ${amountBlock(p_.amount, p_.currency, p_.counterparty ? (isCredit ? `from ${p_.counterparty}` : `to ${p_.counterparty}`) : undefined)}
    ${card(rows)}
    ${muted("If you don't recognise this activity, please contact support immediately.")}
    `,
    preheader: isCredit
      ? `You received ${p_.amountFmt}${p_.counterparty ? ` from ${p_.counterparty}` : ""}.`
      : `${p_.amountFmt} debited${p_.counterparty ? ` — ${p_.counterparty}` : ""}.`,
  });
}
