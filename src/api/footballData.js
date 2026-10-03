import { apiFetch } from '../lib/api'

export async function getFootballDataCompetitions() {
    const data = await apiFetch('/api/football-data/competitions')
    return data.competitions
}

export async function getFootballDataTeamsForCompetition(competitionCode, season) {
    const params = new URLSearchParams({ season: String(season) })
    const code = encodeURIComponent(competitionCode)
    const data = await apiFetch(`/api/football-data/competitions/${code}/teams?${params}`)
    return data.teams
}