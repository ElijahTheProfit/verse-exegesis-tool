import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type {
  AlignResponse,
  EtymologyResponse,
  InterlinearResponse,
  LexEntry,
  VerseRef,
} from '../lib/types';
import { useSettings } from './settings';

export interface WordTarget {
  ref: VerseRef;
  words: string[];
  wordIndex: number;
  wordText: string;
}

interface StudyState {
  wordTarget: WordTarget | null;
  etymWord: string | null;
  openWord: (t: WordTarget) => void;
  closeWord: () => void;
  openEtymology: (word: string) => void;
  closeEtymology: () => void;
  getInterlinear: (ref: VerseRef) => Promise<InterlinearResponse>;
  ensureAlignment: (ref: VerseRef, words: string[]) => Promise<AlignResponse>;
  getLexicon: (strongs: string) => Promise<LexEntry>;
  getEtymology: (word: string) => Promise<EtymologyResponse>;
}

const refKey = (r: VerseRef) => `${r.book} ${r.chapter}:${r.verse}`;

const StudyContext = createContext<StudyState | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { models } = useSettings();
  const [wordTarget, setWordTarget] = useState<WordTarget | null>(null);
  const [etymWord, setEtymWord] = useState<string | null>(null);

  const interCache = useRef(new Map<string, InterlinearResponse>());
  const alignCache = useRef(new Map<string, AlignResponse>());
  const lexCache = useRef(new Map<string, LexEntry>());
  const etymCache = useRef(new Map<string, EtymologyResponse>());

  const getInterlinear = useCallback(async (ref: VerseRef) => {
    const key = refKey(ref);
    const cached = interCache.current.get(key);
    if (cached) return cached;
    const result = await api.interlinear(ref);
    interCache.current.set(key, result);
    return result;
  }, []);

  const ensureAlignment = useCallback(
    async (ref: VerseRef, words: string[]) => {
      const key = refKey(ref);
      const cached = alignCache.current.get(key);
      if (cached) return cached;
      const result = await api.align(ref, words, models.align);
      alignCache.current.set(key, result);
      return result;
    },
    [models.align],
  );

  const getLexicon = useCallback(async (strongs: string) => {
    const cached = lexCache.current.get(strongs);
    if (cached) return cached;
    const entry = await api.lexicon(strongs);
    lexCache.current.set(strongs, entry);
    return entry;
  }, []);

  const getEtymology = useCallback(
    async (word: string) => {
      const key = word.toLowerCase();
      const cached = etymCache.current.get(key);
      if (cached) return cached;
      const entry = await api.etymology(word, models.etymology);
      etymCache.current.set(key, entry);
      return entry;
    },
    [models.etymology],
  );

  const value = useMemo<StudyState>(
    () => ({
      wordTarget,
      etymWord,
      openWord: setWordTarget,
      closeWord: () => setWordTarget(null),
      openEtymology: setEtymWord,
      closeEtymology: () => setEtymWord(null),
      getInterlinear,
      ensureAlignment,
      getLexicon,
      getEtymology,
    }),
    [wordTarget, etymWord, getInterlinear, ensureAlignment, getLexicon, getEtymology],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyState {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}
