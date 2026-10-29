import Modal from './Modal'

export default function ConfirmDialog({
  open,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) {
  if (!open) return null

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <p className="text-sm leading-6 text-slate-300">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="action-button">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={destructive
            ? 'inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-500'
            : 'primary-button'}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
