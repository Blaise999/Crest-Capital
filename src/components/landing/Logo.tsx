"use client";

import Link from "next/link";
import { cx } from "@/lib/utils";

export function Logo({
  className,
  onDark = false,
  useChameleon = false,
  showTagline = false,
  size = "md",
}: {
  className?: string;
  onDark?: boolean;
  useChameleon?: boolean;
  showTagline?: boolean;
  size?: "sm" | "md";
}) {
  const mark = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const text = size === "sm" ? "text-[16px]" : "text-[18px]";
  return (
    <Link
      href="/"
      className={cx("inline-flex items-center gap-2.5 focus-ring", className)}
      aria-label="Crest Capital home"
    >
      <LogoMark className={mark} />
      <span className="flex flex-col leading-none">
        <span
          className={cx(
            "font-bold tracking-tight",
            text,
            !useChameleon && (onDark ? "text-white" : "text-ink-900")
          )}
          style={useChameleon ? { color: "var(--nav-fg)" } : undefined}
        >
          Crest Capital
        </span>
        {showTagline && (
          <span
            className={cx(
              "mt-1 text-[10px] font-medium tracking-[0.14em] uppercase",
              onDark ? "text-white/60" : "text-ink-400"
            )}
          >
            Finance at its peak
          </span>
        )}
      </span>
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "relative grid place-items-center rounded-xl overflow-hidden",
        className
      )}
      aria-hidden
      style={{
        background: "linear-gradient(135deg, #2f66ff 0%, #0c2672 100%)",
        boxShadow: "0 4px 12px -4px rgba(47,102,255,0.6)",
      }}
    >
      <svg viewBox="0 0 32 32" className="h-[70%] w-[70%]" fill="none" aria-hidden>
        <path
          d="M2 26 L11 13 L15.5 18 L21 9 L30 26 Z"
          fill="#ffffff"
          opacity="0.96"
        />
        <circle cx="23" cy="7.5" r="1.6" fill="#ffffff" />
      </svg>
    </span>
  );
}
