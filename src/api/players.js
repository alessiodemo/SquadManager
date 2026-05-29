import { supabase } from '../lib/supabase'

export async function getPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('surname')
  if (error) throw error
  return data
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
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      player_stats(goals, assists, appearances, yellow_cards, red_cards, season_id)
    `)
    .eq('player_stats.season_id', seasonId)
    .order('surname')
  if (error) throw error
  return data
}

export async function upsertPlayer(player) {
  const { data, error } = await supabase
    .from('players')
    .upsert(player)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePlayer(id) {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}
