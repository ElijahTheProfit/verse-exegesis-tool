// Split English text into word vs. non-word segments so we can render words as
// tappable spans while preserving punctuation/whitespace. The same word-indexing
// is used for AI alignment requests.

export interface Segment {
  text: string;
  isWord: boolean;
  /** Index among word segments only (-1 for non-word). */
  wordIndex: number;
}

// Letters (incl. accents) with internal apostrophes/hyphens count as one word.
const WORD_RE = /[\p{L}]+(?:['’\-’][\p{L}]+)*/gu;

export function segmentText(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let wordIndex = 0;
  for (const m of text.matchAll(WORD_RE)) {
    const start = m.index ?? 0;
    if (start > last) {
      segments.push({ text: text.slice(last, start), isWord: false, wordIndex: -1 });
    }
    segments.push({ text: m[0], isWord: true, wordIndex: wordIndex++ });
    last = start + m[0].length;
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last), isWord: false, wordIndex: -1 });
  }
  return segments;
}

/** Just the word strings, in order — what we send to the alignment endpoint. */
export function wordsOf(text: string): string[] {
  return Array.from(text.matchAll(WORD_RE), (m) => m[0]);
}

/** Normalize a word for etymology lookup (strip surrounding punctuation, lowercase). */
export function cleanWord(word: string): string {
  return word.toLowerCase().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
}
