import { useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import type { LexEntry, Token } from '../lib/types';
import { useStudy } from '../state/study';
import { Sheet } from './Sheet';
import { TappableText } from './TappableText';
import { IconSpinner } from './icons';

function isRtl(token: Token) {
  return token.lang === 'hebrew';
}

function ScriptToggle({ showScript, onChange }: { showScript: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface-2 p-0.5 text-sm">
      {[
        { label: 'Original', val: true },
        { label: 'Transliteration', val: false },
      ].map((o) => (
        <button
          key={o.label}
          onClick={() => onChange(o.val)}
          className={`rounded-full px-3 py-1 transition-colors ${
            showScript === o.val ? 'bg-surface text-text shadow-sm' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Chip({
  token,
  active,
  showScript,
  onClick,
}: {
  token: Token;
  active: boolean;
  showScript: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={token.gloss}
      className={`shrink-0 rounded-full border px-3 py-1.5 transition-colors ${
        active ? 'border-accent bg-accent-soft text-accent' : 'border-border hover:bg-surface-2'
      }`}
    >
      {showScript ? (
        <span className="font-original text-base" dir={isRtl(token) ? 'rtl' : 'ltr'}>
          {token.surface}
        </span>
      ) : (
        <span className="font-sans text-sm italic">{token.translit || '—'}</span>
      )}
    </button>
  );
}

function LexBlock({ lex, loading }: { lex: LexEntry | null; loading: boolean }) {
  if (loading)
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <IconSpinner size={15} /> Loading lexicon…
      </div>
    );
  if (!lex)
    return <p className="text-sm text-muted">No dictionary entry for this word.</p>;
  return (
    <dl className="space-y-3 text-[0.95rem]">
      {lex.definition ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Definition</dt>
          <dd className="mt-0.5">
            <TappableText text={lex.definition} />
          </dd>
        </div>
      ) : null}
      {lex.usage ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Biblical usage (KJV)
          </dt>
          <dd className="mt-0.5">
            <TappableText text={lex.usage} />
          </dd>
        </div>
      ) : null}
      {lex.derivation ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Root / derivation</dt>
          <dd className="mt-0.5">
            <TappableText text={lex.derivation} />
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function TokenDetail({
  token,
  lex,
  lexLoading,
  showScript,
}: {
  token: Token;
  lex: LexEntry | null;
  lexLoading: boolean;
  showScript: boolean;
}) {
  const rtl = isRtl(token);
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border border-border bg-surface-2/50 p-4 text-center">
        {showScript ? (
          <>
            <div className="font-original text-4xl leading-tight" dir={rtl ? 'rtl' : 'ltr'}>
              {token.surface}
            </div>
            <div className="mt-1 text-base italic text-muted">{token.translit}</div>
          </>
        ) : (
          <>
            <div className="text-3xl italic leading-tight">{token.translit || '—'}</div>
            <div className="mt-1 font-original text-lg text-muted" dir={rtl ? 'rtl' : 'ltr'}>
              {token.surface}
            </div>
          </>
        )}
        {lex?.lemma ? (
          <div className="mt-2 text-sm text-muted">
            root <span className="font-original" dir={rtl ? 'rtl' : 'ltr'}>{lex.lemma}</span>
            {lex.translit ? <span className="italic"> · {lex.translit}</span> : null}
            {lex.pronunciation ? <span> · {lex.pronunciation}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {token.strongs ? (
          <span className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-xs font-semibold text-accent">
            {token.strongs}
          </span>
        ) : null}
        <span className="text-muted">{token.morph}</span>
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Gloss</span>
        <p className="mt-0.5 text-[0.95rem]">
          <TappableText text={token.gloss || '—'} />
        </p>
      </div>

      <div className="border-t border-border pt-3">
        <LexBlock lex={lex} loading={lexLoading} />
      </div>
    </div>
  );
}

export function WordStudyDrawer() {
  const { wordTarget, closeWord, getInterlinear, ensureAlignment, getLexicon } = useStudy();
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [selected, setSelected] = useState(-1);
  const [lex, setLex] = useState<LexEntry | null>(null);
  const [lexLoading, setLexLoading] = useState(false);
  const [showScript, setShowScript] = useState(true);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!wordTarget) return;
    let cancelled = false;
    setStatus('loading');
    setTokens(null);
    setLex(null);
    setSelected(-1);
    setNote(null);
    (async () => {
      try {
        const inter = await getInterlinear(wordTarget.ref);
        if (cancelled) return;
        setTokens(inter.tokens);
        let sel = inter.tokens.length ? 0 : -1;
        if (wordTarget.wordIndex >= 0) {
          try {
            const { mapping } = await ensureAlignment(wordTarget.ref, wordTarget.words);
            if (cancelled) return;
            const m = mapping.find((x) => x.wordIndex === wordTarget.wordIndex);
            if (m && m.tokenIndex >= 0 && m.tokenIndex < inter.tokens.length) sel = m.tokenIndex;
            else setNote('No exact original word for this term — browse the verse below.');
          } catch {
            setNote('Word alignment unavailable — browse the verse interlinear below.');
          }
        }
        if (!cancelled) {
          setSelected(sel);
          setStatus('idle');
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(e instanceof ApiError ? e.message : 'Could not load the interlinear.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wordTarget, getInterlinear, ensureAlignment]);

  useEffect(() => {
    if (!tokens || selected < 0) {
      setLex(null);
      return;
    }
    const tok = tokens[selected];
    if (!tok?.strongs) {
      setLex(null);
      return;
    }
    let cancelled = false;
    setLexLoading(true);
    setLex(null);
    getLexicon(tok.strongs)
      .then((e) => !cancelled && setLex(e))
      .catch(() => !cancelled && setLex(null))
      .finally(() => !cancelled && setLexLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tokens, selected, getLexicon]);

  const open = !!wordTarget;
  const title =
    wordTarget && wordTarget.wordIndex >= 0 && wordTarget.wordText
      ? `“${wordTarget.wordText}”`
      : 'Interlinear';
  const subtitle = wordTarget
    ? `${wordTarget.ref.book} ${wordTarget.ref.chapter}:${wordTarget.ref.verse}`
    : '';

  return (
    <Sheet open={open} onClose={closeWord} title={title} subtitle={subtitle}>
      {status === 'loading' ? (
        <div className="flex items-center gap-2 py-8 text-muted">
          <IconSpinner /> Loading interlinear…
        </div>
      ) : null}
      {status === 'error' ? <p className="py-8 text-center text-muted">{errorMsg}</p> : null}
      {status === 'idle' && tokens ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <ScriptToggle showScript={showScript} onChange={setShowScript} />
            <span className="text-xs text-muted">{tokens.length} words</span>
          </div>
          {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {tokens.map((t, i) => (
              <Chip
                key={i}
                token={t}
                active={i === selected}
                showScript={showScript}
                onClick={() => setSelected(i)}
              />
            ))}
          </div>
          {selected >= 0 && tokens[selected] ? (
            <TokenDetail
              token={tokens[selected]}
              lex={lex}
              lexLoading={lexLoading}
              showScript={showScript}
            />
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
