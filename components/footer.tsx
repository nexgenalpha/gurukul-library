import Link from "next/link";
import type { Settings } from "@/types/database";

export function Footer({ settings }: { settings: Settings | null }) {
  const name = settings?.library_name ?? "Gurukul Library";

  return (
    <footer className="border-t border-navy-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-serif text-lg font-semibold text-navy-800">{name}</p>
            <p className="mt-2 text-sm text-navy-800/70">
              {settings?.address ?? "Address configured from Admin Panel."}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-navy-800">Contact</p>
            <ul className="mt-2 space-y-1 text-sm text-navy-800/70">
              <li>{settings?.phone ?? "Phone not yet configured"}</li>
              <li>{settings?.email ?? "Email not yet configured"}</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-navy-800">Explore</p>
            <ul className="mt-2 space-y-1 text-sm text-navy-800/70">
              <li><Link href="/membership">Membership Plans</Link></li>
              <li><Link href="/seats">Seat Availability</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-xs text-navy-800/50">
          © {new Date().getFullYear()} {name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
