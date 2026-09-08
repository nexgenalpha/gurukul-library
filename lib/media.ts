import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaCategory } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// Maps each content category to the storage bucket it lives in, per the
// spec's five-bucket layout (library-images / gallery / banners /
// facility-images / profile-images). profile-images is intentionally
// excluded here — those are written by members to their own folder, not
// through the admin Media Manager.
const BUCKET_FOR_CATEGORY: Record<MediaCategory, string> = {
  hero: "library-images",
  about: "library-images",
  promo: "library-images",
  other: "library-images",
  gallery: "gallery",
  banner: "banners",
  facility: "facility-images",
};

function extFromName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}

export async function uploadMedia(
  supabase: AnySupabaseClient,
  file: File,
  category: MediaCategory,
  userId: string
) {
  const bucket = BUCKET_FOR_CATEGORY[category];
  const path = `${category}/${crypto.randomUUID()}${extFromName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  const { data, error: insertError } = await supabase
    .from("media")
    .insert({
      category,
      storage_bucket: bucket,
      storage_path: path,
      public_url: urlData.publicUrl,
      uploaded_by: userId,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return data;
}

export async function replaceMedia(
  supabase: AnySupabaseClient,
  mediaId: string,
  oldBucket: string,
  oldPath: string,
  newFile: File,
  category: MediaCategory
) {
  const bucket = BUCKET_FOR_CATEGORY[category];
  const path = `${category}/${crypto.randomUUID()}${extFromName(newFile.name)}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, newFile, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("media")
    .update({ storage_bucket: bucket, storage_path: path, public_url: urlData.publicUrl })
    .eq("id", mediaId);
  if (updateError) throw updateError;

  // Best-effort cleanup of the old file — don't fail the replace if this errors.
  await supabase.storage.from(oldBucket).remove([oldPath]);
}

export async function deleteMedia(
  supabase: AnySupabaseClient,
  mediaId: string,
  bucket: string,
  path: string
) {
  const { error: dbError } = await supabase.from("media").delete().eq("id", mediaId);
  if (dbError) throw dbError;
  await supabase.storage.from(bucket).remove([path]);
}
