/**
 * build-data.ts — transform open-licensed datasets into compact, gzipped JSON
 * that the server reads at runtime. Run with `npm run build:data`.
 *
 * Sources (all public-domain or CC-BY):
 *   - OpenScriptures Strong's Greek & Hebrew dictionaries  (definitions, roots, translit)
 *   - STEPBible TAGNT / TAHOT  (verse-keyed per-word tagging: Strong's, morphology, gloss)
 *   - STEPBible TEGMC / TEHMC  (morphology-code expansions)
 *
 * Outputs (gzipped JSON) under server/data/:
 *   - lexicon/strongs.json.gz       { [strongsId]: LexEntry }
 *   - morph/codes.json.gz           { [code]: readableString }
 *   - interlinear/<CODE>.json.gz    { "chapter:verse": Token[] }
 *   - manifest.json                 counts + attribution (plain JSON)
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { BOOKS, BOOK_BY_CODE } from '../server/lib/books.ts';
import type { Token, LexEntry, BookInterlinear, DataManifest } from '../server/lib/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data-raw');
const OUT_DIR = path.join(ROOT, 'server', 'data');

const STEP_API = 'https://api.github.com/repos/STEPBible/STEPBible-Data/contents';

// friendly raw filename -> { STEPBible folder, filename prefix }
const STEP_FILES: Record<string, { folder: string; prefix: string }> = {
  'TAGNT-Mat-Jhn.txt': { folder: 'Translators Amalgamated OT+NT', prefix: 'TAGNT Mat-Jhn' },
  'TAGNT-Act-Rev.txt': { folder: 'Translators Amalgamated OT+NT', prefix: 'TAGNT Act-Rev' },
  'TAHOT-Gen-Deu.txt': { folder: 'Translators Amalgamated OT+NT', prefix: 'TAHOT Gen-Deu' },
  'TAHOT-Jos-Est.txt': { folder: 'Translators Amalgamated OT+NT', prefix: 'TAHOT Jos-Est' },
  'TAHOT-Job-Sng.txt': { folder: 'Translators Amalgamated OT+NT', prefix: 'TAHOT Job-Sng' },
  'TAHOT-Isa-Mal.txt': { folder: 'Translators Amalgamated OT+NT', prefix: 'TAHOT Isa-Mal' },
  'TEGMC.txt': { folder: 'Morphology codes', prefix: 'TEGMC' },
  'TEHMC.txt': { folder: 'Morphology codes', prefix: 'TEHMC' },
};
const DIRECT_FILES: Record<string, string> = {
  'strongs-greek.js':
    'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js',
  'strongs-hebrew.js':
    'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js',
};

const TAGNT_FILES = ['TAGNT-Mat-Jhn.txt', 'TAGNT-Act-Rev.txt'];
const TAHOT_FILES = ['TAHOT-Gen-Deu.txt', 'TAHOT-Jos-Est.txt', 'TAHOT-Job-Sng.txt', 'TAHOT-Isa-Mal.txt'];

// ---------- download (only if missing) ----------

const folderCache = new Map<string, any[]>();
async function listFolder(folder: string): Promise<any[]> {
  if (folderCache.has(folder)) return folderCache.get(folder)!;
  const url = `${STEP_API}/${encodeURIComponent(folder).replace(/%2F/g, '/')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'verse-exegesis-build' } });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${folder}`);
  const json = (await res.json()) as any[];
  folderCache.set(folder, json);
  return json;
}

async function ensureRawFiles() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  for (const [name, url] of Object.entries(DIRECT_FILES)) {
    const dest = path.join(RAW_DIR, name);
    if (fs.existsSync(dest)) continue;
    console.log(`  downloading ${name} ...`);
    const res = await fetch(url, { headers: { 'User-Agent': 'verse-exegesis-build' } });
    if (!res.ok) throw new Error(`download ${res.status} for ${name}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
  for (const [name, spec] of Object.entries(STEP_FILES)) {
    const dest = path.join(RAW_DIR, name);
    if (fs.existsSync(dest)) continue;
    const items = await listFolder(spec.folder);
    const item = items.find((it) => typeof it.name === 'string' && it.name.startsWith(spec.prefix));
    if (!item?.download_url) throw new Error(`could not resolve ${spec.prefix} in ${spec.folder}`);
    console.log(`  downloading ${name} ...`);
    const res = await fetch(String(item.download_url).replace(/ /g, '%20'), {
      headers: { 'User-Agent': 'verse-exegesis-build' },
    });
    if (!res.ok) throw new Error(`download ${res.status} for ${name}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
}

// ---------- helpers ----------

function read(name: string): string {
  return fs.readFileSync(path.join(RAW_DIR, name), 'utf8');
}
function writeGz(rel: string, data: unknown) {
  const dest = path.join(OUT_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, zlib.gzipSync(Buffer.from(JSON.stringify(data)), { level: 9 }));
}

/** "G0976" | "{H7225G}" | "H7225 a" -> "G976" | "H7225". Null if not a Strong's ref. */
function normalizeStrong(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.replace(/[{}]/g, '').trim().match(/^([GH])0*(\d+)/i);
  if (!m) return null;
  return `${m[1].toUpperCase()}${m[2]}`;
}

/** Turn "Function=Noun; Case=Nominative; Number=Singular" into "Noun · Nominative · Singular". */
function structuredToReadable(s: string): string {
  const cleaned = s.replace(/\([^)]*\)/g, ''); // drop "(hence ...)" notes
  const parts = cleaned
    .split(';')
    .map((p) => p.split('=').slice(1).join('=').trim())
    .filter(Boolean);
  return parts.join(' · ');
}

// ---------- lexicon ----------

function parseJsDict(text: string): Record<string, any> {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return JSON.parse(text.slice(start, end + 1));
}

function buildLexicon(): Record<string, LexEntry> {
  const out: Record<string, LexEntry> = {};
  const greek = parseJsDict(read('strongs-greek.js'));
  for (const [key, e] of Object.entries<any>(greek)) {
    const id = normalizeStrong(key);
    if (!id) continue;
    out[id] = {
      strongs: id,
      lang: 'greek',
      lemma: e.lemma ?? '',
      translit: e.translit ?? '',
      pronunciation: '',
      definition: (e.strongs_def ?? '').trim(),
      usage: (e.kjv_def ?? '').trim(),
      derivation: (e.derivation ?? '').trim(),
    };
  }
  const hebrew = parseJsDict(read('strongs-hebrew.js'));
  for (const [key, e] of Object.entries<any>(hebrew)) {
    const id = normalizeStrong(key);
    if (!id) continue;
    out[id] = {
      strongs: id,
      lang: 'hebrew',
      lemma: e.lemma ?? '',
      translit: e.xlit ?? '',
      pronunciation: e.pron ?? '',
      definition: (e.strongs_def ?? '').trim(),
      usage: (e.kjv_def ?? '').trim(),
      derivation: (e.derivation ?? '').trim(),
    };
  }
  return out;
}

// ---------- morphology ----------

function buildMorph(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of ['TEGMC.txt', 'TEHMC.txt']) {
    for (const line of read(name).split('\n')) {
      const tab = line.indexOf('\t');
      if (tab < 1) continue;
      const code = line.slice(0, tab).trim();
      const rest = line.slice(tab + 1).trim();
      if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(code)) continue;
      if (!rest.startsWith('Function=')) continue;
      if (!out[code]) out[code] = structuredToReadable(rest);
    }
  }
  return out;
}

// ---------- interlinear ----------

const REF_RE = /^([0-9A-Za-z]+)\.(\d+)\.(\d+)#(\d+)=(.*)$/;

function expandGreekMorph(code: string, morph: Record<string, string>): string {
  return morph[code] ?? code;
}

function expandHebrewMorph(grammar: string, rootIdx: number, morph: Record<string, string>): string {
  const lang = grammar[0] === 'A' ? 'A' : 'H';
  const segs = grammar.split('/');
  const seg = segs[rootIdx] ?? segs[segs.length - 1] ?? grammar;
  const key = /^[HA]/.test(seg) ? seg : lang + seg;
  return morph[key] ?? morph[seg] ?? seg;
}

interface ParseStats {
  verses: number;
  tokens: number;
}

function parseGreek(
  files: string[],
  morph: Record<string, string>,
): Map<string, BookInterlinear> {
  const books = new Map<string, BookInterlinear>();
  for (const file of files) {
    const lines = read(file).split('\n');
    let seen = new Set<string>(); // idx seen in current verse
    let curKey = '';
    for (const line of lines) {
      const tab = line.indexOf('\t');
      if (tab < 0) continue;
      const col0 = line.slice(0, tab);
      const m = REF_RE.exec(col0);
      if (!m) continue;
      const [, code, ch, vs, idx, type] = m;
      if (!BOOK_BY_CODE[code] || BOOK_BY_CODE[code].testament !== 'NT') continue;
      // Modern critical text ≈ NASB base: keep words present in Nestlé-Aland ('N').
      if (!/N/.test(type)) continue;
      const cols = line.split('\t');
      const verseKey = `${ch}:${vs}`;
      if (`${code} ${verseKey}` !== curKey) {
        curKey = `${code} ${verseKey}`;
        seen = new Set();
      }
      if (seen.has(idx)) continue;
      seen.add(idx);

      const surfaceCell = cols[1] ?? '';
      const sm = surfaceCell.match(/^(\S+)\s*(?:\(([^)]*)\))?/);
      const surface = sm?.[1] ?? surfaceCell.trim();
      const translit = sm?.[2] ?? '';
      const [strongsRaw, ...morphRest] = (cols[3] ?? '').split('=');
      const morphCode = morphRest.join('=').trim();
      const [lemma, ...glossRest] = (cols[4] ?? '').split('=');
      void lemma;
      let gloss = glossRest.join('=').trim();
      if (!gloss) gloss = (cols[2] ?? '').replace(/[[\]]/g, '').trim();

      const token: Token = {
        surface,
        translit,
        strongs: normalizeStrong(strongsRaw),
        morph: expandGreekMorph(morphCode, morph),
        morphCode,
        gloss,
        lang: 'greek',
      };
      const bi = books.get(code) ?? {};
      (bi[verseKey] ??= []).push(token);
      books.set(code, bi);
    }
  }
  return books;
}

function parseHebrew(
  files: string[],
  morph: Record<string, string>,
): Map<string, BookInterlinear> {
  const books = new Map<string, BookInterlinear>();
  for (const file of files) {
    const lines = read(file).split('\n');
    let seen = new Set<string>();
    let curKey = '';
    for (const line of lines) {
      const tab = line.indexOf('\t');
      if (tab < 0) continue;
      const col0 = line.slice(0, tab);
      const m = REF_RE.exec(col0);
      if (!m) continue;
      const [, code, ch, vs, idx] = m;
      if (!BOOK_BY_CODE[code] || BOOK_BY_CODE[code].testament !== 'OT') continue;
      const cols = line.split('\t');
      const verseKey = `${ch}:${vs}`;
      if (`${code} ${verseKey}` !== curKey) {
        curKey = `${code} ${verseKey}`;
        seen = new Set();
      }
      if (seen.has(idx)) continue;
      seen.add(idx);

      const dstr = cols[4] ?? '';
      const dsegs = dstr.split('/');
      let rootIdx = dsegs.findIndex((s) => s.includes('{'));
      if (rootIdx < 0) rootIdx = dsegs.length - 1;

      const rootRaw = dsegs[rootIdx] ?? cols[8] ?? '';
      // Hebrew cells use "/" to separate morphemes and "\" to separate trailing
      // punctuation (e.g. sof-pasuq); strip both for the displayed surface form.
      const surface = (cols[1] ?? '').replace(/[\\/]/g, '');
      const translit = (cols[2] ?? '').replace(/[\\/]/g, '').replace(/^\.+|\.+$/g, '');
      const transSegs = (cols[3] ?? '').split('/');
      const gloss = (transSegs[rootIdx] ?? cols[3] ?? '').trim();
      const grammar = cols[5] ?? '';

      const token: Token = {
        surface,
        translit,
        strongs: normalizeStrong(rootRaw),
        morph: expandHebrewMorph(grammar, rootIdx, morph),
        morphCode: grammar,
        gloss,
        lang: 'hebrew',
      };
      const bi = books.get(code) ?? {};
      (bi[verseKey] ??= []).push(token);
      books.set(code, bi);
    }
  }
  return books;
}

// ---------- main ----------

async function main() {
  console.log('Ensuring raw datasets...');
  await ensureRawFiles();

  console.log('Building lexicon...');
  const lexicon = buildLexicon();
  writeGz('lexicon/strongs.json.gz', lexicon);
  console.log(`  ${Object.keys(lexicon).length} Strong's entries`);

  console.log('Building morphology codes...');
  const morph = buildMorph();
  writeGz('morph/codes.json.gz', morph);
  console.log(`  ${Object.keys(morph).length} morphology codes`);

  console.log('Parsing interlinear (this takes a moment)...');
  const greekBooks = parseGreek(TAGNT_FILES, morph);
  const hebrewBooks = parseHebrew(TAHOT_FILES, morph);

  const stats: Record<string, ParseStats> = {};
  const writeBooks = (books: Map<string, BookInterlinear>) => {
    for (const [code, verseMap] of books) {
      writeGz(`interlinear/${code}.json.gz`, verseMap);
      const verses = Object.keys(verseMap).length;
      const tokens = Object.values(verseMap).reduce((n, t) => n + t.length, 0);
      stats[code] = { verses, tokens };
      console.log(`  ${code}: ${verses} verses, ${tokens} tokens`);
    }
  };
  writeBooks(hebrewBooks);
  writeBooks(greekBooks);

  const manifest: DataManifest = {
    generatedNote:
      'Generated by scripts/build-data.ts from OpenScriptures + STEPBible data. Do not edit by hand.',
    books: BOOKS.filter((b) => stats[b.code]).map((b) => ({
      code: b.code,
      name: b.name,
      testament: b.testament,
      verses: stats[b.code].verses,
      tokens: stats[b.code].tokens,
    })),
    lexiconEntries: Object.keys(lexicon).length,
    morphCodes: Object.keys(morph).length,
    attribution: [
      "Strong's dictionaries: OpenScriptures (openscriptures/strongs), CC-BY-SA — public-domain Strong's text.",
      'Tagged text & morphology: STEPBible / Tyndale House Cambridge (TAGNT, TAHOT, TEGMC, TEHMC), CC-BY 4.0.',
    ],
  };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const totalBooks = manifest.books.length;
  const totalTokens = manifest.books.reduce((n, b) => n + b.tokens, 0);
  console.log(`\nDone. ${totalBooks} books, ${totalTokens} tokens, ${manifest.lexiconEntries} lexicon entries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
