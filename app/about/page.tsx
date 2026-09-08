import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "About Gurukul Library — a study library in Koyla Nagar, Kanpur.",
};

export default async function AboutPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("website_content")
    .select("content")
    .eq("section_key", "about_section")
    .maybeSingle();

  const content =
    (data as { content?: { heading?: string; description?: string } } | null)?.content ?? {};

  return (
    <div className="section max-w-3xl">
      <h1 className="font-serif text-3xl font-semibold text-navy-800 sm:text-4xl">
        {content.heading ?? "About Gurukul Library"}
      </h1>
      <div className="prose prose-navy mt-6 whitespace-pre-line text-navy-800/80">
        {content.description ?? (
          <p>
            This section hasn't been filled in yet — an admin can edit it from Website Content in
            the Admin Panel.
          </p>
        )}
      </div>
    </div>
  );
}
