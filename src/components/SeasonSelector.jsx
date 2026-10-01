import { useEffect, useState } from 'react'
import { Select } from 'flowbite-react'
import { getSeasons } from '../api/seasons'

export default function SeasonSelector({ value, onChange }) {
  const [seasons, setSeasons] = useState([])

  useEffect(() => {
    getSeasons().then(setSeasons).catch(console.error)
  }, [value])

  return (
    <Select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      sizing="sm"
      color="gray"
      className="w-full border-gray-700 bg-gray-900 text-gray-100 focus:border-green-600 focus:ring-green-600"
      aria-label="Seleziona stagione"
    >
      <option value="">Tutte le stagioni</option>
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </Select>
  )
}
