import JSZip from 'jszip';
import type { AudioTrackRef } from '../types/courses';

export type AudioBookType = 'sb' | 'wb' | 'video';

export interface LoadedMediaEntry {
  url: string;
  fileName: string;
  mediaType?: 'audio' | 'video';
}

export interface LoadedAudioMap {
  // key format: "sb:1:2", "wb:1:2", or "file:<normalized_basename>"
  tracks: Record<string, LoadedMediaEntry>;
  sbCount: number;
  wbCount: number;
  videoCount: number;
}

export interface AudioCandidateItem {
  fileName: string;
  relativePath: string;
  blob: Blob;
}

export const AUDIO_EXT_RE = /\.(mp3|m4a|wav|ogg)$/i;
export const VIDEO_EXT_RE = /\.(mp4|webm|m4v|mov)$/i;
export const MEDIA_EXT_RE = /\.(mp3|m4a|wav|ogg|mp4|webm|m4v|mov)$/i;

export function makeAudioKey(book: AudioBookType, file: number, track: number): string {
  return `${book}:${file}:${track}`;
}

export function normalizeMediaFileKey(fileName: string): string {
  const base = fileName.split('/').pop() || fileName;
  const withoutExt = base.replace(/\.[a-z0-9]+$/i, '');
  const norm = withoutExt
    .trim()
    .toLowerCase()
    .replace(/[’‘`']/g, '')
    .replace(/&+/g, '_')
    .replace(/\s+/g, '_');
  return `file:${norm}`;
}

export function isVideoFilename(fileName: string): boolean {
  return VIDEO_EXT_RE.test(fileName);
}

export function findMediaForTrack(
  audioMap: LoadedAudioMap,
  track: AudioTrackRef
): LoadedMediaEntry | undefined {
  if (track.fileName) {
    const byName = audioMap.tracks[normalizeMediaFileKey(track.fileName)];
    if (byName) return byName;
  }
  const book = track.book ?? 'sb';
  if (book === 'sb' || book === 'wb') {
    if (track.track > 0) {
      return audioMap.tracks[makeAudioKey(book, track.file, track.track)];
    }
  }
  return undefined;
}

/**
 * Matches MP3 filenames such as:
 * - AEF3e_Level_1_SB_1.02.mp3 -> sb:1:2
 * - AEF3e_Level_1_WB_1.1.mp3 -> wb:1:1
 * - aef4e_level_1_student_book_01_02.mp3 -> sb:1:2
 * - 1.2.mp3 / Track 01-02.mp3
 */
export function parseAudioFilename(
  fileName: string,
  relativePath = ''
): { book: 'sb' | 'wb'; file: number; track: number } | null {
  const lower = `${relativePath}/${fileName}`.toLowerCase();
  if (!AUDIO_EXT_RE.test(fileName)) return null;

  const isWb =
    lower.includes('workbook') ||
    lower.includes('_work') ||
    lower.includes('work_') ||
    lower.includes('/wb') ||
    lower.includes('_wb') ||
    lower.includes('wb_');
  const isSb =
    lower.includes('student') ||
    lower.includes('_sb') ||
    lower.includes('/sb') ||
    lower.includes('sb_') ||
    lower.includes('st_4th');

  const book: 'sb' | 'wb' = isWb && !isSb ? 'wb' : isSb ? 'sb' : 'sb';

  // Match two numbers near the end before extension: e.g. _1.02.mp3 or _01_02.mp3 or 1.2.mp3
  const pairMatch = fileName.match(/(\d{1,2})[\s._-]+(\d{1,2})\.[a-z0-9]+$/i);
  if (pairMatch) {
    const f = parseInt(pairMatch[1], 10);
    const t = parseInt(pairMatch[2], 10);
    if (f >= 1 && f <= 15 && t >= 1 && t <= 99) {
      return { book, file: f, track: t };
    }
  }

  // Fallback: e.g. "01_02_something.mp3"
  const anywhereMatch = fileName.match(/(?:^|[_-])(\d{1,2})[_.-](\d{1,2})(?:[_.-]|$)/);
  if (anywhereMatch) {
    const f = parseInt(anywhereMatch[1], 10);
    const t = parseInt(anywhereMatch[2], 10);
    if (f >= 1 && f <= 15 && t >= 1 && t <= 99) {
      return { book, file: f, track: t };
    }
  }

  return null;
}

export function indexAudioItems(
  items: AudioCandidateItem[],
  existing?: LoadedAudioMap,
  forcedBook?: AudioBookType
): {
  nextMap: LoadedAudioMap;
  matchedCount: number;
  skippedCount: number;
  savedRecords: { key: string; fileName: string; blob: Blob }[];
} {
  const tracks: Record<string, LoadedMediaEntry> = {
    ...(existing?.tracks ?? {}),
  };

  let matchedCount = 0;
  let skippedCount = 0;
  const savedRecords: { key: string; fileName: string; blob: Blob }[] = [];

  for (const item of items) {
    if (!MEDIA_EXT_RE.test(item.fileName)) continue;

    const isVideo = isVideoFilename(item.fileName);
    const fileKey = normalizeMediaFileKey(item.fileName);

    if (isVideo || forcedBook === 'video') {
      if (tracks[fileKey]?.url) {
        URL.revokeObjectURL(tracks[fileKey].url);
      }
      const mediaType: 'audio' | 'video' = isVideo ? 'video' : 'audio';
      const url = URL.createObjectURL(item.blob);
      tracks[fileKey] = {
        url,
        fileName: item.fileName,
        mediaType,
      };
      savedRecords.push({ key: fileKey, fileName: item.fileName, blob: item.blob });
      matchedCount++;
      continue;
    }

    const parsed = parseAudioFilename(item.fileName, item.relativePath);
    const url = URL.createObjectURL(item.blob);

    // Always index by exact normalized filename too so explicit fileName refs resolve directly
    tracks[fileKey] = {
      url,
      fileName: item.fileName,
      mediaType: 'audio',
    };

    if (!parsed) {
      // Save non-numbered audio under its filename key anyway so explicit fileName links work
      savedRecords.push({ key: fileKey, fileName: item.fileName, blob: item.blob });
      matchedCount++;
      continue;
    }

    const book: 'sb' | 'wb' = forcedBook === 'wb' ? 'wb' : forcedBook === 'sb' ? 'sb' : parsed.book;
    const key = makeAudioKey(book, parsed.file, parsed.track);
    if (tracks[key]?.url && tracks[key].url !== url) {
      URL.revokeObjectURL(tracks[key].url);
    }
    tracks[key] = {
      url,
      fileName: item.fileName,
      mediaType: 'audio',
    };
    savedRecords.push({ key, fileName: item.fileName, blob: item.blob });
    matchedCount++;
  }

  let sbCount = 0;
  let wbCount = 0;
  let videoCount = 0;
  for (const [k, entry] of Object.entries(tracks)) {
    if (k.startsWith('sb:')) sbCount++;
    else if (k.startsWith('wb:')) wbCount++;
    else if (k.startsWith('file:') && entry.mediaType === 'video') videoCount++;
  }

  return {
    nextMap: { tracks, sbCount, wbCount, videoCount },
    matchedCount,
    skippedCount,
    savedRecords,
  };
}

export async function extractAudioCandidatesFromFiles(
  fileList: FileList | File[]
): Promise<AudioCandidateItem[]> {
  const result: AudioCandidateItem[] = [];
  const files = Array.from(fileList);

  for (const file of files) {
    if (/\.zip$/i.test(file.name)) {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files);
      for (const entry of entries) {
        if (entry.dir) continue;
        const cleanName = entry.name.split('/').pop() || entry.name;
        if (!MEDIA_EXT_RE.test(cleanName)) continue;
        const blob = await entry.async('blob');
        result.push({
          fileName: cleanName,
          relativePath: entry.name,
          blob,
        });
      }
    } else if (MEDIA_EXT_RE.test(file.name)) {
      result.push({
        fileName: file.name,
        relativePath:
          (file as File & { webkitRelativePath?: string }).webkitRelativePath || '',
        blob: file,
      });
    }
  }

  return result;
}

interface WebkitEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file?: (cb: (f: File) => void) => void;
  createReader?: () => {
    readEntries: (cb: (entries: WebkitEntry[]) => void) => void;
  };
}

async function readEntryRecursively(entry: WebkitEntry): Promise<File[]> {
  if (entry.isFile && entry.file) {
    return new Promise((resolve) => {
      entry.file!((f) => {
        Object.defineProperty(f, 'webkitRelativePath', {
          value: entry.fullPath.replace(/^\//, ''),
          configurable: true,
        });
        resolve([f]);
      });
    });
  }
  if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader();
    const all: WebkitEntry[] = [];
    const readBatch = (): Promise<void> =>
      new Promise((resolve) => {
        reader.readEntries((entries) => {
          if (!entries.length) {
            resolve();
            return;
          }
          all.push(...entries);
          readBatch().then(resolve);
        });
      });
    await readBatch();
    const nested = await Promise.all(all.map(readEntryRecursively));
    return nested.flat();
  }
  return [];
}

export async function readDroppedFilesAndFolders(
  dt: DataTransfer
): Promise<File[]> {
  const items = Array.from(dt.items || []);
  const entries: WebkitEntry[] = [];
  for (const it of items) {
    const raw = (
      it as unknown as { webkitGetAsEntry?: () => WebkitEntry | null }
    ).webkitGetAsEntry?.();
    if (raw) entries.push(raw);
  }

  if (entries.length > 0) {
    const nested = await Promise.all(entries.map(readEntryRecursively));
    return nested.flat();
  }
  return Array.from(dt.files || []);
}

export function normalizeEnglishAnswer(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '');
}
