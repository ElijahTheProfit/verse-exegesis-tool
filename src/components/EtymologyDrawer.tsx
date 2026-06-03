import { useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import type { EtymologyResponse } from '../lib/types';
import { useStudy } from '../state/study';
import { Sheet } from './Sheet';
import { TappableText } from './TappableText';
import { IconSpinner } from './icons';

export function EtymologyDrawer() {
  const { etymWord, closeEtymology, getEtymology, openEtymology } = useStudy();
  const [data, setData] = useState<EtymologyResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!etymWord) return;
    let cancelled = false;
    setStatus('loading');
    setData(null);
    getEtymology(etymWord)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setStatus('idle');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(e instanceof ApiError ? e.message : 'Could not load etymology.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [etymWord, getEtymology]);

  return (
    <Sheet
      open={!!etymWord}
      onClose={closeEtymology}
      level={1}
      title={etymWord ?? 'Etymology'}
      subtitle="English etymology"
    >
      {status === 'loading' ? (
        <div className="flex items-center gap-2 py-8 text-muted">
          <IconSpinner /> Tracing the word’s origin…
        </div>
      ) : null}
      {status === 'error' ? <p className="py-8 text-center text-muted">{errorMsg}</p> : null}
      {status === 'idle' && data ? (
        <div className="space-y-6">
          <p className="font-serif text-[1.05rem] leading-relaxed">
            <TappableText text={data.summary} />
          </p>

          {data.origins.length ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Origin</h3>
              <ol className="space-y-2 border-l border-border pl-4">
                {data.origins.map((o, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[1.32rem] top-1.5 h-2 w-2 rounded-full bg-border" />
                    <span className="text-sm text-muted">{o.language}</span>
                    <div>
                      <span className="font-serif italic">{o.form}</span>
                      {o.note ? <span className="text-muted"> — {o.note}</span> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {data.relatedWords.length ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Shares a root with
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.relatedWords.map((w) => (
                  <button
                    key={w}
                    onClick={() => openEtymology(w)}
                    className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {data.note ? (
            <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">{data.note}</p>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
