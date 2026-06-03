import { useState } from 'react';
import { api, ApiError } from './lib/api';
import type { SearchResponse } from './lib/types';
import { SettingsProvider, useSettings } from './state/settings';
import { StudyProvider } from './state/study';
import { SearchBox } from './components/SearchBox';
import { Results } from './components/Results';
import { WordStudyDrawer } from './components/WordStudyDrawer';
import { EtymologyDrawer } from './components/EtymologyDrawer';
import { Settings } from './screens/Settings';
import { About } from './screens/About';
import { IconInfo, IconSettings, IconSpinner } from './components/icons';

const EXAMPLES = [
  'What does the Bible say about anxiety?',
  'The fruit of the Spirit',
  'Verses about hope in suffering',
  'Love your enemies',
];

// Dev-only sample (stripped from production builds) for verifying the verse →
// word-study → interlinear flow without an API key.
const DEMO: SearchResponse = {
  model: 'demo',
  results: [
    {
      topic: 'God’s love',
      verses: [
        {
          text: 'For God so loved the world, that He gave His only begotten Son, that whoever believes in Him shall not perish, but have eternal life.',
          citation: 'John 3:16',
          book: 'John',
          chapter: 3,
          verse: 16,
        },
        {
          text: 'In the beginning God created the heavens and the earth.',
          citation: 'Genesis 1:1',
          book: 'Genesis',
          chapter: 1,
          verse: 1,
        },
      ],
    },
  ],
};

const iconBtn =
  'rounded-full p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text';

function Welcome({ recents, onPick }: { recents: string[]; onPick: (q: string) => void }) {
  return (
    <div className="animate-fade-in pt-6">
      <p className="font-serif text-lg leading-relaxed text-muted">
        Ask any question, in any phrasing, and find the scripture that speaks to it.
      </p>
      <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wide text-muted">Try</h2>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            {ex}
          </button>
        ))}
      </div>
      {recents.length ? (
        <>
          <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wide text-muted">
            Recent
          </h2>
          <div className="flex flex-wrap gap-2">
            {recents.map((r) => (
              <button
                key={r}
                onClick={() => onPick(r)}
                className="rounded-full bg-surface-2 px-3.5 py-2 text-sm text-muted transition-colors hover:text-text"
              >
                {r}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Shell() {
  const { addRecent, recents, models } = useSettings();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const runSearch = async (q: string) => {
    setQuery(q);
    setLoading(true);
    setError('');
    try {
      const res = await api.search(q, models.search);
      setData(res);
      addRecent(q);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Search failed. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError('');
    setQuery('');
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-content flex-col px-4 sm:px-5">
      <header className="safe-top sticky top-0 z-10 -mx-4 border-b border-transparent bg-bg/85 px-4 backdrop-blur-md sm:-mx-5 sm:px-5">
        <div className="flex items-center justify-between py-3.5">
          <button onClick={reset} className="font-serif text-xl font-semibold tracking-tight">
            Verse Exegesis
          </button>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setAboutOpen(true)} aria-label="About" className={iconBtn}>
              <IconInfo />
            </button>
            <button onClick={() => setSettingsOpen(true)} aria-label="Settings" className={iconBtn}>
              <IconSettings />
            </button>
          </div>
        </div>
        <div className="pb-3">
          <SearchBox value={query} onChange={setQuery} loading={loading} onSubmit={runSearch} />
        </div>
      </header>

      <main className="flex-1 py-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <IconSpinner size={24} />
            <p className="font-serif">Searching scripture…</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="font-serif text-muted">{error}</p>
            {query ? (
              <button
                onClick={() => runSearch(query)}
                className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : data ? (
          <Results data={data} />
        ) : (
          <>
            <Welcome recents={recents} onPick={runSearch} />
            {import.meta.env.DEV ? (
              <button
                onClick={() => setData(DEMO)}
                className="mt-8 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted/70"
              >
                Load demo verses (dev)
              </button>
            ) : null}
          </>
        )}
      </main>

      <footer className="safe-bottom py-5 text-center text-xs text-muted/60">
        <button onClick={() => setAboutOpen(true)} className="hover:text-muted">
          Sources &amp; about
        </button>
      </footer>

      <WordStudyDrawer />
      <EtymologyDrawer />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <StudyProvider>
        <Shell />
      </StudyProvider>
    </SettingsProvider>
  );
}
