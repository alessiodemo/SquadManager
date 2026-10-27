import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-9 w-full appearance-none rounded-lg border border-sofa-border bg-sofa-dark/80 px-3 py-1.5 pr-8 text-xs text-slate-100 shadow-inner shadow-black/10 outline-none transition-colors',
          'focus:border-sofa-blue focus:ring-2 focus:ring-sofa-blue/20 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sofa-muted" />
    </div>
  )
}
