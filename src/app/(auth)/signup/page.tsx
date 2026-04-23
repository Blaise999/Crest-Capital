"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/landing/Logo";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import { cx } from "@/lib/utils";

type Form = {
  // Step 1 — Personal
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
  phone: string;
  // Step 2 — Address
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  country: string;
  // Step 3 — Employment
  employment_status: string;
  employer: string;
  occupation: string;
  monthly_income: string;
  source_of_funds: string;
  tax_id: string;
  id_document_type: string;
  id_document_number: string;
  // Step 4 — Credentials
  email: string;
  password: string;
  password_confirm: string;
  terms: boolean;
};

const EMPTY: Form = {
  first_name: "", middle_name: "", last_name: "",
  date_of_birth: "", place_of_birth: "", nationality: "German", phone: "",
  street: "", street_number: "", postal_code: "", city: "", country: "Germany",
  employment_status: "employed", employer: "", occupation: "",
  monthly_income: "2.000 – 4.000 €", source_of_funds: "Salary",
  tax_id: "", id_document_type: "id_card", id_document_number: "",
  email: "", password: "", password_confirm: "", terms: false,
};

const STEPS = [
  { id: 0, label: "Personal" },
  { id: 1, label: "Address" },
  { id: 2, label: "Employment" },
  { id: 3, label: "Credentials" },
  { id: 4, label: "Review" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.first_name.trim()) return "First name is required";
      if (!form.last_name.trim()) return "Last name is required";
      if (!form.date_of_birth) return "Date of birth is required";
      const age = (Date.now() - new Date(form.date_of_birth).getTime()) / (365.25 * 86400000);
      if (age < 18) return "You must be at least 18 to open an account";
      if (!form.place_of_birth.trim()) return "Place of birth is required";
      if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7) return "Enter a valid phone number";
    }
    if (s === 1) {
      if (!form.street.trim()) return "Street is required";
      if (!form.street_number.trim()) return "Street number is required";
      if (!/^\d{4,5}$/.test(form.postal_code.trim())) return "Postal code looks wrong";
      if (!form.city.trim()) return "City is required";
    }
    if (s === 2) {
      if (!form.employment_status) return "Employment status is required";
      if (["employed", "self_employed"].includes(form.employment_status) && !form.occupation.trim()) {
        return "Occupation is required";
      }
      if (!form.tax_id.trim() || form.tax_id.replace(/\D/g, "").length < 10) return "German Tax-ID (11 digits) looks wrong";
      if (!form.id_document_number.trim()) return "ID document number is required";
    }
    if (s === 3) {
      if (!/.+@.+\..+/.test(form.email)) return "Enter a valid email";
      if (form.password.length < 8) return "Password must be at least 8 characters";
      if (form.password !== form.password_confirm) return "Passwords don't match";
      if (!form.terms) return "You must accept the terms to continue";
    }
    return null;
  }

  function next() {
    const e = validateStep(step);
    if (e) { setErr(e); return; }
    setErr(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setErr(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Sign-up failed");
      router.push("/pending-review");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left — form */}
      <div className="flex flex-col p-5 sm:p-8 bg-white">
        <Logo />

        {/* Progress bar */}
        <div className="mt-8 mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <span
                  className={cx(
                    "grid place-items-center h-7 w-7 rounded-full text-[11px] font-bold transition-colors shrink-0",
                    i < step && "bg-brand-500 text-white",
                    i === step && "bg-ink-900 text-white ring-4 ring-brand-500/15",
                    i > step && "bg-ink-100 text-ink-500"
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    className={cx(
                      "h-[2px] flex-1 rounded-full transition-colors",
                      i < step ? "bg-brand-500" : "bg-ink-100"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-[11.5px] text-ink-500 font-semibold uppercase tracking-[0.14em] px-1">
            Step {step + 1} of {STEPS.length} · {STEPS[step].label}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl w-full mx-auto lg:mx-0"
            >
              {step === 0 && <StepPersonal form={form} update={update} />}
              {step === 1 && <StepAddress form={form} update={update} />}
              {step === 2 && <StepEmployment form={form} update={update} />}
              {step === 3 && <StepCredentials form={form} update={update} />}
              {step === 4 && <StepReview form={form} />}
            </motion.div>
          </AnimatePresence>

          {err && (
            <div className="mt-4 max-w-xl rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13.5px] p-3">
              {err}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 max-w-xl">
            <button
              onClick={back}
              disabled={step === 0 || loading}
              className="btn btn-ghost disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn btn-brand">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={submit} disabled={loading} className="btn btn-brand disabled:opacity-70">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Submit for review
              </button>
            )}
          </div>

          <p className="mt-6 text-[13px] text-ink-500 max-w-xl">
            Already a customer?{" "}
            <Link href="/login" className="font-semibold text-ink-900 hover:underline">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-[12px] text-ink-400 mt-6">© {new Date().getFullYear()} Crest Capital AG</p>
      </div>

      {/* Right — hero image */}
      <div className="hidden lg:block relative bg-ink-900 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&q=80&auto=format&fit=crop"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/60 via-brand-800/40 to-ink-900/80" />
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <div className="rounded-2xl glass-dark p-5 shadow-pop max-w-md">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-brand-300">
              Licensed German bank
            </div>
            <div className="mt-1 text-[17px] font-semibold text-white leading-snug">
              Over 1 million Europeans bank with Crest Capital.
            </div>
            <ul className="mt-3 space-y-1.5">
              {[
                "Deposits protected up to 100.000 €",
                "Real-time SEPA transfers",
                "No hidden fees, ever",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2 text-[13px] text-white/85">
                  <Check className="h-4 w-4 text-brand-300" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== steps ============================== */

function StepPersonal({ form, update }: { form: Form; update: any }) {
  return (
    <section>
      <Heading title="Let's start with you" body="We need this to issue your German IBAN and comply with KYC rules." />
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="First name" value={form.first_name} onChange={(v) => update("first_name", v)} required />
        <Field label="Middle name" value={form.middle_name} onChange={(v) => update("middle_name", v)} />
        <Field label="Last name" value={form.last_name} onChange={(v) => update("last_name", v)} required />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={(v) => update("date_of_birth", v)} required />
        <Field label="Place of birth" value={form.place_of_birth} onChange={(v) => update("place_of_birth", v)} required placeholder="e.g. Berlin, Germany" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <Select label="Nationality" value={form.nationality} onChange={(v) => update("nationality", v)}
          options={["German","Austrian","French","Italian","Spanish","Dutch","Belgian","Swiss","Irish","British","Polish","Portuguese","Other"]} />
        <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+49 151 234 5678" required />
      </div>
    </section>
  );
}

function StepAddress({ form, update }: { form: Form; update: any }) {
  return (
    <section>
      <Heading title="Where do you live?" body="We'll send your card and any mail to this address." />
      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <Field label="Street" value={form.street} onChange={(v) => update("street", v)} required placeholder="Friedrichstraße" />
        <Field label="No." value={form.street_number} onChange={(v) => update("street_number", v)} required placeholder="12a" />
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-3 mt-3">
        <Field label="Postal code" value={form.postal_code} onChange={(v) => update("postal_code", v)} required placeholder="10117" />
        <Field label="City" value={form.city} onChange={(v) => update("city", v)} required placeholder="Berlin" />
      </div>
      <Select label="Country" value={form.country} onChange={(v) => update("country", v)}
        options={["Germany","Austria","Netherlands","Belgium","Luxembourg","France","Italy","Spain","Portugal","Ireland","Poland","Czechia","Other"]} />
    </section>
  );
}

function StepEmployment({ form, update }: { form: Form; update: any }) {
  const showEmployer = ["employed", "self_employed"].includes(form.employment_status);
  return (
    <section>
      <Heading title="Employment & identity" body="Required by German anti-money-laundering regulation." />
      <div className="grid sm:grid-cols-2 gap-3">
        <Select label="Employment status" value={form.employment_status} onChange={(v) => update("employment_status", v)}
          options={[
            { label: "Employed", value: "employed" },
            { label: "Self-employed", value: "self_employed" },
            { label: "Student", value: "student" },
            { label: "Retired", value: "retired" },
            { label: "Unemployed", value: "unemployed" },
          ]} />
        {showEmployer && (
          <Field label="Employer" value={form.employer} onChange={(v) => update("employer", v)} placeholder="e.g. ACME GmbH" />
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        {showEmployer && (
          <Field label="Occupation" value={form.occupation} onChange={(v) => update("occupation", v)} required={showEmployer} placeholder="e.g. Software engineer" />
        )}
        <Select label="Monthly net income" value={form.monthly_income} onChange={(v) => update("monthly_income", v)}
          options={["Below 1.000 €", "1.000 – 2.000 €", "2.000 – 4.000 €", "4.000 – 7.000 €", "7.000 – 10.000 €", "Above 10.000 €"]} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <Select label="Primary source of funds" value={form.source_of_funds} onChange={(v) => update("source_of_funds", v)}
          options={["Salary","Self-employment","Pension","Investment income","Savings","Family support","Other"]} />
        <Field label="German Tax-ID (Steuer-ID)" value={form.tax_id} onChange={(v) => update("tax_id", v)} required placeholder="11 digits" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <Select label="ID document type" value={form.id_document_type} onChange={(v) => update("id_document_type", v)}
          options={[
            { label: "German ID card (Personalausweis)", value: "id_card" },
            { label: "Passport", value: "passport" },
          ]} />
        <Field label="Document number" value={form.id_document_number} onChange={(v) => update("id_document_number", v)} required />
      </div>
    </section>
  );
}

function StepCredentials({ form, update }: { form: Form; update: any }) {
  return (
    <section>
      <Heading title="Create your sign-in credentials" body="You'll also need a one-time code each time you sign in — we'll email it to you." />
      <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required placeholder="you@example.com" />
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <Field label="Password" type="password" value={form.password} onChange={(v) => update("password", v)} required hint="At least 8 characters." />
        <Field label="Confirm password" type="password" value={form.password_confirm} onChange={(v) => update("password_confirm", v)} required />
      </div>
      <label className="mt-4 flex items-start gap-2 text-[13px] text-ink-700">
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(e) => update("terms", e.target.checked)}
          className="h-4 w-4 accent-brand-500 mt-0.5"
        />
        <span>
          I accept the{" "}
          <a className="font-semibold underline" href="#">General Terms &amp; Conditions</a>,{" "}
          <a className="font-semibold underline" href="#">Privacy Policy</a>, and{" "}
          <a className="font-semibold underline" href="#">List of Services &amp; Fees</a>, and confirm
          the information I provided is true and complete.
        </span>
      </label>
      <div className="mt-4 rounded-xl bg-ink-50 border border-ink-100 p-3 text-[12.5px] text-ink-600 flex items-start gap-2">
        <Lock className="h-4 w-4 shrink-0 mt-0.5 text-brand-600" />
        Your details are encrypted in transit and at rest. We never share your data with third parties without your consent.
      </div>
    </section>
  );
}

function StepReview({ form }: { form: Form }) {
  return (
    <section>
      <Heading title="Review & submit" body="Please double-check everything. Once submitted, our team will review your application within 1–2 business days." />
      <div className="rounded-2xl border border-ink-100 bg-ink-50 p-5 space-y-3 text-[13.5px]">
        <Row k="Full name" v={[form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ")} />
        <Row k="Date of birth" v={form.date_of_birth} />
        <Row k="Place of birth" v={form.place_of_birth} />
        <Row k="Nationality" v={form.nationality} />
        <Row k="Phone" v={form.phone} />
        <Row k="Address" v={`${form.street} ${form.street_number}, ${form.postal_code} ${form.city}, ${form.country}`} />
        <Row k="Employment" v={`${labelFor(form.employment_status)} — ${form.occupation || "—"}${form.employer ? ` @ ${form.employer}` : ""}`} />
        <Row k="Monthly income" v={form.monthly_income} />
        <Row k="Source of funds" v={form.source_of_funds} />
        <Row k="Tax ID" v={form.tax_id} />
        <Row k="ID document" v={`${labelFor(form.id_document_type)} · ${form.id_document_number}`} />
        <Row k="Email" v={form.email} />
      </div>
      <p className="mt-4 text-[12.5px] text-ink-500">
        By submitting, Crest Capital AG will open your dossier for KYC review. No money moves yet — you'll be notified by email as soon as we approve you.
      </p>
    </section>
  );
}

function labelFor(v: string) {
  const m: Record<string, string> = {
    employed: "Employed", self_employed: "Self-employed", student: "Student",
    retired: "Retired", unemployed: "Unemployed",
    id_card: "German ID card", passport: "Passport",
  };
  return m[v] || v;
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-ink-900">{title}</h1>
      <p className="mt-1 text-[14px] text-ink-500">{body}</p>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, hint, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; hint?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-700">{label}{required && <span className="text-red-500"> *</span>}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 bg-white px-4 text-[15px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
      />
      {hint && <span className="mt-1 block text-[11.5px] text-ink-400">{hint}</span>}
    </label>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: (string | { label: string; value: string })[];
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 bg-white px-3 text-[15px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
      >
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-ink-500">{k}</span>
      <span className="font-semibold text-ink-900 text-right break-words">{v || "—"}</span>
    </div>
  );
}
