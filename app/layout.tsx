import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: {
    default: "Gurukul Library | Study Library in Koyla Nagar, Kanpur",
    template: "%s | Gurukul Library",
  },
  description:
    "A peaceful, focused study space in Koyla Nagar, Kanpur.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteChrome settings={null}>{children}</SiteChrome>
      </body>
    </html>
  );
}
