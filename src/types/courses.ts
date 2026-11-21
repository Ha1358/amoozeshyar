export type ActiveSubjectId = string | null;

export interface AudioTrackRef {
  book?: 'sb' | 'wb' | 'video';
  file: number; // e.g., 1..12
  track: number; // e.g., 2 in 1.2 (or 0 for standalone video)
  label: string; // e.g., "SB 1.2", "WB 1.1", "Video Ep 1"
  title: string;
  mediaType?: 'audio' | 'video';
  fileName?: string; // exact expected filename e.g. "AEF3e_Level_1_SB_1.02.mp3" or "AEF3e_SB1_PE_Ep1_Checking_in.mp4"
  script?: string;
  url?: string; // optional online MP3/MP4 stream URL
}

export interface VocabItem {
  word: string;
  ipa?: string;
  meaningFa: string;
  example: string;
}

export interface GrammarPoint {
  title: string;
  ruleFa: string;
  formulaEn: string;
  examples: { en: string; fa: string }[];
  warningFa?: string;
}

export interface EnglishExercise {
  id: string;
  source: 'SB' | 'WB';
  type: 'fill' | 'mcq';
  prompt: string;
  promptFa?: string;
  options?: string[];
  acceptedAnswers: string[];
  ansIndex?: number;
  hint: string;
  explain: string;
}

export interface EnglishLesson {
  id: string;
  fileId: number;
  letter: 'A' | 'B' | 'C';
  title: string;
  titleFa: string;
  grammarTitle: string;
  vocabTitle: string;
  pronunciationTitle: string;
  grammarPoints: GrammarPoint[];
  vocabulary: VocabItem[];
  pronunciationNotes: string[];
  dialogueOrReading?: {
    title: string;
    lines: { speaker?: string; en: string; fa?: string }[];
  };
  practicalOrReview?: {
    title: string;
    items: { en: string; fa: string }[];
  };
  audioTracks: AudioTrackRef[];
  exercises: EnglishExercise[];
}

export interface EnglishQuizQuestion {
  q: string;
  qFa?: string;
  opts: string[];
  ans: number;
  explain: string;
  lessonRef?: string;
}

export interface EnglishFileUnit {
  id: number;
  short: string;
  title: string;
  titleFa: string;
  summaryFa: string;
  lessons: [EnglishLesson, EnglishLesson, EnglishLesson];
  quiz: EnglishQuizQuestion[];
}

export interface EnglishProgressState {
  unlockMode: 'progressive' | 'free';
  lessonsStudied: Record<string, boolean>;
  lessonPracticeSolved: Record<string, Record<string, boolean>>;
  fileQuizBest: Record<number, { score: number; total: number; grade20: number }>;
  fileQuizHistory: {
    fileId: number;
    score: number;
    total: number;
    grade20: number;
    timestamp: number;
  }[];
  speedBest: Record<
    number,
    { bestPoints: number; bestCorrect: number; total: number; bestTimeLeft: number }
  >;
  compBest: number | null;
  compHistory: { score: number; total: number; grade20: number; timestamp: number }[];
  bonusPoints: number;
}

export interface CustomExerciseVariant {
  prompt: string;
  options?: string[];
  acceptedAnswers: string[];
  ansIndex?: number;
  hint?: string;
  explain: string;
  solutionSteps?: string[];
}

export interface CustomExerciseItem {
  id: string;
  type: 'fill' | 'mcq';
  prompt: string;
  options?: string[];
  acceptedAnswers: string[];
  ansIndex?: number;
  hint?: string;
  explain: string;
  solutionSteps?: string[];
  variants?: CustomExerciseVariant[];
}

export interface CustomLessonSection {
  heading: string;
  body: string;
  bullets?: string[];
  example?: string;
  solutionSteps?: string[];
  note?: string;
}

export interface CustomLessonItem {
  id: string;
  title: string;
  summary: string;
  prerequisite?: string;
  sections: CustomLessonSection[];
  vocab?: VocabItem[];
  dialogue?: {
    title: string;
    lines: { speaker?: string; en: string; fa?: string }[];
  };
  audioTracks?: AudioTrackRef[];
  exercises: CustomExerciseItem[];
}

export interface CustomQuizItem {
  q: string;
  opts: string[];
  ans: number;
  explain: string;
  solutionSteps?: string[];
  lessonRef?: string;
}

export interface CustomChapterItem {
  id: number;
  short: string;
  title: string;
  lessons: CustomLessonItem[];
  quiz: CustomQuizItem[];
}

export type CourseCategory = 'math' | 'english' | 'science' | 'general';

export interface CustomSubjectPackage {
  schemaVersion?: number;
  id: string;
  title: string;
  subtitle: string;
  category?: CourseCategory;
  enableCalculator?: boolean;
  enableAudio?: boolean;
  dir?: 'rtl' | 'ltr';
  version?: string;
  updatedAt?: string;
  sourceUrl?: string;
  sourcePath?: string;
  formulas?: { title: string; items: string[] }[];
  chapters: CustomChapterItem[];
}

export interface CustomSubjectProgress {
  lessonsStudied: Record<string, boolean>;
  exerciseSolved: Record<string, Record<string, boolean>>;
  quizBest: Record<number, { score: number; total: number; grade20: number }>;
  quizHistory: {
    chapterId: number;
    score: number;
    total: number;
    grade20: number;
    timestamp: number;
  }[];
}

export type EducationLevelId =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'university'
  | 'other';

export interface UserProfile {
  fullName: string;
  mobile: string;
  educationLevel: EducationLevelId | '';
  grade: string;
  updatedAt?: number;
}

export interface AppBackupBundle {
  bundleType: 'amoozeshyar_backup';
  schemaVersion: number;
  appVersion: string;
  exportedAt: number;
  userProfile?: UserProfile;
  courses: CustomSubjectPackage[];
  progressMap: Record<string, CustomSubjectProgress>;
  notes?: string;
  catalogUrl?: string;
  updateServerUrl?: string;
}
