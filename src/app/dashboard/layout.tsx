import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Logo } from "@/components/landing/Logo";
import { DashSidebar } from "@/components/dashboard/DashSidebar";
import { DashTopbar } from "@/components/dashboard/DashTopbar";
import { FlaggedBanner } from "@/components/dashboard/FlaggedBanner";

// The dashboard is always per-user and reads the session cookie. Without
// this hint Next will sometimes try to pre-render or cache aggressively
// and the cookies() call ends up out of sync with the actual request.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");

  const sb = supabaseAdmin();
  // Tolerate a failed extra query — the layout used to assume `data` was
  // always populated; if Supabase is briefly unreachable the layout would
  // throw and you'd see the "Application error" screen.
  let extra: {
    first_name?: string | null;
    blocked?: boolean | null;
    blocked_reason?: string | null;
    blocked_at?: string | null;
    onboarding_status?: string | null;
  } | null = null;

  try {
    const { data } = await sb
      .from("users")
      .select("first_name, blocked, blocked_reason, blocked_at, onboarding_status")
      .eq("id", user.id)
      .single();
    extra = data || null;
  } catch {
    extra = null;
  }

  // Pending / rejected onboarding still gates here (they haven't been approved).
  // If we couldn't read onboarding_status at all, fall through to the
  // dashboard rather than dumping the user in a redirect loop.
  if (extra && extra.onboarding_status && extra.onboarding_status !== "APPROVED") {
    redirect("/pending-review");
  }

  // Blocked users can sign in and see their dashboard read-only.
  // Writes (transfers, vault moves, etc.) are rejected server-side.
  return (
    <div className="min-h-screen bg-ink-50">
      <DashSidebar />
      <div className="lg:pl-64">
        <DashTopbar user={user} />
        {user.blocked && (
          <FlaggedBanner
            reason={extra?.blocked_reason || null}
            blockedAt={extra?.blocked_at || null}
          />
        )}
        <main className="px-5 sm:px-8 pb-16 pt-4">{children}</main>
        <footer className="px-5 sm:px-8 py-6 text-[12px] text-ink-400 flex items-center justify-between">
          <Logo />
          <span>© {new Date().getFullYear()} Crest Capital AG · Berlin</span>
          <span>Need help? support@crestcapital.com</span>
        </footer>
      </div>
    </div>
  );
}
