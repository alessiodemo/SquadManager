import { useSeason } from '../context/seasonContext'
import { Select } from './ui/select'

export default function SeasonSelector({ value, onChange }) {
  const { seasons, seasonsLoading, seasonsError } = useSeason()

  return (
    <>
      <Select
        id="season-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Seleziona stagione"
        disabled={seasonsLoading || Boolean(seasonsError)}
      >
        <option value="">
          {seasonsLoading ? 'Caricamento stagioni...' : 'Seleziona una stagione'}
        </option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      {seasonsError && <p className="mt-1.5 text-[10px] font-medium text-rose-300">{seasonsError}</p>}
    </>
  )
}
