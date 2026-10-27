import { useSeason } from '../context/seasonContext'
import { Select } from './ui/select'

export default function SeasonSelector({ value, onChange }) {
  const { seasons } = useSeason()

  return (
    <Select
      id="season-select"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Seleziona stagione"
    >
      <option value="">Seleziona una stagione</option>
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </Select>
  )
}
