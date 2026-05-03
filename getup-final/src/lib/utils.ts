/**
 * Format a EUR amount. Integer euros only (no cents), `.` as thousands separator
 * (de-DE style). Example: 1234567 → "1.234.567 €"
 */
export function fmtMoney(n: number | string, currency = "EUR", _locale = "de-DE") {
  const raw = typeof n === "string" ? Number(n) : n;
  const num = Number.isFinite(raw) ? raw : 0;
  const sign = num < 0 ? "−" : "";
  const abs = Math.round(Math.abs(num));
  const withSep = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sym = currency === "EUR" ? "€" : currency;
  return `${sign}${withSep}\u00A0${sym}`;
}

/** Plain integer with `.` grouping, no symbol. */
export function fmtInt(n: number | string) {
  const v = Math.round(Number(n || 0));
  const sign = v < 0 ? "−" : "";
  return sign + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Format a compact date label. */
export function fmtDate(d: string | Date, locale = "de-DE") {
  const dt = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  } catch {
    return dt.toISOString().slice(0, 10);
  }
}

/** Friendly relative date (Today / Yesterday / DD Mon). */
export function fmtRelativeDate(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (isSame(dt, today)) return "Today";
  if (isSame(dt, yest)) return "Yesterday";
  return fmtDate(dt);
}

/** Mask an IBAN for display: DE89 **** **** **** 3000 */
export function maskIban(iban?: string | null) {
  if (!iban) return "—";
  const raw = iban.replace(/\s+/g, "");
  if (raw.length < 8) return iban;
  const head = raw.slice(0, 4);
  const tail = raw.slice(-4);
  const groups = Math.max(0, Math.floor((raw.length - 8) / 4));
  const mid = Array(groups).fill("****").join(" ");
  return `${head} ${mid} ${tail}`.replace(/\s+/g, " ").trim();
}

/** Generate a German-style IBAN (demo). */
export function generateIban() {
  // DE + 2 check digits + 8 digit bank code + 10 digit account number
  const rand = (n: number) => {
    let s = "";
    for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  };
  const bankCode = "37040044"; // demo Commerzbank-like code
  const account = rand(10);
  const check = rand(2);
  return `DE${check} ${bankCode.slice(0, 4)} ${bankCode.slice(4)} ${account.slice(0, 4)} ${account.slice(4, 8)} ${account.slice(8, 10)}`;
}

/** Human reference, e.g. "TR-7F3A29". */
export function genReference(prefix = "TR") {
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `${prefix}-${hex}`;
}

/** Short hash used for avatars / color seeds. */
export function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Clamp helper. */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Small classnames joiner. */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
