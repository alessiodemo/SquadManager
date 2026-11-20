import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../app.js';
import { pool } from '../db.js';
import { runMigrations } from '../migrate.js';

test.before(async () => {
    await runMigrations();
});

test.beforeEach(async () => {
    await pool.query(`
        TRUNCATE TABLE
            market_transfers,
            season_players,
            player_stats,
            matches,
            match_events,
            season_table,
            players,
            seasons
        CASCADE
    `);
});

test.after(async () => {
    await pool.query(`
        TRUNCATE TABLE
            market_transfers,
            season_players,
            player_stats,
            matches,
            match_events,
            season_table,
            players,
            seasons
        CASCADE
    `);
    await pool.end();
});

test('creates a transfer', async () => {
    const season = await pool.query(
        `INSERT INTO seasons (name, start_year)
         VALUES ('Test Season', 2026)
         RETURNING id`,
    );

    const seasonId = season.rows[0].id;

    const response = await request(app)
        .post('/api/transfers')
        .send({
            season_id: seasonId,
            type: 'in',
            transfer_date: '2026-11-20',
            fee: '1200000',
            club: 'Test FC',
            new_player_name: 'Mario',
            new_player_surname: 'Rossi',
            new_player_role: 'CEN',
        })
        .expect(200);

    assert.equal(response.body.club, 'Test FC');
    assert.equal(Number(response.body.fee), 1200000);

    const saved = await pool.query(
        'SELECT * FROM market_transfers WHERE id = $1',
        [response.body.id],
    );

    assert.equal(saved.rowCount, 1);
});