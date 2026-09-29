import { apiFetch } from '../lib/api'

export async function importStandings({ season, seasonId, competitionCode = 'SA' }) {
  return apiFetch(`/api/football-data/competitions/${competitionCode}/standings/import`, {
    method: 'POST',
    body: JSON.stringify({ season, seasonId }),
  })
}