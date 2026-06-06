import { Router } from 'express';
import { pool } from '../db.js';

 const router = Router();

 router.get("/", async(req, res) => {
        const result = await pool.query('SELECT * FROM players ORDER BY surname')
        res.json(result.rows)
 })

 router.get("/squad", async(req, res) => {
       const { seasonId } = req.query
       const result = await pool.query(
              `SELECT p.*,
               FROM players p LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = $1
               ORDER BY p.surname`, [seasonId])
       res.json(result.rows)
 })

 router.post("/", async(req, res) => {
       const { id, name, surname, role, nationality, birth_date } = req.body
       const result = await pool.query(
              `INSERT INTO players (id, name, surname, role, nationality, birth_date)
              VALUES (COALESCE($1, gen_random_uui()), $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name=$2, surname=$3, role=$4, nationality=$5, birth_date=$6
              RETURNING *`, [id || null, name, surname, role, nationality, birth_date])
       res.json(result.rows[0])
 })

 router.delete("/:id", async(req, res) => {
       const { id } = req.params.params.id
       const result = await pool.query(`
              DELETE *
              FROM players
              WHERE id = $1`, [id])
       res.json({success: true})
 })

 export default router