import { Sheet } from '../components/Sheet';
import { MODELS, type AiFeature, type ModelId, type ThemeChoice } from '../lib/types';
import { useSettings } from '../state/settings';

const FEATURES: Array<{ key: AiFeature; label: string; help: string }> = [
  { key: 'search', label: 'Search', help: 'Finds the verses that answer your question.' },
  { key: 'align', label: 'Word alignment', help: 'Matches each English word to its original word.' },
  { key: 'etymology', label: 'Etymology', help: 'Traces English word origins.' },
];

const THEMES: ThemeChoice[] = ['light', 'dark', 'system'];
const sectionLabel = 'mb-3 text-xs font-semibold uppercase tracking-wide text-muted';

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { models, setModel, theme, setTheme, recents, clearRecents } = useSettings();

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="space-y-7">
        <section>
          <h3 className={sectionLabel}>AI model per feature</h3>
          <div className="space-y-4">
            {FEATURES.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium">{f.label}</div>
                  <div className="text-sm text-muted">{f.help}</div>
                </div>
                <select
                  value={models[f.key]}
                  onChange={(e) => setModel(f.key, e.target.value as ModelId)}
                  aria-label={`${f.label} model`}
                  className="shrink-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className={sectionLabel}>Appearance</h3>
          <div className="inline-flex rounded-full border border-border bg-surface-2 p-0.5 text-sm">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-full px-4 py-1.5 capitalize transition-colors ${
                  theme === t ? 'bg-surface text-text shadow-sm' : 'text-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {recents.length ? (
          <section>
            <h3 className={sectionLabel}>Recent searches</h3>
            <button
              onClick={clearRecents}
              className="rounded-xl border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-text"
            >
              Clear {recents.length} recent {recents.length === 1 ? 'search' : 'searches'}
            </button>
          </section>
        ) : null}
      </div>
    </Sheet>
  );
}
