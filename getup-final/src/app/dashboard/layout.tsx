import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Logo } from "@/components/landing/Logo";
import { DashSidebar } from "@/components/dashboard/DashSidebar";
import { DashTopbar } from "@/components/dashboard/DashTopbar";
import { FlaggedBanner } from "@/components/dashboard/FlaggedBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("first_name, blocked, blocked_reason, blocked_at, onboarding_status")
    .eq("id", user.id)
    .single();

  // Pending / rejected onboarding still gates here (they haven't been approved).
  if (data?.onboarding_status !== "APPROVED") {
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
            reason={data?.blocked_reason}
            blockedAt={data?.blocked_at}
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
