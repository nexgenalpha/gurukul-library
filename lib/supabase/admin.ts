import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// DANGER: this client uses the service-role key and bypasses Row Level
// Security entirely. It must NEVER be imported into any file that can end
// up in a client bundle. The `server-only` import above makes Next.js
// throw a build error if that ever happens.
//
// Use this only for privileged admin-panel server actions / route
// handlers that have already verified the caller's role server-side
// (see lib/auth/require-admin.ts).
// Untyped for now — see lib/supabase/client.ts for the note on generated types.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
