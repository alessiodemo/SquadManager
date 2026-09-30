import { Router } from 'express';
import { pool } from '../db.js';

 const router = Router();

 router.get("/", async(req, res) => {
        const result = await pool.query('SELECT * FROM players ORDER BY surname')
        res.json(result.rows)
 })

 router.get("/squad", async(req, res) => {
       const { seasonId } = req.query
       if(!seasonId) {
              return res.status(400).json({error: 'seasonId is required'})
       }

       const result = await pool.query(
              `SELECT p.*,
                     COALESCE(
                     json_agg(json_build_object(
                            'appearances', ps.appearances,
                            'goals', ps.goals,
                            'assists', ps.assists,
                            'yellow_cards', ps.yellow_cards,
                            'red_cards', ps.red_cards
                     )) FILTER (WHERE ps.id IS NOT NULL),
                     '[]'::json
                     ) AS player_stats
              FROM season_players sp
              JOIN players p ON p.id = sp.player_id
              LEFT JOIN player_stats ps
              ON ps.player_id = p.id AND ps.season_id = sp.season_id
              WHERE sp.season_id = $1
              GROUP BY p.id
              ORDER BY p.surname`,
              [seasonId],
              )
       res.json(result.rows)
 })

 router.post("/", async(req, res) => {
       const { id, name, surname, role, nationality, birth_date,seasonId } = req.body

       if(!seasonId) {
              return res.status(400).json({ error: 'seasonId is required'})
       }

       let client
       try{

              client = await pool.connect()
              await client.query('BEGIN')

              const result = await client.query(
                     `INSERT INTO players (id, name, surname, role, nationality, birth_date)
                     VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6)
                     ON CONFLICT (id) DO UPDATE 
                     SET name=$2, surname=$3, role=$4, nationality=$5, birth_date=$6
                     RETURNING *`,
                     [id || null, name, surname, role, nationality, birth_date])

                     const player = result.rows[0]

              await client.query(
                     `INSERT INTO season_players (season_id, player_id)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                     [seasonId, player.id],
              )

              await client.query('COMMIT')
              res.json(player)
       } catch (error) {
              if (client) await client.query('ROLLBACK').catch(() => {})
              res.status(500).json({ error: error.message })
       } finally {
              client?.release()
       }
 })

 router.delete("/:id", async(req, res) => {
       const { id } = req.params

       try {
              await pool.query(
                     `DELETE FROM players
                      WHERE id = $1`,
                     [id],
              )
              res.json({ success: true })
       } catch (error) {
              res.status(500).json({ error: error.message })
       }
 })

 export default router