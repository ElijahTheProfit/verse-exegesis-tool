import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { interlinearRouter } from './routes/interlinear.ts';
import { lexiconRouter } from './routes/lexicon.ts';
import { searchRouter } from './routes/search.ts';
import { alignRouter } from './routes/align.ts';
import { etymologyRouter } from './routes/etymology.ts';
import { getManifest, dataAvailable } from './lib/dataStore.ts';
import { rateLimit } from './lib/ratelimit.ts';

// Load .env for local development. In production, real env vars are injected and
// there is no .env file, so this is a harmless no-op.
const loadEnvFile = (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile;
try {
  loadEnvFile?.('.env');
} catch {
  /* .env is optional */
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

// Serve the built SPA when it exists (production single-service). In local dev the
// client is served by Vite on :5173, so dist/client may be absent — that's fine.
const clientDir = path.join(ROOT, 'dist', 'client');
const hasClient = fs.existsSync(path.join(clientDir, 'index.html'));

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, client: hasClient, data: dataAvailable() });
});

app.get('/api/manifest', (_req, res) => {
  const manifest = getManifest();
  if (!manifest) {
    res.status(404).json({ error: 'Data manifest not found. Run `npm run build:data`.' });
    return;
  }
  res.json(manifest);
});

// Deterministic lexical routes (no AI).
app.use('/api', interlinearRouter);
app.use('/api', lexiconRouter);

// AI proxy routes (rate-limited; the OpenAI key stays server-side).
const aiLimiter = rateLimit({ windowMs: 60_000, max: 40 });
app.use('/api', aiLimiter);
app.use('/api', searchRouter);
app.use('/api', alignRouter);
app.use('/api', etymologyRouter);

if (hasClient) {
  app.use(express.static(clientDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] listening on :${PORT} — client ${hasClient ? 'served' : 'not bundled (dev)'}`);
});
