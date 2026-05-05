"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Plus,
  Globe2,
  CreditCard,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  PiggyBank,
} from "lucide-react";
import { fmtMoney, fmtRelativeDate, maskIban, cx } from "@/lib/utils";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  iban: string | null;
  card_last4: string | null;
  balance_checking: number | string;
  balance_savings: number | string;
};

type Txn = {
  id: string;
  direction: "debit" | "credit";
  amount: number | string;
  currency: string;
  category: string | null;
  rail: string | null;
  counterparty_name: string | null;
  merchant: string | null;
  description: string | null;
  account_type: "checking" | "savings";
  created_at: string;
  status: string;
};

type Transfer = {
  id: string;
  reference_id: string;
  beneficiary_name: string;
  amount: number | string;
  currency: string;
  rail: string;
  status: string;
  created_at: string;
};

export default function DashboardOverview() {
  const [me, setMe] = useState<User | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [account, setAccount] = useState<"checking" | "savings">("checking");
  const [hideBalance, setHideBalance] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [a, b, c] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/transactions?sinceDays=60").then((r) => r.json()),
        fetch("/api/transfers").then((r) => r.json()),
      ]);
      if (a.ok) setMe(a.user);
      if (b.ok) setTxns(b.transactions);
      if (c.ok) setTransfers(c.transfers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Derived KPIs for the selected account
  const accountTxns = useMemo(
    () => txns.filter((t) => t.account_type === account),
    [txns, account]
  );

  const last30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return accountTxns.filter((t) => new Date(t.created_at).getTime() >= cutoff);
  }, [accountTxns]);

  const spent30 = last30
    .filter((t) => t.direction === "debit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const recv30 = last30
    .filter((t) => t.direction === "credit")
    .reduce((s, t) => s + Number(t.amount), 0);

  // vs the previous 30 days
  const prev30 = useMemo(() => {
    const cutoff = Date.now() - 60 * 86400000;
    const cutoff2 = Date.now() - 30 * 86400000;
    return accountTxns.filter(
      (t) =>
        new Date(t.created_at).getTime() >= cutoff &&
        new Date(t.created_at).getTime() < cutoff2
    );
  }, [accountTxns]);
  const spentPrev = prev30.filter((t) => t.direction === "debit").reduce((s, t) => s + Number(t.amount), 0);
  const delta = spentPrev > 0 ? ((spent30 - spentPrev) / spentPrev) * 100 : 0;

  const currentBalance = account === "checking"
    ? Number(me?.balance_checking || 0)
    : Number(me?.balance_savings || 0);
  const otherBalance = account === "checking"
    ? Number(me?.balance_savings || 0)
    : Number(me?.balance_checking || 0);

  const recentTxns = accountTxns.slice(0, 8);
  const pendingTransfers = transfers.filter((t) => t.status === "pending_admin").slice(0, 4);

  return (
    <div className="pt-4 sm:pt-6 pb-8 space-y-4 sm:space-y-6">
      {/* Greeting + switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight text-ink-900">
            Hi, {me?.first_name || "there"}
          </h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-ink-500 mt-0.5">
            Here's what's happening with your money.
          </p>
        </div>
        <AccountSwitcher value={account} onChange={setAccount} />
      </div>

      {/* Balance hero — mobile-first */}
      <section
        className="relative rounded-[22px] sm:rounded-[28px] overflow-hidden text-white p-5 sm:p-8"
        style={{
          background:
            account === "checking"
              ? "linear-gradient(135deg, #0c2672 0%, #1a4bf0 60%, #2f8cff 100%)"
              : "linear-gradient(135deg, #0a0c10 0%, #262c34 60%, #1a4bf0 100%)",
        }}
      >
        <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-brand-400/20 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              {account === "checking" ? "Main · Checking" : "Savings"}
            </div>
            <div className="mt-1 text-[10.5px] text-white/60 tabular-nums">
              {maskIban(me?.iban || "")}
            </div>
          </div>
          <button
            onClick={() => setHideBalance((v) => !v)}
            aria-label={hideBalance ? "Show balance" : "Hide balance"}
            className="h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative mt-3 sm:mt-4 flex items-baseline gap-2">
          <span className="text-[40px] sm:text-[56px] font-bold tracking-tight leading-none tabular-nums">
            {hideBalance ? "••••••" : fmtMoney(currentBalance).replace("€", "").trim()}
          </span>
          {!hideBalance && <span className="text-[20px] sm:text-[24px] font-semibold text-white/70">€</span>}
        </div>
        <div className="relative mt-2 text-[13px] text-white/80">
          {recv30 > 0 && !hideBalance && (
            <>+ {fmtMoney(recv30)} received in the last 30 days</>
          )}
        </div>

        {/* Quick actions — tile row */}
        <div className="relative mt-5 sm:mt-6 grid grid-cols-4 gap-2 sm:gap-3">
          <ActionTile Icon={Send} label="Send" href="/dashboard/transfer" />
          <ActionTile Icon={Globe2} label="Int'l" href="/dashboard/transfer/international" />
          <ActionTile Icon={Plus} label="Top up" href="/dashboard/transfer" />
          <ActionTile Icon={PiggyBank} label="Vault" href="/dashboard/vault" />
        </div>

        {/* Other account snippet */}
        <button
          onClick={() => setAccount(account === "checking" ? "savings" : "checking")}
          className="relative mt-4 w-full flex items-center justify-between rounded-2xl bg-white/10 hover:bg-white/15 transition px-4 py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/15 grid place-items-center">
              {account === "checking" ? <PiggyBank className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
            </div>
            <div>
              <div className="text-[12px] text-white/70">{account === "checking" ? "Savings" : "Checking"}</div>
              <div className="text-[15px] font-semibold">
                {hideBalance ? "•••••" : fmtMoney(otherBalance)}
              </div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-white/70" />
        </button>
      </section>

      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3">
        <KPI
          label="Spent · 30d"
          value={fmtMoney(spent30)}
          deltaLabel={spentPrev > 0 ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs. prev` : "—"}
          deltaUp={delta > 0}
          tone="ink"
        />
        <KPI
          label="Received · 30d"
          value={fmtMoney(recv30)}
          deltaLabel={`${last30.filter((t) => t.direction === "credit").length} incoming`}
          deltaUp={false}
          tone="brand"
        />
      </section>

      {/* Chart + categories — stack on mobile, side-by-side on desktop */}
      <section className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Spending · last 30 days
              </div>
              <div className="mt-1 text-[24px] sm:text-[28px] font-bold text-ink-900 tracking-tight tabular-nums">
                {fmtMoney(spent30)}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: delta > 0 ? "#dc2626" : "#0a8a6f" }}>
                {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {spentPrev > 0 ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%` : "—"}
              </div>
              <div className="text-[11.5px] text-ink-400">vs. previous 30d</div>
            </div>
          </div>
          <div className="mt-4">
            <SpendingChart txns={accountTxns} days={30} account={account} />
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Top categories
            </div>
            <Sparkles className="h-4 w-4 text-ink-300" />
          </div>
          <div className="mt-4">
            <CategoryBreakdown txns={last30} account={account} />
          </div>
        </div>
      </section>

      {/* Pending transfers */}
      {pendingTransfers.length > 0 && (
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] sm:text-[17px] font-semibold text-ink-900">Pending transfers</h2>
            <Link href="/dashboard/transactions" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
              See all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-ink-100">
            {pendingTransfers.map((t) => (
              <li key={t.id} className="py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 grid place-items-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-ink-900 truncate">
                    {t.beneficiary_name}
                  </div>
                  <div className="text-[11.5px] text-ink-400">
                    {t.reference_id} · {railLabel(t.rail)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-bold text-ink-900 tabular-nums">
                    {fmtMoney(Number(t.amount), t.currency)}
                  </div>
                  <div className="text-[10.5px] text-amber-700 font-semibold uppercase tracking-wide">
                    Pending
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent activity */}
      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] sm:text-[17px] font-semibold text-ink-900">Recent activity</h2>
          <Link href="/dashboard/transactions" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
            See all
          </Link>
        </div>
        {loading && recentTxns.length === 0 ? (
          <div className="py-6 text-center text-[13.5px] text-ink-400">Loading…</div>
        ) : recentTxns.length === 0 ? (
          <div className="py-6 text-center text-[13.5px] text-ink-500">
            No activity on this account yet.
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {recentTxns.map((t) => (
              <li key={t.id} className="py-3 flex items-center gap-3">
                <div
                  className={cx(
                    "h-10 w-10 rounded-full grid place-items-center shrink-0",
                    t.direction === "credit" ? "bg-brand-500/10 text-brand-700" : "bg-ink-100 text-ink-700"
                  )}
                >
                  {t.direction === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] sm:text-[14.5px] font-semibold text-ink-900 truncate">
                    {t.counterparty_name || t.merchant || "Transaction"}
                  </div>
                  <div className="text-[11.5px] text-ink-400 truncate">
                    {fmtRelativeDate(t.created_at)} · {t.category || "—"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={cx(
                      "text-[14px] sm:text-[15px] font-bold tabular-nums",
                      t.direction === "credit" ? "text-brand-600" : "text-ink-900"
                    )}
                  >
                    {t.direction === "credit" ? "+ " : "− "}
                    {fmtMoney(Number(t.amount), t.currency)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KPI({
  label, value, deltaLabel, deltaUp, tone,
}: {
  label: string; value: string; deltaLabel: string; deltaUp: boolean; tone: "ink" | "brand";
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</div>
      <div className={cx(
        "mt-1 text-[22px] sm:text-[28px] font-bold tracking-tight tabular-nums",
        tone === "brand" ? "text-brand-600" : "text-ink-900"
      )}>
        {value}
      </div>
      <div className="mt-1 text-[11.5px] text-ink-400 inline-flex items-center gap-1">
        {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {deltaLabel}
      </div>
    </div>
  );
}

function ActionTile({ Icon, label, href }: { Icon: any; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/15 hover:bg-white/25 transition py-3 focus-ring"
    >
      <div className="h-9 w-9 rounded-full bg-white/20 grid place-items-center">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[11.5px] font-semibold">{label}</span>
    </Link>
  );
}

function railLabel(r: string) {
  if (r === "sepa_instant") return "SEPA Instant";
  if (r === "sepa") return "SEPA Transfer";
  if (r === "internal") return "Internal Transfer";
  if (r === "swift") return "International (SWIFT)";
  return r.toUpperCase();
}
