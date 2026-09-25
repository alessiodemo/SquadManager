const BASE_URL = 'https://api.football-data.org/v4'

export async function getCompetitionMatches(competitionCode, season) {
  const token = process.env.FOOTBALL_DATA_TOKEN

  if (!token) {
    throw new Error('FOOTBALL_DATA_TOKEN is not configured')
  }

  const params = new URLSearchParams()
  if (season) params.set('season', season)

  const query = params.toString()
  const url = `${BASE_URL}/competitions/${encodeURIComponent(competitionCode)}/matches${query ? `?${query}` : ''}`
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': token },
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`football-data.org returned ${response.status}: ${details}`)
  }

  return response.json()
}

export function normalizeMatch(match, teamName, seasonId) {
  const isHome = match.homeTeam.name === teamName
  const isAway = match.awayTeam.name === teamName

  if (!isHome && !isAway) {
    return null
  }

  const homeGoals = match.score.fullTime.home
  const awayGoals = match.score.fullTime.away

  return {
    external_id: match.id,
    season_id: seasonId,
    date: match.utcDate,
    opponent: isHome ? match.awayTeam.name : match.homeTeam.name,
    is_home: isHome,
    goals_for: isHome ? homeGoals : awayGoals,
    goals_against: isHome ? awayGoals : homeGoals,
    status: match.status,
  }
}