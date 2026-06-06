import { apiFetch } from '../lib/api.js'

export async function getSeasons() {
  return apiFetch('/api/seasons')
}

export async function getCurrentSeason() {
  return apiFetch('/api/seasons/current')
}

export async function upsertSeason(season) {
  return apiFetch('/api/seasons', {
    method: 'POST',
    body: JSON.stringify(season),
  })
}

