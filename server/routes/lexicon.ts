import { Router } from 'express';
import { getLexEntry } from '../lib/dataStore.ts';

// GET /api/lexicon/:strongs  (e.g. /api/lexicon/G2316)
// Deterministic — no AI. Returns the Strong's dictionary entry.
export const lexiconRouter = Router();

lexiconRouter.get('/lexicon/:strongs', (req, res) => {
  const entry = getLexEntry(req.params.strongs);
  if (!entry) {
    res.status(404).json({ error: 'No lexicon entry for that Strong’s id.' });
    return;
  }
  res.json(entry);
});
