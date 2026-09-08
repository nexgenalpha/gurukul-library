import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client. Uses only the public anon key — never the
// service-role key, which must stay server-only (see lib/supabase/admin.ts).
//
// Untyped for now: once this is connected to a real Supabase project, run
//   npx supabase gen types typescript --project-id <id> > types/database.ts
// and pass that as createBrowserClient<Database>(...) for full query
// type-safety. The hand-authored types/database.ts interfaces are still
// useful for typing component props in the meantime.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
