import { useEffect, useState } from 'react'
import { getSeasons } from '../api/seasons'

export default function SeasonSelector({ value, onChange }) {
  const [seasons, setSeasons] = useState([])

  useEffect(() => {
    getSeasons().then(setSeasons).catch(console.error)
  }, [])

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-600"
    >
      <option value="">Tutte le stagioni</option>
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
}
