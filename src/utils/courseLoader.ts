import JSZip from 'jszip';
import type {
  AppBackupBundle,
  CustomSubjectPackage,
  CustomSubjectProgress,
} from '../types/courses';
import { MEDIA_EXT_RE, type AudioCandidateItem } from './audioMatcher';

export interface CatalogCourseEntry {
  id?: string;
  title: string;
  subtitle?: string;
  version?: string;
  category?: string;
  url: string;
}

export interface LocalLoadResult {
  courses: CustomSubjectPackage[];
  backupBundle?: AppBackupBundle;
  audioCandidates: AudioCandidateItem[];
  skippedFiles: number;
}

export function validateCoursePackage(data: unknown): data is CustomSubjectPackage {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Partial<CustomSubjectPackage>;
  if (!obj.id || typeof obj.id !== 'string') return false;
  if (!obj.title || typeof obj.title !== 'string') return false;
  if (!Array.isArray(obj.chapters) || obj.chapters.length === 0) return false;
  for (const ch of obj.chapters) {
    if (typeof ch.id !== 'number' || !ch.title || !Array.isArray(ch.lessons)) return false;
    for (const l of ch.lessons) {
      if (!l.id || !l.title || !Array.isArray(l.sections) || !Array.isArray(l.exercises)) {
        return false;
      }
    }
  }
  return true;
}

export function validateBackupBundle(data: unknown): data is AppBackupBundle {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Partial<AppBackupBundle>;
  return (
    obj.bundleType === 'amoozeshyar_backup' &&
    Array.isArray(obj.courses) &&
    typeof obj.progressMap === 'object' &&
    obj.progressMap !== null
  );
}

export function isMathCourse(pkg?: CustomSubjectPackage | null): boolean {
  if (!pkg) return false;
  if (typeof pkg.enableCalculator === 'boolean') return pkg.enableCalculator;
  if (pkg.category === 'math') return true;
  const lowerId = pkg.id.toLowerCase();
  return (
    lowerId.includes('math') ||
    lowerId.includes('riazi') ||
    pkg.title.includes('ریاضی') ||
    pkg.title.includes('حساب') ||
    pkg.title.includes('جبر') ||
    pkg.title.includes('هندسه')
  );
}

export function hasAudioSupport(pkg?: CustomSubjectPackage | null): boolean {
  if (!pkg) return false;
  if (typeof pkg.enableAudio === 'boolean') return pkg.enableAudio;
  if (pkg.category === 'english') return true;
  return pkg.chapters.some((c) =>
    c.lessons.some((l) => Array.isArray(l.audioTracks) && l.audioTracks.length > 0)
  );
}

function extractCoursesFromParsedJson(
  parsed: unknown,
  originMeta: { sourceUrl?: string; sourcePath?: string }
): { courses: CustomSubjectPackage[]; backupBundle?: AppBackupBundle } {
  if (validateBackupBundle(parsed)) {
    return {
      courses: parsed.courses.filter(validateCoursePackage),
      backupBundle: parsed,
    };
  }
  if (validateCoursePackage(parsed)) {
    return {
      courses: [{ ...parsed, ...originMeta }],
    };
  }
  if (Array.isArray(parsed)) {
    const valid = parsed
      .filter(validateCoursePackage)
      .map((c) => ({ ...c, ...originMeta }));
    return { courses: valid };
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { courses?: unknown }).courses)) {
    const valid = (parsed as { courses: unknown[] }).courses
      .filter(validateCoursePackage)
      .map((c) => ({ ...c, ...originMeta }));
    return { courses: valid };
  }
  return { courses: [] };
}

export async function parseCoursesFromLocalFiles(
  fileList: FileList | File[]
): Promise<LocalLoadResult> {
  const files = Array.from(fileList);
  const courses: CustomSubjectPackage[] = [];
  const audioCandidates: AudioCandidateItem[] = [];
  let backupBundle: AppBackupBundle | undefined;
  let skippedFiles = 0;

  for (const file of files) {
    const relPath =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

    if (/\.zip$/i.test(file.name)) {
      try {
        const zip = await JSZip.loadAsync(file);
        const entries = Object.values(zip.files);
        for (const entry of entries) {
          if (entry.dir) continue;
          const cleanName = entry.name.split('/').pop() || entry.name;
          if (/\.json$/i.test(cleanName)) {
            try {
              const text = await entry.async('string');
              const parsed = JSON.parse(text);
              const res = extractCoursesFromParsedJson(parsed, {
                sourcePath: `${file.name}/${entry.name}`,
              });
              courses.push(...res.courses);
              if (res.backupBundle) backupBundle = res.backupBundle;
            } catch {
              skippedFiles++;
            }
          } else if (MEDIA_EXT_RE.test(cleanName)) {
            const blob = await entry.async('blob');
            audioCandidates.push({
              fileName: cleanName,
              relativePath: entry.name,
              blob,
            });
          }
        }
      } catch {
        skippedFiles++;
      }
    } else if (/\.json$/i.test(file.name)) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const res = extractCoursesFromParsedJson(parsed, {
          sourcePath: relPath,
        });
        if (res.courses.length === 0 && !res.backupBundle) {
          skippedFiles++;
        }
        courses.push(...res.courses);
        if (res.backupBundle) backupBundle = res.backupBundle;
      } catch {
        skippedFiles++;
      }
    } else if (MEDIA_EXT_RE.test(file.name)) {
      audioCandidates.push({
        fileName: file.name,
        relativePath: relPath,
        blob: file,
      });
    }
  }

  return { courses, backupBundle, audioCandidates, skippedFiles };
}

export async function fetchCoursesFromUrl(targetUrl: string): Promise<{
  courses: CustomSubjectPackage[];
  audioCandidates: AudioCandidateItem[];
}> {
  const cleanUrl = targetUrl.trim();
  const res = await fetch(cleanUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (/\.zip(\?|$)/i.test(cleanUrl) || contentType.includes('zip')) {
    const buf = await res.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const courses: CustomSubjectPackage[] = [];
    const audioCandidates: AudioCandidateItem[] = [];

    for (const entry of Object.values(zip.files)) {
      if (entry.dir) continue;
      const cleanName = entry.name.split('/').pop() || entry.name;
      if (/\.json$/i.test(cleanName)) {
        try {
          const parsed = JSON.parse(await entry.async('string'));
          const ext = extractCoursesFromParsedJson(parsed, { sourceUrl: cleanUrl });
          courses.push(...ext.courses);
        } catch {
          // Ignore malformed non-course json inside zip
        }
      } else if (MEDIA_EXT_RE.test(cleanName)) {
        audioCandidates.push({
          fileName: cleanName,
          relativePath: entry.name,
          blob: await entry.async('blob'),
        });
      }
    }
    return { courses, audioCandidates };
  }

  const json = await res.json();
  const ext = extractCoursesFromParsedJson(json, { sourceUrl: cleanUrl });
  return { courses: ext.courses, audioCandidates: [] };
}

export async function fetchCatalogFromUrl(catalogUrl: string): Promise<CatalogCourseEntry[]> {
  const res = await fetch(catalogUrl.trim(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const rawList = Array.isArray(json) ? json : json?.courses;
  if (!Array.isArray(rawList)) {
    throw new Error('Invalid catalog format');
  }
  return rawList.filter(
    (c): c is CatalogCourseEntry =>
      Boolean(c && typeof c.title === 'string' && typeof c.url === 'string')
  );
}

/**
 * Updates an existing course in place (or adds a new one) while keeping its ID
 * when targetCourseId is passed so all saved progress stays linked and preserved.
 */
export function mergeCoursesPreservingMetadata(
  existing: CustomSubjectPackage[],
  incomingList: CustomSubjectPackage[],
  targetCourseId?: string
): {
  nextCourses: CustomSubjectPackage[];
  updatedIds: string[];
  addedIds: string[];
} {
  const next = [...existing];
  const updatedIds: string[] = [];
  const addedIds: string[] = [];
  const nowIso = new Date().toISOString();

  incomingList.forEach((rawPkg, idx) => {
    const resolvedId = targetCourseId && idx === 0 ? targetCourseId : rawPkg.id;
    const existIdx = next.findIndex((c) => c.id === resolvedId);
    if (existIdx >= 0) {
      const prev = next[existIdx];
      next[existIdx] = {
        ...rawPkg,
        id: resolvedId,
        sourceUrl: rawPkg.sourceUrl ?? prev.sourceUrl,
        sourcePath: rawPkg.sourcePath ?? prev.sourcePath,
        updatedAt: nowIso,
      };
      updatedIds.push(resolvedId);
    } else {
      next.push({
        ...rawPkg,
        id: resolvedId,
        updatedAt: nowIso,
      });
      addedIds.push(resolvedId);
    }
  });

  return { nextCourses: next, updatedIds, addedIds };
}

export function mergeProgressMapsPreserving(
  currentMap: Record<string, CustomSubjectProgress>,
  incomingMap?: Record<string, CustomSubjectProgress>
): Record<string, CustomSubjectProgress> {
  if (!incomingMap) return currentMap;
  const merged: Record<string, CustomSubjectProgress> = { ...currentMap };

  for (const [courseId, inc] of Object.entries(incomingMap)) {
    const cur = merged[courseId];
    if (!cur) {
      merged[courseId] = inc;
      continue;
    }

    const mergedLessonsStudied = { ...inc.lessonsStudied, ...cur.lessonsStudied };
    const mergedExercises: Record<string, Record<string, boolean>> = {
      ...inc.exerciseSolved,
    };
    for (const [lessonId, solvedObj] of Object.entries(cur.exerciseSolved || {})) {
      mergedExercises[lessonId] = {
        ...(mergedExercises[lessonId] || {}),
        ...solvedObj,
      };
    }

    const mergedQuizBest = { ...inc.quizBest };
    for (const [chKey, qb] of Object.entries(cur.quizBest || {})) {
      const chId = Number(chKey);
      const prevBest = mergedQuizBest[chId];
      if (!prevBest || qb.grade20 >= prevBest.grade20) {
        mergedQuizBest[chId] = qb;
      }
    }

    const historyKeys = new Set(
      (cur.quizHistory || []).map((h) => `${h.chapterId}:${h.timestamp}:${h.score}`)
    );
    const mergedHistory = [...(cur.quizHistory || [])];
    for (const h of inc.quizHistory || []) {
      const k = `${h.chapterId}:${h.timestamp}:${h.score}`;
      if (!historyKeys.has(k)) {
        mergedHistory.push(h);
      }
    }

    merged[courseId] = {
      lessonsStudied: mergedLessonsStudied,
      exerciseSolved: mergedExercises,
      quizBest: mergedQuizBest,
      quizHistory: mergedHistory.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100),
    };
  }

  return merged;
}

export const COURSE_TEMPLATE_PACKAGE: CustomSubjectPackage = {
  schemaVersion: 2,
  id: 'science_grade8',
  title: 'علوم تجربی پایه هشتم',
  subtitle: 'بسته نمونه ساختار استاندارد دروس برای آموزش یار',
  category: 'science',
  enableCalculator: false,
  enableAudio: false,
  dir: 'rtl',
  version: '1.0.0',
  chapters: [
    {
      id: 1,
      short: 'Chapter 1',
      title: 'فصل ۱: مخلوط‌ها و جداسازی مواد',
      lessons: [
        {
          id: '1A',
          title: 'درس ۱: مخلوط همگن و ناهمگن',
          summary: 'آشنایی با تفاوت محلول‌ها و سوسپانسیون‌ها در زندگی روزمره',
          sections: [
            {
              heading: 'مخلوط چیست؟',
              body: 'هرگاه دو یا چند ماده بدون تغییر شیمیایی با هم ترکیب شوند، مخلوط تشکیل می‌شود.',
              bullets: [
                'مخلوط همگن (محلول): اجزا به‌طور یکنواخت پخش شده‌اند (مانند آب‌نمک).',
                'مخلوط ناهمگن: اجزا به‌طور یکنواخت پخش نشده‌اند (مانند آب و روغن).',
              ],
              example: 'چای صاف‌شده یک مخلوط همگن است، اما شربت خاکشیر یک مخلوط ناهمگن است.',
            },
          ],
          exercises: [
            {
              id: 'sci-1a-1',
              type: 'mcq',
              prompt: 'کدام‌یک نمونه مخلوط همگن (محلول) است؟',
              options: ['آب و ماسه', 'شکر حل‌شده در آب', 'آجیل', 'آب و روغن'],
              acceptedAnswers: ['شکر حل‌شده در آب'],
              ansIndex: 1,
              hint: 'مخلوطی که ظاهر کاملاً یکنواخت دارد.',
              explain: 'شکر در آب حل شده و محلول یکنواخت (همگن) می‌سازد.',
            },
            {
              id: 'sci-1a-2',
              type: 'fill',
              prompt: 'در مخلوط آب و نمک، به نمک چه می‌گویند؟',
              acceptedAnswers: ['حل‌شونده', 'حل شونده'],
              hint: 'ماده‌ای که در حلال حل می‌شود.',
              explain: 'آب حلال است و نمک حل‌شونده.',
            },
          ],
        },
      ],
      quiz: [
        {
          q: 'برای جداسازی آب و روغن که با هم مخلوط نمی‌شوند از چه وسیله‌ای استفاده می‌کنیم؟',
          opts: ['قیف جداکننده (دکانتور)', 'کاغذ صافی', 'آهن‌ربا', 'تقطیر'],
          ans: 0,
          explain: 'برای جداسازی دو مایع مخلوط‌نشدنی با چگالی متفاوت از قیف جداکننده استفاده می‌شود.',
        },
      ],
    },
  ],
};
