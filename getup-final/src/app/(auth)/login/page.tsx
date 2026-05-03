"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Login failed");
      // Store email in sessionStorage so /login/verify can use it
      sessionStorage.setItem("crst_login_email", email);
      if (d.emailMasked) sessionStorage.setItem("crst_login_email_masked", d.emailMasked);
      router.push("/login/verify");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col p-6 sm:p-10 bg-white">
        <Logo />
        <div className="flex-1 flex items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <h1 className="text-[32px] sm:text-[38px] leading-[1.04] font-bold tracking-tight">
              Welcome back.
            </h1>
            <p className="mt-2 text-[15px] text-ink-500">
              Sign in with your email and password. We'll send a one-time code to finish signing in.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-[12.5px] font-semibold text-ink-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1.5 w-full h-12 rounded-xl border border-ink-200 bg-white px-4 text-[15px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </label>
              <label className="block">
                <span className="text-[12.5px] font-semibold text-ink-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-1.5 w-full h-12 rounded-xl border border-ink-200 bg-white px-4 text-[15px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </label>

              {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13.5px] p-3">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-brand w-full disabled:opacity-70 focus-ring"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Continue
              </button>

              <div className="flex justify-between text-[13px]">
                <Link href="/forgot-password" className="text-brand-600 font-semibold hover:underline">
                  Forgot password?
                </Link>
                <Link href="/signup" className="text-ink-900 font-semibold hover:underline">
                  Open an account
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
        <p className="text-[12px] text-ink-400 text-center">© {new Date().getFullYear()} Crest Capital AG</p>
      </div>

      <div className="hidden lg:block relative bg-ink-50 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1579621970590-9d624316904b?w=1400&h=1800&fit=crop&auto=format&q=70"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/60 via-brand-800/40 to-ink-900/70" />
      </div>
    </div>
  );
}
