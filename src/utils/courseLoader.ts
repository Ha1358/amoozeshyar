import JSZip from 'jszip';
import type {
  AppBackupBundle,
  CustomSubjectPackage,
  CustomSubjectProgress,
  EducationLevelId,
  UserProfile,
} from '../types/courses';
import { MEDIA_EXT_RE, type AudioCandidateItem } from './audioMatcher';

export interface CatalogCourseEntry {
  id?: string;
  title: string;
  subtitle?: string;
  version?: string;
  category?: string;
  url: string;
  localPath?: string;
  educationLevels?: EducationLevelId[];
  grades?: string[];
  branches?: string[];
  fields?: string[];
  isExtracurricular?: boolean;
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

export async function fetchCoursesFromUrl(
  targetUrl: string,
  timeoutMs = 10000
): Promise<{
  courses: CustomSubjectPackage[];
  audioCandidates: AudioCandidateItem[];
}> {
  const cleanUrl = targetUrl.trim();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer =
    controller && timeoutMs > 0 ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  let res: Response;
  try {
    res = await fetch(cleanUrl, {
      cache: 'no-store',
      signal: controller?.signal,
    });
  } finally {
    if (timer !== null) window.clearTimeout(timer);
  }
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
  const cleanUrl = catalogUrl.trim();
  const isRemoteHttp = /^https?:\/\//i.test(cleanUrl);
  const fetchTarget = isRemoteHttp
    ? cleanUrl.includes('?')
      ? `${cleanUrl}&t=${Date.now()}`
      : `${cleanUrl}?t=${Date.now()}`
    : cleanUrl;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), 8000) : null;
  try {
    const res = await fetch(fetchTarget, {
      cache: 'no-store',
      signal: controller?.signal,
    });
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
  } finally {
    if (timer !== null) window.clearTimeout(timer);
  }
}

export const DEFAULT_GITHUB_CATALOG_URL = 'https://ha1358.github.io/amoozeshyar/catalog.json';

export const ALL_EDUCATION_LEVELS: EducationLevelId[] = [
  'elementary',
  'middle',
  'high',
  'university',
  'other',
];

export const BUILTIN_COURSE_CATALOG: CatalogCourseEntry[] = [
  {
    id: 'math_grade8_complete',
    title: 'ریاضی پایه هشتم (کامل)',
    subtitle: '۹ فصل کامل همراه با درسنامه رنگی، آزمایشگاه تعاملی، فرمول‌ها، تمرین و آزمون',
    version: '2.3.6',
    category: 'math',
    isExtracurricular: false,
    educationLevels: ['middle'],
    grades: ['پایه هشتم'],
    localPath: 'courses/math8.json',
    url: 'https://ha1358.github.io/amoozeshyar/courses/math8.json',
  },
  {
    id: 'math_grade10_riazi1',
    title: 'ریاضی ۱ — پایه دهم (نظری)',
    subtitle: 'رشته‌های ریاضی و فیزیک و علوم تجربی · ۷ فصل کامل (۲۳ درس) همراه با درسنامه جامع، فرمول‌ها، تمرین‌های چندسری و آزمون فصل',
    version: '1.0.0',
    category: 'math',
    isExtracurricular: false,
    educationLevels: ['high'],
    grades: ['پایه دهم'],
    branches: ['نظری'],
    fields: ['ریاضی و فیزیک', 'علوم تجربی'],
    localPath: 'courses/math10.json',
    url: 'https://ha1358.github.io/amoozeshyar/courses/math10.json',
  },
  {
    id: 'physics_grade10_riazi1',
    title: 'فیزیک ۱ — پایه دهم (ریاضی و فیزیک)',
    subtitle: 'رشته ریاضی و فیزیک (کد ۱۱۰۲۰۹) · ۵ فصل کامل (۳۲ درس) همراه با درسنامه جامع، فرمول‌ها، تمرین‌های چندسری و آزمون فصل',
    version: '1.0.0',
    category: 'science',
    isExtracurricular: false,
    educationLevels: ['high'],
    grades: ['پایه دهم'],
    branches: ['نظری'],
    fields: ['ریاضی و فیزیک'],
    localPath: 'courses/physics10.json',
    url: 'https://ha1358.github.io/amoozeshyar/courses/physics10.json',
  },
  {
    id: 'aef1-v3',
    title: 'زبان انگلیسی (American English File 1)',
    subtitle: 'درس فوق‌برنامه (قابل استفاده در تمام مقاطع) · ۱۲ فصل، ۴۸ درس، ۷۲۰ تمرین تعاملی و آزمون‌ها',
    version: '3.0.1',
    category: 'english',
    isExtracurricular: true,
    educationLevels: ALL_EDUCATION_LEVELS,
    grades: ['*'],
    localPath: 'courses/aef1-v3.json',
    url: 'https://ha1358.github.io/amoozeshyar/courses/aef1-v3.json',
  },
];

function isAefCourseId(id?: string): boolean {
  if (!id) return false;
  const clean = id.trim().toLowerCase();
  return clean === 'aef1-v3' || clean === 'english_aef1_v3' || clean.startsWith('aef');
}

export function findBuiltinCatalogEntry(
  pkg?: Partial<Pick<CustomSubjectPackage, 'id' | 'title' | 'category'>> | null
): CatalogCourseEntry | undefined {
  if (!pkg) return undefined;
  const exact = BUILTIN_COURSE_CATALOG.find((c) => c.id === pkg.id);
  if (exact) return exact;
  if (
    isAefCourseId(pkg.id) ||
    (pkg.category === 'english' && pkg.title?.includes('American English File'))
  ) {
    return BUILTIN_COURSE_CATALOG.find((c) => c.id === 'aef1-v3');
  }
  return undefined;
}

export function isCatalogEntryExtracurricular(
  entry?: Pick<CatalogCourseEntry, 'id' | 'title' | 'category' | 'isExtracurricular' | 'grades' | 'educationLevels'> | null
): boolean {
  if (!entry) return false;
  if (typeof entry.isExtracurricular === 'boolean') return entry.isExtracurricular;
  if (isAefCourseId(entry.id) || entry.title?.includes('American English File')) return true;
  if (Array.isArray(entry.grades) && entry.grades.includes('*')) return true;
  if (Array.isArray(entry.educationLevels) && entry.educationLevels.length >= ALL_EDUCATION_LEVELS.length) {
    return true;
  }
  return false;
}

export function isExtracurricularCourse(
  pkg?: Pick<CustomSubjectPackage, 'id' | 'title' | 'category' | 'isExtracurricular' | 'educationLevels' | 'grades'> | null
): boolean {
  if (!pkg) return false;
  if (typeof pkg.isExtracurricular === 'boolean') return pkg.isExtracurricular;
  const builtinMatch = findBuiltinCatalogEntry(pkg);
  if (builtinMatch?.isExtracurricular) return true;
  if (Array.isArray(pkg.grades) && pkg.grades.includes('*')) return true;
  if (Array.isArray(pkg.educationLevels) && pkg.educationLevels.length >= ALL_EDUCATION_LEVELS.length) {
    return true;
  }
  return false;
}

export function attachCourseProfileTags(
  pkg: CustomSubjectPackage,
  profile?: Pick<UserProfile, 'educationLevel' | 'grade' | 'branch' | 'field'>,
  catalogEntry?: Pick<CatalogCourseEntry, 'educationLevels' | 'grades' | 'branches' | 'fields' | 'isExtracurricular'>
): CustomSubjectPackage {
  const builtinMatch = findBuiltinCatalogEntry(pkg);
  const extracurricular =
    Boolean(pkg.isExtracurricular) ||
    Boolean(catalogEntry?.isExtracurricular) ||
    Boolean(builtinMatch?.isExtracurricular) ||
    isExtracurricularCourse(pkg);

  if (extracurricular) {
    return {
      ...pkg,
      isExtracurricular: true,
      educationLevels: [...ALL_EDUCATION_LEVELS],
      grades: ['*'],
    };
  }

  const resolvedLevels =
    pkg.educationLevels && pkg.educationLevels.length > 0
      ? pkg.educationLevels
      : catalogEntry?.educationLevels && catalogEntry.educationLevels.length > 0
      ? catalogEntry.educationLevels
      : builtinMatch?.educationLevels && builtinMatch.educationLevels.length > 0
      ? builtinMatch.educationLevels
      : profile?.educationLevel
      ? [profile.educationLevel]
      : undefined;

  const resolvedGrades =
    pkg.grades && pkg.grades.length > 0
      ? pkg.grades
      : catalogEntry?.grades && catalogEntry.grades.length > 0
      ? catalogEntry.grades
      : builtinMatch?.grades && builtinMatch.grades.length > 0
      ? builtinMatch.grades
      : profile?.grade?.trim()
      ? [profile.grade.trim()]
      : undefined;

  const resolvedBranches =
    pkg.branches && pkg.branches.length > 0
      ? pkg.branches
      : catalogEntry?.branches && catalogEntry.branches.length > 0
      ? catalogEntry.branches
      : builtinMatch?.branches && builtinMatch.branches.length > 0
      ? builtinMatch.branches
      : profile?.educationLevel === 'high' && profile?.branch?.trim()
      ? [profile.branch.trim()]
      : undefined;

  const resolvedFields =
    pkg.fields && pkg.fields.length > 0
      ? pkg.fields
      : catalogEntry?.fields && catalogEntry.fields.length > 0
      ? catalogEntry.fields
      : builtinMatch?.fields && builtinMatch.fields.length > 0
      ? builtinMatch.fields
      : profile?.educationLevel === 'high' && profile?.field?.trim()
      ? [profile.field.trim()]
      : undefined;

  return {
    ...pkg,
    ...(typeof pkg.isExtracurricular === 'boolean' ? { isExtracurricular: pkg.isExtracurricular } : {}),
    ...(resolvedLevels ? { educationLevels: resolvedLevels } : {}),
    ...(resolvedGrades ? { grades: resolvedGrades } : {}),
    ...(resolvedBranches ? { branches: resolvedBranches } : {}),
    ...(resolvedFields ? { fields: resolvedFields } : {}),
  };
}

function normalizeMatchText(s: string): string {
  return s
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[–—−]/g, '-')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFieldText(s: string): string {
  return normalizeMatchText(s).replace(/\s+و\s+/g, ' ');
}

function branchAndFieldMatch(
  branches: string[] | undefined,
  fields: string[] | undefined,
  profile: Pick<UserProfile, 'educationLevel' | 'branch' | 'field'>
): boolean {
  if (profile.educationLevel !== 'high') return true;

  if (branches && branches.length > 0 && profile.branch?.trim()) {
    const normProfileBranch = normalizeMatchText(profile.branch);
    const branchOk = branches.some((b) => {
      const nb = normalizeMatchText(b);
      return nb === '*' || nb === normProfileBranch;
    });
    if (!branchOk) return false;
  }

  if (fields && fields.length > 0 && profile.field?.trim()) {
    const normProfileField = normalizeFieldText(profile.field);
    const fieldOk = fields.some((f) => {
      const nf = normalizeFieldText(f);
      return nf === '*' || nf === normProfileField;
    });
    if (!fieldOk) return false;
  }

  return true;
}

export function courseMatchesProfile(
  pkg: CustomSubjectPackage,
  profile: Pick<UserProfile, 'educationLevel' | 'grade' | 'branch' | 'field'>
): boolean {
  if (!profile.educationLevel || !profile.grade.trim()) return true;
  if (isExtracurricularCourse(pkg)) return true;

  const builtinMatch = findBuiltinCatalogEntry(pkg);
  const levels =
    pkg.educationLevels && pkg.educationLevels.length > 0
      ? pkg.educationLevels
      : builtinMatch?.educationLevels;
  const grades =
    pkg.grades && pkg.grades.length > 0 ? pkg.grades : builtinMatch?.grades;
  const branches =
    pkg.branches && pkg.branches.length > 0 ? pkg.branches : builtinMatch?.branches;
  const fields =
    pkg.fields && pkg.fields.length > 0 ? pkg.fields : builtinMatch?.fields;

  if (!levels || levels.length === 0) return false;
  if (!levels.includes(profile.educationLevel as EducationLevelId)) return false;
  if (grades && grades.length > 0) {
    const normProfileGrade = normalizeMatchText(profile.grade);
    const gradeOk = grades.some((g) => {
      const ng = normalizeMatchText(g);
      return ng === '*' || ng === normProfileGrade;
    });
    if (!gradeOk) return false;
  }

  return branchAndFieldMatch(branches, fields, profile);
}

export function matchCatalogEntriesForProfile(
  entries: CatalogCourseEntry[],
  profile: Pick<UserProfile, 'educationLevel' | 'grade' | 'branch' | 'field'>,
  options?: { includeCurricular?: boolean; includeExtracurricular?: boolean }
): CatalogCourseEntry[] {
  if (!profile.educationLevel || !profile.grade.trim()) return [];
  const includeCurricular = options?.includeCurricular !== false;
  const includeExtracurricular = options?.includeExtracurricular !== false;
  const normGrade = normalizeMatchText(profile.grade);

  return entries.filter((entry) => {
    const extra = isCatalogEntryExtracurricular(entry);
    if (extra) {
      return includeExtracurricular;
    }
    if (!includeCurricular) {
      return false;
    }
    if (!Array.isArray(entry.educationLevels) || entry.educationLevels.length === 0) {
      return false;
    }
    if (!entry.educationLevels.includes(profile.educationLevel as EducationLevelId)) {
      return false;
    }
    if (Array.isArray(entry.grades) && entry.grades.length > 0) {
      const gradeOk = entry.grades.some((g) => {
        const ng = normalizeMatchText(g);
        return ng === '*' || ng === normGrade;
      });
      if (!gradeOk) return false;
    }
    return branchAndFieldMatch(entry.branches, entry.fields, profile);
  });
}

function compareCatalogVersions(a?: string, b?: string): number {
  const pa = (a || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = (b || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

export function mergeCatalogEntries(
  primary: CatalogCourseEntry[],
  fallback: CatalogCourseEntry[] = BUILTIN_COURSE_CATALOG
): CatalogCourseEntry[] {
  const merged: CatalogCourseEntry[] = [...fallback];
  for (const incoming of primary) {
    const idx = merged.findIndex(
      (b) => (incoming.id && b.id === incoming.id) || b.url.trim() === incoming.url.trim()
    );
    if (idx === -1) {
      merged.push(incoming);
    } else {
      const base = merged[idx];
      const useIncoming = compareCatalogVersions(incoming.version, base.version) >= 0;
      merged[idx] = useIncoming
        ? {
            ...base,
            ...incoming,
            localPath: incoming.localPath || base.localPath,
          }
        : {
            ...incoming,
            ...base,
            url: base.url || incoming.url,
            localPath: base.localPath || incoming.localPath,
          };
    }
  }
  return merged;
}

export async function loadAvailableCourseCatalog(preferredUrl?: string): Promise<CatalogCourseEntry[]> {
  const isFileProto = typeof window !== 'undefined' && window.location.protocol === 'file:';
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  const targetRemote = (preferredUrl || DEFAULT_GITHUB_CATALOG_URL).trim();

  let baseCatalog: CatalogCourseEntry[] = BUILTIN_COURSE_CATALOG;

  if (!isFileProto) {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const localCatalogUrl = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}catalog.json`;
      const localEntries = await fetchCatalogFromUrl(localCatalogUrl);
      if (localEntries.length > 0) {
        baseCatalog = mergeCatalogEntries(localEntries, BUILTIN_COURSE_CATALOG);
      }
    } catch {
      // Keep built-in catalog as base
    }
  }

  if (isOnline && targetRemote) {
    try {
      const remoteEntries = await fetchCatalogFromUrl(targetRemote);
      if (remoteEntries.length > 0) {
        return mergeCatalogEntries(remoteEntries, baseCatalog);
      }
    } catch {
      // Fallback to merged local/built-in catalog
    }
  }

  return baseCatalog;
}

export async function autoLoadCoursesForProfile(
  profile: UserProfile,
  existingCourses: CustomSubjectPackage[],
  options?: {
    catalogUrl?: string;
    includeCurricular?: boolean;
    includeExtracurricular?: boolean;
  }
): Promise<{
  matchedEntries: CatalogCourseEntry[];
  loadedCourses: CustomSubjectPackage[];
  audioCandidates: AudioCandidateItem[];
  alreadyInstalledTitles: string[];
  failedTitles: string[];
}> {
  const catalog = await loadAvailableCourseCatalog(options?.catalogUrl);
  const matchedEntries = matchCatalogEntriesForProfile(catalog, profile, {
    includeCurricular: options?.includeCurricular,
    includeExtracurricular: options?.includeExtracurricular,
  });

  if (matchedEntries.length === 0) {
    return {
      matchedEntries: [],
      loadedCourses: [],
      audioCandidates: [],
      alreadyInstalledTitles: [],
      failedTitles: [],
    };
  }

  const isFileProto = typeof window !== 'undefined' && window.location.protocol === 'file:';
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  const loadedCourses: CustomSubjectPackage[] = [];
  const audioCandidates: AudioCandidateItem[] = [];
  const alreadyInstalledTitles: string[] = [];
  const failedTitles: string[] = [];

  for (const entry of matchedEntries) {
    const existing = existingCourses.find(
      (c) => c.id === entry.id || (isAefCourseId(entry.id) && isAefCourseId(c.id))
    );
    if (existing && (!entry.version || existing.version === entry.version)) {
      alreadyInstalledTitles.push(existing.title || entry.title);
      continue;
    }

    let fetched = false;
    const candidateUrls: string[] = [];
    if (!isFileProto && entry.localPath) {
      const localUrl = `${normalizedBase}${entry.localPath.replace(/^\/+/, '')}`;
      if (isOnline && entry.url) {
        candidateUrls.push(entry.url, localUrl);
      } else {
        candidateUrls.push(localUrl, entry.url);
      }
    } else if (entry.url) {
      candidateUrls.push(entry.url);
    }

    for (const candidate of candidateUrls) {
      if (!candidate) continue;
      if (candidate.startsWith('http') && !isOnline) continue;
      try {
        const res = await fetchCoursesFromUrl(candidate);
        if (res.courses.length > 0) {
          loadedCourses.push(
            ...res.courses.map((c) => attachCourseProfileTags(c, profile, entry))
          );
          audioCandidates.push(...res.audioCandidates);
          fetched = true;
          break;
        }
      } catch {
        // Try next candidate
      }
    }

    if (!fetched) {
      failedTitles.push(entry.title);
    }
  }

  return {
    matchedEntries,
    loadedCourses,
    audioCandidates,
    alreadyInstalledTitles,
    failedTitles,
  };
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

    const mergedLocked: Record<string, Record<string, boolean>> = {
      ...(inc.exerciseLocked || {}),
    };
    for (const [lessonKey, lockObj] of Object.entries(cur.exerciseLocked || {})) {
      mergedLocked[lessonKey] = {
        ...(mergedLocked[lessonKey] || {}),
        ...lockObj,
      };
    }

    const sheetKeys = new Set(
      (cur.quizSheets || []).map((s) => s.id || `${s.chapterId}:${s.timestamp}`)
    );
    const mergedSheets = [...(cur.quizSheets || [])];
    for (const sh of inc.quizSheets || []) {
      const sk = sh.id || `${sh.chapterId}:${sh.timestamp}`;
      if (!sheetKeys.has(sk)) {
        mergedSheets.push(sh);
      }
    }

    merged[courseId] = {
      lessonsStudied: mergedLessonsStudied,
      exerciseSolved: mergedExercises,
      exerciseLocked: mergedLocked,
      quizBest: mergedQuizBest,
      quizHistory: mergedHistory.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100),
      quizSheets: mergedSheets.sort((a, b) => b.timestamp - a.timestamp).slice(0, 40),
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
