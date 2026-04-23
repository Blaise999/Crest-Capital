"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Receipt,
  ClipboardList,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/applications", label: "Applications", Icon: ClipboardList },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/transfers", label: "Transfers", Icon: ArrowLeftRight },
  { href: "/admin/transactions", label: "Transactions", Icon: Receipt },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin-login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile nav */}
      <div className="lg:hidden border-b border-ink-200 bg-ink-900 text-white">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <Logo onDark />
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </span>
        </div>

        <div className="overflow-x-auto">
          <nav className="flex items-center gap-2 px-4 py-3 min-w-max">
            {NAV.map((it) => {
              const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);

              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cx(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition whitespace-nowrap border",
                    active
                      ? "bg-white text-ink-900 border-white"
                      : "text-white/85 border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <it.Icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}

            <button
              onClick={logout}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-white/85 border border-white/10 bg-white/5 hover:bg-white/10 whitespace-nowrap transition"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar - unchanged */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-ink-900 text-white flex-col">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-white/10">
          <Logo onDark />
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((it) => {
            const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);

            return (
              <Link
                key={it.href}
                href={it.href}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition",
                  active ? "bg-white text-ink-900" : "text-white/80 hover:bg-white/10"
                )}
              >
                <it.Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-white/80 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}