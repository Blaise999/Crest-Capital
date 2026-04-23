"use client";

import type { SessionUser } from "@/lib/auth";

export function AdminTopbar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-ink-100">
      <div className="h-16 flex items-center gap-3 px-5 sm:px-8">
        <div>
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Admin console
          </div>
          <div className="text-[13.5px] font-semibold text-ink-900">Signed in as {user.email}</div>
        </div>
        <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-brand-500/10 text-brand-700 text-[11.5px] font-bold px-3 py-1.5">
          Live · production mode
        </div>
      </div>
    </header>
  );
}
