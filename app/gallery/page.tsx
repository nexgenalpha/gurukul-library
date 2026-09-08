import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos of Gurukul Library — interiors, study areas, and facilities.",
};

interface GalleryRow {
  id: string;
  sub_category: string | null;
  caption: string | null;
  media: { public_url: string; alt_text: string | null } | null;
}

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery")
    .select("id, sub_category, caption, media:media_id(public_url, alt_text)")
    .eq("is_active", true)
    .order("display_order");

  const items = (data as unknown as GalleryRow[]) ?? [];

  return (
    <div className="section">
      <h1 className="font-serif text-3xl font-semibold text-navy-800 sm:text-4xl">Gallery</h1>
      <p className="mt-3 max-w-xl text-navy-800/60">A look inside Gurukul Library.</p>

      {items.length === 0 ? (
        <p className="mt-16 text-navy-800/50">
          No photos have been added yet. An admin can upload some from the Media Manager.
        </p>
      ) : (
        <div className="mt-12 columns-1 gap-4 sm:columns-2 md:columns-3">
          {items
            .filter((item) => item.media?.public_url)
            .map((item) => (
              <div key={item.id} className="mb-4 break-inside-avoid overflow-hidden rounded-xl2 shadow-card">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={item.media!.public_url}
                    alt={item.media?.alt_text ?? item.caption ?? "Gurukul Library"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {item.caption && (
                  <p className="bg-white px-3 py-2 text-sm text-navy-800/70">{item.caption}</p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
