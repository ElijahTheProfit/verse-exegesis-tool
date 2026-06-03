import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AiFeature, ModelId, ThemeChoice } from '../lib/types';

interface SettingsState {
  models: Record<AiFeature, ModelId>;
  theme: ThemeChoice;
  recents: string[];
  setModel: (feature: AiFeature, model: ModelId) => void;
  setTheme: (theme: ThemeChoice) => void;
  addRecent: (q: string) => void;
  clearRecents: () => void;
}

const DEFAULT_MODELS: Record<AiFeature, ModelId> = {
  search: 'gpt-5.5',
  align: 'gpt-5.4-mini',
  etymology: 'gpt-5.4-mini',
};

const KEYS = { models: 'vet:models', theme: 'vet:theme', recents: 'vet:recents' };
const MAX_RECENTS = 12;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<Record<AiFeature, ModelId>>(() =>
    load(KEYS.models, DEFAULT_MODELS),
  );
  const [theme, setThemeState] = useState<ThemeChoice>(() => {
    try {
      return (localStorage.getItem(KEYS.theme) as ThemeChoice) || 'system';
    } catch {
      return 'system';
    }
  });
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.recents) || '[]');
    } catch {
      return [];
    }
  });

  // Apply theme to <html> and react to system changes when on "system".
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    if (theme === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  const setModel = useCallback((feature: AiFeature, model: ModelId) => {
    setModels((prev) => {
      const next = { ...prev, [feature]: model };
      try {
        localStorage.setItem(KEYS.models, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t);
    try {
      localStorage.setItem(KEYS.theme, t);
    } catch {
      /* ignore */
    }
  }, []);

  const addRecent = useCallback((q: string) => {
    const query = q.trim();
    if (!query) return;
    setRecents((prev) => {
      const next = [query, ...prev.filter((r) => r !== query)].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(KEYS.recents, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    try {
      localStorage.removeItem(KEYS.recents);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{ models, theme, recents, setModel, setTheme, addRecent, clearRecents }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
