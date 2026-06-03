import type {
  AlignResponse,
  EtymologyResponse,
  InterlinearResponse,
  LexEntry,
  Manifest,
  ModelId,
  SearchResponse,
  VerseRef,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError('Network error — check your connection.', 0);
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    if (data && typeof data === 'object' && 'error' in data) {
      const e = (data as Record<string, unknown>).error;
      if (typeof e === 'string' && e) message = e;
    }
    throw new ApiError(message, res.status);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function postJson<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const api = {
  search: (query: string, model: ModelId) =>
    postJson<SearchResponse>('/api/search', { query, model }),

  interlinear: ({ book, chapter, verse }: VerseRef) =>
    request<InterlinearResponse>(
      `/api/interlinear?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`,
    ),

  align: (ref: VerseRef, words: string[], model: ModelId) =>
    postJson<AlignResponse>('/api/align', { ...ref, words, model }),

  lexicon: (strongs: string) => request<LexEntry>(`/api/lexicon/${encodeURIComponent(strongs)}`),

  etymology: (word: string, model: ModelId) =>
    postJson<EtymologyResponse>('/api/etymology', { word, model }),

  manifest: () => request<Manifest>('/api/manifest'),
};
