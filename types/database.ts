// Hand-authored starting types matching supabase/schema.sql.
// Once the project is connected to a real Supabase instance, replace this
// file by running:
//   npx supabase gen types typescript --project-id <id> > types/database.ts
// Keeping the shapes below in sync in the meantime is fine for development.

export type UserRole = "admin" | "staff" | "member";
export type SeatStatus = "available" | "reserved" | "occupied" | "blocked";
export type MembershipStatus = "active" | "expired" | "pending" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type MediaCategory =
  | "hero"
  | "gallery"
  | "facility"
  | "banner"
  | "promo"
  | "about"
  | "other";
export type BookIssueStatus = "issued" | "returned" | "overdue";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  badge: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Member {
  id: string;
  profile_id: string;
  membership_id: string;
  plan_id: string | null;
  status: MembershipStatus;
  start_date: string | null;
  expiry_date: string | null;
  seat_id: string | null;
  is_active: boolean;
}

export interface Seat {
  id: string;
  seat_number: string;
  zone: string | null;
  status: SeatStatus;
  member_id: string | null;
  notes: string | null;
}

export interface Facility {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  media_id: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Media {
  id: string;
  category: MediaCategory;
  storage_bucket: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  caption: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Settings {
  library_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  opening_hours: Record<string, string>;
  google_maps_url: string | null;
  google_maps_embed_url: string | null;
  social_links: Record<string, string>;
}

// NOTE: previously this file also exported a `Database` generic type for
// use as createClient<Database>(). It was removed — @supabase/ssr's
// generic shape didn't match a hand-rolled partial schema and produced
// `never` types on every query. Once this project is connected to a real
// Supabase instance, generate real types with:
//   npx supabase gen types typescript --project-id <id> > types/database.ts
// and thread that Database type through lib/supabase/{client,server,admin}.ts.
// Until then, query results are typed by hand at the call site (e.g.
// `.select() as Media[]` or an explicit cast), using the interfaces above.
