import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

const toneStyles = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
  },
  error: {
    icon: XCircle,
    className: 'border-red-500/40 bg-red-950/90 text-red-100',
  },
  info: {
    icon: Info,
    className: 'border-sofa-blue/40 bg-slate-950/95 text-slate-100',
  },
  warning: {
    icon: AlertCircle,
    className: 'border-amber-500/40 bg-amber-950/90 text-amber-100',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, options = {}) => {
    const id = crypto.randomUUID()
    const toast = {
      id,
      message,
      tone: options.tone ?? 'info',
      duration: options.duration ?? 5000,
    }

    setToasts((current) => [...current, toast])
    return id
  }, [])

  useEffect(() => {
    const timers = toasts
      .filter((toast) => toast.duration > 0)
      .map((toast) => window.setTimeout(() => dismissToast(toast.id), toast.duration))

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [toasts, dismissToast])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone] ?? toneStyles.info
          const Icon = style.icon

          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className={`glass-panel flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${style.className}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-md p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
