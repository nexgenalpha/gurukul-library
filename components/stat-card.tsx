export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-800/50">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-navy-800">{value}</p>
    </div>
  );
}
