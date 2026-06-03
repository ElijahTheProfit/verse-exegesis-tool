import { Router } from 'express';
import { isAllowedModel, resolveModel } from '../lib/models.ts';
import { chatJson, ApiKeyMissingError } from '../lib/openai.ts';
import { SEARCH_SYSTEM_PROMPT, SEARCH_SCHEMA, type SearchResponse } from '../lib/prompts.ts';

// POST /api/search  { query, model? }  → AI call #1 (semantic scripture search)
export const searchRouter = Router();

searchRouter.post('/search', async (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (!query) {
    res.status(400).json({ error: 'A search query is required.' });
    return;
  }
  if (query.length > 2000) {
    res.status(400).json({ error: 'Query is too long.' });
    return;
  }
  if (req.body?.model !== undefined && !isAllowedModel(req.body.model)) {
    res.status(400).json({ error: 'Unsupported model.' });
    return;
  }
  const model = resolveModel(req.body?.model, 'search');
  try {
    const data = await chatJson<SearchResponse>({
      model,
      system: SEARCH_SYSTEM_PROMPT,
      user: query,
      schemaName: 'scripture_results',
      schema: SEARCH_SCHEMA,
    });
    res.json({ ...data, model });
  } catch (err) {
    if (err instanceof ApiKeyMissingError) {
      res.status(503).json({ error: 'The server is not configured with an OpenAI API key yet.' });
      return;
    }
    console.error('[search] error:', err instanceof Error ? err.message : err);
    res.status(502).json({ error: 'Scripture search failed. Please try again.' });
  }
});
