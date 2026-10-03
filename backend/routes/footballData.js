import { Router } from 'express'
import { pool } from '../db.js'
import {
  getCompetitionMatches,
  getTable,
  getTeam,
  normalizeMatch,
  normalizeSquadPlayer,
  getCompetitions,
  getTeamsForCompetition,
} from '../services/footballData.js'

const router = Router()

router.post('/teams/:teamId/squad/import', async (req, res) => {
  const { teamId } = req.params
  const { season, seasonId } = req.body

  if (!/^\d+$/.test(teamId) || !Number.isInteger(Number(season)) || !seasonId) {
    return res.status(400).json({ error: 'A valid teamId, season, and seasonId are required' })
  }

  let team
  try {
    team = await getTeam(teamId, season)
  } catch (error) {
    return res.status(502).json({ error: error.message })
  }

  if (!Array.isArray(team.squad)) {
    return res.status(502).json({ error: 'football-data.org did not return a team squad' })
  }

  const players = team.squad.map(normalizeSquadPlayer).filter(Boolean)
  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    await client.query(
      `DELETE FROM season_players sp
       USING players p
       WHERE sp.player_id = p.id
         AND sp.season_id = $1
         AND p.football_data_id IS NOT NULL
         AND NOT (p.football_data_id = ANY($2::bigint[]))`,
      [seasonId, players.map((player) => player.football_data_id)],
    )

    for (const player of players) {
      const result = await client.query(
        `INSERT INTO players
          (football_data_id, name, surname, role, nationality, birth_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (football_data_id) DO UPDATE SET
           name = EXCLUDED.name,
           surname = EXCLUDED.surname,
           role = EXCLUDED.role,
           nationality = EXCLUDED.nationality,
           birth_date = EXCLUDED.birth_date
         RETURNING id`,
        [
          player.football_data_id,
          player.name,
          player.surname,
          player.role,
          player.nationality,
          player.birth_date,
        ],
      )

      await client.query(
        `INSERT INTO season_players (season_id, player_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [seasonId, result.rows[0].id],
      )
    }

    await client.query('COMMIT')
    return res.json({
      imported: players.length,
      skipped: team.squad.length - players.length,
      team: team.name,
      season: Number(season),
    })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    return res.status(500).json({ error: error.message })
  } finally {
    client?.release()
  }
})

router.get('/competitions/:code/matches', async (req, res) => {
  const { code } = req.params
  const { season, team, seasonId } = req.query

  if (!team || !seasonId) {
    return res.status(400).json({
      error: 'team and seasonId query parameters are required',
    })
  }

  const data = await getCompetitionMatches(code, season)
  const matches = data.matches
    .map((match) => normalizeMatch(match, team, seasonId))
    .filter(Boolean)

  res.json({
    competition: data.competition,
    filters: data.filters,
    matches,
  })
})

router.post('/competitions/:code/import', async (req, res) => {
  const { code } = req.params
  const { season, team, seasonId } = req.body

  if (!team || !seasonId) {
    return res.status(400).json({
      error: 'team and seasonId body parameters are required',
    })
  }

  try {
    const data = await getCompetitionMatches(code, season)
    const matches = data.matches
      .map((match) => normalizeMatch(match, team, seasonId))
      .filter(Boolean)

    for (const match of matches) {
      await pool.query(
        `INSERT INTO matches
          (external_id, season_id, date, opponent, is_home, venue, goals_for, goals_against)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (external_id) DO UPDATE SET
           season_id = EXCLUDED.season_id,
           date = EXCLUDED.date,
           opponent = EXCLUDED.opponent,
           is_home = EXCLUDED.is_home,
           venue = EXCLUDED.venue,
           goals_for = EXCLUDED.goals_for,
           goals_against = EXCLUDED.goals_against`,
        [
          match.external_id,
          match.season_id,
          match.date,
          match.opponent,
          match.is_home,
          null,
          match.goals_for,
          match.goals_against,
        ],
      )
    }

    res.json({ imported: matches.length, season, competition: data.competition })
  } catch (error) {
    res.status(502).json({ error: error.message })
  }
})

router.get('/competitions', async (req, res) => {
  let data 
  try {
    data = await getCompetitions()
    return res.json(data)
  } catch (error) {
    return res.status(502).json({ error: error.message })
  }
})

router.get('/competitions/:code/teams', async (req, res) => {
  const { code } = req.params
  const { season } = req.query

  if(!code || !season || (!/^\d{4}$/.test(String(season ?? '')))) {
    return res.status(400).json({ error: 'League code and  valid season year are required' })
  }
  try {
    const data = await getTeamsForCompetition(code, season)
    return res.json(data)
  } catch (error) {
    return res.status(502).json({ error: error.message })
  }
})

router.post('/competitions/:code/standings/import', async (req, res) => {
  const { code } = req.params
  const { season, seasonId } = req.body

  if (!season || !seasonId) {
    return res.status(400).json({
      error: 'season and seasonId body parameters are required',
    })
  }

  let data
  try {
    data = await getTable(code, season)
  } catch (error) {
    return res.status(502).json({ error: error.message })
  }

  if (!Array.isArray(data.standings)) {
    return res.status(502).json({ error: 'Unexpected standings response from football-data.org' })
  }

  const rows = data.standings.flatMap((standing) =>
    (standing.table ?? []).map((row) => ({
      type: standing.type,
      teamExternalId: row.team.id,
      teamName: row.team.name,
      position: row.position,
      matchPlayed: row.playedGames,
      win: row.won,
      draw: row.draw,
      lose: row.lost,
      goalScored: row.goalsFor,
      goalConceded: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
    })),
  )

  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    for (const row of rows) {
      await client.query(
        `INSERT INTO season_table
          (season_id, competition_code, type, team_external_id, team_name, position,
           match_played, win, draw, lose, goal_scored, goal_conceded, goal_difference, points)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (season_id, competition_code, type, team_external_id) DO UPDATE SET
           team_name = EXCLUDED.team_name,
           position = EXCLUDED.position,
           match_played = EXCLUDED.match_played,
           win = EXCLUDED.win,
           draw = EXCLUDED.draw,
           lose = EXCLUDED.lose,
           goal_scored = EXCLUDED.goal_scored,
           goal_conceded = EXCLUDED.goal_conceded,
           goal_difference = EXCLUDED.goal_difference,
           points = EXCLUDED.points`,
        [
          seasonId,
          code,
          row.type,
          row.teamExternalId,
          row.teamName,
          row.position,
          row.matchPlayed,
          row.win,
          row.draw,
          row.lose,
          row.goalScored,
          row.goalConceded,
          row.goalDifference,
          row.points,
        ],
      )
    }

    await client.query('COMMIT')
    return res.json({ imported: rows.length, season, competition: data.competition })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    return res.status(500).json({ error: error.message })
  } finally {
    client?.release()
  }
})

router.get('/competitions/:code/standings', async (req, res) => {
  const { code } = req.params
  const { seasonId } = req.query

  if (!seasonId) {
    return res.status(400).json({ error: 'seasonId required' })
  }

  const result = await pool.query(`
    SELECT *
    FROM season_table
    WHERE season_id = $1 AND competition_code = $2
    ORDER BY
      CASE type
        WHEN 'TOTAL' THEN 1
        WHEN 'HOME' THEN 2
        WHEN 'AWAY' THEN 3
      END,
      position  
      `, [seasonId, code])

      res.json(result.rows)
})

export default router