import './loadEnv';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { matchRouter } from './routes/matches';
import { predictionRouter } from './routes/predictions';
import { poolRouter } from './routes/pools';
import { adminRouter } from './routes/admin';
import { bonusRouter } from './routes/bonus';
import { syncResults } from './services/resultsSync';

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Toegestane origins komma-gescheiden via CORS_ORIGIN (bijv. https://wk-poule.netlify.app).
// Lokaal valt het terug op de Vite-dev-server. Slashes op het eind worden genegeerd.
const stripSlash = (s: string) => s.trim().replace(/\/+$/, '');
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(stripSlash)
  .filter(Boolean);

console.log('Toegestane CORS-origins:', allowedOrigins.join(', '));

app.use(cors({
  origin: (origin, callback) => {
    // Sta verzoeken zonder origin toe (bijv. curl, health checks).
    if (!origin || allowedOrigins.includes(stripSlash(origin))) {
      callback(null, true);
    } else {
      // Niet toegestaan: weiger netjes zonder 500-fout te veroorzaken.
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/matches', matchRouter);
app.use('/api/predictions', predictionRouter);
app.use('/api/pools', poolRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bonus', bonusRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`WK Poule 2026 API running on http://localhost:${PORT}`);

  // Automatische uitslagen-sync elke 5 minuten zodra een API-key is ingesteld.
  if (process.env.FOOTBALL_DATA_API_KEY) {
    const INTERVAL_MS = 5 * 60 * 1000;
    console.log('Auto-sync ingeschakeld: uitslagen worden elke 5 minuten opgehaald.');
    const runSync = async () => {
      try {
        const result = await syncResults(prisma);
        if (result.updated > 0) {
          console.log(`[auto-sync] ${result.message}`);
        }
      } catch (err) {
        console.error('[auto-sync] fout:', err);
      }
    };
    runSync(); // direct bij opstarten
    setInterval(runSync, INTERVAL_MS);
  } else {
    console.log('Auto-sync uit: stel FOOTBALL_DATA_API_KEY in een .env-bestand in om automatisch uitslagen op te halen.');
  }
});
