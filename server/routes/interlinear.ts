import { Router } from 'express';
import { getVerse } from '../lib/dataStore.ts';

// GET /api/interlinear?book=John&chapter=3&verse=16
// Deterministic — no AI. Returns the verse's original-language tokens.
export const interlinearRouter = Router();

interlinearRouter.get('/interlinear', (req, res) => {
  const book = String(req.query.book ?? '').trim();
  const chapter = Number(req.query.chapter);
  const verse = Number(req.query.verse);
  if (!book || !Number.isInteger(chapter) || !Number.isInteger(verse)) {
    res.status(400).json({ error: 'Query params book, chapter, verse are required.' });
    return;
  }
  const result = getVerse(book, chapter, verse);
  if (!result) {
    res.status(404).json({ error: 'Interlinear unavailable for this reference.' });
    return;
  }
  res.json(result);
});
