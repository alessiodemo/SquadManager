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

export async function upsertPlayer(player) {
  return apiFetch('/api/players', {
    method: 'POST',
    body: JSON.stringify(player),
  })
}

export async function deletePlayer(id) {
  return apiFetch(`/api/players/${id}`, { method: 'DELETE' })
}
