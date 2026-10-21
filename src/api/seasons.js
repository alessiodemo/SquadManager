import { apiFetch } from '../lib/api.js'

export function normalizeSeason(season) {
  if (!season || !Number.isInteger(Number(season.start_year))) {
    return season
  }

  const startYear = Number(season.start_year)
  return {
    ...season,
    name: `${startYear}/${startYear + 1}`,
    start_year: startYear,
  }
}

export function normalizeSeasons(seasons) {
  const uniqueSeasons = new Map()

  for (const season of seasons) {
    const normalizedSeason = normalizeSeason(season)
    const key = Number.isInteger(normalizedSeason?.start_year)
      ? String(normalizedSeason.start_year)
      : String(normalizedSeason?.name ?? normalizedSeason?.id)

    if (!uniqueSeasons.has(key)) {
      uniqueSeasons.set(key, normalizedSeason)
    }
  }

  return [...uniqueSeasons.values()]
}

export async function getSeasons() {
  const seasons = await apiFetch('/api/seasons')
  return normalizeSeasons(seasons)
}

export async function getCurrentSeason() {
  const season = await apiFetch('/api/seasons/current')
  return normalizeSeason(season)
}

export async function upsertSeason(season) {
  return apiFetch('/api/seasons', {
    method: 'POST',
    body: JSON.stringify(season),
  })
}

export async function createSeasonContext(competitionCode, startYear, teamExternalId, teamName) {
  const season = await apiFetch('/api/seasons/context', {
    method: 'POST',
    body: JSON.stringify({
      competitionCode,
      startYear,
      teamExternalId,
      teamName,
    }),
  })
  return normalizeSeason(season)
}
