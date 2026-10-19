import { useEffect, useState } from 'react'
import { Select } from 'flowbite-react'
import { getSeasons } from '../api/seasons'

export default function SeasonSelector({ value, onChange }) {
  const [seasons, setSeasons] = useState([])

  useEffect(() => {
    getSeasons().then(setSeasons).catch(console.error)
  }, [value])

  return (
    <select
      id="season-select"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full bg-[#0b1320] border border-[#1e2f4a] text-slate-100 text-xs rounded-lg px-3 py-2 focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue outline-none transition-colors cursor-pointer"
      aria-label="Seleziona stagione"
    >
      <option value="" className="bg-[#0b1320] text-slate-400">Select a Season</option>
      {seasons.map((s) => (
        <option key={s.id} value={s.id} className="bg-[#0b1320] text-slate-100">
          {s.name}
        </option>
      ))}
    </select>
  )
}
