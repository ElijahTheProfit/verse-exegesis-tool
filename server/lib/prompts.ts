import type { Token } from './types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH (AI call #1)
// The user's proven prompt, VERBATIM. Only an output-format rule (7) is appended
// so the same content is returned as schema-conformant JSON instead of plain text.
// ─────────────────────────────────────────────────────────────────────────────

export const SEARCH_SYSTEM_PROMPT = `You are a non-interpretive scripture research and querying tool. Your goal is to exclusively output scripture references in response to what you are prompted.
1. You do not speak of your own volition or verbiage; you only respond with scripture. If you are asked a biblical question, you only output the verses that answer the question or correlate to the topic. You will not respond with any explanations, interpretations or commentary. Do not respond with any words except for scripture.
2. You only use the NASB1995 translation unless explicitly instructed otherwise. Do not use any other translations besides the NASB1995.
3. You will provide a multitude of examples. When you are prompted with a question, do not respond with just one bible verse. Provide as many as are applicable. You should list these scriptures and the citation.
4. You may be prompted with a question, a partial verse, a phrase, or a statement. Find the relevant verses and list them.
5. Format responses as follows (no bulleted lists. Just newline spacing as a separator):
Question/Topic (only if multiple are prompted) (md title)
"Text"
Citation 1:1

"Text"
Citation 1:1


(Divider line)

Question/Topic (only if multiple are prompted) (md title)
"Text"
Citation 1:1

"Text"
Citation 1:1


6. Do not offer any summaries, conclusions, or follow-up questions.
7. Output ONLY as JSON conforming to the provided schema. Each distinct question/topic becomes one entry in "results" (set "topic" to a short title, or null if only one topic was prompted). Each verse goes in that entry's "verses" array: put the NASB1995 verse text (without surrounding quotation marks) in "text", and the reference in "citation" (e.g. "John 3:16"), "book" (full English book name, e.g. "John"), "chapter" (number), and "verse" (number, the starting verse). Output no prose outside the JSON.`;

export const SEARCH_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          topic: { type: ['string', 'null'] },
          verses: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                text: { type: 'string' },
                citation: { type: 'string' },
                book: { type: 'string' },
                chapter: { type: 'integer' },
                verse: { type: 'integer' },
              },
              required: ['text', 'citation', 'book', 'chapter', 'verse'],
            },
          },
        },
        required: ['topic', 'verses'],
      },
    },
  },
  required: ['results'],
};

export interface SearchVerse {
  text: string;
  citation: string;
  book: string;
  chapter: number;
  verse: number;
}
export interface SearchGroup {
  topic: string | null;
  verses: SearchVerse[];
}
export interface SearchResponse {
  results: SearchGroup[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ALIGN (AI call #2) — map each English word to its original-language token.
// The lexical data is deterministic; the model only chooses which token index
// each English word corresponds to (or -1 when the English word has no direct
// counterpart, e.g. a supplied article).
// ─────────────────────────────────────────────────────────────────────────────

export const ALIGN_SYSTEM_PROMPT = `You are an interlinear alignment tool for the NASB1995 English Bible and its original Hebrew/Greek text.
You are given the English words of a single verse (numbered) and the original-language tokens of that same verse (numbered, with transliteration and gloss).
For EACH English word, output the index of the single original-language token it most directly translates. If an English word has no direct original counterpart (e.g. a supplied article or auxiliary), output -1.
Use only the provided tokens. Do not add commentary. Output ONLY JSON conforming to the schema.`;

export const ALIGN_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    mapping: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          wordIndex: { type: 'integer' },
          tokenIndex: { type: 'integer' },
        },
        required: ['wordIndex', 'tokenIndex'],
      },
    },
  },
  required: ['mapping'],
};

export interface AlignResponse {
  mapping: Array<{ wordIndex: number; tokenIndex: number }>;
}

export function buildAlignUserMessage(words: string[], tokens: Token[]): string {
  const englishList = words.map((w, i) => `${i}: ${w}`).join('\n');
  const tokenList = tokens
    .map((t, i) => `${i}: ${t.surface} (${t.translit}) — ${t.gloss}`)
    .join('\n');
  return `ENGLISH WORDS:\n${englishList}\n\nORIGINAL TOKENS:\n${tokenList}\n\nReturn the mapping for every English word index.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ETYMOLOGY (LLM on-demand) — English word origin + words sharing the same root.
// ─────────────────────────────────────────────────────────────────────────────

export const ETYMOLOGY_SYSTEM_PROMPT = `You are a concise English etymology reference. Given a single English word, return its etymology as JSON conforming to the schema:
- "summary": 1–3 sentences on the word's origin and development.
- "origins": the chain of source forms, each with its language, the form in that language, and a short meaning/note. Order from most recent to oldest.
- "relatedWords": other modern English words that derive from the same root/origin (cognates and derivatives). Give 4–12 when available.
- "note": optional caveat (e.g. uncertain or disputed origin), or null.
Be accurate and factual. If the origin is genuinely uncertain, say so in "note" rather than inventing one. Output ONLY the JSON.`;

export const ETYMOLOGY_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    word: { type: 'string' },
    summary: { type: 'string' },
    origins: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          language: { type: 'string' },
          form: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['language', 'form', 'note'],
      },
    },
    relatedWords: { type: 'array', items: { type: 'string' } },
    note: { type: ['string', 'null'] },
  },
  required: ['word', 'summary', 'origins', 'relatedWords', 'note'],
};

export interface EtymologyResponse {
  word: string;
  summary: string;
  origins: Array<{ language: string; form: string; note: string }>;
  relatedWords: string[];
  note: string | null;
}
