// Plain pass-through. This exists only so /admin/* sits under the app
// router's admin segment; the actual chrome is decided per route group:
//   - app/admin/login          -> no sidebar (full-screen login)
//   - app/admin/(panel)/*      -> sidebar layout, see (panel)/layout.tsx
export default function AdminSegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
