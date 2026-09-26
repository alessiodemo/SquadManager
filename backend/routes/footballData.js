import { Router } from 'express'
import { pool } from '../db.js'
import { getCompetitionMatches, normalizeMatch } from '../services/footballData.js'

const router = Router()

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

export default router