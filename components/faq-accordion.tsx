"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <div className="divide-y divide-navy-100 rounded-xl2 bg-white shadow-card">
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <div key={faq.id}>
            <button
              onClick={() => setOpenId(open ? null : faq.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-medium text-navy-800">{faq.question}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-navy-800/50 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && <p className="px-5 pb-4 text-sm text-navy-800/70">{faq.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
