import { Card } from './ui/card'

export default function StatCard({ label, value, sub, highlight = false }) {
  return (
    <Card className={`glass-panel relative overflow-hidden p-4 transition-all duration-200 group hover:-translate-y-0.5 hover:border-sofa-borderLight ${highlight ? 'border-sofa-blue/50 ring-1 ring-sofa-blue/20' : 'border-sofa-border'}`}>
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-sofa-blue/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl lg:text-3xl font-black text-white mt-1 font-mono tracking-tight tabular-nums">{value ?? '—'}</p>
      {sub && <p className="text-xs text-sofa-dim mt-1.5 font-medium">{sub}</p>}
    </Card>
  )
}
