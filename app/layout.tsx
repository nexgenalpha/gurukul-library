import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    default: "Gurukul Library | Study Library in Koyla Nagar, Kanpur",
    template: "%s | Gurukul Library",
  },
  description:
    "A peaceful, focused study space in Koyla Nagar, Kanpur. Comfortable seating, dedicated study environment, and flexible membership plans for students and serious learners.",
  openGraph: {
    title: "Gurukul Library",
    description: "Your Space to Learn, Focus & Grow — a study library in Koyla Nagar, Kanpur.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Settings are fetched once here so the navbar/footer (library name,
  // phone, WhatsApp CTA) always reflect what admin has saved — nothing
  // about contact info is hardcoded into the layout.
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .single();

  return (
    <html lang="en">
      <body>
        <SiteChrome settings={settings ?? null}>{children}</SiteChrome>
      </body>
    </html>
  );
}
