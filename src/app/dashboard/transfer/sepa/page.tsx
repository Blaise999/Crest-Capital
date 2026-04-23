"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Zap, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SepaPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const instant = sp.get("instant") === "1";

  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/transfers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rail: instant ? "sepa_instant" : "sepa",
          amount: Number(amount.replace(",", ".")),
          beneficiary_name: name,
          beneficiary_iban: iban.replace(/\s+/g, ""),
          beneficiary_bic: bic || undefined,
          reference,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Transfer failed");
      router.push(`/dashboard/transfer/success?ref=${d.transfer.reference_id}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-6 max-w-xl mx-auto">
      <Link href="/dashboard/transfer" className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mt-3 text-[28px] font-bold tracking-tight text-ink-900">
        {instant ? "SEPA Instant" : "SEPA Transfer"}
      </h1>
      <p className="text-[13.5px] text-ink-500 mt-1">
        {instant
          ? "Arrives in under 10 seconds, 24 / 7."
          : "Arrives the next working day. Free."}
      </p>

      {instant && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500/10 text-brand-700 px-3 py-1.5 text-[12.5px] font-semibold">
          <Zap className="h-3.5 w-3.5" /> Instant · 0,00 € fee
        </div>
      )}

      <form onSubmit={submit} className="mt-6 card p-6 space-y-4">
        <Field label="Amount (EUR)" hint="Between 0,01 € and 15.000,00 €">
          <div className="relative">
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full h-12 rounded-xl border border-ink-200 bg-white pl-4 pr-12 text-[18px] font-semibold outline-none focus:border-ink-900"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 font-semibold">€</span>
          </div>
        </Field>

        <Field label="Beneficiary name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Anna Müller"
            className="w-full h-11 rounded-xl border border-ink-200 bg-white px-4 text-[15px] outline-none focus:border-ink-900"
          />
        </Field>

        <Field label="IBAN" hint="No spaces needed — we'll format it for you.">
          <input
            required
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="DE89 3704 0044 0532 0130 00"
            className="w-full h-11 rounded-xl border border-ink-200 bg-white px-4 text-[15px] outline-none focus:border-ink-900 tabular-nums"
          />
        </Field>

        <Field label="BIC (optional)">
          <input
            value={bic}
            onChange={(e) => setBic(e.target.value.toUpperCase())}
            placeholder="COBADEFFXXX"
            className="w-full h-11 rounded-xl border border-ink-200 bg-white px-4 text-[15px] outline-none focus:border-ink-900"
          />
        </Field>

        <Field label="Reference" hint="Shown on the recipient's statement.">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Rent — April"
            maxLength={140}
            className="w-full h-11 rounded-xl border border-ink-200 bg-white px-4 text-[15px] outline-none focus:border-ink-900"
          />
        </Field>

        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13.5px] p-3">
            {err}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => router.back()} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send for review
          </button>
        </div>

        <p className="text-[11.5px] text-ink-400 text-center">
          Transfers are reviewed by our compliance team before they settle.
        </p>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-700">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11.5px] text-ink-400">{hint}</span>}
    </label>
  );
}
