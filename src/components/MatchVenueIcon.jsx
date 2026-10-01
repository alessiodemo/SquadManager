import { House, Plane } from 'lucide-react'

export default function MatchVenueIcon({ isHome, size = 16, className = '' }) {
  const Icon = isHome ? House : Plane
  const label = isHome ? 'Partita in casa' : 'Partita in trasferta'

  return (
    <Icon
      size={size}
      strokeWidth={2}
      className={`shrink-0 ${isHome ? 'text-green-400' : 'text-sky-300'} ${className}`}
      role="img"
      aria-label={label}
      title={label}
    />
  )
}