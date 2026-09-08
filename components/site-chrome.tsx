"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Settings } from "@/types/database";

// The admin panel has its own sidebar chrome (see admin/(panel)/layout.tsx)
// and must never show the public marketing navbar/footer. Since the app
// has a single root layout, that decision is made here based on path
// rather than via a second root layout, to keep the site's <head>/metadata
// setup in one place.
export function SiteChrome({
  settings,
  children,
}: {
  settings: Settings | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar libraryName={settings?.library_name ?? "Gurukul Library"} />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
