"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminContentPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [hero, setHero] = useState({ headline: "", subtext: "" });
  const [about, setAbout] = useState({ heading: "", description: "" });

  useEffect(() => {
    Promise.all([
      supabase.from("website_content").select("content").eq("section_key", "home_hero").maybeSingle(),
      supabase.from("website_content").select("content").eq("section_key", "about_section").maybeSingle(),
    ]).then(([heroRes, aboutRes]) => {
      const heroContent = (heroRes.data as { content?: typeof hero } | null)?.content;
      const aboutContent = (aboutRes.data as { content?: typeof about } | null)?.content;
      if (heroContent) setHero({ headline: heroContent.headline ?? "", subtext: heroContent.subtext ?? "" });
      if (aboutContent) setAbout({ heading: aboutContent.heading ?? "", description: aboutContent.description ?? "" });
      setLoading(false);
    });
  }, [supabase]);

  async function saveSection(key: string, content: object) {
    setSaving(key);
    setSaved(null);
    await supabase.from("website_content").upsert({ section_key: key, content }, { onConflict: "section_key" });
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2500);
  }

  if (loading) return <div className="p-8 text-navy-800/50">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-serif text-2xl font-semibold text-navy-800">Website Content</h1>
      <p className="mt-1 text-sm text-navy-800/60">
        Text shown on the public Home and About pages. The hero image itself is managed in Media
        Manager (category "Hero").
      </p>

      <div className="mt-8 card space-y-4">
        <p className="font-medium text-navy-800">Homepage Hero</p>
        <label className="block">
          <span className="text-sm font-medium text-navy-800">Headline</span>
          <input
            className="input mt-1"
            placeholder="Your Space to Learn, Focus & Grow"
            value={hero.headline}
            onChange={(e) => setHero({ ...hero, headline: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-navy-800">Supporting Text</span>
          <textarea
            className="input mt-1 min-h-[80px]"
            value={hero.subtext}
            onChange={(e) => setHero({ ...hero, subtext: e.target.value })}
          />
        </label>
        <div className="flex items-center gap-4">
          <button onClick={() => saveSection("home_hero", hero)} disabled={saving === "home_hero"} className="btn-primary">
            {saving === "home_hero" ? "Saving…" : "Save Hero"}
          </button>
          {saved === "home_hero" && <span className="text-sm text-green-600">Saved.</span>}
        </div>
      </div>

      <div className="mt-6 card space-y-4">
        <p className="font-medium text-navy-800">About Section</p>
        <label className="block">
          <span className="text-sm font-medium text-navy-800">Heading</span>
          <input
            className="input mt-1"
            placeholder="About Gurukul Library"
            value={about.heading}
            onChange={(e) => setAbout({ ...about, heading: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-navy-800">Description</span>
          <textarea
            className="input mt-1 min-h-[140px]"
            value={about.description}
            onChange={(e) => setAbout({ ...about, description: e.target.value })}
          />
        </label>
        <div className="flex items-center gap-4">
          <button onClick={() => saveSection("about_section", about)} disabled={saving === "about_section"} className="btn-primary">
            {saving === "about_section" ? "Saving…" : "Save About"}
          </button>
          {saved === "about_section" && <span className="text-sm text-green-600">Saved.</span>}
        </div>
      </div>
    </div>
  );
}
