import { apiFetch } from '../lib/api'
import { supabase } from '../lib/supabase'

export async function getPlayers() {
  return apiFetch('/api/players')
}

export async function getPlayerWithStats(playerId, seasonId) {
  //TODO
}

export async function getSquadWithStats(seasonId) {
  return apiFetch(`/api/players/squad?seasonId=${seasonId}`)
}

export async function importFootballDataSquad(seasonId, season, teamId) {
  return apiFetch(`/api/football-data/teams/${teamId}/squad/import`, {
    method: 'POST',
    body: JSON.stringify({ seasonId, season }),
  })
}

export async function upsertPlayer(player) {
  return apiFetch('/api/players', {
    method: 'POST',
    body: JSON.stringify(player),
  })
}

export async function deletePlayer(id, seasonId) {
  return apiFetch(`/api/players/${id}?seasonId=${encodeURIComponent(seasonId)}`, { method: 'DELETE' })
}
