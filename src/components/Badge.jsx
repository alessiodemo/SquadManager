const variants = {
  win: 'bg-[#16a34a] text-white font-black w-6 h-6 rounded-md flex items-center justify-center text-xs shadow-sm shadow-emerald-950/40 tracking-wider',
  draw: 'bg-[#ca8a04] text-white font-black w-6 h-6 rounded-md flex items-center justify-center text-xs shadow-sm shadow-amber-950/40 tracking-wider',
  loss: 'bg-[#dc2626] text-white font-black w-6 h-6 rounded-md flex items-center justify-center text-xs shadow-sm shadow-rose-950/40 tracking-wider',
  in: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold px-2.5 py-0.5 rounded-full text-xs tracking-wide',
  out: 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold px-2.5 py-0.5 rounded-full text-xs tracking-wide',
  POR: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded text-[11px] tracking-wide',
  DIF: 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold px-2 py-0.5 rounded text-[11px] tracking-wide',
  CEN: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded text-[11px] tracking-wide',
  ATT: 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold px-2 py-0.5 rounded text-[11px] tracking-wide',
  ALA: 'bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold px-2 py-0.5 rounded text-[11px] tracking-wide',
  default: 'bg-slate-800 text-slate-300 border border-slate-700/80 font-medium px-2 py-0.5 rounded text-xs',
}

export default function Badge({ label, variant = 'default', className = '' }) {
  const isFormBadge = variant === 'win' || variant === 'draw' || variant === 'loss'
  
  return (
    <span className={`inline-flex shrink-0 ${isFormBadge ? '' : 'items-center'} ${variants[variant] ?? variants.default} ${className}`}>
      {label}
    </span>
  )
}
