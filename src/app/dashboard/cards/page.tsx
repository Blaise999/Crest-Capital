import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Snowflake, Eye, Settings, Infinity as Infinit } from "lucide-react";
import { fmtMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("first_name,last_name,card_last4,balance_checking")
    .eq("id", u.id)
    .single();

  const holder = `${user?.first_name || "Crest Capital"} ${user?.last_name || "Customer"}`.toUpperCase();
  const last4 = user?.card_last4 || "4417";

  return (
    <div className="pt-6 max-w-4xl mx-auto">
      <h1 className="text-[28px] font-bold tracking-tight text-ink-900">Your card</h1>
      <p className="text-[13.5px] text-ink-500 mt-1">
        A Mastercard debit you can use anywhere, online and in-store.
      </p>

      <div className="mt-8 grid lg:grid-cols-[1.3fr_1fr] gap-8 items-center">
        {/* Card visual */}
        <div className="relative mx-auto w-full max-w-md aspect-[1.586/1] rounded-3xl bg-gradient-to-br from-ink-800 via-ink-800 to-ink-900 text-white p-7 shadow-2xl ring-1 ring-white/10 overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-md bg-brand-500" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase">N-BANK</span>
            </div>
            <Infinit className="h-5 w-5 text-white/70" />
          </div>

          <div className="mt-12 text-[19px] tracking-[0.25em] font-semibold">
            •••• •••• •••• {last4}
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-wide text-white/60">Cardholder</div>
              <div className="mt-0.5 text-[12px] font-semibold">{holder}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wide text-white/60">Expires</div>
              <div className="mt-0.5 text-[12px] font-semibold">08/29</div>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="h-6 w-6 rounded-full bg-[#eb001b]" />
              <span className="h-6 w-6 rounded-full bg-[#f79e1b] -ml-2.5 mix-blend-multiply" />
            </div>
          </div>

          <span className="pointer-events-none absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="card p-5">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Available to spend
            </div>
            <div className="mt-1 text-[30px] font-bold text-ink-900 tracking-tight tabular-nums">
              {fmtMoney(user?.balance_checking || 0)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { Icon: Snowflake, label: "Freeze" },
              { Icon: Eye, label: "Details" },
              { Icon: Settings, label: "Settings" },
            ].map(({ Icon, label }) => (
              <button
                key={label}
                className="card py-4 flex flex-col items-center gap-1.5 hover:shadow-pop transition"
              >
                <Icon className="h-5 w-5 text-ink-900" />
                <span className="text-[12px] font-semibold text-ink-700">{label}</span>
              </button>
            ))}
          </div>

          <div className="card p-5">
            <div className="text-[13px] font-semibold text-ink-900">Weekly spend limit</div>
            <div className="mt-1 text-[12px] text-ink-500">
              Set a cap and we'll block payments that would exceed it.
            </div>
            <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden">
              <span className="block h-full w-[36%] rounded-full bg-brand-500" />
            </div>
            <div className="mt-2 flex justify-between text-[11.5px] text-ink-400">
              <span>438,20 € used</span>
              <span>of 1.200,00 €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
