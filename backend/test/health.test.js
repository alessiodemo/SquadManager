import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../app.js';

test('GET /health/live returns a healthy response', async () => {
    const response = await request(app)
        .get('/health/live')
        .expect(200);

    assert.equal(response.body.status, 'ok');
    assert.ok(response.body.timestamp);
});

test('POST /api/transfers requires season_id', async () => {
    const response = await request(app)
        .post('/api/transfers')
        .send({
            transfer_date: '2026-11-20',
        })
        .expect(400);

    assert.equal(
        response.body.error,
        'season_id is required',
    );
});

test('POST /api/transfers requires transfer_date', async () => {
    const response = await request(app)
        .post('/api/transfers')
        .send({
            season_id: 'season-1',
        })
        .expect(400);

    assert.equal(
        response.body.error,
        'transfer_date is required',
    );
});