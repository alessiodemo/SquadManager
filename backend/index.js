import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import seasonsRouter from './routes/seasons.js';
import playersRouter from './routes/players.js';
import matchesRouter from './routes/matches.js';
import transfersRouter from './routes/transfers.js';
import footballDataRouter from './routes/footballData.js';

dotenv.config()

const app = express();

app.use(cors());
app.use(express.json());

const PORT =  process.env.PORT || 3000

app.use('/api/seasons', seasonsRouter)
app.use('/api/players', playersRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/transfers', transfersRouter)
app.use('/api/football-data', footballDataRouter)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
