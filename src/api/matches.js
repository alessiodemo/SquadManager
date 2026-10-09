import { apiFetch } from '../lib/api'
//import { callApi } from '../../backend/services/llm_interaction/llm_interaction.py'

export async function getMatches(seasonId) {
  return apiFetch(`/api/matches?seasonId=${seasonId}`)
}

export async function getMatchWithEvents(matchId) {
  return apiFetch(`/api/matches/${matchId}`)
}

export async function upsertMatch(match) {
  return apiFetch(`/api/matches`, {
    method: 'POST',
    body: JSON.stringify(match),
  })
}

export async function updateScore(matchId, goalsFor, goalsAgainst) {
  return apiFetch(`/api/matches/${matchId}`, {
    method: 'PATCH',
    body: JSON.stringify({ goals_for: goalsFor, goals_against: goalsAgainst }),
  })
}

export async function deleteMatch(id) {
  return apiFetch(`/api/matches/${id}`, { method: 'DELETE' })
}

export async function addMatchEvent(event) {
  return apiFetch(`/api/matches/${event.match_id}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export async function deleteMatchEvent(id) {
  return apiFetch(`/api/matches/events/${id}`, { method: 'DELETE' })
}

export async function getMatchContext(matchId) {
  return apiFetch(`/api/matches/${matchId}/context`)
  // result = apiFetch(`/api/matches/${matchId}/context`)
  // llm_interaction = callApi(result)
}

export async function importCompetitionMatches({ competitionCode, season, teamExternalId, seasonId }) {
  return apiFetch(`/api/football-data/competitions/${encodeURIComponent(competitionCode)}/import`, {
    method: 'POST',
    body: JSON.stringify({
      season,
      teamExternalId,
      seasonId,
    }),
  })
}

export async function getStandings(seasonId, competitionCode) {
  return apiFetch(`/api/football-data/competitions/${encodeURIComponent(competitionCode)}/standings?seasonId=${encodeURIComponent(seasonId)}`)
}
