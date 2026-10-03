import { apiFetch } from '../lib/api'

export async function importStandings({ season, seasonId, competitionCode }) {
  return apiFetch(`/api/football-data/competitions/${encodeURIComponent(competitionCode)}/standings/import`, {
    method: 'POST',
    body: JSON.stringify({ season, seasonId }),
  })
}