import { Router } from 'express';
import { isAllowedModel, resolveModel } from '../lib/models.ts';
import { chatJson, ApiKeyMissingError } from '../lib/openai.ts';
import {
  ALIGN_SYSTEM_PROMPT,
  ALIGN_SCHEMA,
  buildAlignUserMessage,
  type AlignResponse,
} from '../lib/prompts.ts';
import { getVerse } from '../lib/dataStore.ts';

// POST /api/align { book, chapter, verse, words[], model? } → AI call #2 (alignment only).
// tokens come from the deterministic interlinear; the model only maps word→token index.
export const alignRouter = Router();

alignRouter.post('/align', async (req, res) => {
  const { book, chapter, verse, words } = req.body ?? {};
  const valid =
    typeof book === 'string' &&
    Number.isInteger(chapter) &&
    Number.isInteger(verse) &&
    Array.isArray(words) &&
    words.every((w) => typeof w === 'string');
  if (!valid) {
    res.status(400).json({ error: 'book, chapter, verse and words[] are required.' });
    return;
  }
  if (req.body?.model !== undefined && !isAllowedModel(req.body.model)) {
    res.status(400).json({ error: 'Unsupported model.' });
    return;
  }
  const model = resolveModel(req.body?.model, 'align');

  const v = getVerse(book, chapter, verse);
  if (!v) {
    res.status(404).json({ error: 'Interlinear unavailable for this reference.' });
    return;
  }

  try {
    const data = await chatJson<AlignResponse>({
      model,
      system: ALIGN_SYSTEM_PROMPT,
      user: buildAlignUserMessage(words as string[], v.tokens),
      schemaName: 'alignment',
      schema: ALIGN_SCHEMA,
    });
    res.json({ mapping: data.mapping });
  } catch (err) {
    if (err instanceof ApiKeyMissingError) {
      res.status(503).json({ error: 'The server is not configured with an OpenAI API key yet.' });
      return;
    }
    console.error('[align] error:', err instanceof Error ? err.message : err);
    res.status(502).json({ error: 'Word alignment failed.' });
  }
});
