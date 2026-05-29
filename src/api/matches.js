import { supabase } from '../lib/supabase'

export async function getMatches(seasonId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*, match_events(id)')
    .eq('season_id', seasonId)
    .order('date')
  if (error) throw error
  return data
}

export async function getMatchWithEvents(matchId) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      match_events(
        id, type, minute, note,
        players(id, name, surname)
      )
    `)
    .eq('id', matchId)
    .single()
  if (error) throw error
  return data
}

export async function upsertMatch(match) {
  const { data, error } = await supabase
    .from('matches')
    .upsert(match)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateScore(matchId, goalsFor, goalsAgainst) {
  const { data, error } = await supabase
    .from('matches')
    .update({ goals_for: goalsFor, goals_against: goalsAgainst })
    .eq('id', matchId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMatch(id) {
  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) throw error
}

export async function addMatchEvent(event) {
  const { data, error } = await supabase
    .from('match_events')
    .insert(event)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMatchEvent(id) {
  const { error } = await supabase.from('match_events').delete().eq('id', id)
  if (error) throw error
}
