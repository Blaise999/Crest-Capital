import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin-login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop stays exactly the same */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="lg:pl-64">
        <AdminTopbar user={user} />
        <main className="px-4 sm:px-5 lg:px-8 pb-16 pt-4">{children}</main>
      </div>
    </div>
  );
}