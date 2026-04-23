"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, User } from "lucide-react";
import { cx } from "@/lib/utils";

export default function SettingsPage() {
  const [me, setMe] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/auth/me");
    const d = await r.json();
    if (d.ok) {
      setMe(d.user);
      setFirstName(d.user.first_name || "");
      setLastName(d.user.last_name || "");
      setPhone(d.user.phone || "");
      setAvatar(d.user.avatar_url || null);
    }
  }
  useEffect(() => { load(); }, []);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3_000_000) return setErr("Image must be under 3 MB");
    const r = new FileReader();
    r.onload = () => setAvatar(String(r.result));
    r.readAsDataURL(f);
  }

  async function save() {
    setErr(null); setSaving(true); setSaved(false);
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          avatar_url: avatar,
          first_name: firstName,
          last_name: lastName,
          phone,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  if (!me) {
    return <div className="pt-10 text-center text-[13px] text-ink-400">
      <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading…
    </div>;
  }

  return (
    <div className="pt-4 sm:pt-6 max-w-2xl space-y-5 pb-12">
      <div>
        <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight text-ink-900">Settings</h1>
        <p className="text-[13px] text-ink-500 mt-0.5">Your profile and sign-in details.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-[15px] font-semibold text-ink-900">Profile</h2>
        <div className="mt-5 flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-ink-100 overflow-hidden grid place-items-center ring-4 ring-white shadow-md">
              {avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-ink-400" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-brand-500 text-white grid place-items-center shadow ring-2 ring-white hover:bg-brand-600"
              aria-label="Change picture"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-semibold text-ink-900">
              {firstName} {lastName}
            </div>
            <div className="text-[12.5px] text-ink-500">{me.email}</div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <Field label="First name" value={firstName} onChange={setFirstName} />
          <Field label="Last name" value={lastName} onChange={setLastName} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Email" value={me.email} onChange={() => {}} readOnly />
        </div>

        {err && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13px] p-3">{err}</div>}

        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} disabled={saving} className={cx("btn btn-brand disabled:opacity-60")}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-[15px] font-semibold text-ink-900">Account</h2>
        <div className="mt-3 space-y-2 text-[13.5px]">
          <KV k="IBAN" v={me.iban || "—"} />
          <KV k="BIC" v={me.bic || "—"} />
          <KV k="Card" v={me.card_last4 ? `•••• ${me.card_last4}` : "—"} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, readOnly,
}: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={cx(
          "mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-[15px] outline-none focus:border-brand-500",
          readOnly && "bg-ink-50 text-ink-500"
        )}
      />
    </label>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{k}</span>
      <span className="font-semibold text-ink-900 tabular-nums">{v}</span>
    </div>
  );
}
