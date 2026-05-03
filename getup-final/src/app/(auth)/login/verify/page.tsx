"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/landing/Logo";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

export default function LoginVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [masked, setMasked] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const e = sessionStorage.getItem("crst_login_email");
    const m = sessionStorage.getItem("crst_login_email_masked");
    if (!e) {
      router.replace("/login");
      return;
    }
    setEmail(e);
    if (m) setMasked(m);
    inputs.current[0]?.focus();
  }, [router]);

  function handleDigit(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d) && !loading) {
      void submitCode(next.join(""));
    }
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setCode(next);
    if (text.length === 6) void submitCode(text);
    else inputs.current[text.length]?.focus();
  }

  async function submitCode(c: string) {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code: c }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Invalid code");
      sessionStorage.removeItem("crst_login_email");
      sessionStorage.removeItem("crst_login_email_masked");
      router.push(d.redirect || "/dashboard");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      setCode(Array(6).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setErr(null);
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "__resend__" }),
    }).catch(() => {});
  }

  return (
    <div className="min-h-screen grid place-items-center px-5 py-10 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/login" className="text-[13px] text-ink-500 hover:text-ink-900 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="mt-10">
          <div className="h-14 w-14 rounded-2xl bg-brand-500/10 grid place-items-center text-brand-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight text-ink-900">
            Enter your sign-in code
          </h1>
          <p className="mt-2 text-[14.5px] text-ink-500">
            We emailed a 6-digit code to <span className="font-semibold text-ink-900">{masked || email}</span>.
            Enter it below to finish signing in.
          </p>

          <div className="mt-6 flex gap-2 justify-between">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                onPaste={handlePaste}
                className="h-14 w-full max-w-[56px] rounded-xl border border-ink-200 bg-white text-center text-[22px] font-bold text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
            ))}
          </div>

          {err && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13.5px] p-3">
              {err}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between text-[13px]">
            <button onClick={resend} className="text-brand-600 font-semibold hover:underline">
              Resend code
            </button>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-ink-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying…
              </span>
            )}
          </div>

          <div className="mt-8 rounded-xl bg-ink-50 border border-ink-100 p-3 text-[12px] text-ink-500">
            Didn't get a code? <span className="font-mono text-ink-900">Try Again</span>.
            Check spam folder
          </div>
        </div>
      </motion.div>
    </div>
  );
}
