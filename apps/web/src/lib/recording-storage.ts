// IndexedDB helper for persisting live class recording chunks across page refreshes

const DB_NAME = 'NEET_LiveRecordings_DB';
const DB_VERSION = 1;
const STORE_NAME = 'chunks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecordingChunk(classId: string, chunk: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const arrayBuffer = await chunk.arrayBuffer();
    store.add({
      classId,
      timestamp: Date.now(),
      mimeType: chunk.type,
      data: arrayBuffer,
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('[RecordingStorage] saveChunk error:', e);
  }
}

export async function loadAllRecordingChunks(classId: string): Promise<Blob[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const records: Array<{ classId: string; mimeType: string; data: ArrayBuffer }> =
          request.result || [];
        const classRecords = records.filter((r) => r.classId === classId);
        const blobs = classRecords.map(
          (r) => new Blob([r.data], { type: r.mimeType || 'video/mp4' }),
        );
        resolve(blobs);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('[RecordingStorage] loadAllChunks error:', e);
    return [];
  }
}

export async function clearRecordingChunks(classId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if (cursor.value.classId === classId) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (e) {
    console.warn('[RecordingStorage] clearChunks error:', e);
  }
}
