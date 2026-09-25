import { Router } from 'express'
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

export default router