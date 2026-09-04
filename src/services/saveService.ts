import { PlayerState, GameMessage } from '../types';
import { WORLD_HEX_TILES } from '../data/world/worldMapSystem';
import { WORLD_DUNGEON_DATABASE } from '../data/dungeons/dungeonSystem';

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


function resolveActualLocationName(playerState: PlayerState): string {
  const dungeonId = playerState.dungeonExploration?.dungeonId;
  if (dungeonId && !playerState.dungeonExploration?.completed) {
    const dungeon = WORLD_DUNGEON_DATABASE[dungeonId];
    if (dungeon) return `${dungeon.name} · ${playerState.dungeonExploration?.currentTileId || '탐사 중'}`;
  }
  const hexId = playerState.worldMap?.currentHexId;
  const tile = hexId ? WORLD_HEX_TILES[hexId] : undefined;
  if (tile) {
    const place = tile.locationName || tile.featureName || tile.sectorName || tile.regionId;
    return `${place} · ${tile.layer} (${tile.q}, ${tile.r})`;
  }
  return playerState.worldMap?.currentRegionId || '시작의 모험지';
}

function refreshSlotPreview(record: SaveSlot): SaveSlot {
  if (!record?.gameData?.playerState) return record;
  return { ...record, preview: extractPreview(record.gameData.playerState) };
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
    locationName: resolveActualLocationName(playerState),
  };
}

function waitForWriteTransaction(transaction: IDBTransaction, request: IDBRequest): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error || 'IndexedDB write failed.')));
    };
    request.onerror = () => fail(request.error || new Error('IndexedDB write request failed.'));
    transaction.onerror = () => fail(transaction.error || new Error('IndexedDB write transaction failed.'));
    transaction.onabort = () => fail(transaction.error || new Error('IndexedDB write transaction aborted.'));
    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
  });
}

async function readAllSaveSlotRecordsStrict(): Promise<SaveSlot[]> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  return new Promise<SaveSlot[]>((resolve, reject) => {
    let records: SaveSlot[] = [];
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error || 'IndexedDB save read failed.')));
    };
    const request = store.getAll();
    request.onsuccess = () => { records = request.result || []; };
    request.onerror = () => fail(request.error || new Error('IndexedDB save read failed.'));
    transaction.onerror = () => fail(transaction.error || new Error('IndexedDB save transaction failed.'));
    transaction.onabort = () => fail(transaction.error || new Error('IndexedDB save transaction aborted.'));
    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      resolve(records);
    };
  });
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
    const allRecords = await readAllSaveSlotRecordsStrict();
    for (const record of allRecords) {
      if (record && record.slotId && result.hasOwnProperty(record.slotId)) {
        result[record.slotId as SlotId] = refreshSlotPreview(record);
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
      request.onsuccess = () => resolve(request.result ? refreshSlotPreview(request.result) : null);
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

    const request = store.put(slotData);
    await waitForWriteTransaction(transaction, request);

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

    const request = store.delete(slotId);
    await waitForWriteTransaction(transaction, request);

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

    const request = store.put(existing);
    await waitForWriteTransaction(transaction, request);

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

export interface SaveBackupBundle {
  format: 'FANTASYAC_SAVE_BUNDLE';
  bundleVersion: 1;
  exportedAt: number;
  saveVersion: number;
  slots: SaveSlot[];
}

export async function createSaveBackupBundle(): Promise<SaveBackupBundle> {
  // Update backups are safety-critical: unlike the ordinary save-list UI, never
  // convert an IndexedDB read failure into a silently empty backup.
  // If the most recent queued save failed, do not pretend an older DB snapshot is a safe backup.
  await saveQueuePromise;
  const records = await readAllSaveSlotRecordsStrict();
  const slots = records
    .filter((slot): slot is SaveSlot => Boolean(slot?.slotId && slot?.gameData?.playerState))
    .map(refreshSlotPreview);
  return {
    format: 'FANTASYAC_SAVE_BUNDLE',
    bundleVersion: 1,
    exportedAt: Date.now(),
    saveVersion: CURRENT_SAVE_VERSION,
    slots,
  };
}

export function parseSaveBackupBundle(raw: string): SaveBackupBundle {
  const parsed = JSON.parse(raw);
  if (!parsed || parsed.format !== 'FANTASYAC_SAVE_BUNDLE' || !Array.isArray(parsed.slots)) {
    throw new Error('판타지악 세이브 백업 파일 형식이 아닙니다.');
  }
  const validSlots = parsed.slots.filter((slot: any) =>
    slot &&
    ['AUTOSAVE', 'SLOT_1', 'SLOT_2', 'SLOT_3', 'SLOT_4', 'SLOT_5'].includes(slot.slotId) &&
    slot.gameData?.playerState
  );
  return {
    format: 'FANTASYAC_SAVE_BUNDLE',
    bundleVersion: 1,
    exportedAt: Number(parsed.exportedAt) || Date.now(),
    saveVersion: Number(parsed.saveVersion) || 1,
    slots: validSlots,
  };
}

export async function restoreSaveBackupBundle(bundle: SaveBackupBundle): Promise<number> {
  let restored = 0;
  for (const slot of bundle.slots) {
    const migrated = migrateSaveData(slot.gameData);
    await saveSlotData(slot.slotId, migrated, slot.slotName);
    restored += 1;
  }
  return restored;
}
