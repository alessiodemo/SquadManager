import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get("/", async (req, res) => {
    const { seasonId } = req.query;
    
    let query = `
        SELECT 
            mt.*, 
            p.name, 
            p.surname, 
            p.role,
            CASE 
                WHEN p.id IS NOT NULL THEN json_build_object('id', p.id, 'name', p.name, 'surname', p.surname, 'role', p.role)
                ELSE NULL 
            END AS players
        FROM market_transfers mt 
        LEFT JOIN players p ON p.id = mt.player_id
        ORDER BY mt.transfer_date DESC, mt.created_at DESC
    `;
    
    const params = [];
    if (seasonId) {
        query = `
            SELECT 
                mt.*, 
                p.name, 
                p.surname, 
                p.role,
                CASE 
                    WHEN p.id IS NOT NULL THEN json_build_object('id', p.id, 'name', p.name, 'surname', p.surname, 'role', p.role)
                    ELSE NULL 
                END AS players
            FROM market_transfers mt 
            LEFT JOIN players p ON p.id = mt.player_id
            WHERE mt.season_id = $1
            ORDER BY mt.transfer_date DESC, mt.created_at DESC
        `;
        params.push(seasonId);
    }
    
    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/", async (req, res) => {
    const {
        id,
        season_id,
        player_id,
        type,
        transfer_date,
        fee,
        club,
        notes,
        from_club,
        to_club,
        new_player_name,
        new_player_surname,
        new_player_role,
        add_to_squad = true
    } = req.body;

    if (!season_id) {
        return res.status(400).json({ error: 'season_id is required' });
    }
    if (!transfer_date) {
        return res.status(400).json({ error: 'transfer_date is required' });
    }

    const resolvedType = type === 'out' || (!type && from_club) ? 'out' : 'in';
    const resolvedClub = club ?? (resolvedType === 'in' ? from_club : to_club) ?? null;
    const numericFee = fee !== '' && fee !== null && fee !== undefined && !isNaN(Number(fee)) 
        ? Number(fee) 
        : null;

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        let effectivePlayerId = player_id || null;

        // Se non è stato selezionato un giocatore esistente ma sono forniti nome e cognome
        if (!effectivePlayerId && new_player_surname?.trim()) {
            const role = ['POR', 'DIF', 'CEN', 'ATT'].includes(new_player_role) ? new_player_role : 'CEN';
            const playerRes = await client.query(
                `INSERT INTO players (name, surname, role)
                 VALUES ($1, $2, $3)
                 RETURNING id`,
                [new_player_name?.trim() || '', new_player_surname.trim(), role]
            );
            effectivePlayerId = playerRes.rows[0].id;
        }

        // Se è un acquisto ed è richiesto l'inserimento in rosa
        if (resolvedType === 'in' && effectivePlayerId && add_to_squad) {
            await client.query(
                `INSERT INTO season_players (season_id, player_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [season_id, effectivePlayerId]
            );
        }

        const result = await client.query(
            `INSERT INTO market_transfers (id, player_id, season_id, type, transfer_date, fee, club, notes)
             VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET 
                 player_id = EXCLUDED.player_id, 
                 season_id = EXCLUDED.season_id, 
                 type = EXCLUDED.type, 
                 transfer_date = EXCLUDED.transfer_date, 
                 fee = EXCLUDED.fee, 
                 club = EXCLUDED.club, 
                 notes = EXCLUDED.notes
             RETURNING *`,
            [
                id || null,
                effectivePlayerId,
                season_id,
                resolvedType,
                transfer_date,
                numericFee,
                resolvedClub?.trim() || null,
                notes?.trim() || null
            ]
        );

        // Recuperiamo i dati completi del trasferimento con il giocatore collegato
        const transferId = result.rows[0].id;
        const fullRecord = await client.query(
            `SELECT 
                mt.*, 
                p.name, 
                p.surname, 
                p.role,
                CASE 
                    WHEN p.id IS NOT NULL THEN json_build_object('id', p.id, 'name', p.name, 'surname', p.surname, 'role', p.role)
                    ELSE NULL 
                END AS players
             FROM market_transfers mt
             LEFT JOIN players p ON p.id = mt.player_id
             WHERE mt.id = $1`,
            [transferId]
        );

        await client.query('COMMIT');
        res.json(fullRecord.rows[0] || result.rows[0]);
    } catch (error) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        console.error('Error saving transfer:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (client) client.release();
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM market_transfers WHERE id = $1`,
            [req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transfer:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
