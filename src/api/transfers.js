import { apiFetch } from '../lib/api'

export async function getTransfers(seasonId) {
  return apiFetch(`/api/transfers?seasonId=${seasonId}`)
}

export async function importTransfers({ seasonId, season, teamId }) {
  return apiFetch('/api/transfers/import', {
    method: 'POST',
    body: JSON.stringify({ seasonId, season, teamId }),
  })
}

export async function upsertTransfer(transfer) {
  return apiFetch(`/api/transfers`, {
    method: 'POST',
    body: JSON.stringify(transfer),
  })
}

export async function deleteTransfer(id) {
  return apiFetch(`/api/transfers/${id}`, { method: 'DELETE' })
}
