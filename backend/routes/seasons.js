import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get("/", async(req, res) => {
    const result = await pool.query('SELECT * FROM seasons ORDER BY start_year DESC')
    res.json(result.rows)
})

router.get("/current", async(req, res) => {
    const result = await pool.query('SELECT * FROM seasons WHERE is_current = true LIMIT 1')
    res.json(result.rows[0])
})

router.post("/", async(req, res) => {
    const { id, name, start_year, end_year, is_current } = req.body
    const result = await pool.query(
        `INSERT INTO seasons (id, name, start_year, end_year, is_current)
        VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET name=$2, start_year=$3, end_year=$4, is_current=$5
        RETURNING *`, [id || null, name, start_year, end_year, is_current]
    )
    res.json(result.rows[0])
})

export default router