import { Router } from 'express';
import { pool } from '../db.js';
import { getTeam, normalizeSquadPlayer } from '../services/footballData.js';
import {
    indexTransfer,
    indexTransfers,
    removeTransferFromKnowledge,
    reportKnowledgeSyncFailure,
} from '../services/knowledgeIndexer.js';

const router = Router();

router.post('/import', async (req, res) => {
    const { seasonId, season, teamId } = req.body;

    if (!seasonId || !Number.isInteger(Number(season)) || !/^\d+$/.test(String(teamId))) {
        return res.status(400).json({ error: 'A valid seasonId, season, and teamId are required' });
    }

    try {
        const [currentTeam, previousTeam] = await Promise.all([
            getTeam(teamId, Number(season)),
            getTeam(teamId, Number(season) - 1),
        ]);
        const currentPlayers = currentTeam.squad?.map(normalizeSquadPlayer).filter(Boolean) ?? [];
        const previousPlayers = previousTeam.squad?.map(normalizeSquadPlayer).filter(Boolean) ?? [];
        const previousIds = new Set(previousPlayers.map((player) => player.football_data_id));
        const currentIds = new Set(currentPlayers.map((player) => player.football_data_id));
        const arrivals = currentPlayers.filter((player) => !previousIds.has(player.football_data_id));
        const departures = previousPlayers.filter((player) => !currentIds.has(player.football_data_id));

        let client;
        let committed = false;
        try {
            client = await pool.connect();
            await client.query('BEGIN');

            for (const [type, players] of [['in', arrivals], ['out', departures]]) {
                for (const player of players) {
                    const playerResult = await client.query(
                        `INSERT INTO players
                          (football_data_id, name, surname, role, nationality, birth_date)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (football_data_id) DO UPDATE SET
                           name = EXCLUDED.name,
                           surname = EXCLUDED.surname,
                           role = EXCLUDED.role,
                           nationality = EXCLUDED.nationality,
                           birth_date = EXCLUDED.birth_date
                         RETURNING id`,
                        [
                            player.football_data_id,
                            player.name,
                            player.surname,
                            player.role,
                            player.nationality,
                            player.birth_date,
                        ],
                    );
                    const sourceKey = `football-data:${teamId}:${season}:${type}:${player.football_data_id}`;
                    await client.query(
                        `INSERT INTO market_transfers
                          (player_id, season_id, type, transfer_date, club, notes, source, source_key)
                         VALUES ($1, $2, $3, $4, $5, $6, 'football-data.org', $7)
                         ON CONFLICT (season_id, source_key) DO UPDATE SET
                           player_id = EXCLUDED.player_id,
                           club = EXCLUDED.club,
                           notes = EXCLUDED.notes`,
                        [
                            playerResult.rows[0].id,
                            seasonId,
                            type,
                            `${Number(season)}-07-01`,
                            type === 'in' ? previousTeam.name ?? null : currentTeam.name ?? null,
                            'Derived by comparing football-data.org squads; fee unavailable.',
                            sourceKey,
                        ],
                    );
                }
            }

            await client.query('COMMIT');
            committed = true;
            return res.json({
                imported: arrivals.length + departures.length,
                arrivals: arrivals.length,
                departures: departures.length,
                season: Number(season),
            });
        } finally {
            if (client && !committed) await client.query('ROLLBACK').catch(() => {});
            client?.release();
        }
    } catch (error) {
        return res.status(502).json({ error: error.message });
    }
});

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

router.post('/reindex', async (req, res) => {
    try {
        const result = await indexTransfers(req.body?.seasonId);
        res.json(result);
    } catch (error) {
        reportKnowledgeSyncFailure('reindex-transfers', error);
        res.status(502).json({ error: error.message });
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
        indexTransfer(transferId).catch((error) => reportKnowledgeSyncFailure('index-transfer', error))
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
        removeTransferFromKnowledge(req.params.id)
            .catch((error) => reportKnowledgeSyncFailure('delete-transfer', error));
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transfer:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
