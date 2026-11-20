import dotenv from 'dotenv';
import { runMigrations } from './migrate.js';
import { pool } from './db.js';
import app from './app.js';

dotenv.config()

const PORT = process.env.PORT || 3000

try {
    await runMigrations()
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
} catch (error) {
    console.error(`[migrations] Startup failed: ${error.message}`)
    await pool.end()
    process.exitCode = 1
}