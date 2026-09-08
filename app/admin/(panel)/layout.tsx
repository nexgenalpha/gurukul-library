import { AdminSidebar } from "@/components/admin-sidebar";

// Applies only to routes under app/admin/(panel)/* — i.e. everything in
// the admin panel except /admin/login, which lives outside this group
// and renders full-screen instead.
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-navy-50/30">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
