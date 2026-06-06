import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get("/", async(req, res) => {
    const result = await pool.query('SELECT * FROM seasons ORDER BY start_year DESC')
    res.json(result.rows)
})

router.get("/current", async(req, res) => {
    const result = await pool.query('SELECT * FROM season WHERE is_current = true LIMIT 1')
    res.json(result.rows[0])
})

export default router