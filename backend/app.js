import express from 'express';
import cors from 'cors';
import seasonsRouter from './routes/seasons.js';
import playersRouter from './routes/players.js';
import matchesRouter from './routes/matches.js';
import transfersRouter from './routes/transfers.js';
import footballDataRouter from './routes/footballData.js';
import { pool } from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/seasons', seasonsRouter)
app.use('/api/players', playersRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/transfers', transfersRouter)
app.use('/api/football-data', footballDataRouter)
app.get('/health/live', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    })
})

app.get('/health/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        return res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(`[readiness] Database check failed: ${error.message}`);
        return res.status(503).json({
            status: 'degraded',
            database: 'unavailable',
            timestamp: new Date().toISOString(),
        });
    }
});

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        return res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(`[health] Database check failed: ${error.message}`);
        return res.status(503).json({
            status: 'degraded',
            database: 'unavailable',
            timestamp: new Date().toISOString(),
        });
    }
});

export default app;