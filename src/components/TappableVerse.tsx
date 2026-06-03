import { useMemo } from 'react';
import { segmentText, wordsOf } from '../lib/tokenize';
import { useStudy } from '../state/study';
import type { SearchVerse } from '../lib/types';

// Renders verse text where every word is tappable to open the Hebrew/Greek word study.
export function TappableVerse({ verse }: { verse: SearchVerse }) {
  const { openWord } = useStudy();
  const segments = useMemo(() => segmentText(verse.text), [verse.text]);
  const words = useMemo(() => wordsOf(verse.text), [verse.text]);
  const ref = { book: verse.book, chapter: verse.chapter, verse: verse.verse };

  const open = (wordIndex: number, wordText: string) =>
    openWord({ ref, words, wordIndex, wordText });

  return (
    <p className="font-serif text-[1.15rem] leading-relaxed text-text">
      {segments.map((s, i) =>
        s.isWord ? (
          <span
            key={i}
            role="button"
            tabIndex={0}
            className="tap-word -mx-0.5 rounded px-0.5 hover:bg-accent-soft"
            onClick={() => open(s.wordIndex, s.text)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(s.wordIndex, s.text);
              }
            }}
          >
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}
