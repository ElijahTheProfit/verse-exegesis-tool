import { useMemo } from 'react';
import { cleanWord, segmentText } from '../lib/tokenize';
import { useStudy } from '../state/study';

// Renders English prose where every word is tappable to open its etymology.
// Used inside menus/drawers (glosses, definitions, summaries).
export function TappableText({ text, className }: { text: string; className?: string }) {
  const { openEtymology } = useStudy();
  const segments = useMemo(() => segmentText(text), [text]);

  return (
    <span className={className}>
      {segments.map((s, i) =>
        s.isWord ? (
          <span
            key={i}
            role="button"
            tabIndex={0}
            className="tap-word underline decoration-dotted decoration-muted/30 underline-offset-2 hover:text-accent hover:decoration-accent"
            onClick={() => openEtymology(cleanWord(s.text))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openEtymology(cleanWord(s.text));
              }
            }}
          >
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </span>
  );
}
