import { supabase } from '../lib/supabase'

export async function getTransfers(seasonId) {
  return apiFetch(`/api/transfers?seasonId=${seasonId}`)
}

export async function upsertTransfer(transfer) {
  return apiFetch(`/api/transfers`)
}

export async function deleteTransfer(id) {
  return apiFetch(`/api/transfers/${id}`, { method: 'DELETE' })
}
