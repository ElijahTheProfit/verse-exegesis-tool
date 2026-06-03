// Canonical 66-book table. `code` matches the STEPBible reference codes used in the
// tagged datasets (TAHOT/TAGNT). `name` is the full English name the AI is asked to emit.
// `abbrevs` are extra spellings the citation resolver should accept.

export type Testament = 'OT' | 'NT';

export interface BookDef {
  code: string; // STEPBible/OSIS-ish code, e.g. "Jhn"
  name: string; // canonical English name, e.g. "John"
  testament: Testament;
  order: number; // 1..66
  abbrevs: string[];
}

const RAW: Array<[string, string, Testament, string[]]> = [
  // OT
  ['Gen', 'Genesis', 'OT', ['gn']],
  ['Exo', 'Exodus', 'OT', ['ex', 'exod']],
  ['Lev', 'Leviticus', 'OT', ['lv', 'levit']],
  ['Num', 'Numbers', 'OT', ['nm', 'nu', 'numb']],
  ['Deu', 'Deuteronomy', 'OT', ['dt', 'deut']],
  ['Jos', 'Joshua', 'OT', ['jsh', 'josh']],
  ['Jdg', 'Judges', 'OT', ['jdgs', 'judg']],
  ['Rut', 'Ruth', 'OT', ['rth']],
  ['1Sa', '1 Samuel', 'OT', ['1sam', '1 sam', 'i samuel', '1st samuel']],
  ['2Sa', '2 Samuel', 'OT', ['2sam', '2 sam', 'ii samuel', '2nd samuel']],
  ['1Ki', '1 Kings', 'OT', ['1kgs', '1 kgs', 'i kings', '1st kings']],
  ['2Ki', '2 Kings', 'OT', ['2kgs', '2 kgs', 'ii kings', '2nd kings']],
  ['1Ch', '1 Chronicles', 'OT', ['1chr', '1 chr', 'i chronicles', '1st chronicles']],
  ['2Ch', '2 Chronicles', 'OT', ['2chr', '2 chr', 'ii chronicles', '2nd chronicles']],
  ['Ezr', 'Ezra', 'OT', []],
  ['Neh', 'Nehemiah', 'OT', ['neh']],
  ['Est', 'Esther', 'OT', ['esth']],
  ['Job', 'Job', 'OT', []],
  ['Psa', 'Psalms', 'OT', ['ps', 'psalm', 'pslm', 'psa']],
  ['Pro', 'Proverbs', 'OT', ['prov', 'prv']],
  ['Ecc', 'Ecclesiastes', 'OT', ['eccl', 'qoh', 'qoheleth']],
  ['Sng', 'Song of Solomon', 'OT', ['song', 'song of songs', 'canticles', 'sos', 'cant']],
  ['Isa', 'Isaiah', 'OT', ['is', 'isa']],
  ['Jer', 'Jeremiah', 'OT', ['jer']],
  ['Lam', 'Lamentations', 'OT', ['lam']],
  ['Ezk', 'Ezekiel', 'OT', ['ezek', 'eze']],
  ['Dan', 'Daniel', 'OT', ['dan']],
  ['Hos', 'Hosea', 'OT', ['hos']],
  ['Jol', 'Joel', 'OT', ['joel']],
  ['Amo', 'Amos', 'OT', ['am']],
  ['Oba', 'Obadiah', 'OT', ['obad', 'ob']],
  ['Jon', 'Jonah', 'OT', ['jnh']],
  ['Mic', 'Micah', 'OT', ['mic']],
  ['Nam', 'Nahum', 'OT', ['nah']],
  ['Hab', 'Habakkuk', 'OT', ['hab']],
  ['Zep', 'Zephaniah', 'OT', ['zeph']],
  ['Hag', 'Haggai', 'OT', ['hag']],
  ['Zec', 'Zechariah', 'OT', ['zech', 'zec']],
  ['Mal', 'Malachi', 'OT', ['mal']],
  // NT
  ['Mat', 'Matthew', 'NT', ['mt', 'matt']],
  ['Mrk', 'Mark', 'NT', ['mk', 'mr']],
  ['Luk', 'Luke', 'NT', ['lk', 'luk']],
  ['Jhn', 'John', 'NT', ['jn', 'jhn', 'joh']],
  ['Act', 'Acts', 'NT', ['ac', 'acts of the apostles']],
  ['Rom', 'Romans', 'NT', ['rm', 'rom']],
  ['1Co', '1 Corinthians', 'NT', ['1cor', '1 cor', 'i corinthians', '1st corinthians']],
  ['2Co', '2 Corinthians', 'NT', ['2cor', '2 cor', 'ii corinthians', '2nd corinthians']],
  ['Gal', 'Galatians', 'NT', ['gal']],
  ['Eph', 'Ephesians', 'NT', ['eph']],
  ['Php', 'Philippians', 'NT', ['phil', 'phlp', 'php']],
  ['Col', 'Colossians', 'NT', ['col']],
  ['1Th', '1 Thessalonians', 'NT', ['1thess', '1 thess', 'i thessalonians', '1st thessalonians']],
  ['2Th', '2 Thessalonians', 'NT', ['2thess', '2 thess', 'ii thessalonians', '2nd thessalonians']],
  ['1Ti', '1 Timothy', 'NT', ['1tim', '1 tim', 'i timothy', '1st timothy']],
  ['2Ti', '2 Timothy', 'NT', ['2tim', '2 tim', 'ii timothy', '2nd timothy']],
  ['Tit', 'Titus', 'NT', ['tit']],
  ['Phm', 'Philemon', 'NT', ['phlm', 'philem', 'phm']],
  ['Heb', 'Hebrews', 'NT', ['heb']],
  ['Jas', 'James', 'NT', ['jms', 'jas']],
  ['1Pe', '1 Peter', 'NT', ['1pet', '1 pet', 'i peter', '1st peter']],
  ['2Pe', '2 Peter', 'NT', ['2pet', '2 pet', 'ii peter', '2nd peter']],
  ['1Jn', '1 John', 'NT', ['1jn', '1 jn', 'i john', '1st john']],
  ['2Jn', '2 John', 'NT', ['2jn', '2 jn', 'ii john', '2nd john']],
  ['3Jn', '3 John', 'NT', ['3jn', '3 jn', 'iii john', '3rd john']],
  ['Jud', 'Jude', 'NT', ['jude']],
  ['Rev', 'Revelation', 'NT', ['rev', 'apocalypse', 'revelation of john']],
];

export const BOOKS: BookDef[] = RAW.map(([code, name, testament, abbrevs], i) => ({
  code,
  name,
  testament,
  order: i + 1,
  abbrevs,
}));

export const BOOK_BY_CODE: Record<string, BookDef> = Object.fromEntries(
  BOOKS.map((b) => [b.code, b]),
);

function norm(s: string): string {
  return s.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
}
function compact(s: string): string {
  return norm(s).replace(/\s+/g, '');
}

// Build a lookup from every accepted spelling (normalized) to a book code.
const LOOKUP: Record<string, string> = {};
for (const b of BOOKS) {
  const keys = new Set<string>([b.code, b.name, ...b.abbrevs]);
  for (const k of keys) {
    LOOKUP[norm(k)] = b.code;
    LOOKUP[compact(k)] = b.code;
  }
}

/** Resolve a free-form book name/abbreviation to a canonical code, or null. */
export function resolveBook(input: string): string | null {
  if (!input) return null;
  const n = norm(input);
  if (LOOKUP[n]) return LOOKUP[n];
  const c = compact(input);
  if (LOOKUP[c]) return LOOKUP[c];
  return null;
}
