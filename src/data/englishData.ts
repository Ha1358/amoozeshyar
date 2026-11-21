import type { EnglishFileUnit, EnglishQuizQuestion } from '../types/courses';
import { englishFiles1to6 } from './englishFiles1to6';
import { englishFiles7to12 } from './englishFiles7to12';

export const ENGLISH_FILES: EnglishFileUnit[] = [
  ...englishFiles1to6,
  ...englishFiles7to12,
];

export interface EnglishCompQuestion extends EnglishQuizQuestion {
  fileId: number;
  fileShort: string;
}

export function generateEnglishComprehensiveExam(): EnglishCompQuestion[] {
  const picked: EnglishCompQuestion[] = [];
  for (const f of ENGLISH_FILES) {
    const shuffled = [...f.quiz].sort(() => Math.random() - 0.5).slice(0, 2);
    for (const q of shuffled) {
      picked.push({
        ...q,
        fileId: f.id,
        fileShort: f.short,
      });
    }
  }
  return picked;
}
