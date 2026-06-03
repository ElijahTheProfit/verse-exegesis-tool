// Client-side mirrors of the server's data shapes.

export type Lang = 'hebrew' | 'greek';

export interface Token {
  surface: string;
  translit: string;
  strongs: string | null;
  morph: string;
  morphCode: string;
  gloss: string;
  lang: Lang;
}

export interface LexEntry {
  strongs: string;
  lang: Lang;
  lemma: string;
  translit: string;
  pronunciation: string;
  definition: string;
  usage: string;
  derivation: string;
}

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
  model?: string;
}

export interface InterlinearResponse {
  reference: string;
  book: string;
  code: string;
  chapter: number;
  verse: number;
  tokens: Token[];
}

export interface AlignResponse {
  // tokenIndex indexes into the deterministic /api/interlinear token order.
  mapping: Array<{ wordIndex: number; tokenIndex: number }>;
}

export interface EtymologyResponse {
  word: string;
  summary: string;
  origins: Array<{ language: string; form: string; note: string }>;
  relatedWords: string[];
  note: string | null;
}

export interface Manifest {
  generatedNote: string;
  books: Array<{ code: string; name: string; testament: string; verses: number; tokens: number }>;
  lexiconEntries: number;
  morphCodes: number;
  attribution: string[];
}

export const MODELS = ['gpt-5.5', 'gpt-5.4-mini', 'gpt-5.4-nano'] as const;
export type ModelId = (typeof MODELS)[number];
export type AiFeature = 'search' | 'align' | 'etymology';
export type ThemeChoice = 'light' | 'dark' | 'system';

export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
}
