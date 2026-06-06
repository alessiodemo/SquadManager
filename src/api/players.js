import { supabase } from '../lib/supabase'

export async function getPlayers() {
  return apiFetch('/api/players')
}

export async function getPlayerWithStats(playerId, seasonId) {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      player_stats!inner(goals, assists, appearances, yellow_cards, red_cards, season_id),
      seasons!player_stats(id, name)
    `)
    .eq('id', playerId)
    .eq('player_stats.season_id', seasonId)
    .single()
  if (error) throw error
  return data
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
