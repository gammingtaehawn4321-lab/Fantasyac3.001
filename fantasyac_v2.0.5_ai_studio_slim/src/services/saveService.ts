import { PlayerState, GameMessage } from '../types';

export type SlotId = 'AUTOSAVE' | 'SLOT_1' | 'SLOT_2' | 'SLOT_3' | 'SLOT_4' | 'SLOT_5';

export const CURRENT_SAVE_VERSION = 1;

export const MANUAL_SLOT_IDS: SlotId[] = ['SLOT_1', 'SLOT_2', 'SLOT_3', 'SLOT_4', 'SLOT_5'];

export interface SaveSlotPreview {
  characterName: string;
  level: number;
  race: string;
  className?: string;
  dayCount: number;
  currentHour: number;
  currentMinute: number;
  locationName?: string;
}

export interface GameSaveData {
  playerState: PlayerState;
  messages: GameMessage[];
  [key: string]: any;
}

export interface SaveSlot {
  slotId: SlotId;
  slotName: string;
  saveVersion: number;
  createdAt: number;
  updatedAt: number;
  preview: SaveSlotPreview;
  gameData: GameSaveData;
}

const DB_NAME = 'fantasyak';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slotId' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
      dbPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

export function extractPreview(playerState: PlayerState): SaveSlotPreview {
  const className =
    playerState.classEvolutionName ||
    playerState.combatClass ||
    playerState.characterClass ||
    undefined;

  return {
    characterName: playerState.characterName || playerState.profile?.inGameName || '모험가',
    level: playerState.level || 1,
    race: playerState.race || 'HUMAN',
    className,
    dayCount: playerState.dayCount || 1,
    currentHour: typeof playerState.currentHour === 'number' ? playerState.currentHour : 8,
    currentMinute: typeof playerState.currentMinute === 'number' ? playerState.currentMinute : 0,
    locationName: '시작의 모험지',
  };
}

export async function getAllSaveSlots(): Promise<Record<SlotId, SaveSlot | null>> {
  const result: Record<SlotId, SaveSlot | null> = {
    AUTOSAVE: null,
    SLOT_1: null,
    SLOT_2: null,
    SLOT_3: null,
    SLOT_4: null,
    SLOT_5: null,
  };

  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const allRecords = await new Promise<SaveSlot[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    for (const record of allRecords) {
      if (record && record.slotId && result.hasOwnProperty(record.slotId)) {
        result[record.slotId as SlotId] = record;
      }
    }
  } catch (error) {
    console.error('Failed to load save slots from IndexedDB:', error);
  }

  return result;
}

export async function getSaveSlot(slotId: SlotId): Promise<SaveSlot | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return await new Promise<SaveSlot | null>((resolve, reject) => {
      const request = store.get(slotId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to load save slot ${slotId}:`, error);
    return null;
  }
}

let saveQueuePromise: Promise<any> = Promise.resolve();

export function queueSaveOperation<T>(operation: () => Promise<T>): Promise<T> {
  const nextPromise = saveQueuePromise
    .catch(() => {})
    .then(() => operation());
  saveQueuePromise = nextPromise;
  return nextPromise;
}

export async function saveSlotData(
  slotId: SlotId,
  gameData: GameSaveData,
  customSlotName?: string
): Promise<SaveSlot> {
  return queueSaveOperation(async () => {
    const db = await getDB();
    const existing = await getSaveSlot(slotId);

    const now = Date.now();
    const defaultName =
      slotId === 'AUTOSAVE'
        ? '자동 저장'
        : `슬롯 ${slotId.replace('SLOT_', '')}`;

    const slotName = customSlotName || existing?.slotName || defaultName;

    const slotData: SaveSlot = {
      slotId,
      slotName,
      saveVersion: CURRENT_SAVE_VERSION,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      preview: extractPreview(gameData.playerState),
      gameData,
    };

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(slotData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return slotData;
  });
}

export async function deleteSaveSlot(slotId: SlotId): Promise<boolean> {
  return queueSaveOperation(async () => {
    if (slotId === 'AUTOSAVE') {
      throw new Error('자동 저장 슬롯은 삭제할 수 없습니다.');
    }

    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(slotId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return true;
  });
}

export async function renameSaveSlot(slotId: SlotId, newName: string): Promise<SaveSlot | null> {
  return queueSaveOperation(async () => {
    if (slotId === 'AUTOSAVE') {
      throw new Error('자동 저장 슬롯 이름은 변경할 수 없습니다.');
    }

    const existing = await getSaveSlot(slotId);
    if (!existing) {
      throw new Error('지정한 세이브 슬롯을 찾을 수 없습니다.');
    }

    existing.slotName = newName.trim() || existing.slotName;
    existing.updatedAt = Date.now();

    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(existing);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return existing;
  });
}

let autosaveTimer: any = null;

export function triggerDebouncedAutosave(
  gameData: GameSaveData,
  delayMs: number = 750
): Promise<SaveSlot | null> {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }

  return new Promise((resolve) => {
    autosaveTimer = setTimeout(async () => {
      try {
        const result = await saveSlotData('AUTOSAVE', gameData, '자동 저장');
        resolve(result);
      } catch (err) {
        console.error('Autosave failed:', err);
        resolve(null);
      }
    }, delayMs);
  });
}

export function migrateSaveData(rawSave: any): GameSaveData {
  if (!rawSave || typeof rawSave !== 'object') {
    throw new Error('유효하지 않은 세이브 데이터 형식입니다.');
  }

  let playerState = rawSave.playerState || rawSave.gameData?.playerState || rawSave;
  let messages = rawSave.messages || rawSave.gameData?.messages || [];

  if (!playerState || typeof playerState !== 'object') {
    throw new Error('플레이어 데이터가 존재하지 않거나 손상되었습니다.');
  }

  if (!Array.isArray(messages)) {
    messages = [];
  }

  return {
    playerState,
    messages,
  };
}

const LEGACY_STORAGE_KEY = 'fantasyak_game_save_v1';
const LEGACY_MIGRATION_FLAG = 'fantasyak_indexeddb_migrated';

export async function checkAndMigrateLegacyLocalStorage(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    const alreadyMigrated = localStorage.getItem(LEGACY_MIGRATION_FLAG);
    if (alreadyMigrated) return false;

    const allSlots = await getAllSaveSlots();
    const hasAnyIndexedDBSave = Object.values(allSlots).some((s) => s !== null);

    if (hasAnyIndexedDBSave) {
      localStorage.setItem(LEGACY_MIGRATION_FLAG, 'true');
      return false;
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) {
      localStorage.setItem(LEGACY_MIGRATION_FLAG, 'true');
      return false;
    }

    const parsed = JSON.parse(legacyRaw);
    const gameData = migrateSaveData(parsed);

    if (gameData.playerState && gameData.playerState.isCharacterCreated) {
      await saveSlotData('SLOT_1', gameData, '이전 데이터 (자동 이전됨)');
      await saveSlotData('AUTOSAVE', gameData, '자동 저장');
      localStorage.setItem(LEGACY_MIGRATION_FLAG, 'true');
      console.log('Successfully migrated legacy localStorage save to IndexedDB SLOT_1 & AUTOSAVE');
      return true;
    }

    localStorage.setItem(LEGACY_MIGRATION_FLAG, 'true');
    return false;
  } catch (error) {
    console.error('Failed legacy localStorage migration check:', error);
    return false;
  }
}
