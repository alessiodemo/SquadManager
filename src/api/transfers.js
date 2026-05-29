import { supabase } from '../lib/supabase'

export async function getTransfers(seasonId) {
  const query = supabase
    .from('market_transfers')
    .select('*, players(id, name, surname, role)')
    .order('transfer_date', { ascending: false })

  if (seasonId) query.eq('season_id', seasonId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function upsertTransfer(transfer) {
  const { data, error } = await supabase
    .from('market_transfers')
    .upsert(transfer)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTransfer(id) {
  const { error } = await supabase.from('market_transfers').delete().eq('id', id)
  if (error) throw error
}
