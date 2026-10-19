export default function StatCard({ label, value, sub, highlight = false }) {
  return (
    <div className={`bg-sofa-card border ${highlight ? 'border-sofa-blue/50 ring-1 ring-sofa-blue/20' : 'border-sofa-border'} hover:border-sofa-borderLight transition-all duration-200 rounded-xl p-4 shadow-sm relative overflow-hidden group`}>
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-sofa-blue/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl lg:text-3xl font-black text-white mt-1 font-mono tracking-tight tabular-nums">{value ?? '—'}</p>
      {sub && <p className="text-xs text-sofa-dim mt-1.5 font-medium">{sub}</p>}
    </div>
  )
}
