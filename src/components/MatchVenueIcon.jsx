export default function MatchVenueIcon({ isHome, className = '' }) {
  const label = isHome ? 'CASA' : 'TRASFERTA'

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase shrink-0 ${
        isHome
          ? 'bg-sofa-blue/15 text-sofa-blueLight border border-sofa-blue/30'
          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
      } ${className}`}
      title={isHome ? 'Partita in casa' : 'Partita in trasferta'}
    >
      {label}
    </span>
  )
}