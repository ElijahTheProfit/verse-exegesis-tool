import { Router } from 'express';
import { isAllowedModel, resolveModel } from '../lib/models.ts';
import { chatJson, ApiKeyMissingError } from '../lib/openai.ts';
import {
  ETYMOLOGY_SYSTEM_PROMPT,
  ETYMOLOGY_SCHEMA,
  type EtymologyResponse,
} from '../lib/prompts.ts';

// POST /api/etymology { word, model? } → English etymology + words sharing the same root.
export const etymologyRouter = Router();

etymologyRouter.post('/etymology', async (req, res) => {
  const word = typeof req.body?.word === 'string' ? req.body.word.trim() : '';
  if (!word || word.length > 80) {
    res.status(400).json({ error: 'A single English word is required.' });
    return;
  }
  if (req.body?.model !== undefined && !isAllowedModel(req.body.model)) {
    res.status(400).json({ error: 'Unsupported model.' });
    return;
  }
  const model = resolveModel(req.body?.model, 'etymology');

  try {
    const data = await chatJson<EtymologyResponse>({
      model,
      system: ETYMOLOGY_SYSTEM_PROMPT,
      user: word,
      schemaName: 'etymology',
      schema: ETYMOLOGY_SCHEMA,
    });
    res.json(data);
  } catch (err) {
    if (err instanceof ApiKeyMissingError) {
      res.status(503).json({ error: 'The server is not configured with an OpenAI API key yet.' });
      return;
    }
    console.error('[etymology] error:', err instanceof Error ? err.message : err);
    res.status(502).json({ error: 'Etymology lookup failed.' });
  }
});
