import {
  isVideoFilename,
  normalizeMediaFileKey,
  type LoadedAudioMap,
} from './audioMatcher';

const DB_NAME = 'amoozeshyar_audio_db';
const LEGACY_DB_NAME = 'doros8_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_tracks';

export interface StoredAudioRecord {
  key: string; // e.g. "sb:1:2" or "file:aef3e_sb1_pe_ep1_checking_in"
  fileName: string;
  blob: Blob;
}

function openAudioDB(name = DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }
    const req = indexedDB.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

async function readRecordsFromDB(name: string): Promise<StoredAudioRecord[]> {
  const db = await openAudioDB(name);
  const records = await new Promise<StoredAudioRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as StoredAudioRecord[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return records;
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // Ignore unsupported browsers
  }
  return false;
}

export async function loadAudioTracksFromDB(): Promise<LoadedAudioMap> {
  try {
    let records = await readRecordsFromDB(DB_NAME);

    // Seamless one-time migration from older IndexedDB name if needed
    if (records.length === 0) {
      try {
        const legacyRecords = await readRecordsFromDB(LEGACY_DB_NAME);
        if (legacyRecords.length > 0) {
          records = legacyRecords;
          await saveAudioTracksToDB(legacyRecords);
        }
      } catch {
        // Ignore if legacy DB does not exist
      }
    }

    const tracks: LoadedAudioMap['tracks'] = {};
    let sbCount = 0;
    let wbCount = 0;
    let videoCount = 0;

    for (const rec of records) {
      if (!rec?.key || !rec?.blob) continue;
      const isVid =
        rec.blob.type?.startsWith('video/') || isVideoFilename(rec.fileName);
      const mediaType: 'audio' | 'video' = isVid ? 'video' : 'audio';
      const url = URL.createObjectURL(rec.blob);
      tracks[rec.key] = {
        url,
        fileName: rec.fileName,
        mediaType,
      };
      const fileAlias = normalizeMediaFileKey(rec.fileName);
      if (rec.key !== fileAlias && !tracks[fileAlias]) {
        tracks[fileAlias] = { url, fileName: rec.fileName, mediaType };
      }
      if (rec.key.startsWith('sb:')) sbCount++;
      else if (rec.key.startsWith('wb:')) wbCount++;
      else if (rec.key.startsWith('file:') && isVid) videoCount++;
    }

    return { tracks, sbCount, wbCount, videoCount };
  } catch {
    return { tracks: {}, sbCount: 0, wbCount: 0, videoCount: 0 };
  }
}

export async function saveAudioTracksToDB(records: StoredAudioRecord[]): Promise<void> {
  if (records.length === 0) return;
  try {
    await requestPersistentStorage();
    const db = await openAudioDB(DB_NAME);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Graceful fallback if storage quota or IndexedDB is unavailable
  }
}

export async function clearAudioTracksDB(): Promise<void> {
  try {
    const db = await openAudioDB(DB_NAME);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore
  }
}
