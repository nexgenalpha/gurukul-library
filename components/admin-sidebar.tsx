"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Armchair,
  ClipboardCheck,
  BookOpen,
  ArrowLeftRight,
  Wallet,
  Image as ImageIcon,
  Megaphone,
  Bell,
  MessageSquareQuote,
  HelpCircle,
  FileText,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/seats", label: "Seats", icon: Armchair },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/book-issues", label: "Book Issues", icon: ArrowLeftRight },
  { href: "/admin/plans", label: "Membership Plans", icon: Wallet },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/media", label: "Media Manager", icon: ImageIcon },
  { href: "/admin/banners", label: "Banners", icon: Megaphone },
  { href: "/admin/announcements", label: "Announcements", icon: Bell },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/content", label: "Website Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-navy-100 bg-white">
      <div className="border-b border-navy-100 px-6 py-5">
        <p className="font-serif text-lg font-semibold text-navy-800">Gurukul Library</p>
        <p className="text-xs text-navy-800/50">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-navy-600 text-white"
                      : "text-navy-800/70 hover:bg-navy-50 hover:text-navy-800"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-navy-100 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-navy-800/70 hover:bg-navy-50 hover:text-navy-800"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
