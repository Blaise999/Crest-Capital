export type TransferEmailPayload = {
  firstName: string;
  reference: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  rail: string;
  reason?: string;
};

function shell(inner: string, preheader = "") {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Crest Capital</title>
</head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,Inter,Segoe UI,Roboto,sans-serif;color:#161a1f;">
<span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escape(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:20px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.04);overflow:hidden;">
      <tr><td style="padding:28px 32px 0 32px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:28px;height:28px;border-radius:8px;background:#15a586;display:inline-block;vertical-align:middle;"></div>
          <span style="font-weight:700;font-size:18px;letter-spacing:-0.01em;vertical-align:middle;">Crest Capital</span>
        </div>
      </td></tr>
      <tr><td style="padding:18px 32px 32px 32px;">${inner}</td></tr>
      <tr><td style="padding:20px 32px 28px 32px;border-top:1px solid #eef1f4;color:#8491a0;font-size:12px;line-height:18px;">
        Crest Capital AG · Friedrichstraße 1 · 10117 Berlin, Germany<br/>
        This is a transactional notification. If you didn't expect it, please contact support.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escape(s: string) {
  return String(s).replace(/[&<>"']/g, (m) =>
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
  return rail.toUpperCase();
}

function h1(t: string) {
  return `<h1 style="margin:0 0 10px 0;font-size:24px;font-weight:700;letter-spacing:-0.01em;color:#0a0c10;">${escape(t)}</h1>`;
}
function p(t: string) {
  return `<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;color:#3d4753;">${t}</p>`;
}
function card(rows: [string, string][]) {
  const lines = rows
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:8px 0;color:#8491a0;font-size:13px;">${escape(k)}</td>
          <td style="padding:8px 0;color:#0a0c10;font-size:14px;text-align:right;font-weight:500;">${escape(v)}</td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;border-radius:14px;padding:6px 16px;margin:6px 0 18px 0;">${lines}</table>`;
}
function badge(text: string, bg: string, fg: string) {
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:600;">${escape(text)}</span>`;
}

export function welcomeTemplate({ firstName }: { firstName: string }) {
  return shell(
    `
    ${h1(`Welcome, ${firstName || "there"} 👋`)}
    ${p("Your Crest Capital account is open. You can now send money across Europe via SEPA, organise savings in Spaces, and track every cent in real time.")}
    ${p('Your IBAN is being issued — you’ll see it on your dashboard shortly.')}
    `,
    "Welcome to Crest Capital — your account is ready."
  );
}

export function transferSubmittedTemplate(p_: TransferEmailPayload) {
  return shell(
    `
    ${h1("Transfer submitted")}
    ${p(`Hi ${escape(p_.firstName)}, we’ve received your ${railLabel(p_.rail)} of <b>${fmt(p_.amount, p_.currency)}</b> to <b>${escape(p_.beneficiaryName)}</b>. It’s now under review.`)}
    ${card([
      ["Reference", p_.reference],
      ["Amount", fmt(p_.amount, p_.currency)],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Under review"],
    ])}
    ${p(`You’ll get another email the moment the review is complete. Most transfers are reviewed within a few minutes during business hours.`)}
    <p style="margin-top:8px;">${badge("Pending review", "#fff7e6", "#8a5a00")}</p>
    `,
    `Transfer ${p_.reference} is under review.`
  );
}

export function transferApprovedTemplate(p_: TransferEmailPayload) {
  return shell(
    `
    ${h1("Transfer approved ✓")}
    ${p(`Good news, ${escape(p_.firstName)} — your transfer to <b>${escape(p_.beneficiaryName)}</b> has been approved and is being settled.`)}
    ${card([
      ["Reference", p_.reference],
      ["Amount", fmt(p_.amount, p_.currency)],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Approved"],
    ])}
    <p style="margin-top:8px;">${badge("Approved", "#eef4ff", "#1a4bf0")}</p>
    `,
    `Transfer ${p_.reference} approved.`
  );
}

export function transferRejectedTemplate(p_: TransferEmailPayload) {
  const reason = p_.reason ? `<br/><b>Reason:</b> ${escape(p_.reason)}` : "";
  return shell(
    `
    ${h1("Transfer rejected")}
    ${p(`Hi ${escape(p_.firstName)}, we weren’t able to approve your transfer to <b>${escape(p_.beneficiaryName)}</b>. No funds were moved.${reason}`)}
    ${card([
      ["Reference", p_.reference],
      ["Amount", fmt(p_.amount, p_.currency)],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Rejected"],
    ])}
    ${p("If you believe this is a mistake, please contact support and reference the ID above.")}
    <p style="margin-top:8px;">${badge("Rejected", "#fdecec", "#a11a1a")}</p>
    `,
    `Transfer ${p_.reference} rejected.`
  );
}

export function accountBlockedTemplate({ firstName, reason }: { firstName: string; reason?: string }) {
  const r = reason ? `<br/><b>Reason:</b> ${escape(reason)}` : "";
  return shell(
    `
    ${h1("Your account has been suspended")}
    ${p(`Hi ${escape(firstName)}, your Crest Capital account has been temporarily suspended by our compliance team. You won’t be able to initiate transfers until this is resolved.${r}`)}
    ${p("Please contact support as soon as possible so we can review the case together.")}
    <p style="margin-top:8px;">${badge("Account suspended", "#fdecec", "#a11a1a")}</p>
    `,
    "Your Crest Capital account has been suspended."
  );
}

/* ============================= OTP ============================= */

export function otpTemplate({ code, purpose }: { code: string; purpose: "login" | "password_reset" }) {
  const title = purpose === "login" ? "Your login code" : "Reset your password";
  const body = purpose === "login"
    ? "Enter this 6-digit code to finish signing in."
    : "Use this 6-digit code to set a new password.";
  return shell(
    `
    ${h1(title)}
    ${p(body)}
    <div style="margin:18px 0 22px 0;display:flex;justify-content:center;">
      <div style="display:inline-block;background:#eef4ff;border:1px solid #bcd3ff;border-radius:14px;padding:14px 20px;font-size:28px;letter-spacing:0.35em;font-weight:800;color:#0c2672;font-family:ui-monospace,Menlo,Consolas,monospace;">${escape(code)}</div>
    </div>
    ${p(`This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.`)}
    `,
    title
  );
}

/* ============================= ONBOARDING ============================= */

export function onboardingApprovedTemplate({ firstName, iban }: { firstName: string; iban?: string }) {
  return shell(
    `
    ${h1(`Welcome aboard, ${escape(firstName)} 🎉`)}
    ${p("Your Crest Capital application has been reviewed and approved. Your account is now live and ready to use.")}
    ${iban ? card([["Your IBAN", iban]]) : ""}
    ${p("You can now sign in, receive money, send SEPA / SEPA Instant / SWIFT transfers, and organise your balance into Spaces. On first sign-in we'll ask for a one-time code — that's normal, it keeps your account safe.")}
    <p style="margin-top:8px;">${badge("Approved", "#eef4ff", "#1a4bf0")}</p>
    `,
    "Welcome to Crest Capital — your account is live."
  );
}

export function onboardingRejectedTemplate({ firstName, reason }: { firstName: string; reason?: string }) {
  return shell(
    `
    ${h1("We couldn't approve your application")}
    ${p(`Hi ${escape(firstName)}, after reviewing your application we're unable to open a Crest Capital account for you at this time.`)}
    ${reason ? card([["Reason", reason]]) : ""}
    ${p("If you believe this is a mistake or you'd like us to reconsider with updated information, please contact our compliance team at support@crestcapital.com.")}
    <p style="margin-top:8px;">${badge("Not approved", "#fdecec", "#a11a1a")}</p>
    `,
    "Your Crest Capital application was not approved."
  );
}

export function accountUnblockedTemplate({ firstName }: { firstName: string }) {
  return shell(
    `
    ${h1("Your account is active again")}
    ${p(`Good news, ${escape(firstName)} — the suspension on your Crest Capital account has been lifted. You can sign in and transfer money again as normal.`)}
    <p style="margin-top:8px;">${badge("Active", "#eef4ff", "#1a4bf0")}</p>
    `,
    "Your account is active again."
  );
}

/* ============================= RECEIPT ============================= */

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
  const when = new Date(p_.completedAt).toLocaleString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const rows: [string, string][] = [
    ["Receipt reference", p_.reference],
    ["Status", "Completed"],
    ["Completed", when],
    ["Rail", railLabel(p_.rail)],
    ["Amount", fmt(p_.amount, p_.currency)],
  ];
  if (p_.fee && p_.fee > 0) rows.push(["Fee", fmt(p_.fee, p_.currency)]);

  const senderRows: [string, string][] = [
    ["From", p_.senderName],
  ];
  if (p_.senderIban) senderRows.push(["From IBAN", p_.senderIban]);

  const benRows: [string, string][] = [
    ["To", p_.beneficiaryName],
  ];
  if (p_.beneficiaryIban) benRows.push(["To IBAN", p_.beneficiaryIban]);
  if (p_.beneficiaryBic) benRows.push(["BIC / SWIFT", p_.beneficiaryBic]);
  if (p_.beneficiaryCountry) benRows.push(["Country", p_.beneficiaryCountry]);
  if (p_.reference_note) benRows.push(["Reference", p_.reference_note]);

  return shell(
    `
    ${h1("Payment receipt")}
    ${p(`Hi ${escape(p_.firstName)}, here's your official receipt for the transfer below. Keep this email for your records.`)}

    <div style="margin:16px 0 10px 0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8491a0;">
      Transaction
    </div>
    ${card(rows)}

    <div style="margin:16px 0 10px 0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8491a0;">
      From
    </div>
    ${card(senderRows)}

    <div style="margin:16px 0 10px 0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8491a0;">
      Beneficiary
    </div>
    ${card(benRows)}

    <p style="margin-top:8px;">${badge("Settled", "#eef4ff", "#1a4bf0")}</p>

    ${p(`Crest Capital AG — Friedrichstraße 1, 10117 Berlin, Germany. Supervised by BaFin and the Deutsche Bundesbank. Receipt number ${escape(p_.reference)}.`)}
    `,
    `Receipt ${p_.reference} — ${fmt(p_.amount, p_.currency)} to ${p_.beneficiaryName}.`
  );
}
