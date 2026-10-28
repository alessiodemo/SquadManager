import { AlertCircle, X } from 'lucide-react'

export function ErrorNotice({ message, onDismiss, onRetry, className = '' }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200 ${className}`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 font-semibold text-rose-100 underline underline-offset-2">
          Try again
        </button>
      )}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Chiudi avviso" className="shrink-0 text-rose-300 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
