import type { ReactNode } from 'react';

export type ChapterId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type AppMode = 'learn' | 'practice' | 'quiz';
export type ThemeMode = 'light' | 'dark';
export type UnlockMode = 'progressive' | 'free';

export interface ChapterMeta {
  id: ChapterId;
  short: string;
  title: string;
  subtitle: string;
  toc: { id: string; label: string }[];
}

export interface PracticeQuestion {
  q: ReactNode;
  type: 'int' | 'frac';
  ans?: string;
  num?: string;
  den?: string;
  hint: ReactNode;
  explain: ReactNode;
}

export interface QuizQuestion {
  q: ReactNode;
  opts: ReactNode[];
  ans: number;
  explain: ReactNode;
}

export interface PracticeSessionState {
  round: number;
  activeIndices: number[];
  attempts: Record<number, number>;
  solved: Record<number, boolean>;
  revealed: Record<number, boolean>;
}

export interface QuizBestRecord {
  score: number;
  total: number;
  grade20: number;
}

export interface QuizHistoryEntry {
  chapter: ChapterId;
  score: number;
  total: number;
  grade20: number;
  timestamp: number;
}

export interface CompHistoryEntry {
  score: number;
  total: number;
  grade20: number;
  timestamp: number;
}

export interface SpeedChallengeRecord {
  bestPoints: number;
  bestCorrect: number;
  total: number;
  bestTimeLeft: number;
  runsCompleted: number;
}

export interface AppProgress {
  theme: ThemeMode;
  unlockMode: UnlockMode;
  practice: Record<number, PracticeSessionState>;
  practiceSeeds: Record<number, number>;
  quizSeeds: Record<number, number>;
  quizBest: Record<number, QuizBestRecord>;
  quizHistory: QuizHistoryEntry[];
  speedChallengeBest: Record<number, SpeedChallengeRecord>;
  lessonsCompleted: Record<number, boolean>;
  bonusPoints: number;
  compBest: number | null;
  compHistory: CompHistoryEntry[];
  notes: string;
}
