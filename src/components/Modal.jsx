import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`bg-sofa-card border border-sofa-border shadow-2xl rounded-2xl w-full ${maxWidth} my-8 overflow-hidden transform transition-all`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-sofa-border bg-sofa-bg/40">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sofa-blue" />
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Chiudi modale"
            className="text-sofa-muted hover:text-white hover:bg-sofa-cardHover transition-colors rounded-lg p-1.5 leading-none"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
