import { useSeason } from '../context/seasonContext'
import { Select } from './ui/select'
import { ErrorNotice } from './ui/error-notice'

export default function SeasonSelector({ value, onChange }) {
  const { seasons, seasonsLoading, seasonsError } = useSeason()

  return (
    <>
      <Select
        id="season-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Select season"
        disabled={seasonsLoading || Boolean(seasonsError)}
      >
        <option value="">
          {seasonsLoading ? 'Loading seasons...' : 'Select a season'}
        </option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <ErrorNotice message={seasonsError} />
    </>
  )
}
