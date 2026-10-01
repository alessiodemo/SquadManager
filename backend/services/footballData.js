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

export async function getTable(code, season) {
  const token = process.env.FOOTBALL_DATA_TOKEN

  if (!token) {
    throw new Error('FOOTBALL_DATA_TOKEN is not configured')
  }

  const params = new URLSearchParams()
  if (season) params.set('season', season)

  const query = params.toString()
  const url = `${BASE_URL}/competitions/${code}/standings${query ? `?${query}` : ''}`
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': token },
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`football-data.org returned ${response.status}: ${details}`)
  }

  return response.json()
}

export async function getTeam(teamId, season) {
  const token = process.env.FOOTBALL_DATA_TOKEN

  if (!token) {
    throw new Error('FOOTBALL_DATA_TOKEN is not configured')
  }

  const params = new URLSearchParams({ season: String(season) })
  const response = await fetch(`${BASE_URL}/teams/${encodeURIComponent(teamId)}?${params}`, {
    headers: { 'X-Auth-Token': token },
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`football-data.org returned ${response.status}: ${details}`)
  }

  return response.json()
}

export function normalizeSquadPlayer(player) {
  const fullName = player.name?.trim()
  const nameParts = fullName?.split(/\s+/) ?? []
  const roleByPosition = {
    Goalkeeper: 'POR',
    Defender: 'DIF',
    Defence: 'DIF',
    'Centre-Back': 'DIF',
    'Right-Back': 'DIF',
    'Left-Back': 'DIF',
    'Wing-Back': 'DIF',
    Midfielder: 'CEN',
    Midfield: 'CEN',
    'Defensive Midfield': 'CEN',
    'Attacking Midfield': 'CEN',
    Attacker: 'ATT',
    Offence: 'ATT',
    'Left Winger': 'ATT',
    'Right Winger': 'ATT',
    'Centre-Forward': 'ATT',
    'Second Striker': 'ATT',
  }

  if (!player.id || !fullName || !roleByPosition[player.position]) {
    return null
  }

  return {
    football_data_id: player.id,
    name: nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullName,
    surname: nameParts.length > 1 ? nameParts.at(-1) : '',
    role: roleByPosition[player.position],
    nationality: player.nationality ?? null,
    birth_date: player.dateOfBirth ?? null,
  }
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