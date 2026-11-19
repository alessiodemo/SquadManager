import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT || 5432),
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
    }

export const pool = new pg.Pool(poolConfig)