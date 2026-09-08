import { FaqAccordion } from "@/components/faq-accordion";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Gurukul Library membership and facilities.",
};

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

export default async function FaqPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  const faqs = (data as Faq[]) ?? [];

  return (
    <div className="section max-w-2xl">
      <h1 className="font-serif text-3xl font-semibold text-navy-800 sm:text-4xl">
        Frequently Asked Questions
      </h1>

      {faqs.length === 0 ? (
        <p className="mt-16 text-navy-800/50">
          FAQs will appear here once added in the Admin Panel.
        </p>
      ) : (
        <div className="mt-10">
          <FaqAccordion faqs={faqs} />
        </div>
      )}
    </div>
  );
}
