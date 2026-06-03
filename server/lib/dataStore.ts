// Lazy, cached access to the generated lexical data (gzipped JSON under server/data).
// Lexicon + morphology load once on first use; interlinear loads per-book on demand.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import type { BookInterlinear, DataManifest, LexEntry, Token } from './types.ts';
import { resolveBook, BOOK_BY_CODE } from './books.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

function loadGz<T>(rel: string): T | null {
  const file = path.join(DATA_DIR, rel);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')) as T;
}

/** "g2316" | "G02316" | "2316G..." -> "G2316". Returns null if unparseable. */
export function normalizeStrong(raw: string): string | null {
  const m = raw.replace(/[{}]/g, '').trim().match(/^([GH])0*(\d+)/i);
  if (!m) return null;
  return `${m[1].toUpperCase()}${m[2]}`;
}

let lexicon: Record<string, LexEntry> | null = null;
function getLexicon(): Record<string, LexEntry> {
  if (!lexicon) lexicon = loadGz<Record<string, LexEntry>>('lexicon/strongs.json.gz') ?? {};
  return lexicon;
}

export function getLexEntry(strongs: string): LexEntry | null {
  const id = normalizeStrong(strongs);
  if (!id) return null;
  return getLexicon()[id] ?? null;
}

let morph: Record<string, string> | null = null;
export function getMorph(): Record<string, string> {
  if (!morph) morph = loadGz<Record<string, string>>('morph/codes.json.gz') ?? {};
  return morph;
}

const bookCache = new Map<string, BookInterlinear | null>();
function getBook(code: string): BookInterlinear | null {
  if (!bookCache.has(code)) {
    bookCache.set(code, loadGz<BookInterlinear>(`interlinear/${code}.json.gz`));
  }
  return bookCache.get(code) ?? null;
}

export interface VerseResult {
  reference: string;
  book: string;
  code: string;
  chapter: number;
  verse: number;
  tokens: Token[];
}

/** Look up a verse's interlinear by free-form book name + chapter + verse. */
export function getVerse(bookInput: string, chapter: number, verse: number): VerseResult | null {
  const code = resolveBook(bookInput);
  if (!code) return null;
  const book = getBook(code);
  if (!book) return null;
  const tokens = book[`${chapter}:${verse}`];
  if (!tokens) return null;
  const name = BOOK_BY_CODE[code]?.name ?? code;
  return {
    reference: `${name} ${chapter}:${verse}`,
    book: name,
    code,
    chapter,
    verse,
    tokens,
  };
}

let manifest: DataManifest | null = null;
export function getManifest(): DataManifest | null {
  if (!manifest) {
    const file = path.join(DATA_DIR, 'manifest.json');
    if (fs.existsSync(file)) manifest = JSON.parse(fs.readFileSync(file, 'utf8')) as DataManifest;
  }
  return manifest;
}

export function dataAvailable(): boolean {
  return fs.existsSync(path.join(DATA_DIR, 'lexicon', 'strongs.json.gz'));
}
