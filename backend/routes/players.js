import { Router } from 'express';
import { pool } from '../db.js';

 const router = Router();

 router.get("/", async(req, res) => {
        const result = await pool.query('SELECT * FROM players ORDER BY surname')
        res.json(result.rows)
 })

 router.get