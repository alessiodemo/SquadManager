const variants = {
  win: 'bg-green-700 text-green-100',
  draw: 'bg-yellow-700 text-yellow-100',
  loss: 'bg-red-700 text-red-100',
  in: 'bg-blue-700 text-blue-100',
  out: 'bg-orange-700 text-orange-100',
  default: 'bg-gray-700 text-gray-200',
}

export default function Badge({ label, variant = 'default' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant] ?? variants.default}`}>
      {label}
    </span>
  )
}
