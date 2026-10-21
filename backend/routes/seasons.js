import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get("/", async(req, res) => {
    const result = await pool.query(`
        SELECT DISTINCT ON (start_year) *
        FROM seasons
        ORDER BY start_year DESC, is_current DESC, created_at DESC NULLS LAST
    `)
    res.json(result.rows)
})

router.post("/context", async(req, res) => {
    const { competitionCode, startYear, teamExternalId, teamName } = req.body
    const normalizedCompetitionCode = typeof competitionCode === 'string'
        ? competitionCode.trim()
        : ''
    const normalizedTeamName = typeof teamName === 'string'
        ? teamName.trim()
        : ''

    if (
        !normalizedCompetitionCode
        || !Number.isInteger(startYear)
        || startYear < 1800
        || startYear > 9999
        || !Number.isSafeInteger(teamExternalId)
        || teamExternalId <= 0
        || !normalizedTeamName
    ) {
        return res.status(400).json({
            error: 'competitionCode, a valid startYear, teamExternalId, and teamName are required',
        })
    }

    try {
        const result = await pool.query(
            `INSERT INTO seasons
                (name, start_year, is_current, competition_code, team_external_id, team_name)
             VALUES ($1, $2, false, $3, $4, $5)
             ON CONFLICT (competition_code, start_year, team_external_id)
             DO UPDATE SET
                name = EXCLUDED.name,
                team_name = EXCLUDED.team_name
             RETURNING *`,
            [
                `${startYear}/${startYear + 1}`,
                startYear,
                normalizedCompetitionCode,
                teamExternalId,
                normalizedTeamName,
            ],
        )

        return res.json(result.rows[0])
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

router.get("/current", async(req, res) => {
    const result = await pool.query(
        `SELECT *
        FROM seasons 
        ORDER BY is_current DESC, start_year DESC, created_at DESC NULLS LAST
        LIMIT 1
        `
    )
    res.json(result.rows[0])
})

router.post("/", async(req, res) => {
    const { id, name, start_year, is_current } = req.body
    const normalizedName = Number.isInteger(start_year)
        ? `${start_year}/${start_year + 1}`
        : name
    const result = await pool.query(
        `INSERT INTO seasons (id, name, start_year, is_current)
        VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET name=$2, start_year=$3, is_current=$4
        RETURNING *`, [id || null, normalizedName, start_year, is_current ?? false]
    )
    res.json(result.rows[0])
})

export default router