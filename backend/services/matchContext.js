import { pool } from '../db.js'

export async function getMatchContext(matchId) {
  const [matchResult, eventsResult] = await Promise.all([
    pool.query('SELECT * FROM matches WHERE id = $1', [matchId]),
    pool.query(
      `SELECT me.*, p.name, p.surname
       FROM match_events me
       LEFT JOIN players p ON p.id = me.player_id
       WHERE me.match_id = $1
       ORDER BY me.minute`,
      [matchId],
    ),
  ])

  const match = matchResult.rows[0]
  if (!match) {
    const error = new Error('Match not found')
    error.statusCode = 404
    throw error
  }

  const result = match.goals_for > match.goals_against
    ? 'win'
    : match.goals_for === match.goals_against
      ? 'draw'
      : 'loss'

  return {
    match,
    events: eventsResult.rows,
    result,
  }
}
