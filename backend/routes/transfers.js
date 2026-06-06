import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get("/", async(req, res) => {
    const { seasonId } = req.query
    let query = 
        `SELECT mt.*, p.name, p.surname, p.role
         FROM market_transfers mt LEFT JOIN players p ON p.id = mt.player_id
         ORDER BY mt.transfer_date DESC`
    
         const params = []
         if (seasonId) {
            query =  
            `SELECT mt.*, p.name, p.surname, p.role
            FROM market_transfers mt LEFT JOIN players p ON p.id = mt.player_id
            WHERE mt.season_id = $1
            ORDER BY mt.transfer_date DESC`
            params.push(seasonId)
         }
    const result = await pool.query(query, params)
    res.json(result.rows)
})

router.post("/", async(req, res) => {
    const { id, season_id, player_id, transfer_date, from_club, to_club, fee } = req.body
    const result = await pool.query(
        `INSERT INTO market_transfers (id, player_id, season_id, type, transfer_date, fee, club, notes)
        VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET player_id=$2, season_id=$3, type=$4, transfer_date=$5, fee=$6, club=$7, notes=$8
        RETURNING *`, [id || null, player_id, season_id, from_club ? 'out' : 'in', transfer_date, fee, from_club || to_club, null]
    )
    res.json(result.rows[0])
})

router.delete('/:id', async(req, res) => {
    await pool.query(
        `DELETE 
        FROM market_transfers
        WHERE id = $1`, [req.params.id])
    res.json({ success: true })
})

export default router
