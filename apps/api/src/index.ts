import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { matchesRouter } from './routes/matches';
import { oddsRouter } from './routes/odds';
import { bookmakerRouter } from './routes/bookmakers';
import { leaguesRouter } from './routes/leagues';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/matches', matchesRouter);
app.use('/api/odds', oddsRouter);
app.use('/api/bookmakers', bookmakerRouter);
app.use('/api/leagues', leaguesRouter);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Sportwetten Quoten API running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  process.exit(0);
});

export { app };
