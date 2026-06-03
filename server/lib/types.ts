// Shared data shapes for the deterministic lexical layer.

export type Lang = 'hebrew' | 'greek';

/** One original-language word as it appears in a verse. */
export interface Token {
  /** Original script as it appears in the text (Hebrew incl. prefixes; Greek surface form). */
  surface: string;
  /** Transliteration. */
  translit: string;
  /** Normalized root Strong's id, e.g. "G976" / "H7225". Null for untagged punctuation. */
  strongs: string | null;
  /** Human-readable morphology, e.g. "Noun · Nominative · Singular · Feminine". */
  morph: string;
  /** Raw morphology code(s) as in the source data, e.g. "N-NSF" / "HR/Ncfsa". */
  morphCode: string;
  /** Short contextual gloss, e.g. "beginning". */
  gloss: string;
  lang: Lang;
}

/** A full lexicon entry keyed by normalized Strong's id. */
export interface LexEntry {
  strongs: string;
  lang: Lang;
  /** Dictionary (lemma) form in original script. */
  lemma: string;
  /** Transliteration of the lemma. */
  translit: string;
  /** Pronunciation guide (Hebrew only; empty for Greek). */
  pronunciation: string;
  /** Strong's definition. */
  definition: string;
  /** KJV usage summary (how the word is rendered). */
  usage: string;
  /** Derivation / root note. */
  derivation: string;
}

/** verse key "chapter:verse" -> tokens */
export type BookInterlinear = Record<string, Token[]>;

export interface DataManifest {
  generatedNote: string;
  books: Array<{ code: string; name: string; testament: string; verses: number; tokens: number }>;
  lexiconEntries: number;
  morphCodes: number;
  attribution: string[];
}
