import { supabase } from '../lib/supabase'

export async function getSeasons() {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('start_year', { ascending: false })
  if (error) throw error
  return data
}

export async function getCurrentSeason() {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_current', true)
    .single()
  if (error) throw error
  return data
}

export async function upsertSeason(season) {
  const { data, error } = await supabase
    .from('seasons')
    .upsert(season)
    .select()
    .single()
  if (error) throw error
  return data
}
