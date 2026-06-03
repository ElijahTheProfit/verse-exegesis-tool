import { useMemo } from 'react';
import { wordsOf } from '../lib/tokenize';
import { useStudy } from '../state/study';
import type { SearchResponse, SearchVerse } from '../lib/types';
import { TappableVerse } from './TappableVerse';
import { IconBook } from './icons';

function VerseCard({ verse }: { verse: SearchVerse }) {
  const { openWord } = useStudy();
  const words = useMemo(() => wordsOf(verse.text), [verse.text]);
  const ref = { book: verse.book, chapter: verse.chapter, verse: verse.verse };

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <TappableVerse verse={verse} />
      <button
        onClick={() => openWord({ ref, words, wordIndex: -1, wordText: '' })}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
        title="View the original-language interlinear"
      >
        <IconBook size={14} />
        {verse.citation}
      </button>
    </article>
  );
}

export function Results({ data }: { data: SearchResponse }) {
  if (!data.results.length || data.results.every((g) => g.verses.length === 0)) {
    return (
      <p className="py-10 text-center font-serif text-muted">
        No verses found. Try rephrasing your question.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {data.results.map((group, gi) => (
        <section key={gi}>
          {group.topic ? (
            <h2 className="mb-3 font-serif text-xl font-semibold tracking-tight">{group.topic}</h2>
          ) : null}
          <div className="space-y-3">
            {group.verses.map((v, vi) => (
              <VerseCard key={`${v.citation}-${vi}`} verse={v} />
            ))}
          </div>
          {gi < data.results.length - 1 ? <hr className="mt-6 border-border" /> : null}
        </section>
      ))}
      {data.model ? (
        <p className="pt-2 text-center text-xs text-muted/70">Answered by {data.model}</p>
      ) : null}
    </div>
  );
}
