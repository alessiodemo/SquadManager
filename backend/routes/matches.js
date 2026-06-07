import { Router } from 'express';
import { pool } from '../db.js';

const router =  Router();

router.get("/", async(req, res) => {
    const { seasonId } = req.query
    const result = await pool.query(
        `SELECT m.*, COUNT(me.id) as events_count
         FROM matches m LEFT JOIN match_events me ON me.match_id = m.id
         WHERE m.season_id = $1
         GROUP BY m.id
         ORDER BY m.date
        `, [seasonId])
    res.json(result.rows)
})

router.get('/:id', async(req, res ) => {
    const match = await pool.query('SELECT * FROM matches WHERE id = $1', [req.params.id])
    const events = await pool.query(
        `SELECT me.*, p.name, p.surname
         FROM match_events me LEFT JOIN players p ON p.id = me.player_id
         WHERE me.match_id = $1
         ORDER BY me.minute`,
        [req.params.id]
    )
    res.json({ match: match.rows[0], events: events.rows })
})

router.post('/', async(req, res) => {
    const { id, season_id, date, opponent, is_home, venue, goals_for, goals_against } = req.body
    const result = await pool.query(
        `INSERT INTO matches (id, season_id, date, opponent, is_home, venue, goals_for, goals_against)
        VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET date=$3, opponent=$4, is_home=$5, venue=$6, goals_for=$7, goals_against=$8
        RETURNING *`, [id || null, season_id, date, opponent, is_home, venue, goals_for, goals_against]
    )
    res.json(result.rows[0])
})

router.patch('/:id', async(req, res) => {
    const { goals_for, goals_against } = req.body
    const result = await pool.query(
        `UPDATE matches 
        SET goals_for = $1, goals_against = $2
        WHERE id = $3 RETURNING *`, [goals_for, goals_against, req.params.id])
    res.json(result.rows[0])
})

router.delete('/:id', async(req, res) => {
    await pool.query(
        `DELETE 
        FROM matches
        WHERE id = $1`, [req.params.id])
    res.json({ success: true })
})

router.post('/:id/events', async(req, res) => {
    const { player_id, minute, type } = req.body
    const result = await pool.query(
        `INSERT INTO match_events (match_id, player_id, minute, type)
        VALUES ($1, $2, $3, $4) RETURNING *`, [req.params.id, player_id, minute, type])
    res.json(result.rows[0])
})

router.delete('/:id/events/:eventId', async(req, res) => {
    await pool.query(
        `DELETE 
        FROM match_events
        WHERE id = $1`, [req.params.eventId])
    res.json({ success: true })
})

export default router