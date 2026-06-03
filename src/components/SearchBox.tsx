import { useState, type FormEvent } from 'react';
import { IconSearch, IconSpinner } from './icons';

interface Props {
  onSubmit: (q: string) => void;
  loading: boolean;
  value: string;
  onChange: (v: string) => void;
}

export function SearchBox({ onSubmit, loading, value, onChange }: Props) {
  const [focused, setFocused] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q && !loading) onSubmit(q);
  };

  return (
    <form onSubmit={submit} className="relative">
      <IconSearch
        size={19}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        enterKeyHint="search"
        placeholder="Ask anything…"
        aria-label="Ask a question or enter a phrase"
        className={`w-full rounded-2xl border bg-surface py-3.5 pl-11 pr-[5.5rem] text-base shadow-sm outline-none transition-all placeholder:text-muted/70 ${
          focused ? 'border-accent ring-4 ring-accent-soft' : 'border-border'
        }`}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-accent-contrast transition-opacity disabled:opacity-40"
      >
        {loading ? <IconSpinner size={16} /> : 'Search'}
      </button>
    </form>
  );
}
