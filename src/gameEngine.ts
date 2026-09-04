import {
  PlayerState,
  PlayerStats,
  StateChanges,
  GameMessage,
  Race,
  BeastkinType,
  TimeOfDay,
  CharacterProfile,
  InventoryItem,
  RemoveItemResult,
  ActionInterpretation,
  BattleTriggerInfo,
  CompanionData,
  CompanionTactic,
  StatCheckType,
  StatCheckResult,
  UnlockMethod,
  QuestProgress,
  AddictionTier,
  AdultNarrativeCue,
  BodyPayloadEntry, BodyPayloadKind, BodyCompartmentId, BodyLoadStage,
  BodyPayloadChange, PartnerClassification, ParasiteState, EggCohort, EggType, ParasiteOriginRoute, PheromoneLineage,
} from './types';
import { getRaceDefinition } from './data/raceData';
import {
  STAT_POINTS_PER_LEVEL,
  TALENT_POINTS_PER_LEVEL,
  BONUS_TALENT_POINTS_BY_LEVEL,
  DEFAULT_LEVEL_GROWTH,
  getStatUpgradeCost,
  calculateCombatStats,
} from './data/combatConfig';
import { getTalentNode } from './data/talents';
import { CombatClassType, COMBAT_CLASSES, canChooseDancer, getCombatClass } from './data/classes';
import {
  EquipmentSlot, EquippedItems, EQUIPMENT_DATABASE, RunewordType, EquipmentEnhancementMilestone,
  getEquipmentEnhancementCost, enhanceEquipmentEntry, socketRuneword, normalizeEquipmentEnhancementState,
} from './data/equipment';
import { ProfessionType, ProfessionProgress } from './data/professions/professionTypes';
import { PROFESSIONS_DATABASE, RECIPE_DATABASE } from './data/professions/professionData';
import { CampFacilityType, CampProgress } from './data/camp/campTypes';
import { CAMP_FACILITIES_DATABASE, CAMP_SETUP_COST, INITIAL_CAMP_PROGRESS, READABLE_BOOKS_DATABASE } from './data/camp/campData';
import { performStatCheck } from './combat/statCheckEngine';
import { getItemDefinition, enrichInventoryItem, inferItemMetadata } from './data/items';
import { POTION_DATABASE } from './data/potions/potionDatabase';
import { getLockDefinition, LOCK_DATABASE } from './data/locks/lockDatabase';
import { INITIAL_MAJOR_CHARACTERS, getMajorCharacter } from './data/characters/majorCharacters';
import { dispatchGameEvent, evaluateGameCondition, evaluateStateBasedObjective, grantQuestRewards } from './gameEvents';
import { QUEST_DATABASE, getQuestDefinition } from './data/quests/questDatabase';
import {
  BAG_DATABASE,
  getBagDefinition,
  calculateInventoryWeight,
  calculateBaseCarryWeight,
  calculatePartyCarryWeight,
  calculateEncumbranceState,
  calculateCampStorageWeight,
  getCampStorageMaxCapacity,
  getItemSingleWeight,
} from './data/bags';
import {
  ADULT_SYSTEM_CONFIG,
  getAddictionTierByValue,
  getCorruptionTierByValue,
} from './data/adultSystemConfig';
import { BODY_COMPARTMENT_CAPACITY, BODY_LOAD_THRESHOLDS, BODY_PAYLOAD_EFFECTS, BODY_DERIVED_EFFECT_CAPS, BODY_COMPARTMENT_EFFECT_WEIGHTS, BLADDER_CONFIG, INSERTED_PARASITE_EMISSION_DEFAULT, EGG_SYSTEM_CONFIG, PARASITE_GROWTH_CONFIG, PREGNANCY_SYSTEM_CONFIG } from './data/bodySystemConfig';

import { createInitialSkillProgression, ensureProgressionState, applyProgressionLevelMilestones } from './data/progression/progressionSystem';
import { createInitialWorldMapState, WORLD_HEX_TILES, revealAround, canEnterHex } from './data/world/worldMapSystem';
import { resolveEncounterMovementTarget, type HexMoveDirection, type EncounterMovementType } from './data/world/encounterMovement';
import { normalizeFateState } from './data/world/fateSystem';
import { DEFAULT_AIRSHIP_STATE } from './data/world/lifeTravelSystem';
import { applyCompanionNeedChanges, applyCompanionNeedTimeProgress, applyCompanionStoryNeedProgress, createInitialCompanionNeeds, normalizeCompanionNeeds } from './data/companions/companionNeeds';
import { createInitialPetState, normalizePetState } from './data/pets/petState';
import { applyPetNeedTimeProgress, applyPetStoryNeedProgress, respondToPetNeedRequest } from './data/pets/petNeeds';
import { feedPetItem, getPetCommandRates, getPetFoodOptions, performPetCare, resolvePetCommand, upgradePetMetabolism, recordPetCommandOutcome, type PetCommandRates, type PetCommandOutcome } from './data/pets/petProgression';
import { getPetSpeciesDefinition, PET_SPECIES_DATABASE } from './data/pets/petDatabase';
import { PHEROMONE_CONFIG, calculateActivePheromoneStrength, createEmptyPheromoneState, inferPheromoneLineage, pheromoneTier } from './data/pheromoneSystem';
import { DEFAULT_PLAYER_PHYSICAL_AGE, isAdultPhysicalAge, normalizeAdultHumanoidPhysicalAge } from './config/agePolicy';
import { createEmptyCommerceRuntimeState, normalizeCommerceRuntimeState } from './data/world/shops';
import { createEmptySettlementRuntimeState, normalizeSettlementRuntimeState } from './data/world/settlements';

export const SAVE_KEY = 'AI_TEXT_RPG_SAVE_DATA_V1';

/**
 * 구 세이브의 야영지 시설 배열이 현재 버전보다 짧아도 모든 정식 시설을 복구한다.
 * 시설이 통째로 누락된 채 업그레이드 비용만 소비되는 상태를 방지하는 저장 마이그레이션 경계다.
 */
function normalizeCampProgress(raw: any): CampProgress {
  const source = raw && typeof raw === 'object' ? raw : {};
  const savedFacilities = Array.isArray(source.facilities) ? source.facilities : [];
  const initialById = new Map(INITIAL_CAMP_PROGRESS.facilities.map((f) => [f.facilityId, f]));
  const savedById = new Map(savedFacilities.filter((f: any) => f && typeof f.facilityId === 'string').map((f: any) => [f.facilityId, f]));

  const facilities = (Object.keys(CAMP_FACILITIES_DATABASE) as CampFacilityType[]).map((facilityId) => {
    const base = initialById.get(facilityId) || { facilityId, level: 0, isBuilt: false };
    const saved: any = savedById.get(facilityId);
    const def = CAMP_FACILITIES_DATABASE[facilityId];
    if (!saved) return { ...base };
    const level = clamp(Math.floor(Number(saved.level) || 0), 0, def.maxLevel);
    return { ...base, ...saved, facilityId, level, isBuilt: level > 0 ? true : Boolean(saved.isBuilt) };
  });

  return {
    ...INITIAL_CAMP_PROGRESS,
    ...source,
    facilities,
    unlockedActivities: Array.isArray(source.unlockedActivities) ? source.unlockedActivities : [...INITIAL_CAMP_PROGRESS.unlockedActivities],
    upgrades: Array.isArray(source.upgrades) ? source.upgrades : [...INITIAL_CAMP_PROGRESS.upgrades],
    storageItems: Array.isArray(source.storageItems) ? source.storageItems : [],
  };
}

// ============================================================
// 인벤토리 공통 함수: addItem & removeItem
// ============================================================

/**
 * 게임 시간을 지닌 분(minute) 단위로 경과시키며 시각 및 일수를 업데이트합니다.
 */
export function passTime(state: PlayerState, minutes: number): PlayerState {
  // 레거시 시간 경과 진입점도 반드시 공통 시간 엔진을 사용한다.
  // 제작/제련 등에서 시계만 움직이고 임신·페로몬·기생체·동료 욕구 등의
  // 지속 시스템이 멈춰 있던 오작동을 방지한다.
  return advanceGameTime(state, minutes);
}

/**
 * 인벤토리에 아이템을 안전하게 추가하고 수량을 합산합니다.

 * 동일한 이름 및 동일 장비ID의 아이템이 이미 존재하면 수량을 병합합니다.
 */
export function addItem(
  inventory: InventoryItem[],
  item: InventoryItem
): InventoryItem[] {
  if (!item || !item.name || typeof item.quantity !== 'number' || item.quantity <= 0) {
    return inventory;
  }

  const cleanName = item.name.trim();
  if (!cleanName) return inventory;

  const existingIndex = inventory.findIndex(
    existing => existing.name.trim() === cleanName && existing.equipmentId === item.equipmentId && existing.bagId === item.bagId && existing.quality === item.quality
  );

  if (existingIndex === -1) {
    const enriched = enrichInventoryItem({ ...item, name: cleanName });
    return [
      ...inventory,
      {
        ...item,
        id: item.id || enriched.id,
        name: cleanName,
        quantity: item.quantity,
        description: item.description || enriched.description,
        flavorText: item.flavorText || enriched.flavorText,
        illustrationUrl: item.illustrationUrl || enriched.illustrationUrl,
        category: item.category || enriched.category,
        quality: item.quality || 'NORMAL',
      },
    ];
  }

  return inventory.map((existing, index) =>
    index === existingIndex
      ? {
          ...existing,
          quantity: existing.quantity + item.quantity,
          description: item.description || existing.description,
          flavorText: item.flavorText || existing.flavorText,
          illustrationUrl: item.illustrationUrl || existing.illustrationUrl,
          bagId: item.bagId || existing.bagId,
          category: item.category || existing.category,
        }
      : existing
  );
}

/**
 * 인벤토리에서 아이템을 안전하게 제거합니다.
 */
export function removeItem(
  inventory: InventoryItem[],
  itemIdOrName: string,
  requestedQuantity: number
): RemoveItemResult {
  if (!itemIdOrName || typeof requestedQuantity !== 'number' || requestedQuantity <= 0) {
    return {
      inventory,
      removedQuantity: 0,
    };
  }

  const cleanTarget = itemIdOrName.trim();
  let removedQuantity = 0;

  const nextInventory = inventory
    .map(item => {
      const matches = item.name.trim() === cleanTarget || item.id === cleanTarget || item.equipmentId === cleanTarget || item.bagId === cleanTarget;
      if (!matches) {
        return item;
      }

      // 실제 소실 가능한 수량 계산 (보유량 초과 방지)
      const toRemove = Math.min(requestedQuantity, Math.max(0, item.quantity));
      removedQuantity += toRemove;

      return {
        ...item,
        quantity: item.quantity - toRemove,
      };
    })
    .filter(item => item.quantity > 0);

  return {
    inventory: nextInventory,
    removedQuantity,
  };
}

/**
 * 행동 해석 및 전투 진입 안전 검증 함수
 */
export function shouldStartBattle(
  interpretation?: ActionInterpretation,
  battleTrigger?: BattleTriggerInfo
): boolean {
  if (!battleTrigger) {
    return false;
  }

  if (interpretation) {
    if (!interpretation.startsCombat) {
      return false;
    }

    return (
      interpretation.hostileAction === true ||
      interpretation.intent === 'COMBAT_ATTACK' ||
      interpretation.intent === 'COMBAT_PROVOKE' ||
      interpretation.forcedCombat === true
    );
  }

  return Boolean(battleTrigger && (battleTrigger.enemyName || battleTrigger.enemyTemplate));
}

// Max resource formulas
export function calculateMaxHp(vitality: number, level: number = 1, talentHpBonus: number = 0): number {
  const lvlBonus = (Math.max(1, level) - 1) * DEFAULT_LEVEL_GROWTH.hpPerLevel;
  return 50 + Math.max(1, vitality) * 10 + lvlBonus + talentHpBonus;
}

export function calculateMaxSanity(spirit: number, talentSanityBonus: number = 0): number {
  return 50 + Math.max(1, spirit) * 10 + talentSanityBonus;
}

export function calculateMaxMana(intelligence: number, level: number = 1, talentManaBonus: number = 0): number {
  const lvlBonus = (Math.max(1, level) - 1) * DEFAULT_LEVEL_GROWTH.mpPerLevel;
  return 25 + Math.max(1, intelligence) * 5 + lvlBonus + talentManaBonus;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ============================================================
// 게임 내 시간 엔진 (World Time System)
// ============================================================
export const DEFAULT_ACTION_TIME_MINUTES = 15;

/**
 * 24시간 시(0~23)에 따라 시간대(TimeOfDay)를 판정합니다.
 * 06:00 ~ 11:59 -> MORNING
 * 12:00 ~ 16:59 -> AFTERNOON
 * 17:00 ~ 20:59 -> EVENING
 * 21:00 ~ 05:59 -> NIGHT
 */
export function getTimeOfDayFromHour(hour: number): TimeOfDay {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h >= 6 && h < 12) {
    return 'MORNING';
  }
  if (h >= 12 && h < 17) {
    return 'AFTERNOON';
  }
  if (h >= 17 && h < 21) {
    return 'EVENING';
  }
  return 'NIGHT';
}

/**
 * 구 세이브 마이그레이션용 시간대 기본 시각
 */
export function getTimeOfDayMigrationHour(timeOfDay?: string): number {
  switch (timeOfDay) {
    case 'AFTERNOON':
      return 14;
    case 'EVENING':
      return 18;
    case 'NIGHT':
      return 22;
    case 'MORNING':
    default:
      return 8;
  }
}

/**
 * 게임 내 시간을 지정된 분(minutes)만큼 진행시킵니다.
 *
 * - minutes 추가
 * - 60분 초과 시 시간 올림
 * - 24:00을 넘으면 dayCount + 1 (다중 일수 진행 포함)
 * - currentHour / currentMinute 갱신
 * - timeOfDay 자동 재계산
 */
function applyPotionTimeProgress(state: PlayerState, minutes: number): PlayerState {
  if (!Array.isArray(state.activePotionEffects) || state.activePotionEffects.length === 0 || minutes <= 0) return state;
  const activePotionEffects = state.activePotionEffects
    .map((effect) => ({ ...effect, remainingMinutes: Math.max(0, Math.floor(effect.remainingMinutes - minutes)) }))
    .filter((effect) => effect.remainingMinutes > 0);
  return { ...state, activePotionEffects };
}

export function hasActivePotionEffect(state: Pick<PlayerState, 'activePotionEffects'>, statusEffectId: string): boolean {
  return Boolean(state.activePotionEffects?.some((effect) => effect.statusEffectId === statusEffectId && effect.remainingMinutes > 0));
}

export function advanceGameTime(
  state: PlayerState,
  minutes: number
): PlayerState {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  if (safeMinutes <= 0) return state;

  const currentHour =
    typeof state.currentHour === 'number'
      ? clamp(Math.floor(state.currentHour), 0, 23)
      : getTimeOfDayMigrationHour(state.timeOfDay);

  const currentMinute =
    typeof state.currentMinute === 'number'
      ? clamp(Math.floor(state.currentMinute), 0, 59)
      : 0;

  const currentDay = Math.max(1, Math.floor(state.dayCount || 1));

  const totalMinutes = currentMinute + safeMinutes;
  const addedHours = Math.floor(totalMinutes / 60);
  const nextMinute = totalMinutes % 60;

  const totalHours = currentHour + addedHours;
  const addedDays = Math.floor(totalHours / 24);
  const nextHour = totalHours % 24;
  const nextDay = currentDay + addedDays;
  const nextTimeOfDay = getTimeOfDayFromHour(nextHour);

  const nextState: PlayerState = {
    ...state,
    dayCount: nextDay,
    currentHour: nextHour,
    currentMinute: nextMinute,
    timeOfDay: nextTimeOfDay,
  };

  let progressedState = applyAdultTimeProgress(nextState, safeMinutes);
  progressedState = applyBodyPayloadTimeProgress(progressedState, safeMinutes);
  progressedState = applyPheromoneTimeProgress(progressedState, safeMinutes);
  // 기존 기생체를 먼저 진행시킨 뒤 알을 부화시킨다. 같은 시간 구간에 새로 부화한 개체가 즉시 성장 시간을 중복 적용받지 않도록 순서를 고정한다.
  progressedState = applyParasiteTimeProgress(progressedState, safeMinutes);
  progressedState = applyEggTimeProgress(progressedState, safeMinutes);
  progressedState = applyBladderTimeProgress(progressedState, safeMinutes);
  progressedState = applyPregnancyTimeProgress(progressedState, safeMinutes);
  if (addedDays > 0 && PREGNANCY_SYSTEM_CONFIG.rollOnDayChange) progressedState = tryStartPregnancyFromStoredFluid(progressedState, true);
  progressedState = applyCompanionNeedTimeProgress(progressedState, safeMinutes);
  progressedState = applyPetNeedTimeProgress(progressedState, safeMinutes);
  progressedState = applyPotionTimeProgress(progressedState, safeMinutes);
  return recalculateAdultDerivedStatus(progressedState);
}

/**
 * UI 등에서 재사용 가능한 게임 시간 한국어 포맷터
 * 예: Day 1 · 08:05 · 아침
 */
export function formatGameTime(
  state: Pick<PlayerState, 'dayCount' | 'currentHour' | 'currentMinute' | 'timeOfDay'>
): string {
  const day = state.dayCount || 1;
  const h = String(state.currentHour ?? 8).padStart(2, '0');
  const m = String(state.currentMinute ?? 0).padStart(2, '0');

  const todMap: Record<TimeOfDay, string> = {
    MORNING: '아침',
    AFTERNOON: '오후',
    EVENING: '저녁',
    NIGHT: '밤',
  };

  const periodLabel = (state.timeOfDay && todMap[state.timeOfDay]) || todMap[getTimeOfDayFromHour(Number(h))] || '아침';

  return `Day ${day} · ${h}:${m} · ${periodLabel}`;
}

export function isAdultStatusEligible(state: Pick<PlayerState, 'profile'>): boolean {
  return isAdultPhysicalAge(state.profile?.physicalAge);
}

export const NATURAL_DESIRE_GAIN_PER_STORY_LOG =
  ADULT_SYSTEM_CONFIG.naturalDesireGainPerStoryLog;

export const SENSITIVITY_DECAY_INTERVAL_MINUTES =
  ADULT_SYSTEM_CONFIG.sensitivity.decayIntervalMinutes;

export const APHRODISIAC_DECAY_INTERVAL_MINUTES =
  ADULT_SYSTEM_CONFIG.aphrodisiac.decayIntervalMinutes;

export const APHRODISIAC_DECAY_PER_INTERVAL =
  ADULT_SYSTEM_CONFIG.aphrodisiac.decayPerInterval;

export function calculateSensitivity(
  baseSensitivity: number,
  tattoos: PlayerState['tattoos'] = [],
  restraints: PlayerState['restraints'] = [],
  aphrodisiacLevel: number = 0
): number {
  const tattooBonus = tattoos.reduce(
    (sum, tattoo) => sum + (tattoo.sensitivityModifier ?? 0),
    0
  );

  const restraintBonus = restraints.reduce(
    (sum, restraint) => sum + (restraint.sensitivityModifier ?? 0),
    0
  );

  const safeAphrodisiacLevel = clamp(
    aphrodisiacLevel,
    0,
    ADULT_SYSTEM_CONFIG.aphrodisiac.maxLevel
  );

  const aphrodisiacBonus = Math.floor(
    safeAphrodisiacLevel /
      ADULT_SYSTEM_CONFIG.aphrodisiac.sensitivityBonusPerLevelBlock
  );

  return clamp(
    baseSensitivity + tattooBonus + restraintBonus + aphrodisiacBonus,
    0,
    100
  );
}

export function getAddictionTier(
  addiction: number
): AddictionTier {
  return getAddictionTierByValue(addiction);
}

export function getCorruptionTier(
  corruption: number
) {
  return getCorruptionTierByValue(corruption);
}

/**
 * 영구 타락도는 높아질수록 추가 상승이 점점 어려워집니다.
 * 현재 상태에 의한 일시적 영향은 effectiveCorruption이 담당합니다.
 */
export function getPermanentCorruptionGainMultiplier(
  currentCorruption: number
): number {
  const value = clamp(currentCorruption, 0, 10);

  if (value < 2) return 1.0;
  if (value < 4) return 0.8;
  if (value < 6) return 0.6;
  if (value < 8) return 0.4;
  return 0.25;
}

/**
 * 성인 상태 변화 자체를 즉시 문장으로 출력하지 않고,
 * 다음 정상 GM 로그에서 참고할 "사건 큐"만 저장합니다.
 * 실제 문장은 server.ts가 사용자 작성 reference를 Gemini에 전달해 새로 생성합니다.
 */
export function enqueueAdultNarrativeCue(
  state: PlayerState,
  cue: AdultNarrativeCue
): PlayerState {
  const previousQueue = Array.isArray(state.adultNarrativeQueue)
    ? state.adultNarrativeQueue
    : [];

  const lastCue =
    previousQueue.length > 0
      ? previousQueue[previousQueue.length - 1]
      : undefined;

  let nextQueue: AdultNarrativeCue[];

  // 같은 종류 + 같은 원인의 연속 큐는 최신 정보로 합칩니다.
  if (
    lastCue &&
    lastCue.type === cue.type &&
    lastCue.sourceId === cue.sourceId
  ) {
    nextQueue = [
      ...previousQueue.slice(0, -1),
      cue,
    ];
  } else {
    nextQueue = [
      ...previousQueue,
      cue,
    ];
  }

  // 실패/재시도 등으로 소비되지 않아도 무한히 쌓이지 않게 제한합니다.
  if (nextQueue.length > 20) {
    nextQueue = nextQueue.slice(-20);
  }

  return {
    ...state,
    adultNarrativeQueue: nextQueue,
  };
}

/**
 * 미약 수치를 연출용 단계로 분류합니다.
 * 실제 효과량 계산이 아니라, 눈에 띄는 단계 변화가 있었는지 판정할 때만 사용합니다.
 * 0 / 1~25 / 26~50 / 51~75 / 76~100
 */
function getAphrodisiacStage(
  level: number
): number {
  const value = clamp(Number(level) || 0, 0, 100);

  if (value <= 0) return 0;
  if (value <= 25) return 1;
  if (value <= 50) return 2;
  if (value <= 75) return 3;
  return 4;
}

export function calculateCurrentLewdness(
  state: Pick<
    PlayerState,
    'adultStatus' | 'equipment' | 'tattoos' | 'restraints'
  >,
  baseLewdnessOverride?: number
): number {
  const adultStatus = state.adultStatus;
  if (!adultStatus) return 0;

  const baseLewdness = clamp(
    typeof baseLewdnessOverride === 'number'
      ? baseLewdnessOverride
      : adultStatus.baseLewdness ?? adultStatus.lewdness ?? 0,
    0,
    10
  );

  const equipmentBonus = Object.values(state.equipment || {}).reduce(
    (sum, equipmentId) => {
      if (!equipmentId) return sum;

      const def = EQUIPMENT_DATABASE[equipmentId];

      return sum + (def?.lewdnessModifier ?? 0);
    },
    0
  );

  const clothingBonus =
    adultStatus.clothingState === 'NAKED'
      ? 2
      : adultStatus.clothingState === 'PARTIAL'
        ? 1
        : 0;

  const tattooBonus = (state.tattoos || []).reduce(
    (sum, tattoo) => sum + (tattoo.lewdnessModifier ?? 0),
    0
  );

  const restraintBonus = (state.restraints || []).reduce(
    (sum, restraint) => sum + (restraint.lewdnessModifier ?? 0),
    0
  );

  return clamp(
    baseLewdness +
      equipmentBonus +
      clothingBonus +
      tattooBonus +
      restraintBonus,
    0,
    10
  );
}

export function getBodyLoadStage(amount: number, compartmentId: BodyCompartmentId): BodyLoadStage {
  const capacity = Math.max(1, BODY_COMPARTMENT_CAPACITY[compartmentId]);
  const ratio = Math.max(0, amount) / capacity;
  return BODY_LOAD_THRESHOLDS.find((entry) => ratio >= entry.minRatio)?.stage ?? 'EMPTY';
}

const VALID_BODY_PAYLOAD_KINDS: BodyPayloadKind[] = [
  'STANDARD_FLUID',
  'INSECTOID_SECRETION',
  'URINE',
  'EGG',
  'PARASITE',
];

function normalizeLegacyBodyPayloadKind(value: unknown): BodyPayloadKind | undefined {
  const raw = String(value || '').toUpperCase();
  // 구 세이브의 OTHER는 더 이상 별도 종류가 아니므로 일반 체액으로 통합한다.
  if (raw === 'OTHER') return 'STANDARD_FLUID';
  return VALID_BODY_PAYLOAD_KINDS.includes(raw as BodyPayloadKind)
    ? raw as BodyPayloadKind
    : undefined;
}

function normalizeSavedBodyPayloads(raw: unknown): BodyPayloadEntry[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((value: any) => {
    if (!value || typeof value !== 'object') return [];
    const payloadKind = normalizeLegacyBodyPayloadKind(value.payloadKind);
    if (!payloadKind || payloadKind === 'PARASITE') return [];
    if (!['COMPARTMENT_1', 'COMPARTMENT_2', 'COMPARTMENT_3'].includes(String(value.compartmentId || ''))) return [];

    // payloadChannel은 3종 레거시 필드이므로 읽기만 하고 새 상태에는 보존하지 않는다.
    const { payloadChannel: _legacyPayloadChannel, ...rest } = value;
    const legacyFamilyKey = typeof rest.payloadFamilyKey === 'string' ? rest.payloadFamilyKey : undefined;
    const payloadFamilyKey = legacyFamilyKey
      ? legacyFamilyKey.replace(/:(?:A|B|C)$/i, `:${payloadKind}`)
      : undefined;

    const savedEggType = rest.eggType === 'INSECTOID_EGG' || rest.eggType === 'TENTACLE_EGG'
      ? rest.eggType
      : payloadKind === 'EGG' && String(rest.sourceSpeciesId || '').toUpperCase().includes('INSECTOID')
        ? 'INSECTOID_EGG'
        : payloadKind === 'EGG' && String(rest.sourceSpeciesId || '').toUpperCase().includes('TENTACLE')
          ? 'TENTACLE_EGG'
          : undefined;
    return [{
      ...rest,
      payloadKind,
      payloadFamilyKey,
      eggType: savedEggType,
      canCausePregnancy: typeof rest.canCausePregnancy === 'boolean'
        ? rest.canCausePregnancy
        : (payloadKind === 'STANDARD_FLUID' || payloadKind === 'INSECTOID_SECRETION'),
      pheromoneLineage: rest.pheromoneLineage === 'INSECTOID' || rest.pheromoneLineage === 'TENTACLE'
        ? rest.pheromoneLineage
        : (payloadKind === 'INSECTOID_SECRETION'
          ? 'INSECTOID'
          : (payloadKind === 'STANDARD_FLUID' && String(rest.sourceSpeciesId || rest.payloadFamilyKey || '').toUpperCase().includes('TENTACLE') ? 'TENTACLE' : undefined)),
      amount: Math.max(0, Number(rest.amount) || 0),
      elapsedMinutes: Math.max(0, Number(rest.elapsedMinutes) || 0),
    } as BodyPayloadEntry];
  });
}

export function calculateBodyPayloadDerivedEffects(state: PlayerState) {
  let desire = 0, lewdness = 0, corruption = 0, sensitivity = 0;
  for (const payload of state.bodyPayloads ?? []) {
    const payloadKind = normalizeLegacyBodyPayloadKind((payload as any).payloadKind);
    if (!payloadKind) continue;
    const capacity = Math.max(1, BODY_COMPARTMENT_CAPACITY[payload.compartmentId]);
    const load = Math.min(1.25, Math.max(0, payload.amount) / capacity);
    const effect = BODY_PAYLOAD_EFFECTS[payloadKind];
    const weight = BODY_COMPARTMENT_EFFECT_WEIGHTS[payload.compartmentId];
    desire += effect.desire * load * weight.desire;
    lewdness += effect.lewdness * load * weight.lewdness;
    corruption += effect.corruption * load * weight.corruption;
    sensitivity += effect.sensitivity * load * weight.sensitivity;
  }
  return {
    desire: Math.min(BODY_DERIVED_EFFECT_CAPS.desire, desire),
    lewdness: Math.min(BODY_DERIVED_EFFECT_CAPS.lewdness, lewdness),
    corruption: Math.min(BODY_DERIVED_EFFECT_CAPS.corruption, corruption),
    sensitivity: Math.min(BODY_DERIVED_EFFECT_CAPS.sensitivity, sensitivity),
  };
}

function resolveEggType(change: BodyPayloadChange): EggType | undefined {
  if (change.eggType === 'INSECTOID_EGG' || change.eggType === 'TENTACLE_EGG') return change.eggType;
  const species = String(change.sourceSpeciesId || '').toUpperCase();
  if (species.includes('INSECTOID')) return 'INSECTOID_EGG';
  if (species.includes('TENTACLE')) return 'TENTACLE_EGG';
  return undefined;
}

function getParasiteOriginRoute(compartmentId: BodyCompartmentId): ParasiteOriginRoute | undefined {
  if (compartmentId === 'COMPARTMENT_1') return 'VAGINAL';
  if (compartmentId === 'COMPARTMENT_2') return 'ANAL';
  return undefined;
}

function makeIndependentParasite(
  state: PlayerState,
  params: {
    sourceId?: string;
    sourceName?: string;
    sourceSpeciesId?: string;
    sourceSpeciesName?: string;
    originCompartmentId: 'COMPARTMENT_1' | 'COMPARTMENT_2';
    mode: 'INSERTED' | 'INTERNAL';
    count: number;
    originEggType?: EggType;
  }
): ParasiteState {
  const originKind = params.originEggType === 'INSECTOID_EGG'
    ? 'INSECTOID'
    : params.originEggType === 'TENTACLE_EGG'
      ? 'TENTACLE'
      : 'DIRECT';
  const emissionPayloadKind = originKind === 'TENTACLE' ? 'STANDARD_FLUID' : 'INSECTOID_SECRETION';
  return {
    id: `parasite_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    speciesId: params.sourceSpeciesId || 'unknown_species',
    mode: params.mode,
    originKind,
    originEggType: params.originEggType,
    originRoute: getParasiteOriginRoute(params.originCompartmentId),
    originCompartmentId: params.originCompartmentId,
    currentRegion: params.mode === 'INTERNAL' ? 'ENTRY_REGION' : undefined,
    count: Math.max(1, Math.round(params.count)),
    elapsedMinutes: 0,
    maturationMinutes: PARASITE_GROWTH_CONFIG.maturationMinutes,
    stage: 'HATCHLING',
    removable: true,
    sourceId: params.sourceId,
    sourceName: params.sourceName,
    sourceSpeciesId: params.sourceSpeciesId,
    sourceSpeciesName: params.sourceSpeciesName,
    emissionProgressMinutes: 0,
    emissionIntervalMinutes: params.mode === 'INSERTED' ? INSERTED_PARASITE_EMISSION_DEFAULT.intervalMinutes : undefined,
    emissionAmount: params.mode === 'INSERTED' ? INSERTED_PARASITE_EMISSION_DEFAULT.amountPerInterval : undefined,
    emissionPayloadKind,
  };
}

export function applyBodyPayloadChanges(state: PlayerState, changes: BodyPayloadChange[] = []): PlayerState {
  let payloads = normalizeSavedBodyPayloads(state.bodyPayloads ?? []).filter((entry) => entry.payloadKind !== 'PARASITE');
  let eggCohorts: EggCohort[] = Array.isArray(state.eggCohorts) ? [...state.eggCohorts] : [];
  let parasiteStates: ParasiteState[] = Array.isArray(state.parasiteStates) ? [...state.parasiteStates] : [];
  const eggDepositedCues: AdultNarrativeCue[] = [];
  let pregnancyRollRequested = false;

  const timestamp = () => ({
    day: Math.max(1, Number(state.dayCount) || 1),
    hour: Math.max(0, Number(state.currentHour) || 0),
    minute: Math.max(0, Number(state.currentMinute) || 0),
  });

  const hasSpecificSource = (change: BodyPayloadChange) =>
    Boolean(change.sourceId || change.sourceName || change.sourceSpeciesId);

  const sameSource = (entry: BodyPayloadEntry, change: BodyPayloadChange) => {
    if (change.sourceId) return (entry.sourceId ?? '') === change.sourceId;
    if (change.sourceName) {
      return (entry.sourceName ?? '') === change.sourceName
        && (entry.sourceSpeciesId ?? '') === (change.sourceSpeciesId ?? '');
    }
    if (change.sourceSpeciesId) return (entry.sourceSpeciesId ?? '') === change.sourceSpeciesId;
    return !entry.sourceId && !entry.sourceName && !entry.sourceSpeciesId;
  };

  for (const change of changes) {
    if (!change || !['COMPARTMENT_1','COMPARTMENT_2','COMPARTMENT_3'].includes(change.compartmentId)) continue;
    const payloadKind = normalizeLegacyBodyPayloadKind(change.payloadKind);
    if (!payloadKind) continue;
    const amount = Math.max(0, Number(change.amount) || 0);
    if (
      change.compartmentId === PREGNANCY_SYSTEM_CONFIG.allowedCompartmentId
      && (payloadKind === 'STANDARD_FLUID' || payloadKind === 'INSECTOID_SECRETION')
      && change.canCausePregnancy !== false
      && change.operation !== 'REMOVE'
      && amount > 0
    ) pregnancyRollRequested = true;

    // 기생체는 더 이상 구획 payload/용량에 들어가지 않는다. 직접 유입도 곧바로 독립 ParasiteState가 된다.
    if (payloadKind === 'PARASITE') {
      if (change.compartmentId === 'COMPARTMENT_3') continue;
      if (change.operation === 'ADD' && amount > 0) {
        parasiteStates.push(makeIndependentParasite(state, {
          sourceId: change.sourceId,
          sourceName: change.sourceName,
          sourceSpeciesId: change.sourceSpeciesId,
          sourceSpeciesName: change.sourceSpeciesName,
          originCompartmentId: change.compartmentId,
          mode: change.parasiteMode ?? 'INSERTED',
          count: amount,
        }));
      }
      continue;
    }

    const eggType = payloadKind === 'EGG' ? resolveEggType(change) : undefined;
    // 알은 곤충형/촉수형 두 종류만 허용하고, 질/항문 외 구획에는 들어가지 않는다.
    if (payloadKind === 'EGG' && (!eggType || change.compartmentId === 'COMPARTMENT_3')) continue;

    const payloadFamilyKey = change.payloadFamilyKey
      ?? (change.sourceType === 'MONSTER' && change.sourceSpeciesId
        ? `MONSTER:${change.sourceSpeciesId}:${payloadKind}${eggType ? `:${eggType}` : ''}`
        : change.sourceType === 'CHARACTER' && (change.sourceId || change.sourceName)
          ? `CHARACTER:${change.sourceId || change.sourceName}:${payloadKind}${eggType ? `:${eggType}` : ''}`
          : undefined);
    const baseMatch = (entry: BodyPayloadEntry) =>
      entry.compartmentId === change.compartmentId
      && normalizeLegacyBodyPayloadKind((entry as any).payloadKind) === payloadKind
      && (payloadKind !== 'EGG' || entry.eggType === eggType);
    const exactMatch = (entry: BodyPayloadEntry) => baseMatch(entry) && sameSource(entry, change);

    if (change.operation === 'REMOVE' && !hasSpecificSource(change)) {
      let remaining = amount;
      const candidateIds = payloads.filter(baseMatch).sort((a,b) => (b.elapsedMinutes ?? 0) - (a.elapsedMinutes ?? 0)).map((entry) => entry.id);
      for (const id of candidateIds) {
        if (remaining <= 0) break;
        const liveIndex = payloads.findIndex((entry) => entry.id === id);
        if (liveIndex < 0) continue;
        const current = Math.max(0, payloads[liveIndex].amount);
        const removed = Math.min(current, remaining);
        remaining -= removed;
        if (current - removed <= 0.001) payloads.splice(liveIndex, 1);
        else payloads[liveIndex] = { ...payloads[liveIndex], amount: current - removed };
      }
    } else if (change.operation === 'SET' && !hasSpecificSource(change)) {
      payloads = payloads.filter((entry) => !baseMatch(entry));
      if (amount > 0) {
        const now = timestamp();
        payloads.push({
          id: `payload_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          compartmentId: change.compartmentId as 'COMPARTMENT_1' | 'COMPARTMENT_2',
          payloadKind,
          payloadFamilyKey,
          amount,
          sourceType: 'UNKNOWN',
          firstAddedAt: now,
          lastAddedAt: now,
          elapsedMinutes: 0,
          eggType,
          canCausePregnancy: change.canCausePregnancy ?? (payloadKind === 'STANDARD_FLUID' || payloadKind === 'INSECTOID_SECRETION'),
          pheromoneLineage: change.pheromoneLineage ?? (payloadKind === 'INSECTOID_SECRETION' ? 'INSECTOID' : (payloadKind === 'STANDARD_FLUID' && String(change.sourceSpeciesId || '').toUpperCase().includes('TENTACLE') ? 'TENTACLE' : undefined)),
        });
      }
    } else {
      const index = payloads.findIndex(exactMatch);
      const current = index >= 0 ? payloads[index].amount : 0;
      const nextAmount = change.operation === 'SET' ? amount : change.operation === 'REMOVE' ? Math.max(0, current - amount) : current + amount;
      if (index >= 0) {
        if (nextAmount <= 0.001) payloads.splice(index, 1);
        else {
          const now = timestamp();
          payloads[index] = {
            ...payloads[index], payloadKind, amount: nextAmount,
            payloadFamilyKey: payloadFamilyKey ?? payloads[index].payloadFamilyKey,
            sourceId: change.sourceId ?? payloads[index].sourceId,
            sourceName: change.sourceName ?? payloads[index].sourceName,
            sourceSpeciesId: change.sourceSpeciesId ?? payloads[index].sourceSpeciesId,
            sourceSpeciesName: change.sourceSpeciesName ?? payloads[index].sourceSpeciesName,
            sourceType: change.sourceType ?? payloads[index].sourceType,
            sourceSex: change.sourceSex ?? payloads[index].sourceSex,
            lastAddedAt: change.operation === 'ADD' ? now : payloads[index].lastAddedAt,
            elapsedMinutes: change.operation === 'ADD' ? 0 : payloads[index].elapsedMinutes,
            eggType: eggType ?? payloads[index].eggType,
            canCausePregnancy: change.canCausePregnancy ?? payloads[index].canCausePregnancy ?? (payloadKind === 'STANDARD_FLUID' || payloadKind === 'INSECTOID_SECRETION'),
            pheromoneLineage: change.pheromoneLineage ?? payloads[index].pheromoneLineage ?? (payloadKind === 'INSECTOID_SECRETION' ? 'INSECTOID' : (payloadKind === 'STANDARD_FLUID' && String(change.sourceSpeciesId || '').toUpperCase().includes('TENTACLE') ? 'TENTACLE' : undefined)),
          };
        }
      } else if (change.operation !== 'REMOVE' && nextAmount > 0) {
        const now = timestamp();
        payloads.push({
          id: `payload_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          compartmentId: change.compartmentId, payloadKind, payloadFamilyKey, amount: nextAmount,
          sourceId: change.sourceId, sourceName: change.sourceName,
          sourceSpeciesId: change.sourceSpeciesId, sourceSpeciesName: change.sourceSpeciesName,
          sourceType: change.sourceType ?? 'UNKNOWN', sourceSex: change.sourceSex,
          firstAddedAt: now, lastAddedAt: now, elapsedMinutes: 0,
          eggType,
          canCausePregnancy: change.canCausePregnancy ?? (payloadKind === 'STANDARD_FLUID' || payloadKind === 'INSECTOID_SECRETION'),
          pheromoneLineage: change.pheromoneLineage ?? (payloadKind === 'INSECTOID_SECRETION' ? 'INSECTOID' : (payloadKind === 'STANDARD_FLUID' && String(change.sourceSpeciesId || '').toUpperCase().includes('TENTACLE') ? 'TENTACLE' : undefined)),
        });
      }
    }

    if (payloadKind === 'EGG' && eggType) {
      const cohortMatch = (cohort: EggCohort) => cohort.compartmentId === change.compartmentId
        && cohort.eggType === eggType
        && (change.sourceId ? cohort.sourceId === change.sourceId : change.sourceSpeciesId ? cohort.sourceSpeciesId === change.sourceSpeciesId : true);
      if (change.operation === 'ADD' && amount > 0) {
        const count = Math.max(1, Math.round(change.eggCount ?? amount / Math.max(0.001, EGG_SYSTEM_CONFIG.volumePerEgg[eggType])));
        const newCohort: EggCohort = {
          id: `egg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          eggType,
          compartmentId: change.compartmentId as 'COMPARTMENT_1' | 'COMPARTMENT_2',
          count,
          occupiedAmount: amount,
          sourceId: change.sourceId, sourceName: change.sourceName,
          sourceSpeciesId: change.sourceSpeciesId, sourceSpeciesName: change.sourceSpeciesName,
          sourceType: change.sourceType,
          depositedAt: timestamp(), elapsedActiveMinutes: 0,
          incubationMinutes: EGG_SYSTEM_CONFIG.incubationMinutes[eggType],
          stage: 'DORMANT', plannedGrowthMode: change.parasiteMode ?? 'INTERNAL',
        };
        eggCohorts.push(newCohort);
        eggDepositedCues.push({
          type: 'EGG_DEPOSITED',
          amount: count,
          sourceId: newCohort.id,
          eggType,
          originRoute: change.compartmentId === 'COMPARTMENT_2' ? 'ANAL' : 'VAGINAL',
        });
      } else if (change.operation === 'REMOVE') {
        let remaining = amount;
        eggCohorts = eggCohorts.flatMap((cohort) => {
          if (!cohortMatch(cohort) || remaining <= 0) return [cohort];
          const removed = Math.min(cohort.occupiedAmount, remaining);
          remaining -= removed;
          const ratio = cohort.occupiedAmount > 0 ? (cohort.occupiedAmount - removed) / cohort.occupiedAmount : 0;
          if (ratio <= 0.001) return [];
          return [{ ...cohort, occupiedAmount: cohort.occupiedAmount - removed, count: Math.max(1, Math.round(cohort.count * ratio)) }];
        });
      } else if (change.operation === 'SET') {
        eggCohorts = eggCohorts.filter((cohort) => !cohortMatch(cohort));
        if (amount > 0) {
          const count = Math.max(1, Math.round(change.eggCount ?? amount / Math.max(0.001, EGG_SYSTEM_CONFIG.volumePerEgg[eggType])));
          eggCohorts.push({
            id: `egg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            eggType, compartmentId: change.compartmentId as 'COMPARTMENT_1' | 'COMPARTMENT_2', count, occupiedAmount: amount,
            sourceId: change.sourceId, sourceName: change.sourceName,
            sourceSpeciesId: change.sourceSpeciesId, sourceSpeciesName: change.sourceSpeciesName,
            sourceType: change.sourceType, depositedAt: timestamp(), elapsedActiveMinutes: 0,
            incubationMinutes: EGG_SYSTEM_CONFIG.incubationMinutes[eggType], stage: 'DORMANT', plannedGrowthMode: change.parasiteMode ?? 'INTERNAL',
          });
        }
      }
    }
  }

  let next = { ...state, bodyPayloads: payloads, eggCohorts, parasiteStates };
  for (const cue of eggDepositedCues) next = enqueueAdultNarrativeCue(next, cue);
  if (pregnancyRollRequested) next = tryStartPregnancyFromStoredFluid(next);
  next = synchronizePheromoneState(next);
  return recalculateAdultDerivedStatus(next);
}

export function applyBodyPayloadTimeProgress(state: PlayerState, elapsedMinutes: number): PlayerState {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  if (!minutes) return state;
  const bodyPayloads = (state.bodyPayloads ?? []).map((p) => ({
    ...p, elapsedMinutes: (p.elapsedMinutes ?? 0) + minutes,
    amount: Math.max(0, p.amount - Math.max(0, p.decayPerHour ?? 0) * minutes / 60),
  })).filter((p) => p.amount > 0.001 && p.payloadKind !== 'PARASITE');
  return { ...state, bodyPayloads };
}

export function applyEggTimeProgress(state: PlayerState, elapsedMinutes: number): PlayerState {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  if (!minutes || !Array.isArray(state.eggCohorts) || state.eggCohorts.length === 0) return state;

  let next: PlayerState = { ...state, eggCohorts: [...state.eggCohorts], parasiteStates: [...(state.parasiteStates ?? [])] };
  const survivors: EggCohort[] = [];

  for (const cohort of next.eggCohorts ?? []) {
    const reactionKind = EGG_SYSTEM_CONFIG.reactionFluidKind[cohort.eggType] as BodyPayloadKind;
    const fluidAmount = (next.bodyPayloads ?? [])
      .filter((entry) => entry.compartmentId === cohort.compartmentId && entry.payloadKind === reactionKind)
      .reduce((sum, entry) => sum + Math.max(0, Number(entry.amount) || 0), 0);
    const active = fluidAmount > 0.001;
    const previousStage = cohort.stage;
    const elapsedActiveMinutes = active ? cohort.elapsedActiveMinutes + minutes : cohort.elapsedActiveMinutes;
    const ratio = cohort.incubationMinutes > 0 ? elapsedActiveMinutes / cohort.incubationMinutes : 1;
    const stage = !active ? 'DORMANT' : ratio >= 1 ? 'HATCH_READY' : ratio >= EGG_SYSTEM_CONFIG.developingThreshold ? 'DEVELOPING' : 'ACTIVE';

    if (active && next.adultStatus) {
      const capacity = Math.max(1, BODY_COMPARTMENT_CAPACITY[cohort.compartmentId]);
      const eggLoad = Math.min(1, Math.max(0, cohort.occupiedAmount) / capacity);
      const fluidLoad = Math.min(1, fluidAmount / capacity);
      const intensity = Math.sqrt(Math.max(0, eggLoad * fluidLoad));
      const ticks = minutes / EGG_SYSTEM_CONFIG.reactionTickMinutes;
      if (intensity > 0 && ticks > 0) {
        next = {
          ...next,
          adultStatus: {
            ...next.adultStatus,
            desire: clamp((next.adultStatus.desire ?? 0) + EGG_SYSTEM_CONFIG.desireGainAtFullLoadPerTick * intensity * ticks, 0, 100),
            baseSensitivity: clamp((next.adultStatus.baseSensitivity ?? next.adultStatus.sensitivity ?? 0) + EGG_SYSTEM_CONFIG.sensitivityGainAtFullLoadPerTick * intensity * ticks, 0, 100),
          },
        };
      }
    }

    if (stage === 'HATCH_READY') {
      // 부화하는 순간 알은 원래 구획의 EGG 점유에서 빠지고, 기생체는 별도 상태로 독립한다.
      let remaining = cohort.occupiedAmount;
      const bodyPayloads = [...(next.bodyPayloads ?? [])];
      for (let i = bodyPayloads.length - 1; i >= 0 && remaining > 0; i--) {
        const entry = bodyPayloads[i];
        if (entry.payloadKind !== 'EGG' || entry.compartmentId !== cohort.compartmentId || entry.eggType !== cohort.eggType) continue;
        if (cohort.sourceId && entry.sourceId !== cohort.sourceId) continue;
        const removed = Math.min(remaining, Math.max(0, entry.amount));
        remaining -= removed;
        if (entry.amount - removed <= 0.001) bodyPayloads.splice(i, 1);
        else bodyPayloads[i] = { ...entry, amount: entry.amount - removed };
      }
      next = { ...next, bodyPayloads };
      next.parasiteStates = [
        ...(next.parasiteStates ?? []),
        makeIndependentParasite(next, {
          sourceId: cohort.sourceId, sourceName: cohort.sourceName,
          sourceSpeciesId: cohort.sourceSpeciesId, sourceSpeciesName: cohort.sourceSpeciesName,
          originCompartmentId: cohort.compartmentId, mode: cohort.plannedGrowthMode,
          count: cohort.count, originEggType: cohort.eggType,
        }),
      ];
      const originRoute = cohort.compartmentId === 'COMPARTMENT_2' ? 'ANAL' : 'VAGINAL';
      next = enqueueAdultNarrativeCue(next, {
        type: 'EGG_HATCH_READY',
        amount: cohort.count,
        sourceId: cohort.id,
        eggType: cohort.eggType,
        originRoute,
      });
      next = enqueueAdultNarrativeCue(next, {
        type: 'EGG_HATCHED',
        amount: cohort.count,
        sourceId: cohort.id,
        eggType: cohort.eggType,
        originRoute,
      });
      continue;
    }

    survivors.push({ ...cohort, elapsedActiveMinutes, stage });
    if (previousStage !== stage) {
      next = enqueueAdultNarrativeCue(next, {
        type: stage === 'DORMANT' ? 'EGG_REACTION_STOPPED' : previousStage === 'DORMANT' ? 'EGG_ACTIVATED' : 'EGG_DEVELOPING',
        sourceId: cohort.id,
        eggType: cohort.eggType,
        originRoute: cohort.compartmentId === 'COMPARTMENT_2' ? 'ANAL' : 'VAGINAL',
      });
    }
  }

  next = { ...next, eggCohorts: survivors };
  return recalculateAdultDerivedStatus(next);
}

export function applyParasiteTimeProgress(state: PlayerState, elapsedMinutes: number): PlayerState {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  if (!minutes) return state;
  let next = { ...state, parasiteStates: [...(state.parasiteStates ?? [])] };
  const updated: ParasiteState[] = [];
  for (const raw of next.parasiteStates) {
    const maturationMinutes = Math.max(1, Number(raw.maturationMinutes ?? raw.incubationMinutes ?? PARASITE_GROWTH_CONFIG.maturationMinutes));
    const elapsed = (raw.elapsedMinutes ?? 0) + minutes;
    const ratio = elapsed / maturationMinutes;
    const stage = ratio >= 1 ? 'MATURE' : ratio >= 0.25 ? 'JUVENILE' : 'HATCHLING';
    let emissionProgressMinutes = (raw.emissionProgressMinutes ?? 0) + minutes;
    if (raw.mode === 'INSERTED' && stage === 'MATURE' && raw.originCompartmentId && raw.emissionIntervalMinutes && raw.emissionAmount) {
      const ticks = Math.floor(emissionProgressMinutes / raw.emissionIntervalMinutes);
      emissionProgressMinutes %= raw.emissionIntervalMinutes;
      if (ticks > 0) next = applyBodyPayloadChanges(next, [{ operation: 'ADD', compartmentId: raw.originCompartmentId, payloadKind: raw.emissionPayloadKind ?? 'INSECTOID_SECRETION', amount: ticks * raw.emissionAmount * Math.max(1, raw.count), sourceId: raw.id, sourceName: raw.speciesId, sourceSpeciesId: raw.speciesId, sourceType: 'PARASITE', canCausePregnancy: false, pheromoneLineage: raw.originKind === 'TENTACLE' ? 'TENTACLE' : raw.originKind === 'INSECTOID' ? 'INSECTOID' : undefined }]);
    }
    if (raw.stage !== 'MATURE' && stage === 'MATURE') next = enqueueAdultNarrativeCue(next, { type: raw.mode === 'INSERTED' ? 'PARASITE_INSERTED_MATURED' : 'PARASITE_INTERNAL_MATURED', sourceId: raw.id });
    updated.push({ ...raw, maturationMinutes, elapsedMinutes: elapsed, stage, emissionProgressMinutes, compartmentId: undefined, incubationMinutes: undefined });
  }
  return { ...next, parasiteStates: updated };
}

export function applyBladderTimeProgress(state: PlayerState, elapsedMinutes: number): PlayerState {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  const current = state.bladderStatus ?? { amount: 0, capacity: BLADDER_CONFIG.capacity, urge: 0, productionPerMinute: BLADDER_CONFIG.productionPerMinute };
  if (!minutes) return state;
  const amount = Math.min(current.capacity, current.amount + current.productionPerMinute * minutes);
  return { ...state, bladderStatus: { ...current, amount, urge: clamp((amount / Math.max(1,current.capacity)) * 100, 0, 100) } };
}

export function voidBladder(state: PlayerState): PlayerState {
  const current = state.bladderStatus;
  if (!current) return state;
  return { ...state, bladderStatus: { ...current, amount: 0, urge: 0 } };
}

export function resolveReflexRelease(state: PlayerState, category: 'HUMANOID' | 'ABERRANT'): PlayerState {
  const chance = BLADDER_CONFIG.reflexChanceByPartnerCategory[category];
  return Math.random() < chance ? voidBladder(state) : state;
}

export function resolveChildSpecies(parentA: PartnerClassification, parentB: PartnerClassification): string | undefined {
  const a = parentA.speciesId;
  const b = parentB.speciesId;
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  const aAberrant = parentA.category === 'ABERRANT';
  const bAberrant = parentB.category === 'ABERRANT';
  if (aAberrant && !bAberrant) return a;
  if (!aAberrant && bAberrant) return b;
  if (a === b) return a;
  return Math.random() < 0.5 ? a : b;
}

export function startPregnancy(
  state: PlayerState,
  parentA: PartnerClassification,
  parentB: PartnerClassification,
  gestationMinutes: number = PREGNANCY_SYSTEM_CONFIG.defaultGestationMinutes,
  source?: Pick<BodyPayloadEntry, 'id' | 'sourceId' | 'sourceName' | 'sourceSpeciesId' | 'sourceSpeciesName'>
): PlayerState {
  if (!isAdultStatusEligible(state) || state.pregnancy?.active) return state;
  const childSpeciesId = resolveChildSpecies(parentA, parentB);
  const next: PlayerState = {
    ...state,
    pregnancy: {
      active: true,
      parentASpeciesId: parentA.speciesId,
      parentBSpeciesId: parentB.speciesId,
      childSpeciesId,
      sourceParentId: source?.sourceId,
      sourceParentName: source?.sourceName,
      sourceParentSpeciesId: source?.sourceSpeciesId,
      sourceParentSpeciesName: source?.sourceSpeciesName,
      conceptionPayloadId: source?.id,
      startedAtDay: state.dayCount,
      startedAtHour: state.currentHour,
      startedAtMinute: state.currentMinute,
      elapsedMinutes: 0,
      gestationMinutes: Math.max(1, Math.floor(gestationMinutes)),
      stage: 'EARLY',
    },
  };
  return enqueueAdultNarrativeCue(next, { type: 'PREGNANCY_STARTED', sourceId: source?.id });
}

function pregnancyCapableFluidEntries(state: PlayerState): BodyPayloadEntry[] {
  return (state.bodyPayloads ?? []).filter((entry) =>
    entry.compartmentId === PREGNANCY_SYSTEM_CONFIG.allowedCompartmentId
    && (entry.payloadKind === 'STANDARD_FLUID' || entry.payloadKind === 'INSECTOID_SECRETION')
    && entry.canCausePregnancy !== false
    && Math.max(0, Number(entry.amount) || 0) > 0.001
  );
}

function weightedPregnancySource(entries: BodyPayloadEntry[]): BodyPayloadEntry | undefined {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.amount) || 0), 0);
  if (total <= 0) return undefined;
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= Math.max(0, Number(entry.amount) || 0);
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

/**
 * 임신은 산란/부화와 완전히 별개다.
 * COMPARTMENT_1(질/자궁 계통)의 임신 가능 정액만 판정에 사용한다.
 * COMPARTMENT_2(항문)는 어떤 양이 있어도 임신 판정을 하지 않는다.
 */
export function tryStartPregnancyFromStoredFluid(state: PlayerState, forceRoll = false): PlayerState {
  if (!isAdultStatusEligible(state) || state.pregnancy?.active) return state;
  const entries = pregnancyCapableFluidEntries(state);
  if (entries.length === 0) return state;

  const amount = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.amount) || 0), 0);
  const capacity = Math.max(1, BODY_COMPARTMENT_CAPACITY[PREGNANCY_SYSTEM_CONFIG.allowedCompartmentId]);
  const fillRatio = Math.max(0, amount / capacity);
  const guaranteed = fillRatio >= PREGNANCY_SYSTEM_CONFIG.guaranteedFillRatio;
  const chance = guaranteed
    ? 1
    : Math.min(PREGNANCY_SYSTEM_CONFIG.maxChanceBelowGuaranteed,
        (fillRatio / PREGNANCY_SYSTEM_CONFIG.guaranteedFillRatio) * PREGNANCY_SYSTEM_CONFIG.maxChanceBelowGuaranteed);

  if (!guaranteed && chance <= 0) return state;
  if (!guaranteed && !forceRoll && Math.random() >= chance) return state;
  if (!guaranteed && forceRoll && Math.random() >= chance) return state;

  const source = weightedPregnancySource(entries);
  if (!source) return state;
  const playerSpecies = String(state.race || state.profile?.race || 'HUMAN');
  const sourceCategory: PartnerClassification['category'] = source.sourceType === 'MONSTER' ? 'ABERRANT' : 'HUMANOID';
  const parentA: PartnerClassification = { category: 'HUMANOID', sapience: 'SAPIENT', speciesId: playerSpecies };
  const parentB: PartnerClassification = { category: sourceCategory, sapience: source.sourceType === 'CHARACTER' ? 'SAPIENT' : 'UNKNOWN', speciesId: source.sourceSpeciesId || source.sourceName || 'UNKNOWN' };
  return startPregnancy(state, parentA, parentB, PREGNANCY_SYSTEM_CONFIG.defaultGestationMinutes, source);
}

export function applyPregnancyTimeProgress(state: PlayerState, elapsedMinutes: number): PlayerState {
  const p = state.pregnancy;
  if (!p?.active) return state;
  const elapsed = Math.min(p.gestationMinutes, p.elapsedMinutes + Math.max(0, Math.floor(elapsedMinutes)));
  const ratio = p.gestationMinutes > 0 ? elapsed / p.gestationMinutes : 1;
  const stage = ratio >= 1 ? 'READY' : ratio >= .75 ? 'LATE' : ratio >= .4 ? 'MID' : 'EARLY';
  let next: PlayerState = { ...state, pregnancy: { ...p, elapsedMinutes: elapsed, stage } };
  if (p.stage !== stage) {
    next = enqueueAdultNarrativeCue(next, { type: stage === 'READY' ? 'PREGNANCY_READY' : 'PREGNANCY_STAGE_CHANGED', sourceId: p.conceptionPayloadId, previousStage: p.stage, currentStage: stage });
  }
  return next;
}

export function synchronizePheromoneState(state: PlayerState): PlayerState {
  const previous = state.pheromoneState ?? createEmptyPheromoneState();
  const nextState = createEmptyPheromoneState();
  (['INSECTOID','TENTACLE'] as PheromoneLineage[]).forEach((lineage) => {
    const activeStrength = calculateActivePheromoneStrength(state, lineage);
    const old = previous[lineage];
    if (activeStrength > 0) {
      nextState[lineage] = {
        lineage,
        activeStrength,
        residualStrength: activeStrength,
        effectiveStrength: activeStrength,
        residualMinutesRemaining: PHEROMONE_CONFIG.residualDurationMinutes,
        tier: pheromoneTier(activeStrength),
      };
    } else if (old?.residualMinutesRemaining > 0 && old.residualStrength > 0) {
      const effectiveStrength = old.residualStrength * Math.max(0, Math.min(1, old.residualMinutesRemaining / PHEROMONE_CONFIG.residualDurationMinutes));
      nextState[lineage] = { ...old, lineage, activeStrength: 0, effectiveStrength, tier: pheromoneTier(effectiveStrength, true) };
    }
  });
  return { ...state, pheromoneState: nextState };
}

/** 체내 정액의 활성 페로몬과 정액 제거 후 잔향을 시간 단위로 처리한다. */
export function applyPheromoneTimeProgress(state: PlayerState, elapsedMinutes: number): PlayerState {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  if (minutes <= 0) return synchronizePheromoneState(state);
  const previous = state.pheromoneState ?? createEmptyPheromoneState();
  const nextPheromones = createEmptyPheromoneState();
  let next = state;
  let totalEffectiveStrength = 0;

  for (const lineage of ['INSECTOID','TENTACLE'] as PheromoneLineage[]) {
    const activeStrength = calculateActivePheromoneStrength(state, lineage);
    const old = previous[lineage];
    let residualStrength = Math.max(0, Number(old?.residualStrength) || 0);
    let residualMinutesRemaining = Math.max(0, Number(old?.residualMinutesRemaining) || 0);
    let effectiveStrength = 0;
    let residual = false;

    if (activeStrength > 0) {
      residualStrength = activeStrength;
      residualMinutesRemaining = PHEROMONE_CONFIG.residualDurationMinutes;
      effectiveStrength = activeStrength;
      if ((old?.activeStrength || 0) <= 0) {
        next = enqueueAdultNarrativeCue(next, { type: lineage === 'INSECTOID' ? 'PHEROMONE_INSECTOID_ACTIVE' : 'PHEROMONE_TENTACLE_ACTIVE' });
      }
    } else {
      if ((old?.activeStrength || 0) > 0) {
        residualStrength = Math.max(residualStrength, old.activeStrength);
        residualMinutesRemaining = PHEROMONE_CONFIG.residualDurationMinutes;
        next = enqueueAdultNarrativeCue(next, { type: lineage === 'INSECTOID' ? 'PHEROMONE_INSECTOID_RESIDUAL_START' : 'PHEROMONE_TENTACLE_RESIDUAL_START' });
      } else if (residualMinutesRemaining > 0) {
        residualMinutesRemaining = Math.max(0, residualMinutesRemaining - minutes);
      }
      if (residualMinutesRemaining > 0 && residualStrength > 0) {
        residual = true;
        effectiveStrength = residualStrength * Math.max(0, Math.min(1, residualMinutesRemaining / PHEROMONE_CONFIG.residualDurationMinutes));
      } else if ((old?.effectiveStrength || 0) > 0) {
        next = enqueueAdultNarrativeCue(next, { type: lineage === 'INSECTOID' ? 'PHEROMONE_INSECTOID_RESIDUAL_END' : 'PHEROMONE_TENTACLE_RESIDUAL_END' });
      }
    }

    nextPheromones[lineage] = {
      lineage,
      activeStrength,
      residualStrength,
      effectiveStrength,
      residualMinutesRemaining,
      tier: pheromoneTier(effectiveStrength, residual),
    };
    totalEffectiveStrength += effectiveStrength;
  }

  next = { ...next, pheromoneState: nextPheromones };
  if (isAdultStatusEligible(next) && next.adultStatus && totalEffectiveStrength > 0) {
    const hours = minutes / 60;
    next = {
      ...next,
      adultStatus: {
        ...next.adultStatus,
        desire: clamp((next.adultStatus.desire ?? 0) + PHEROMONE_CONFIG.desireGainPerHourAtFullStrength * totalEffectiveStrength * hours, 0, 100),
        baseSensitivity: clamp((next.adultStatus.baseSensitivity ?? 0) + PHEROMONE_CONFIG.sensitivityGainPerHourAtFullStrength * totalEffectiveStrength * hours, 0, 100),
      },
    };
  }
  return next;
}

export function recalculateAdultDerivedStatus(
  state: PlayerState
): PlayerState {
  if (!isAdultStatusEligible(state) || !state.adultStatus) {
    return {
      ...state,
      adultStatus: undefined,
      adultNarrativeQueue: [],
    };
  }

  const current = state.adultStatus;
  const payloadEffects = calculateBodyPayloadDerivedEffects(state);

  const desire = clamp(
    current.desire ?? 0,
    0,
    100
  );

  const baseLewdness = clamp(
    current.baseLewdness ?? current.lewdness ?? 0,
    0,
    10
  );

  const baseSensitivity = clamp(
    current.baseSensitivity ?? current.sensitivity ?? 0,
    0,
    100
  );

  const aphrodisiacLevel = clamp(
    current.aphrodisiacLevel ?? 0,
    0,
    ADULT_SYSTEM_CONFIG.aphrodisiac.maxLevel
  );

  const addiction = clamp(
    current.addiction ?? 0,
    0,
    ADULT_SYSTEM_CONFIG.addiction.maxLevel
  );

  const adultStatus = {
    ...current,
    desire,
    effectiveDesire: clamp(desire + payloadEffects.desire, 0, 100),
    baseLewdness,
    lewdness: 0,
    baseSensitivity,
    sensitivity: clamp(calculateSensitivity(
      baseSensitivity,
      state.tattoos,
      state.restraints,
      aphrodisiacLevel
    ) + payloadEffects.sensitivity, 0, 100),
    sensitivityDecayProgressMinutes: Math.max(
      0,
      Math.floor(current.sensitivityDecayProgressMinutes ?? 0)
    ),
    aphrodisiacLevel,
    aphrodisiacDecayProgressMinutes: Math.max(
      0,
      Math.floor(current.aphrodisiacDecayProgressMinutes ?? 0)
    ),
    addiction,
    clothingState: current.clothingState ?? 'CLOTHED',
  };

  const nextState: PlayerState = {
    ...state,
    adultStatus,
  };

  nextState.adultStatus!.lewdness = clamp(
    calculateCurrentLewdness(nextState, baseLewdness) + payloadEffects.lewdness,
    0, 10
  );
  nextState.corruptionStatus = {
    ...(nextState.corruptionStatus ?? { corruption: 0, effectiveCorruption: 0 }),
    corruption: clamp(nextState.corruptionStatus?.corruption ?? 0, 0, 10),
    effectiveCorruption: clamp((nextState.corruptionStatus?.corruption ?? 0) + payloadEffects.corruption, 0, 10),
  };

  return nextState;
}

/**
 * 실제 스토리 로그가 하나 확정됐을 때만 호출합니다.
 * - dialogueCount +1
 * - 성인 캐릭터는 기본 성욕 +5
 * - 활성 미약 20당 추가 +1
 * - 성욕에는 시간에 따른 자연 감소가 없습니다.
 */
export function applyStoryLogProgress(
  state: PlayerState
): PlayerState {
  let nextState: PlayerState = {
    ...state,
    dialogueCount:
      Math.max(0, Number(state.dialogueCount ?? 0)) + 1,
  };

  nextState = applyCompanionStoryNeedProgress(nextState);
  nextState = applyPetStoryNeedProgress(nextState);

  if (
    !isAdultStatusEligible(nextState) ||
    !nextState.adultStatus
  ) {
    return nextState;
  }

  const oldDesire = clamp(
    nextState.adultStatus.desire,
    0,
    100
  );

  const aphrodisiacLevel = clamp(
    nextState.adultStatus.aphrodisiacLevel ?? 0,
    0,
    ADULT_SYSTEM_CONFIG.aphrodisiac.maxLevel
  );

  const aphrodisiacDesireBonus = Math.floor(
    aphrodisiacLevel /
      ADULT_SYSTEM_CONFIG.aphrodisiac.desireBonusPerLevelBlock
  );

  const newDesire = clamp(
    oldDesire +
      NATURAL_DESIRE_GAIN_PER_STORY_LOG +
      aphrodisiacDesireBonus,
    0,
    100
  );

  nextState = {
    ...nextState,
    adultStatus: {
      ...nextState.adultStatus,
      desire: newDesire,
    },
  };

  nextState = recalculateAdultDerivedStatus(nextState);

  // 자연 증가로 처음 고성욕 구간에 들어간 사실은 다음 로그가 참고할 수 있게 예약합니다.
  if (oldDesire < 75 && newDesire >= 75) {
    nextState = enqueueAdultNarrativeCue(nextState, {
      type: 'DESIRE_HIGH',
      previousValue: oldDesire,
      currentValue: newDesire,
      sourceId: 'NATURAL_STORY_PROGRESS',
    });
  }

  return nextState;
}

/**
 * 실제 게임 시간이 흐를 때 성인 상태의 시간 기반 변화만 처리합니다.
 * - 감도: 144분마다 baseSensitivity -1 (24시간당 -10)
 * - 미약: 60분마다 -5
 * - 성욕/중독/타락도에는 자연 감소를 적용하지 않습니다.
 */
export function applyAdultTimeProgress(
  state: PlayerState,
  elapsedMinutes: number
): PlayerState {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));

  if (
    minutes <= 0 ||
    !isAdultStatusEligible(state) ||
    !state.adultStatus
  ) {
    return state;
  }

  const current = state.adultStatus;

  // 감도 자연 감소
  const oldBaseSensitivity = clamp(
    current.baseSensitivity ?? 0,
    0,
    100
  );

  const sensitivityProgress =
    Math.max(0, current.sensitivityDecayProgressMinutes ?? 0) + minutes;

  const sensitivityTicks = Math.floor(
    sensitivityProgress / SENSITIVITY_DECAY_INTERVAL_MINUTES
  );

  const newBaseSensitivity = clamp(
    oldBaseSensitivity -
      sensitivityTicks * ADULT_SYSTEM_CONFIG.sensitivity.decayPerInterval,
    0,
    100
  );

  const nextSensitivityProgress =
    newBaseSensitivity <= 0
      ? 0
      : sensitivityProgress % SENSITIVITY_DECAY_INTERVAL_MINUTES;

  // 미약 자연 감소
  const oldAphrodisiacLevel = clamp(
    current.aphrodisiacLevel ?? 0,
    0,
    ADULT_SYSTEM_CONFIG.aphrodisiac.maxLevel
  );

  let newAphrodisiacLevel = oldAphrodisiacLevel;
  let nextAphrodisiacProgress = 0;

  if (oldAphrodisiacLevel > 0) {
    const aphrodisiacProgress =
      Math.max(0, current.aphrodisiacDecayProgressMinutes ?? 0) + minutes;

    const aphrodisiacTicks = Math.floor(
      aphrodisiacProgress / APHRODISIAC_DECAY_INTERVAL_MINUTES
    );

    newAphrodisiacLevel = clamp(
      oldAphrodisiacLevel -
        aphrodisiacTicks * APHRODISIAC_DECAY_PER_INTERVAL,
      0,
      ADULT_SYSTEM_CONFIG.aphrodisiac.maxLevel
    );

    nextAphrodisiacProgress =
      newAphrodisiacLevel <= 0
        ? 0
        : aphrodisiacProgress % APHRODISIAC_DECAY_INTERVAL_MINUTES;
  }

  let nextState: PlayerState = {
    ...state,
    adultStatus: {
      ...current,
      baseSensitivity: newBaseSensitivity,
      sensitivityDecayProgressMinutes: nextSensitivityProgress,
      aphrodisiacLevel: newAphrodisiacLevel,
      aphrodisiacDecayProgressMinutes: nextAphrodisiacProgress,
    },
  };

  nextState = recalculateAdultDerivedStatus(nextState);

  // 자연 감도 감소가 실제로 발생했을 때만 다음 로그용 큐를 남깁니다.
  if (newBaseSensitivity < oldBaseSensitivity) {
    nextState = enqueueAdultNarrativeCue(nextState, {
      type: 'SENSITIVITY_DECREASE',
      amount: oldBaseSensitivity - newBaseSensitivity,
      previousValue: oldBaseSensitivity,
      currentValue: newBaseSensitivity,
      sourceId: 'TIME_DECAY',
    });
  }

  // 미약은 매 -5마다 반복 연출하지 않고, 큰 구간을 넘어갈 때만 큐를 남깁니다.
  const oldAphrodisiacStage = getAphrodisiacStage(oldAphrodisiacLevel);
  const newAphrodisiacStage = getAphrodisiacStage(newAphrodisiacLevel);

  if (
    oldAphrodisiacStage !== newAphrodisiacStage &&
    newAphrodisiacLevel > 0
  ) {
    nextState = enqueueAdultNarrativeCue(nextState, {
      type: 'APHRODISIAC_DECAY',
      previousValue: oldAphrodisiacLevel,
      currentValue: newAphrodisiacLevel,
      sourceId: 'TIME_DECAY',
    });
  }

  if (oldAphrodisiacLevel > 0 && newAphrodisiacLevel === 0) {
    nextState = enqueueAdultNarrativeCue(nextState, {
      type: 'APHRODISIAC_CLEARED',
      previousValue: oldAphrodisiacLevel,
      currentValue: 0,
      sourceId: 'TIME_DECAY',
    });
  }

  return nextState;
}

export function applyLewdnessMultiplier(baseIncrease: number, lewdness: number): number {
  if (baseIncrease <= 0) return baseIncrease;
  return Math.floor(baseIncrease * (1 + clamp(lewdness, 0, 10) * 0.1));
}

/**
 * 기본 스탯과 종족 보정치 합성
 */
export function calculateEffectiveStats(
  baseStats: PlayerStats,
  race: Race = 'HUMAN',
  beastkinType?: BeastkinType
): PlayerStats {
  const raceDef = getRaceDefinition(race, beastkinType);
  const mods = raceDef.statModifiers || {};

  return {
    strength: Math.max(1, (baseStats.strength ?? 5) + (mods.strength ?? 0)),
    vitality: Math.max(1, (baseStats.vitality ?? 5) + (mods.vitality ?? 0)),
    agility: Math.max(1, (baseStats.agility ?? 5) + (mods.agility ?? 0)),
    intelligence: Math.max(1, (baseStats.intelligence ?? 5) + (mods.intelligence ?? 0)),
    spirit: Math.max(1, (baseStats.spirit ?? 5) + (mods.spirit ?? 0)),
    luck: Math.max(1, (baseStats.luck ?? 5) + (mods.luck ?? 0)),
  };
}

/**
 * 다음 레벨 필요 경험치 공식
 */
export function getRequiredExp(level: number): number {
  const currentLvl = Math.max(1, Math.floor(level));
  const diff = currentLvl - 1;
  return 100 + 50 * diff + 10 * Math.pow(diff, 2);
}

export const INITIAL_PLAYER_STATS: PlayerStats = {
  strength: 5,
  vitality: 5,
  agility: 5,
  intelligence: 5,
  spirit: 5,
  luck: 5,
};

export const DEFAULT_CHARACTER_PROFILE: CharacterProfile = {
  inGameName: '모험가',
  name: '모험가',
  gender: '여성',
  physicalAge: DEFAULT_PLAYER_PHYSICAL_AGE,
  race: 'HUMAN',
  height: 170,
  build: 'AVERAGE',
  breastSize: 'SLENDER',
  hipSize: 'AVERAGE',
  hairColor: '검은색',
  hairStyle: '단정한 숏컷',
  eyeColor: '갈색',
  skinDescription: '건강한 살결',
  features: '오른쪽 뺨의 작은 점',
  appearance: '평범하지만 단단한 인상을 풍기는 모험가의 모습.',
  speechStyle: {
    presetId: 'calm',
    description: '차분하고 이성적이며 감정을 크게 드러내지 않고 명확하게 말한다.',
    tone: '차분하고 침착함',
    politeness: '상황에 따라 정중하거나 담담한 어조',
    quirks: ['위기 상황에서도 호흡을 가다듬고 말함'],
    exampleLines: ['상황을 파악하는 게 우선이야.', '당황하지 마. 길은 분명히 있어.'],
  },
  portraitUrl: undefined,
};

export function createInitialProfessions(): ProfessionProgress[] {
  const list: ProfessionType[] = ['BLACKSMITH', 'LEATHERWORKER', 'ALCHEMIST', 'COOK', 'CARPENTER', 'TAILOR'];
  return list.map((id) => ({
    professionId: id,
    level: 1,
    exp: 0,
    learnedRecipes: [],
    learnedPerks: [],
  }));
}

export function createInitialEquippedItems(): EquippedItems {
  return {
    MAIN_HAND: null,
    OFF_HAND: null,
    HEAD: null,
    CHEST: null,
    LEGS: null,
    BOOTS: null,
    GLOVES: null,
    RING_1: null,
    RING_2: null,
    NECKLACE: null,
    BRACELET: null,
    EARRING: null,
    CLOAK: null,
  };
}

export function createSampleCompanions(): CompanionData[] {
  return [
    {
      id: 'companion_elena',
      name: '엘레나',
      gender: '남성',
      physicalAge: 20,
      race: 'ELF',
      appearance: '은빛 머리칼과 신비로운 에메랄드빛 눈동자를 지닌 숲의 궁수.',
      level: 1,
      experience: 0,
      hp: 80,
      maxHp: 80,
      mp: 60,
      maxMp: 60,
      sanity: 80,
      maxSanity: 80,
      baseStats: { strength: 4, vitality: 5, agility: 8, intelligence: 6, spirit: 6, luck: 6 },
      stats: { strength: 4, vitality: 5, agility: 8, intelligence: 6, spirit: 6, luck: 6 },
      combatClass: 'ARCHER',
      classEvolutionTier: 1,
      talentPoints: 0,
      learnedTalents: {},
      learnedSkills: ['archer_precision_shot'],
      professions: [
        { professionId: 'LEATHERWORKER', level: 2, exp: 40, learnedRecipes: [], learnedPerks: [] },
        { professionId: 'CARPENTER', level: 2, exp: 20, learnedRecipes: [], learnedPerks: [] },
      ],
      equipment: {
        ...createInitialEquippedItems(),
        MAIN_HAND: 'silver_hunting_bow',
        CHEST: 'scout_leather_vest',
        BOOTS: 'swift_leather_boots',
      },
      kind: 'HUMANOID',
      bond: {
        bondLevel: 1,
        bondExp: 0,
        trust: 50,
        affection: 50,
        personalFlags: {},
      },
      needs: createInitialCompanionNeeds(),
      combatTactic: 'BALANCED',
      isActivePartyMember: true,
      recentConversationTopics: ['숲의 고향 이야기', '사냥용 활 손질법'],
    },
    {
      id: 'companion_garrick',
      name: '가릭',
      gender: '남성',
      physicalAge: 20,
      race: 'HUMAN',
      appearance: '거친 수염과 믿음직한 어깨를 가진 노련한 전직 용병 대장장이.',
      level: 2,
      experience: 0,
      hp: 120,
      maxHp: 120,
      mp: 30,
      maxMp: 30,
      sanity: 70,
      maxSanity: 70,
      baseStats: { strength: 9, vitality: 8, agility: 4, intelligence: 4, spirit: 5, luck: 4 },
      stats: { strength: 9, vitality: 8, agility: 4, intelligence: 4, spirit: 5, luck: 4 },
      combatClass: 'WARRIOR',
      classEvolutionTier: 1,
      talentPoints: 0,
      learnedTalents: {},
      learnedSkills: ['warrior_heavy_strike', 'warrior_shield_bash'],
      professions: [
        { professionId: 'BLACKSMITH', level: 3, exp: 120, learnedRecipes: [], learnedPerks: [] },
      ],
      equipment: {
        ...createInitialEquippedItems(),
        MAIN_HAND: 'apprentice_sword',
        OFF_HAND: 'knight_iron_shield',
        CHEST: 'heavy_plate_cuirass',
      },
      kind: 'HUMANOID',
      bond: {
        bondLevel: 1,
        bondExp: 0,
        trust: 45,
        affection: 45,
        personalFlags: {},
      },
      needs: createInitialCompanionNeeds(),
      combatTactic: 'DEFENSIVE',
      isActivePartyMember: false,
      assignedFacilityId: 'anvil',
      recentConversationTopics: ['용병 시절의 무용담', '철광석 선별 노하우'],
    },
  ];
}

/** 3.3 검증용 임시 플래그. 정식 출시 전 false로 되돌린다. */
export const PET_TEST_UNLOCK_ALL = true;

function createPetCompanionData(
  speciesId: import('./types').PetSpeciesId,
  options: { id?: string; name?: string; level?: number; appearance?: string; active?: boolean } = {},
): CompanionData {
  const def = getPetSpeciesDefinition(speciesId);
  const level = Math.max(1, Math.floor(Number(options.level) || 1));
  const baseStats = { ...def.baseStats } as PlayerStats;
  const initialPetState = createInitialPetState(speciesId);
  return {
    id: options.id || `pet_${speciesId.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: options.name || def.displayName,
    kind: 'PET',
    petState: { ...initialPetState, growth: { ...initialPetState.growth, level } },
    gender: '',
    race: 'BEASTKIN',
    appearance: options.appearance || `${def.displayName} 형태의 펫`,
    level,
    experience: 0,
    hp: 300 + level * 40,
    maxHp: 300 + level * 40,
    mp: 0,
    maxMp: 0,
    sanity: 100,
    maxSanity: 100,
    baseStats,
    stats: { ...baseStats },
    talentPoints: 0,
    learnedTalents: {},
    learnedSkills: [],
    professions: [],
    equipment: createInitialEquippedItems(),
    bond: { bondLevel: 1, bondExp: 0, trust: 0, affection: 0, personalFlags: {} },
    needs: createInitialCompanionNeeds(),
    combatTactic: 'BALANCED',
    isActivePartyMember: options.active ?? false,
  };
}

function createTestingPetCompanions(): CompanionData[] {
  if (!PET_TEST_UNLOCK_ALL) return [];
  return (Object.keys(PET_SPECIES_DATABASE) as import('./types').PetSpeciesId[]).map((speciesId) =>
    createPetCompanionData(speciesId, { id: `test_pet_${speciesId.toLowerCase()}`, active: false })
  );
}

export function createNewPlayerState(
  profileInput?: Partial<CharacterProfile>,
  allocatedBaseStats?: PlayerStats,
  remainingStatPoints: number = 0,
  isCharacterCreated: boolean = true
): PlayerState {
  const race: Race = profileInput?.race || 'HUMAN';
  const beastkinType: BeastkinType | undefined =
    race === 'BEASTKIN' ? profileInput?.beastkinType || 'CAT' : undefined;
  const charName = (profileInput?.inGameName || profileInput?.name || '모험가').trim() || '모험가';

  const defaultSpeech = DEFAULT_CHARACTER_PROFILE.speechStyle;
  const speechStyle = profileInput?.speechStyle || {
    presetId: 'calm',
    description: '차분하고 이성적이며 감정을 크게 드러내지 않고 명확하게 말한다.',
    tone: '차분하고 침착함',
    politeness: '상황에 따라 정중하거나 담담한 어조',
    quirks: ['위기 상황에서도 호흡을 가다듬고 말함'],
    exampleLines: ['상황을 파악하는 게 우선이야.'],
  };

  const fullProfile: CharacterProfile = {
    inGameName: charName,
    name: charName,
    gender: '여성',
    physicalAge:
      typeof profileInput?.physicalAge === 'number' && profileInput.physicalAge >= 13
        ? profileInput.physicalAge
        : 18,
    race,
    beastkinType,
    height: typeof profileInput?.height === 'number' && profileInput.height > 0 ? profileInput.height : 170,
    build: profileInput?.build || 'AVERAGE',
    breastSize: profileInput?.breastSize || 'SLENDER',
    hipSize: profileInput?.hipSize || 'AVERAGE',
    hairColor: profileInput?.hairColor || '검은색',
    hairStyle: profileInput?.hairStyle || '짧은 단발',
    eyeColor: profileInput?.eyeColor || '갈색',
    skinDescription: profileInput?.skinDescription || '',
    features: profileInput?.features || '',
    appearance: profileInput?.appearance || '',
    speechStyle,
    portraitUrl: profileInput?.portraitUrl,
    beastFeatures: race === 'BEASTKIN' ? profileInput?.beastFeatures : undefined,
  };

  const base = allocatedBaseStats ? { ...allocatedBaseStats } : { ...INITIAL_PLAYER_STATS };
  const effectiveStats = calculateEffectiveStats(base, race, beastkinType);
  const maxHp = calculateMaxHp(effectiveStats.vitality, 1, 0);
  const maxSanity = calculateMaxSanity(effectiveStats.spirit, 0);
  const maxMana = calculateMaxMana(effectiveStats.intelligence, 1, 0);
  const raceDef = getRaceDefinition(race, beastkinType);

  const initialEquipment = createInitialEquippedItems();
  initialEquipment.MAIN_HAND = 'apprentice_sword';

  return {
    characterName: charName,
    race,
    beastkinType,
    profile: fullProfile,
    level: 1,
    experience: 0,
    statPoints: remainingStatPoints,
    baseStats: base,
    stats: effectiveStats,
    passives: [...raceDef.passiveIds],
    storyFlags: [...raceDef.storyFlags],
    isCharacterCreated,
    hp: maxHp,
    maxHp,
    sanity: maxSanity,
    maxSanity,
    mana: maxMana,
    maxMana,
    rupees: 100,
    commerce: createEmptyCommerceRuntimeState(),
    settlementState: createEmptySettlementRuntimeState(),
    combatClass: 'NONE',
    classEvolutionTier: 1,
    talentPoints: 0,
    learnedTalents: {},
    learnedSkills: Array.from(new Set(['basic_attack', 'defend_stance', 'first_aid', ...(race === 'DRAGONKIN' ? ['dragonkin_sacred_breath','dragonkin_scale_guard'] : [])])),
    activeBattle: null,
    defeatAdultEvent: null,
    defeatAftermath: null,
    professions: createInitialProfessions(),
    equipment: initialEquipment,
    equipmentEnhancements: {},
    equippedBagId: 'backpack_traveler',
    campProgress: { ...INITIAL_CAMP_PROGRESS },
    campActionPoints: 3,
    companions: createTestingPetCompanions(),
    equippedPetId: null,
    companionNeedQueue: [],
    dragonkinState: race === 'DRAGONKIN' ? { hunterThreat: 10, hunterEncounterCount: 0 } : undefined,
    airship: { ...DEFAULT_AIRSHIP_STATE },
    timeOfDay: 'MORNING',
    dayCount: 1,
    currentHour: 8,
    currentMinute: 0,
    unlockedLocks: [],
    encounters: {},
    scheduledEncounters: [],
    majorCharacters: { ...INITIAL_MAJOR_CHARACTERS },
    quests: {
      quest_main_awakening: {
        questId: 'quest_main_awakening', status: 'ACTIVE', currentStageId: 1, objectives: {}, startedAt: Date.now(),
      },
      ...Object.fromEntries(Object.keys(QUEST_DATABASE).filter((id)=>id.startsWith('guide_')&&id!=='guide_airship_flight'&&id!=='guide_recruitment').map((id)=>[id,{questId:id,status:'OFFERED' as const,currentStageId:1,objectives:{}}])),
    },
    trackedQuestId: 'quest_main_awakening',
    questAlertQuestIds: Object.keys(QUEST_DATABASE).filter((id) => id.startsWith('guide_') && id !== 'guide_airship_flight' && id !== 'guide_recruitment'),
    declinedQuestIds: [],
    factionReputation: {},
    skillProgression: createInitialSkillProgression(),
    fate: { fateId: 'fate_human_01', startingRegionId: 'GRANDIA', startingHexId: 'SURFACE:-12:0', resolved: false, status: 'IN_PROGRESS', currentChapterId: 'fate_human_01_chapter_1', completedChapterIds: [], choiceHistory: [], fateFlags: ['FATE_HUMAN_01_START'], permanentRewardIds: [], startedAtDay: 1, startedAtDialogue: 0 },
    worldMap: createInitialWorldMapState('THE_PELLESS_LOWER', raceDef.storyFlags),
    dungeonExploration: null,
    dungeonRecords: {},
    adultStatus:
      isAdultPhysicalAge(fullProfile.physicalAge)
        ? {
            desire: 0,
            effectiveDesire: 0,
            baseLewdness: 0,
            lewdness: 0,
            baseSensitivity: 0,
            sensitivity: 0,
            sensitivityDecayProgressMinutes: 0,
            aphrodisiacLevel: 0,
            aphrodisiacDecayProgressMinutes: 0,
            addiction: 0,
            clothingState: 'CLOTHED',
          }
        : undefined,
    corruptionStatus: { corruption: 0, effectiveCorruption: 0 },
    tattoos: [],
    restraints: [],
    adultNarrativeQueue: [],
    bodyPayloads: [],
    eggCohorts: [],
    parasiteStates: [],
    pheromoneState: createEmptyPheromoneState(),
    bladderStatus: { amount: 0, capacity: BLADDER_CONFIG.capacity, urge: 0, productionPerMinute: BLADDER_CONFIG.productionPerMinute },
    pregnancy: undefined,
    dialogueCount: 0,
    inventory: [
      { name: '수련생의 강철검', quantity: 1, description: '단단하게 벼려진 기본 강철 장검', equipmentId: 'apprentice_sword' },
      { name: '작은 회복약', quantity: 3, description: '체력을 30 회복시켜 주는 물약' },
      { name: '나뭇가지', quantity: 6, description: '야영지 모닥불을 피우거나 기초 도구를 만드는 목재 부스러기' },
      { name: '돌', quantity: 4, description: '단단하고 묵직한 돌멩이' },
      { name: '철광석', quantity: 4, description: '대장장이 제련에 쓰이는 순수한 철 원석' },
      { name: '약초', quantity: 3, description: '상처를 치유하고 차를 달일 수 있는 야생 약초' },
    ],
  };
}

export const INITIAL_PLAYER_STATE: PlayerState = createNewPlayerState(
  DEFAULT_CHARACTER_PROFILE,
  INITIAL_PLAYER_STATS,
  5,
  false
);

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  earnedStatPoints: number;
  earnedTalentPoints: number;
}

/**
 * Apply experience and calculate multi-level-ups with Stat & Talent points
 */
export function applyExperience(
  currentLevel: number,
  currentExp: number,
  currentStatPoints: number,
  currentTalentPoints: number,
  expGain: number
): { level: number; experience: number; statPoints: number; talentPoints: number; levelUpResult?: LevelUpResult } {
  let level = currentLevel;
  let exp = currentExp + Math.max(0, expGain);
  let statPoints = currentStatPoints;
  let talentPoints = currentTalentPoints;
  const startLevel = level;
  let totalEarnedStat = 0;
  let totalEarnedTalent = 0;

  while (true) {
    const needed = getRequiredExp(level);
    if (exp >= needed) {
      exp -= needed;
      level += 1;
      const statBonus = STAT_POINTS_PER_LEVEL;
      const talentBonus = TALENT_POINTS_PER_LEVEL + (BONUS_TALENT_POINTS_BY_LEVEL[level] || 0);

      statPoints += statBonus;
      talentPoints += talentBonus;
      totalEarnedStat += statBonus;
      totalEarnedTalent += talentBonus;
    } else {
      break;
    }
  }

  const leveledUp = level > startLevel;
  return {
    level,
    experience: exp,
    statPoints,
    talentPoints,
    levelUpResult: leveledUp
      ? {
          leveledUp: true,
          oldLevel: startLevel,
          newLevel: level,
          earnedStatPoints: totalEarnedStat,
          earnedTalentPoints: totalEarnedTalent,
        }
      : undefined,
  };
}

/**
 * 특성으로부터 추가 체력, 마나, 정신력 보너스 계산
 */
export function calculateTalentResourceBonuses(learnedTalents: Record<string, number> = {}) {
  let hpBonus = 0;
  let manaBonus = 0;
  let sanityBonus = 0;

  if (!learnedTalents || typeof learnedTalents !== 'object') {
    return { hpBonus, manaBonus, sanityBonus };
  }

  Object.entries(learnedTalents).forEach(([talentId, rank]) => {
    const node = getTalentNode(talentId);
    if (node && rank > 0 && node.statModifiers) {
      if (typeof node.statModifiers.maxHp === 'number') hpBonus += node.statModifiers.maxHp * rank;
      if (typeof node.statModifiers.maxMp === 'number') manaBonus += node.statModifiers.maxMp * rank;
      if (typeof node.statModifiers.maxSanity === 'number') sanityBonus += node.statModifiers.maxSanity * rank;
    }
  });

  return { hpBonus, manaBonus, sanityBonus };
}

/**
 * PlayerState의 스탯 및 최대 자원(HP, MP, Sanity)을 안전하게 재계산하고 보정합니다.
 */
export function sanitizePlayerState(inputState: any): PlayerState {
  let state = inputState;
  while (state && state.nextState && typeof state.nextState === 'object') {
    state = state.nextState;
  }

  const race: Race = state?.race || 'HUMAN';
  const beastkinType: BeastkinType | undefined = state?.beastkinType;
  const raceDef = getRaceDefinition(race, beastkinType);

  const baseStats: PlayerStats = {
    strength: Number(state?.baseStats?.strength ?? state?.stats?.strength ?? 5),
    vitality: Number(state?.baseStats?.vitality ?? state?.stats?.vitality ?? 5),
    agility: Number(state?.baseStats?.agility ?? state?.stats?.agility ?? 5),
    intelligence: Number(state?.baseStats?.intelligence ?? state?.stats?.intelligence ?? 5),
    spirit: Number(state?.baseStats?.spirit ?? state?.stats?.spirit ?? 5),
    luck: Number(state?.baseStats?.luck ?? state?.stats?.luck ?? 5),
  };

  const effectiveStats: PlayerStats = calculateEffectiveStats(baseStats, race, beastkinType);

  const learnedTalents: Record<string, number> = {
    ...(state?.learnedTalents || {}),
    ...(state?.talents?.learnedTalents || {}),
  };

  const { hpBonus, manaBonus, sanityBonus } = calculateTalentResourceBonuses(learnedTalents);
  const lvl = Math.max(1, Number(state?.level) || 1);

  const maxHp = calculateMaxHp(effectiveStats.vitality, lvl, hpBonus);
  const maxSanity = calculateMaxSanity(effectiveStats.spirit, sanityBonus);
  const maxMana = calculateMaxMana(effectiveStats.intelligence, lvl, manaBonus);

  const hp = clamp(Number(state?.hp ?? maxHp), 0, maxHp);
  const progressionState = ensureProgressionState({ ...(state || {}), profile: state?.profile || DEFAULT_CHARACTER_PROFILE, race, baseStats, stats: effectiveStats } as PlayerState).skillProgression;
  const fallbackWorld = createInitialWorldMapState('THE_PELLESS_LOWER', Array.isArray(state?.storyFlags) ? state.storyFlags : []);
  const worldMap = state?.worldMap ? { ...fallbackWorld, ...state.worldMap, skyTools: { ...fallbackWorld.skyTools, ...(state.worldMap.skyTools || {}) }, celestialTools: { ...fallbackWorld.celestialTools, ...(state.worldMap.celestialTools || {}) } } : fallbackWorld;
  const fate = normalizeFateState(state?.fate, worldMap.currentRegionId, worldMap.currentHexId, state?.dayCount, state?.dialogueCount);
  const mana = clamp(Number(state?.mana ?? maxMana), 0, maxMana);
  const sanity = clamp(Number(state?.sanity ?? maxSanity), 0, maxSanity);
  const majorCharacters = { ...INITIAL_MAJOR_CHARACTERS, ...(state?.majorCharacters || {}) };
  for (const [characterId, defaultCharacter] of Object.entries(INITIAL_MAJOR_CHARACTERS)) {
    const patchQuestIds = (defaultCharacter.customQuestIds || []).filter((id) => id.startsWith('quest_v205_') || id.startsWith('quest_fate_'));
    if (patchQuestIds.length === 0) continue;
    const savedCharacter = majorCharacters[characterId];
    const savedQuestIds = Array.isArray(savedCharacter?.customQuestIds) ? savedCharacter.customQuestIds : [];
    const mergedQuestIds = Array.from(new Set([...savedQuestIds, ...patchQuestIds]));
    if (mergedQuestIds.length !== savedQuestIds.length) majorCharacters[characterId] = { ...savedCharacter, customQuestIds: mergedQuestIds };
  }

  const inventory = (Array.isArray(state?.inventory) ? state.inventory : []).map((item: InventoryItem) => {
    const enriched = enrichInventoryItem(item);
    const bagDef = getBagDefinition(item.bagId || item.id || item.name);
    return { ...item, id: item.id || enriched.id, bagId: item.bagId || bagDef?.id, category: item.category || (bagDef ? 'EQUIPMENT' : enriched.category), description: item.description || enriched.description, flavorText: item.flavorText || enriched.flavorText, illustrationUrl: item.illustrationUrl || enriched.illustrationUrl };
  });
  const savedQuests: Record<string, QuestProgress> = state?.quests && typeof state.quests === 'object' ? state.quests : {};
  const quests: Record<string, QuestProgress> = Object.keys(savedQuests).length > 0
    ? savedQuests
    : {
        quest_main_awakening: { questId: 'quest_main_awakening', status: 'ACTIVE', currentStageId: 1, objectives: {}, startedAt: Date.now() },
        ...Object.fromEntries(Object.keys(QUEST_DATABASE).filter((id) => id.startsWith('guide_') && id !== 'guide_airship_flight' && id !== 'guide_recruitment').map((id) => [id, { questId: id, status: 'OFFERED' as const, currentStageId: 1, objectives: {} }])),
      };
  const questAlertQuestIds = Array.isArray(state?.questAlertQuestIds)
    ? Array.from(new Set(state.questAlertQuestIds.filter((id: string) => Boolean(quests[id]))))
    : Object.values(quests).filter((q) => q.status === 'OFFERED').map((q) => q.questId);
  const rawTravelSession = worldMap.travelSession && typeof worldMap.travelSession === 'object' ? worldMap.travelSession : null;
  const normalizedTravelSession = rawTravelSession?.active ? {
    ...rawTravelSession,
    status: rawTravelSession.status === 'ENCOUNTER_PAUSED' ? 'ENCOUNTER_PAUSED' as const : 'MOVING' as const,
    currentPathIndex: Math.max(0, Math.floor(Number(rawTravelSession.currentPathIndex ?? rawTravelSession.completedHexSteps ?? 0))),
    pausedAtHexId: rawTravelSession.status === 'ENCOUNTER_PAUSED'
      ? (rawTravelSession.pausedAtHexId || worldMap.activeEncounterHexId || worldMap.currentHexId)
      : undefined,
  } : null;
  let normalizedWorldMap = {
    ...worldMap,
    travelSession: normalizedTravelSession,
    activeEncounterHexId: state?.activeEncounterId ? (worldMap.activeEncounterHexId || worldMap.currentHexId) : null,
  };
  // 4.0.1 구세이브 보정: 예전 여행 시스템은 인카운터가 진행 중이어도 currentHexId가
  // 직전 Hex에 남아 있을 수 있었다. 활성 여행 사건/전투를 불러오면 현재 unit의 실제 Hex로 즉시 맞춘다.
  if (normalizedTravelSession?.active && (state?.activeEncounterId || state?.activeBattle)) {
    const activeUnit = normalizedTravelSession.encounters?.[normalizedTravelSession.currentEncounterIndex];
    const activeTile = activeUnit ? WORLD_HEX_TILES[activeUnit.tileId] : undefined;
    if (activeTile) {
      normalizedWorldMap = {
        ...normalizedWorldMap,
        currentHexId: activeTile.id,
        currentRegionId: activeTile.regionId,
        currentLayer: activeTile.layer,
        activeEncounterHexId: state?.activeEncounterId ? activeTile.id : normalizedWorldMap.activeEncounterHexId,
        discoveredHexIds: Array.from(new Set([...(normalizedWorldMap.discoveredHexIds || []), activeTile.id])),
        exploredHexIds: Array.from(new Set([...(normalizedWorldMap.exploredHexIds || []), activeTile.id])),
        travelSession: {
          ...normalizedTravelSession,
          status: 'ENCOUNTER_PAUSED',
          currentPathIndex: activeUnit.pathIndex,
          pausedAtHexId: activeTile.id,
        },
      };
    }
  }

  const equipment: EquippedItems = state?.equipment && typeof state.equipment === 'object'
    ? { ...createInitialEquippedItems(), ...state.equipment }
    : createInitialEquippedItems();
  const professions: ProfessionProgress[] = Array.isArray(state?.professions) && state.professions.length > 0
    ? state.professions.map((prof: ProfessionProgress) => ({ ...prof, learnedRecipes: Array.isArray(prof.learnedRecipes) ? prof.learnedRecipes : [], learnedPerks: Array.isArray(prof.learnedPerks) ? prof.learnedPerks : [], skillPoints: Math.max(0, Number(prof.skillPoints) || 0) }))
    : createInitialProfessions();
  const campProgress = normalizeCampProgress(state?.campProgress);
  const companions: CompanionData[] = (Array.isArray(state?.companions) ? state.companions : []).map((c: CompanionData) => {
    const kind = c.kind === 'PET' ? 'PET' : 'HUMANOID';
    const linkedMajorCharacter = (Object.values(majorCharacters) as any[]).find((m) => m.id === c.id || m.companionId === c.id);
    const legacyTrust = Number(c.bond?.trust ?? c.trust ?? linkedMajorCharacter?.trust ?? 0);
    const legacyAffection = Number(c.bond?.affection ?? linkedMajorCharacter?.relationship ?? legacyTrust);
    const bond = {
      bondLevel: 1,
      bondExp: 0,
      trust: clamp(legacyTrust, 0, 100),
      affection: clamp(legacyAffection, 0, 100),
      personalFlags: {},
      ...(c.bond || {}),
    };

    const common: CompanionData = {
      ...c,
      kind,
      petState: kind === 'PET' ? normalizePetState(c.petState) : undefined,
      needs: normalizeCompanionNeeds(c.needs || createInitialCompanionNeeds()),
      equippedBagId: c.equippedBagId !== undefined ? c.equippedBagId : null,
      bond: {
        ...bond,
        trust: clamp(Number(bond.trust) || 0, 0, 100),
        affection: clamp(Number(bond.affection) || 0, 0, 100),
      },
      professions: Array.isArray(c.professions) ? c.professions : [],
      equipment: c.equipment && typeof c.equipment === 'object' ? { ...createInitialEquippedItems(), ...c.equipment } : createInitialEquippedItems(),
      equipmentEnhancements: c.equipmentEnhancements && typeof c.equipmentEnhancements === 'object' ? c.equipmentEnhancements : {},
      learnedTalents: c.learnedTalents && typeof c.learnedTalents === 'object' ? c.learnedTalents : {},
      learnedSkills: Array.isArray(c.learnedSkills) ? c.learnedSkills : ['basic_attack'],
      combatTactic: c.combatTactic || 'BALANCED',
      isActivePartyMember: Boolean(c.isActivePartyMember),
    };

    // 기존 사람형 동료만 성인/성별 마이그레이션 규칙을 적용한다. 펫에 인간형 메타데이터를 강제하지 않는다.
    if (kind === 'HUMANOID') {
      common.gender = '남성';
      common.physicalAge = normalizeAdultHumanoidPhysicalAge(c.physicalAge);
    }

    return common;
  });
  if (PET_TEST_UNLOCK_ALL) {
    for (const speciesId of Object.keys(PET_SPECIES_DATABASE) as import('./types').PetSpeciesId[]) {
      if (!companions.some((c) => c.kind === 'PET' && c.petState?.speciesId === speciesId)) {
        companions.push(createPetCompanionData(speciesId, { id: `test_pet_${speciesId.toLowerCase()}`, active: false }));
      }
    }
  }
  const equippedPetId = typeof state?.equippedPetId === 'string'
    && companions.some((c) => c.id === state.equippedPetId && c.kind === 'PET' && c.petState)
      ? state.equippedPetId
      : null;

  const currentHour = typeof state?.currentHour === 'number' ? clamp(Math.floor(state.currentHour), 0, 23) : getTimeOfDayMigrationHour(state?.timeOfDay);
  const currentMinute = typeof state?.currentMinute === 'number' ? clamp(Math.floor(state.currentMinute), 0, 59) : 0;
  const dayCount = Math.max(1, Math.floor(Number(state?.dayCount) || 1));
  const timeOfDay = getTimeOfDayFromHour(currentHour);
  const airship = state?.airship && typeof state.airship === 'object'
    ? { ...DEFAULT_AIRSHIP_STATE, ...state.airship, unlockedUpgradeIds: Array.isArray(state.airship.unlockedUpgradeIds) ? state.airship.unlockedUpgradeIds : [] }
    : { ...DEFAULT_AIRSHIP_STATE };
  const corruptionStatus = {
    corruption: clamp(Number(state?.corruptionStatus?.corruption ?? 0), 0, 10),
    effectiveCorruption: clamp(Number(state?.corruptionStatus?.effectiveCorruption ?? state?.corruptionStatus?.corruption ?? 0), 0, 10),
  };
  const pheromoneState = state?.pheromoneState && typeof state.pheromoneState === 'object'
    ? {
        ...createEmptyPheromoneState(),
        INSECTOID: { ...createEmptyPheromoneState().INSECTOID, ...(state.pheromoneState.INSECTOID || {}) },
        TENTACLE: { ...createEmptyPheromoneState().TENTACLE, ...(state.pheromoneState.TENTACLE || {}) },
      }
    : createEmptyPheromoneState();
  const bladderCapacity = Math.max(1, Number(state?.bladderStatus?.capacity ?? BLADDER_CONFIG.capacity));
  const bladderStatus = state?.bladderStatus && typeof state.bladderStatus === 'object'
    ? {
        amount: clamp(Number(state.bladderStatus.amount ?? 0), 0, bladderCapacity),
        capacity: bladderCapacity,
        urge: clamp(Number(state.bladderStatus.urge ?? 0), 0, 100),
        productionPerMinute: Math.max(0, Number(state.bladderStatus.productionPerMinute ?? BLADDER_CONFIG.productionPerMinute)),
      }
    : { amount: 0, capacity: BLADDER_CONFIG.capacity, urge: 0, productionPerMinute: BLADDER_CONFIG.productionPerMinute };

  return {
    ...state,
    level: lvl,
    experience: Math.max(0, Number(state?.experience) || 0),
    statPoints: Math.max(0, Number(state?.statPoints) || 0),
    talentPoints: Math.max(0, Number(state?.talentPoints) || 0),
    rupees: Math.max(0, Number(state?.rupees) || 0),
    commerce: normalizeCommerceRuntimeState(state?.commerce),
    settlementState: normalizeSettlementRuntimeState(state?.settlementState),
    baseStats,
    stats: effectiveStats,
    hp,
    maxHp,
    mana,
    maxMana,
    sanity,
    maxSanity,
    skillProgression: progressionState,
    worldMap: normalizedWorldMap,
    majorCharacters,
    quests,
    questAlertQuestIds,
    factionReputation: state?.factionReputation && typeof state.factionReputation === 'object' ? { ...state.factionReputation } : {},
    passives: Array.isArray(state?.passives) && state.passives.length > 0 ? state.passives : raceDef.passiveIds,
    storyFlags: Array.isArray(state?.storyFlags) && state.storyFlags.length > 0 ? state.storyFlags : raceDef.storyFlags,
    isCharacterCreated: state?.isCharacterCreated ?? true,
    characterName: state?.characterName || state?.profile?.inGameName || state?.profile?.name || '모험가',
    combatClass: state?.combatClass || 'NONE',
    classEvolutionTier: Math.max(1, Number(state?.classEvolutionTier) || 1),
    learnedSkills: Array.from(new Set([...(Array.isArray(state?.learnedSkills) && state.learnedSkills.length > 0 ? state.learnedSkills : ['basic_attack','defend_stance','first_aid']), ...(race === 'DRAGONKIN' ? ['dragonkin_sacred_breath','dragonkin_scale_guard'] : [])])),
    activeBattle: state?.activeBattle || null,
    defeatAdultEvent: state?.defeatAdultEvent?.active ? state.defeatAdultEvent : null,
    defeatAftermath: state?.defeatAftermath || null,
    equipment,
    equipmentEnhancements: state?.equipmentEnhancements && typeof state.equipmentEnhancements === 'object' ? Object.fromEntries(Object.entries(state.equipmentEnhancements).map(([id, value]) => [id, normalizeEquipmentEnhancementState(value as any)])) : {},
    equippedBagId: state?.equippedBagId !== undefined ? state.equippedBagId : 'backpack_traveler',
    professions,
    campProgress,
    campActionPoints: Math.max(0, Number(state?.campActionPoints ?? 3)),
    companions,
    equippedPetId,
    companionNeedQueue: Array.isArray(state?.companionNeedQueue) ? state.companionNeedQueue : [],
    airship,
    timeOfDay,
    dayCount,
    currentHour,
    currentMinute,
    unlockedLocks: Array.isArray(state?.unlockedLocks) ? state.unlockedLocks : [],
    encounters: state?.encounters && typeof state.encounters === 'object' ? state.encounters : {},
    scheduledEncounters: Array.isArray(state?.scheduledEncounters) ? state.scheduledEncounters : [],
    trackedQuestId: state?.trackedQuestId || 'quest_main_awakening',
    declinedQuestIds: Array.isArray(state?.declinedQuestIds) ? state.declinedQuestIds : [],
    inventory,
    activePotionEffects: Array.isArray(state?.activePotionEffects)
      ? state.activePotionEffects.filter((effect: any) => effect && effect.statusEffectId && Number(effect.remainingMinutes) > 0).map((effect: any) => ({
          statusEffectId: String(effect.statusEffectId),
          sourceItemId: String(effect.sourceItemId || ''),
          name: String(effect.name || effect.statusEffectId),
          remainingMinutes: Math.max(1, Math.floor(Number(effect.remainingMinutes) || 0)),
        }))
      : [],
    explorationConditions: Array.isArray(state?.explorationConditions) ? Array.from(new Set(state.explorationConditions.filter(Boolean).map(String))) : [],
    fate,
    dungeonExploration: state?.dungeonExploration || null,
    dungeonRecords: state?.dungeonRecords && typeof state.dungeonRecords === 'object' ? state.dungeonRecords : {},
    dragonkinState: race === 'DRAGONKIN' ? { hunterThreat: Math.max(0, Math.min(100, Number(state?.dragonkinState?.hunterThreat ?? 10))), hunterEncounterCount: Math.max(0, Math.floor(Number(state?.dragonkinState?.hunterEncounterCount ?? 0))) } : undefined,
    corruptionStatus,
    tattoos: Array.isArray(state?.tattoos) ? state.tattoos : [],
    restraints: Array.isArray(state?.restraints) ? state.restraints : [],
    adultNarrativeQueue: Array.isArray(state?.adultNarrativeQueue) ? state.adultNarrativeQueue : [],
    bodyPayloads: normalizeSavedBodyPayloads(state?.bodyPayloads),
    eggCohorts: Array.isArray(state?.eggCohorts) ? state.eggCohorts : [],
    parasiteStates: Array.isArray(state?.parasiteStates) ? state.parasiteStates : [],
    pheromoneState,
    bladderStatus,
    pregnancy: state?.pregnancy?.active ? state.pregnancy : undefined,
    dialogueCount: Math.max(0, Number(state?.dialogueCount) || 0),
    profile: { ...DEFAULT_CHARACTER_PROFILE, ...(state?.profile || {}), height: Number(state?.profile?.height ?? DEFAULT_CHARACTER_PROFILE.height), build: state?.profile?.build ?? DEFAULT_CHARACTER_PROFILE.build, breastSize: state?.profile?.breastSize ?? DEFAULT_CHARACTER_PROFILE.breastSize, hipSize: state?.profile?.hipSize ?? DEFAULT_CHARACTER_PROFILE.hipSize, gender: '여성', race, beastkinType: race === 'BEASTKIN' ? (state?.profile?.beastkinType || beastkinType || 'CAT') : undefined },
    learnedTalents,
    talents: {
      ...(state?.talents || {}),
      category: state?.talents?.category || 'GENERAL',
      learnedTalents,
      unlockedNodeIds: Array.isArray(state?.talents?.unlockedNodeIds)
        ? state.talents.unlockedNodeIds
        : Object.keys(learnedTalents),
    },
  };
}

/**
 * 특성 포인트(Talent Point)를 투자하여 특성을 습득 또는 랭크업합니다.
 */
export function allocateTalentPoint(
  state: PlayerState,
  talentId: string
): { nextState: PlayerState; success: boolean; message?: string } {
  const cleanState = sanitizePlayerState(state);

  const node = getTalentNode(talentId);
  const cost = node?.cost || 1;

  if (!cleanState.talentPoints || cleanState.talentPoints < cost) {
    return { nextState: cleanState, success: false, message: '사용 가능한 특성 포인트가 부족합니다.' };
  }

  const learnedTalents = {
    ...(cleanState.learnedTalents || {}),
    ...(cleanState.talents?.learnedTalents || {}),
  };
  const currentRank = learnedTalents[talentId] || 0;
  const maxRank = node?.maxRank || 3;

  if (currentRank >= maxRank) {
    return { nextState: cleanState, success: false, message: '이미 최고 랭크에 도달한 특성입니다.' };
  }

  learnedTalents[talentId] = currentRank + 1;

  const { hpBonus, manaBonus, sanityBonus } = calculateTalentResourceBonuses(learnedTalents);
  const nextMaxHp = calculateMaxHp(cleanState.stats.vitality, cleanState.level, hpBonus);
  const nextMaxSanity = calculateMaxSanity(cleanState.stats.spirit, sanityBonus);
  const nextMaxMana = calculateMaxMana(cleanState.stats.intelligence, cleanState.level, manaBonus);

  const hpDiff = nextMaxHp - cleanState.maxHp;
  const manaDiff = nextMaxMana - cleanState.maxMana;
  const sanityDiff = nextMaxSanity - cleanState.maxSanity;

  const nextHp = clamp(cleanState.hp + (hpDiff > 0 ? hpDiff : 0), 0, nextMaxHp);
  const nextMana = clamp(cleanState.mana + (manaDiff > 0 ? manaDiff : 0), 0, nextMaxMana);
  const nextSanity = clamp(cleanState.sanity + (sanityDiff > 0 ? sanityDiff : 0), 0, nextMaxSanity);

  const nextState: PlayerState = {
    ...cleanState,
    hp: nextHp,
    maxHp: nextMaxHp,
    mana: nextMana,
    maxMana: nextMaxMana,
    sanity: nextSanity,
    maxSanity: nextMaxSanity,
    talentPoints: cleanState.talentPoints - cost,
    learnedTalents,
    talents: {
      ...cleanState.talents,
      category: cleanState.talents?.category || 'GENERAL',
      learnedTalents,
      unlockedNodeIds: Array.from(new Set([...(cleanState.talents?.unlockedNodeIds || []), talentId])),
    },
  };

  return {
    nextState,
    success: true,
    message: `✨ [${node?.name || talentId}] 특성을 습득했습니다. (랭크 ${currentRank + 1}/${maxRank})`,
  };
}

/**
 * 1차 전투 직업을 선택합니다. (무희의 경우 여성 성별 제한 검사)
 */
export function chooseCombatClass(state: PlayerState, classId: string): PlayerState {
  const cleanState = sanitizePlayerState(state);

  if (classId === 'DANCER' && !canChooseDancer(cleanState.profile?.gender)) {
    // 무희는 여성 캐릭터 전용 직업입니다.
    return cleanState;
  }
  if (cleanState.race === 'DRAGONKIN' && classId !== 'DRAGON_EMPEROR') return cleanState;
  if (cleanState.race !== 'DRAGONKIN' && classId === 'DRAGON_EMPEROR') return cleanState;

  const classDef = COMBAT_CLASSES[classId as any];
  const initialSkills = classDef?.initialSkillIds || [];
  const learnedTalents = cleanState.learnedTalents || {};

  return {
    ...cleanState,
    combatClass: classId as any,
    classEvolutionId: undefined,
    classEvolutionTier: 1,
    characterClass: classDef?.name || classId,
    learnedSkills: Array.from(new Set([...(cleanState.learnedSkills || []), ...initialSkills])),
    learnedTalents,
    talents: {
      ...cleanState.talents,
      category: (classDef?.talentCategory as any) || 'GENERAL',
      learnedTalents,
      unlockedNodeIds: cleanState.talents?.unlockedNodeIds || Object.keys(learnedTalents),
    },
  };
}

/**
 * 2차 직업으로 진화(전직)합니다.
 */
export function evolveCombatClass(state: PlayerState, evolutionId?: string): PlayerState {
  const cleanState = sanitizePlayerState(state);
  const currentClassDef = getCombatClass(cleanState.combatClass);
  const evoDef = currentClassDef?.evolutions?.find(
    (e) => e.id === evolutionId || e.evolutionName === evolutionId || e.toClassId === evolutionId
  ) || currentClassDef?.evolutions?.[0];

  const evolvedTitle = evoDef?.evolutionName || evolutionId || `${cleanState.combatClass} 진화형`;

  return {
    ...cleanState,
    classEvolutionId: evoDef?.id || evolutionId,
    classEvolutionTier: evoDef?.evolutionTier || 2,
    classEvolutionName: evolvedTitle,
    characterClass: evolvedTitle,
    learnedSkills: Array.from(new Set([...(cleanState.learnedSkills || []), ...(evoDef?.grantedSkillIds || [])])),
  };
}

// ============================================================
// 장비 +0~+20 강화 및 룬워드 각인
// ============================================================

function playerOwnsEquipmentDefinition(state: PlayerState, equipmentId: string): boolean {
  const def = EQUIPMENT_DATABASE[equipmentId];
  return Object.values(state.equipment || {}).includes(equipmentId) ||
    (state.inventory || []).some((item) => item.quantity > 0 && (
      item.equipmentId === equipmentId ||
      item.id === equipmentId ||
      (!!def && item.name === def.name)
    ));
}

export function enhanceEquipment(
  state: PlayerState,
  equipmentId: string,
): { nextState: PlayerState; success: boolean; message: string; cost?: number } {
  const def = EQUIPMENT_DATABASE[equipmentId];
  if (!def) return { nextState: state, success: false, message: '존재하지 않는 장비입니다.' };
  if (!playerOwnsEquipmentDefinition(state, equipmentId)) return { nextState: state, success: false, message: `${def.name}을(를) 보유하고 있지 않습니다.` };
  const current = normalizeEquipmentEnhancementState(state.equipmentEnhancements?.[equipmentId]);
  if (current.level >= 20) return { nextState: state, success: false, message: `${def.name}은(는) 이미 +20 최대 강화입니다.` };
  const cost = getEquipmentEnhancementCost(def, current.level);
  if ((state.rupees ?? 0) < cost) return { nextState: state, success: false, message: `루피가 부족합니다. (${cost} 루피 필요)`, cost };
  const enhancements = enhanceEquipmentEntry(state.equipmentEnhancements, equipmentId);
  const nextLevel = current.level + 1;
  const milestone = [5, 10, 15, 20].includes(nextLevel);
  return {
    nextState: { ...state, rupees: Math.max(0, state.rupees - cost), equipmentEnhancements: enhancements },
    success: true,
    cost,
    message: `${def.name} 강화 성공: +${nextLevel}${milestone ? ' · 룬워드 슬롯 해금!' : ''}`,
  };
}

export function socketEquipmentRuneword(
  state: PlayerState,
  equipmentId: string,
  milestone: EquipmentEnhancementMilestone,
  runeword: RunewordType,
): { nextState: PlayerState; success: boolean; message: string } {
  const def = EQUIPMENT_DATABASE[equipmentId];
  if (!def) return { nextState: state, success: false, message: '존재하지 않는 장비입니다.' };
  if (!playerOwnsEquipmentDefinition(state, equipmentId)) return { nextState: state, success: false, message: `${def.name}을(를) 보유하고 있지 않습니다.` };
  const result = socketRuneword(state.equipmentEnhancements, equipmentId, milestone, runeword);
  if (!result.success) return { nextState: state, success: false, message: result.reason || '룬워드 각인에 실패했습니다.' };
  return {
    nextState: { ...state, equipmentEnhancements: result.table },
    success: true,
    message: `${def.name} +${milestone} 슬롯에 룬워드를 각인했습니다.`,
  };
}

// ============================================================
// 13슬롯 장비 관리 시스템 (장착, 해제, 적성, 양손무기 처리)
// ============================================================

/**
 * 장비를 슬롯에 장착합니다.
 * - 양손 무기(isTwoHanded) 장착 시 보조장비(OFF_HAND)를 자동으로 해제하여 인벤토리로 안전 반환합니다.
 * - 보조장비(OFF_HAND) 장착 시 주무기가 양손 무기이면 주무기를 자동 해제합니다.
 * - 기존 슬롯에 착용 중이던 장비는 인벤토리로 안전하게 반환됩니다.
 */
export function equipItemToSlot(
  state: PlayerState,
  slot: EquipmentSlot,
  equipmentId: string
): { nextState: PlayerState; message: string } {
  const itemDef = EQUIPMENT_DATABASE[equipmentId];
  if (!itemDef) {
    return { nextState: state, message: '존재하지 않는 장비입니다.' };
  }

  // UI 필터를 우회해 호출하더라도 잘못된 슬롯/레벨 장비를 강제로 착용할 수 없게 엔진에서 검증한다.
  if (itemDef.slot !== slot) {
    return { nextState: state, message: `${itemDef.name}은(는) [${itemDef.slot}] 슬롯 전용 장비입니다.` };
  }
  if ((itemDef.requiredLevel ?? 1) > (state.level ?? 1)) {
    return { nextState: state, message: `${itemDef.name} 장착에는 Lv.${itemDef.requiredLevel}이 필요합니다.` };
  }

  let inventory = [...state.inventory];
  const equipment = { ...state.equipment };

  // 인벤토리에서 해당 장비 1개 차감
  const removeRes = removeItem(inventory, equipmentId, 1);
  if (removeRes.removedQuantity <= 0) {
    // 장비 이름으로도 확인
    const removeByName = removeItem(inventory, itemDef.name, 1);
    if (removeByName.removedQuantity <= 0) {
      return { nextState: state, message: `${itemDef.name}을(를) 보유하고 있지 않습니다.` };
    }
    inventory = removeByName.inventory;
  } else {
    inventory = removeRes.inventory;
  }

  const unequippedList: string[] = [];

  // 기존 해당 슬롯 장착 아이템 해제 및 인벤토리 회수
  const prevEquippedId = equipment[slot];
  if (prevEquippedId && EQUIPMENT_DATABASE[prevEquippedId]) {
    const prevDef = EQUIPMENT_DATABASE[prevEquippedId];
    inventory = addItem(inventory, {
      name: prevDef.name,
      quantity: 1,
      description: prevDef.description,
      equipmentId: prevDef.id,
    });
    unequippedList.push(prevDef.name);
  }

  // 양손 무기 특수 처리
  if (slot === 'MAIN_HAND' && itemDef.isTwoHanded) {
    const offHandId = equipment.OFF_HAND;
    if (offHandId && EQUIPMENT_DATABASE[offHandId]) {
      const offDef = EQUIPMENT_DATABASE[offHandId];
      inventory = addItem(inventory, {
        name: offDef.name,
        quantity: 1,
        description: offDef.description,
        equipmentId: offDef.id,
      });
      equipment.OFF_HAND = null;
      unequippedList.push(`${offDef.name} (양손 무기 착용으로 보조무기 자동 해제)`);
    }
  } else if (slot === 'OFF_HAND') {
    const mainHandId = equipment.MAIN_HAND;
    if (mainHandId && EQUIPMENT_DATABASE[mainHandId]?.isTwoHanded) {
      const mainDef = EQUIPMENT_DATABASE[mainHandId];
      inventory = addItem(inventory, {
        name: mainDef.name,
        quantity: 1,
        description: mainDef.description,
        equipmentId: mainDef.id,
      });
      equipment.MAIN_HAND = null;
      unequippedList.push(`${mainDef.name} (보조무기 착용으로 양손무기 자동 해제)`);
    }
  }

  equipment[slot] = equipmentId;

  // 장비가 부여하는 스킬은 전투 Actor 생성 시 현재 장착 장비에서만 계산한다.
  // learnedSkills에 영구 추가하면 장비를 한 번 착용한 뒤 해제해도 스킬이 남는 누수가 발생한다.
  let nextState: PlayerState = {
    ...state,
    equipment,
    inventory,
  };

  // 장비 변경으로 현재 음란도 등 파생 성인 상태 재계산
  nextState = recalculateAdultDerivedStatus(nextState);
  // ITEM_EQUIPPED 이벤트 디스패치
  const equipEv = dispatchGameEvent(nextState, 'ITEM_EQUIPPED', {
    itemId: itemDef.id,
    itemName: itemDef.name,
    equipmentSlot: slot,
  });
  nextState = equipEv.nextState;

  let message = `⚔️ ${itemDef.name}을(를) [${slot}] 슬롯에 장착했습니다.`;
  if (unequippedList.length > 0) {
    message += ` (기존 ${unequippedList.join(', ')} 인벤토리로 반환됨)`;
  }
  if (equipEv.messages.length > 0) {
    message += `\n${equipEv.messages.join('\n')}`;
  }

  return { nextState, message };
}

/**
 * 인벤토리 아이템을 사용하고 효과와 GameEvent를 순차 처리합니다.
 */
export function useInventoryItem(
  state: PlayerState,
  itemNameOrId: string,
  targetCharacterId?: string
): { nextState: PlayerState; success: boolean; message: string; changeSummary?: string[] } {
  const item = state.inventory.find(
    (i) => (i.id && i.id === itemNameOrId) || i.name.trim() === itemNameOrId.trim()
  );
  if (!item || item.quantity <= 0) {
    return { nextState: state, success: false, message: `가방에 [${itemNameOrId}]이(가) 없습니다.` };
  }

  const def = getItemDefinition(item.id || item.name);
  const inferredMeta = inferItemMetadata(item.id || item.name, item.description);
  const potionDef = POTION_DATABASE[item.id || ''] || Object.values(POTION_DATABASE).find((potion) => potion.name === item.name);
  // 이 함수는 인벤토리/탐험용 비전투 사용 경로다. 전투 전용 비약은 전투 아이템 UI에서만 소비한다.
  if (potionDef?.usableContext === 'COMBAT_ONLY') {
    return { nextState: state, success: false, message: `[${potionDef.name}]은(는) 전투 중에만 사용할 수 있습니다.` };
  }
  if (potionDef?.gameplayEffect.resurrectRatio && state.hp > 0) {
    return { nextState: state, success: false, message: `[${potionDef.name}]은(는) 전투 패배/사망 시 부활 처리에서 사용됩니다.` };
  }

  // 선물 아이템은 대상 없이 일반 사용으로 소비되면 안 된다.
  if (def?.giftValue) {
    if (!targetCharacterId) {
      return { nextState: state, success: false, message: '선물 아이템은 주요 인물 창에서 직접 만난 인물에게 사용해 주세요.' };
    }
    const giftTarget = state.majorCharacters?.[targetCharacterId];
    const hasMet = Boolean(giftTarget?.hasMet || (giftTarget?.interactionHistory?.length || 0) > 0);
    if (!giftTarget || !giftTarget.isAlive || !hasMet) {
      return { nextState: state, success: false, message: '아직 실제로 조우하지 않은 인물에게는 선물할 수 없습니다.' };
    }
    if (!giftTarget.currentHexId || giftTarget.currentHexId !== state.worldMap?.currentHexId) {
      return { nextState: state, success: false, message: `${giftTarget.name}와(과) 현재 같은 장소에 있지 않아 선물할 수 없습니다.` };
    }
  }

  let nextState = { ...state };
  const summaries: string[] = [];

  // 동적 보물지도/지도 아이템도 실제 용도를 가진다. 현재 Hex 주변 탐사 정보를 넓히고 단서를 기록한다.
  const isMapItem = (def?.category || item.category || inferredMeta.category) === 'MAP' || /지도|해도|항로도/.test(item.name);
  if (isMapItem) {
    nextState = revealAround(nextState, nextState.worldMap.currentHexId, 2);
    nextState = { ...nextState, storyFlags: Array.from(new Set([...(nextState.storyFlags || []), `MAP_READ:${def?.id || item.id || item.name}`])) };
    summaries.push('주변 지도 정보가 갱신되었습니다.');
  }

  // 기본 효과 산출
  let hpHeal = 0;
  let mpHeal = 0;
  let sanityHeal = 0;
  let customMsg = '';

  if (potionDef) {
    const effect = potionDef.gameplayEffect || {};
    // 숙면 물약은 즉시 999 회복하는 약이 아니라 '다음 야영 수면 완전 회복' 예약 효과다.
    hpHeal = potionDef.id === 'potion_deep_sleep' ? 0 : (effect.hpDelta || 0);
    if ((effect.hpPercent || 0) > 0) hpHeal += Math.round(nextState.maxHp * (effect.hpPercent || 0));
    mpHeal = effect.mpDelta || 0;
    sanityHeal = potionDef.id === 'potion_deep_sleep' ? 0 : (effect.sanityDelta || 0);
    customMsg = potionDef.effectLogText || potionDef.actionLogText;

    const durationMinutes = Math.max(0, Number(effect.durationMinutes ?? potionDef.durationMinutes ?? 0));
    if (durationMinutes > 0 && potionDef.statusEffectId) {
      const others = (nextState.activePotionEffects || []).filter((entry) => entry.statusEffectId !== potionDef.statusEffectId);
      nextState.activePotionEffects = [...others, { statusEffectId: potionDef.statusEffectId, sourceItemId: potionDef.id, name: potionDef.name, remainingMinutes: durationMinutes }];
      summaries.push(`${potionDef.gameplayEffect.buffName || potionDef.name} ${durationMinutes}분`);
    }
    if ((effect.energyDelta || 0) > 0) {
      // 별도 피로 수치가 없는 현 버전에서는 탐험/야영 행동 여력을 회복시키는 실제 자원으로 연결한다.
      const recovered = Math.max(1, Math.ceil((effect.energyDelta || 0) / 20));
      const before = nextState.campActionPoints || 0;
      nextState.campActionPoints = Math.min(3, before + recovered);
      if (nextState.campActionPoints > before) summaries.push(`행동 여력 +${nextState.campActionPoints - before}`);
    }
    if (effect.detoxPoison) nextState.explorationConditions = (nextState.explorationConditions || []).filter((condition) => !/POISON|TOXIN/i.test(condition));
    if (effect.healBleeding) nextState.explorationConditions = (nextState.explorationConditions || []).filter((condition) => !/BLEED/i.test(condition));
    if (effect.cureDisease) nextState.explorationConditions = (nextState.explorationConditions || []).filter((condition) => !/DISEASE|INFECTION|FEVER/i.test(condition));
  } else if (def?.useEffect) {
    hpHeal = def.useEffect.hpDelta || 0;
    mpHeal = def.useEffect.mpDelta || 0;
    sanityHeal = def.useEffect.sanityDelta || 0;
    if (def.useEffect.message) customMsg = def.useEffect.message;
  } else {
    // 정의가 없거나 커스텀 아이템일 때 이름 기반 기본 복구
    const name = item.name;
    if (name.includes('회복약') || name.includes('물약') || name.includes('포션')) {
      if (name.includes('상급') || name.includes('대형')) hpHeal = 90;
      else hpHeal = 35;
    }
    if (name.includes('마나')) {
      mpHeal = 40;
    }
    if (name.includes('정신') || name.includes('허브차') || name.includes('성수')) {
      sanityHeal = 25;
    }
    if (name.includes('엘릭서')) {
      hpHeal = nextState.maxHp;
      mpHeal = nextState.maxMana;
      sanityHeal = nextState.maxSanity;
    }
  }

  // 선물용 아이템인 경우 특정 캐릭터 호감도 처리
  if (def?.giftValue && targetCharacterId) {
    const majorChars = { ...(nextState.majorCharacters || INITIAL_MAJOR_CHARACTERS) };
    if (majorChars[targetCharacterId]) {
      const char = { ...majorChars[targetCharacterId] };
      const isFav = def.giftValue.preferredCharacters?.includes(targetCharacterId);
      const trustGain = isFav ? def.giftValue.baseTrustGain * 1.5 : def.giftValue.baseTrustGain;
      char.trust = Math.min(100, char.trust + trustGain);
      char.relationship = Math.min(100, char.relationship + trustGain);
      majorChars[targetCharacterId] = char;
      nextState.majorCharacters = majorChars;
      summaries.push(`🎁 ${char.name}에게 [${item.name}]을(를) 선물했습니다. (신뢰/호감 +${Math.round(trustGain)})`);
    }
  }

  // 아이템 소모 처리 (소비형인 경우 기본 1개 소모)
  const consumed = isMapItem ? false : (def ? (def.consumedOnUse !== false) : true);
  if (consumed) {
    const rmRes = removeItem(nextState.inventory, item.name, 1);
    nextState.inventory = rmRes.inventory;
  }

  // 상태 변화 적용 (HP, MP, Sanity)
  if (hpHeal !== 0 || mpHeal !== 0 || sanityHeal !== 0) {
    const changed = applyStateChanges(nextState, {
      hpDelta: hpHeal,
      manaDelta: mpHeal,
      sanityDelta: sanityHeal,
    });
    nextState = changed.nextState;
    if (hpHeal > 0) summaries.push(`체력 +${hpHeal}`);
    if (mpHeal > 0) summaries.push(`마나 +${mpHeal}`);
    if (sanityHeal > 0) summaries.push(`정신력 +${sanityHeal}`);
  }

  // ITEM_USED 이벤트 디스패치
  const evRes = dispatchGameEvent(nextState, 'ITEM_USED', {
    itemId: def?.id || item.id,
    itemName: item.name,
    quantity: 1,
    targetCharacterId,
  });
  nextState = evRes.nextState;
  if (evRes.messages.length > 0) {
    summaries.push(...evRes.messages);
  }

  const finalMsg = customMsg || `${isMapItem ? '🗺️' : '🧪'} [${item.name}]을(를) 사용했습니다. (${summaries.join(', ') || '효과 발동'})`;

  return {
    nextState,
    success: true,
    message: finalMsg,
    changeSummary: summaries,
  };
}

/**
 * 잠금장치를 해제(열쇠, 락픽, 완력, 마법 등)하고 상태와 GameEvent를 순차 처리합니다.
 */
export function attemptUnlockLock(
  state: PlayerState,
  lockId: string,
  method: UnlockMethod
): {
  nextState: PlayerState;
  success: boolean;
  message: string;
  statCheckResult?: StatCheckResult;
  rewardsSummary?: string[];
} {
  const lockDef = getLockDefinition(lockId);
  if (!lockDef) {
    return { nextState: state, success: false, message: '존재하지 않는 잠금장치입니다.' };
  }

  const unlockedLocks = [...(state.unlockedLocks || [])];
  if (unlockedLocks.includes(lockId)) {
    return { nextState: state, success: true, message: `이미 [${lockDef.name}]은(는) 해제되어 있습니다.` };
  }

  if (!lockDef.supportedMethods.includes(method)) {
    return {
      nextState: state,
      success: false,
      message: `[${lockDef.name}]은(는) 해당 방식(${method})으로 해제할 수 없습니다.`,
    };
  }

  let nextState = { ...state };
  let isSuccess = false;
  let statCheckResult: StatCheckResult | undefined;
  let methodMsg = '';

  switch (method) {
    case 'KEY': {
      if (!lockDef.keyItemId) {
        return { nextState: state, success: false, message: '맞는 열쇠가 지정되지 않았습니다.' };
      }
      const hasKey = nextState.inventory.find((i) => {
        const itemDef = getItemDefinition(i.id || i.name);
        return (i.id && i.id === lockDef.keyItemId) || itemDef?.id === lockDef.keyItemId;
      });
      if (!hasKey) {
        return {
          nextState: state,
          success: false,
          message: `해제에 필요한 열쇠/인장 [${lockDef.keyItemId}]을(를) 보유하고 있지 않습니다.`,
        };
      }
      isSuccess = true;
      methodMsg = `🔑 맞는 열쇠를 사용하여`;
      if (lockDef.consumeKeyOnUnlock) {
        const rm = removeItem(nextState.inventory, hasKey.name, 1);
        nextState.inventory = rm.inventory;
        methodMsg += ` (${hasKey.name} 소모)`;
      }
      break;
    }

    case 'LOCKPICK': {
      const difficulty = lockDef.difficultyByMethod?.LOCKPICK || 12;
      statCheckResult = performStatCheck('agility', difficulty, nextState.stats);
      if (statCheckResult.outcome === 'SUCCESS' || statCheckResult.outcome === 'CRITICAL_SUCCESS') {
        isSuccess = true;
        methodMsg = `🛠️ 정교한 락픽 솜씨로 자물쇠 핀을 맞추어`;
      } else if (statCheckResult.outcome === 'PARTIAL_SUCCESS') {
        isSuccess = true;
        methodMsg = `🛠️ 락픽으로 힘겹게 잠금을 해제했으나, 핀이 마모되었습니다.`;
      } else {
        isSuccess = false;
        methodMsg = `❌ 락픽 시도 실패: ${statCheckResult.description}`;
      }
      break;
    }

    case 'FORCE': {
      const difficulty = lockDef.difficultyByMethod?.FORCE || 14;
      statCheckResult = performStatCheck('strength', difficulty, nextState.stats);
      if (statCheckResult.outcome === 'SUCCESS' || statCheckResult.outcome === 'CRITICAL_SUCCESS') {
        isSuccess = true;
        methodMsg = `💪 압도적인 완력으로 빗장을 파괴하여`;
      } else {
        isSuccess = false;
        methodMsg = `❌ 완력 돌파 실패: ${statCheckResult.description}`;
      }
      break;
    }

    case 'MAGIC': {
      const difficulty = lockDef.difficultyByMethod?.MAGIC || 14;
      statCheckResult = performStatCheck('intelligence', difficulty, nextState.stats);
      if (statCheckResult.outcome === 'SUCCESS' || statCheckResult.outcome === 'CRITICAL_SUCCESS') {
        isSuccess = true;
        methodMsg = `✨ 비전 마력으로 술식을 해체하여`;
      } else {
        isSuccess = false;
        methodMsg = `❌ 마력 해체 실패: ${statCheckResult.description}`;
      }
      break;
    }

    case 'NPC_PERMISSION': {
      if (!lockDef.requiredNpcId) {
        return { nextState: state, success: false, message: '담당 인물이 지정되지 않았습니다.' };
      }
      const char = nextState.majorCharacters?.[lockDef.requiredNpcId] || INITIAL_MAJOR_CHARACTERS[lockDef.requiredNpcId];
      const reqTrust = lockDef.requiredNpcTrust || 50;
      if (!char || char.trust < reqTrust) {
        return {
          nextState: state,
          success: false,
          message: `${char?.name || '인물'}의 신뢰도가 부족합니다. (현재: ${char?.trust || 0} / 필요: ${reqTrust})`,
        };
      }
      const hasMet = Boolean(char.hasMet || (char.interactionHistory?.length || 0) > 0);
      if (!hasMet || !char.currentHexId || char.currentHexId !== nextState.worldMap?.currentHexId) {
        return {
          nextState: state,
          success: false,
          message: `${char.name}의 승인이 필요하지만 현재 같은 장소에 있지 않습니다.`,
        };
      }
      isSuccess = true;
      methodMsg = `📜 ${char.name}의 공식 승인과 협조를 얻어`;
      break;
    }

    case 'QUEST': {
      if (!lockDef.requiredQuestId) {
        return { nextState: state, success: false, message: '연계 퀘스트가 지정되지 않았습니다.' };
      }
      const quest = nextState.quests?.[lockDef.requiredQuestId];
      if (!quest || (quest.status !== 'ACTIVE' && quest.status !== 'COMPLETED')) {
        return {
          nextState: state,
          success: false,
          message: `연계 퀘스트를 진행해야 이 잠금을 해제할 수 있습니다.`,
        };
      }
      isSuccess = true;
      methodMsg = `📜 퀘스트 진행을 통해 봉인 조건을 충족하여`;
      break;
    }
  }

  if (!isSuccess) {
    return {
      nextState: state,
      success: false,
      message: `${methodMsg} [${lockDef.name}] 해제에 실패했습니다.`,
      statCheckResult,
    };
  }

  // 해제 성공 처리
  if (!unlockedLocks.includes(lockId)) {
    unlockedLocks.push(lockId);
  }
  nextState.unlockedLocks = unlockedLocks;

  const rewardSummaries: string[] = [];

  // 먼저 잠금 해제 이벤트를 커밋한다. 잠금 보상으로 획득하는 아이템이 다음 퀘스트 단계의
  // GAIN_ITEM 목표라면, 단계 전환 뒤 ITEM_GAINED 이벤트를 받아야 정상 진행된다.
  const evRes = dispatchGameEvent(nextState, 'LOCK_UNLOCKED', {
    lockId,
    lockName: lockDef.name,
    unlockMethod: method,
  });
  nextState = evRes.nextState;
  if (evRes.messages.length > 0) rewardSummaries.push(...evRes.messages);

  // 보상 지급
  if (lockDef.rewards) {
    const rw = lockDef.rewards;
    if (rw.exp || rw.rupees || (rw.items && rw.items.length > 0)) {
      const changed = applyStateChanges(nextState, {
        expGain: rw.exp,
        rupeeDelta: rw.rupees,
        addItems: rw.items,
      });
      nextState = changed.nextState;
      if (changed.changeSummary) rewardSummaries.push(...changed.changeSummary);
    }
    if (rw.storyFlags && rw.storyFlags.length > 0) {
      const flags = new Set([...(nextState.storyFlags || []), ...rw.storyFlags]);
      nextState.storyFlags = Array.from(flags);
      rewardSummaries.push(`스토리 플래그 활성화: ${rw.storyFlags.join(', ')}`);
    }
  }

  const successMessage = `🔓 ${methodMsg} [${lockDef.name}]을(를) 성공적으로 해제했습니다!\n${rewardSummaries.map((s) => `• ${s}`).join('\n')}`;

  return {
    nextState,
    success: true,
    message: successMessage,
    statCheckResult,
    rewardsSummary: rewardSummaries,
  };
}

/**
 * 특정 슬롯의 장비를 해제하여 인벤토리로 반환합니다.
 */
export function unequipItemFromSlot(
  state: PlayerState,
  slot: EquipmentSlot
): { nextState: PlayerState; message: string } {
  const currentEquippedId = state.equipment[slot];
  if (!currentEquippedId || !EQUIPMENT_DATABASE[currentEquippedId]) {
    return { nextState: state, message: '해당 슬롯에 장착된 장비가 없습니다.' };
  }

  const itemDef = EQUIPMENT_DATABASE[currentEquippedId];
  const equipment = { ...state.equipment };
  equipment[slot] = null;

  const inventory = addItem(state.inventory, {
    name: itemDef.name,
    quantity: 1,
    description: itemDef.description,
    equipmentId: itemDef.id,
  });

    let nextState: PlayerState = {
    ...state,
    equipment,
    inventory,
  };

  // 장비 해제로 현재 음란도 등 파생 성인 상태 재계산
  nextState = recalculateAdultDerivedStatus(nextState);

  return {
    nextState,
    message: `🛡️ ${itemDef.name}의 장착을 해제하여 가방에 보관했습니다.`,
  };
}

// ============================================================
// 생활 직업 (Professions) 제작 시스템
// ============================================================

export function craftRecipe(
  state: PlayerState,
  recipeId: string,
  isAtCamp: boolean = false
): { nextState: PlayerState; success: boolean; message: string; producedItemName?: string } {
  const recipe = RECIPE_DATABASE[recipeId];
  if (!recipe) {
    return { nextState: state, success: false, message: '존재하지 않는 제작 레시피입니다.' };
  }

  // 0. 생활 직업 요구 레벨 검사. 복합 제작은 여러 생활직업의 성장을 동시에 요구할 수 있다.
  const prof = state.professions.find((p) => p.professionId === recipe.professionId);
  const profLvl = prof ? prof.level : 1;
  const professionRequirements = recipe.professionRequirements?.length
    ? recipe.professionRequirements
    : [{ professionId: recipe.professionId, minimumLevel: recipe.requiredLevel }];
  for (const requirement of professionRequirements) {
    const progress = state.professions.find((p) => p.professionId === requirement.professionId);
    const currentLevel = progress?.level ?? 1;
    if (currentLevel < requirement.minimumLevel) {
      return { nextState: state, success: false, message: `[${PROFESSIONS_DATABASE[requirement.professionId]?.name || requirement.professionId}] 직업 레벨이 부족합니다. (필요: Lv.${requirement.minimumLevel}, 현재: Lv.${currentLevel})` };
    }
  }

  // 0-1. 요구 캠프 시설 검사
  if (recipe.requiredFacilityId) {
    const facility = state.campProgress?.facilities?.find((f) => f.facilityId === recipe.requiredFacilityId);
    const builtLvl = facility && facility.isBuilt ? facility.level : 0;
    if (builtLvl < 1) {
      const facilityName = CAMP_FACILITIES_DATABASE[recipe.requiredFacilityId as CampFacilityType]?.name || recipe.requiredFacilityId;
      return {
        nextState: state,
        success: false,
        message: `제작을 위해 캠프 시설 [${facilityName}]이(가) 구축되어 있어야 합니다.`,
      };
    }
  }

  // 1. 재료 보유량 검사 (야영지 체류 시 보관함 연동)
  let inventory = [...state.inventory];
  let storageItems = [...(state.campProgress?.storageItems || [])];

  for (const ing of recipe.ingredients) {
    const invCount = inventory
      .filter((i) => i.name.trim() === ing.itemName.trim())
      .reduce((sum, item) => sum + item.quantity, 0);

    const storageCount = isAtCamp
      ? storageItems
          .filter((i) => i.name.trim() === ing.itemName.trim())
          .reduce((sum, item) => sum + item.quantity, 0)
      : 0;

    if (invCount + storageCount < ing.quantity) {
      return {
        nextState: state,
        success: false,
        message: `제작에 필요한 재료 [${ing.itemName} x${ing.quantity}]이(가) 부족합니다. (소지: ${invCount}개${isAtCamp ? `, 보관함: ${storageCount}개` : ''})`,
      };
    }
  }

  // 2. 재료 차감 (인벤토리 우선 차감 후 보관함에서 잔여 차감)
  for (const ing of recipe.ingredients) {
    let remainingNeeded = ing.quantity;

    const invRes = removeItem(inventory, ing.itemName, remainingNeeded);
    inventory = invRes.inventory;
    remainingNeeded -= invRes.removedQuantity;

    if (remainingNeeded > 0 && isAtCamp) {
      const storRes = removeItem(storageItems, ing.itemName, remainingNeeded);
      storageItems = storRes.inventory;
    }
  }

  // 3. 성공률 및 품질 산출 (지능, 행운 보정)
  const luckBonus = (state.stats.luck ?? 5) * 0.5;
  const successChance = Math.min(100, (recipe.baseSuccessRate ?? 90) + (profLvl - recipe.requiredLevel) * 5 + luckBonus);
  const roll = Math.random() * 100;
  const isSuccess = roll <= successChance;

  if (!isSuccess) {
    return {
      nextState: {
        ...state,
        inventory,
        campProgress: {
          ...state.campProgress,
          storageItems,
        },
      },
      success: false,
      message: `💥 제작 중 집중이 흐트러져 재료가 손상되었습니다. (제작 실패)`,
    };
  }

  // 품질 결정: POOR, NORMAL, FINE, SUPERIOR, MASTERWORK
  const qualityRoll = Math.random() * 100 + luckBonus;
  let quality: 'POOR' | 'NORMAL' | 'FINE' | 'SUPERIOR' | 'MASTERWORK' = 'NORMAL';
  if (qualityRoll >= 95) quality = 'MASTERWORK';
  else if (qualityRoll >= 80) quality = 'SUPERIOR';
  else if (qualityRoll >= 60) quality = 'FINE';

  const outputQty = recipe.output.baseQuantity || 1;
  inventory = addItem(inventory, {
    name: recipe.output.itemName,
    quantity: outputQty,
    description: recipe.description,
    equipmentId: recipe.output.equipmentId,
    quality,
  });

  // 직업 경험치 획득 및 레벨업
  let leveledUp = false;
  let newProfLevel = 1;
  const updatedProfessions = state.professions.map((p) => {
    if (p.professionId === recipe.professionId) {
      let nextExp = (p.exp || 0) + recipe.expReward;
      let nextLevel = p.level || 1;
      let earnedSkillPoints = 0;
      while (nextLevel < 60) {
        const neededExp = nextLevel * 100;
        if (nextExp < neededExp) break;
        nextExp -= neededExp;
        nextLevel += 1;
        earnedSkillPoints += 1;
      }
      if (nextLevel >= 60) nextExp = 0;
      if (nextLevel > p.level) {
        leveledUp = true;
        newProfLevel = nextLevel;
      }
      return {
        ...p,
        level: nextLevel,
        exp: nextExp,
        skillPoints: (p.skillPoints ?? 0) + earnedSkillPoints,
      };
    }
    return p;
  });

  let nextState: PlayerState = {
    ...state,
    inventory,
    professions: updatedProfessions,
    campProgress: {
      ...state.campProgress,
      storageItems,
    },
  };

  // ITEM_CRAFTED 이벤트 디스패치
  const craftEv = dispatchGameEvent(nextState, 'ITEM_CRAFTED', {
    itemId: recipe.output.equipmentId || recipe.output.itemName,
    itemName: recipe.output.itemName,
    quantity: outputQty,
    quality,
    professionId: recipe.professionId,
  });
  nextState = craftEv.nextState;

  // 레벨업 시 PROFESSION_LEVEL_UP 디스패치
  if (leveledUp) {
    const lvlEv = dispatchGameEvent(nextState, 'PROFESSION_LEVEL_UP', {
      professionId: recipe.professionId,
      newLevel: newProfLevel,
    });
    nextState = lvlEv.nextState;
  }

  const qualityLabel = quality !== 'NORMAL' ? ` [품질: ${quality}]` : '';
  const message = `✨ [${PROFESSIONS_DATABASE[recipe.professionId].name}] ${recipe.output.itemName} x${outputQty}${qualityLabel} 제작에 성공했습니다! (경험치 +${recipe.expReward})`;

  return {
    nextState,
    success: true,
    message,
    producedItemName: recipe.output.itemName,
  };
}

// ============================================================
// 야영 (Camp) 시스템 (설치, 시설 업그레이드, 활동, 독서)
// ============================================================

export function setupCamp(state: PlayerState): { nextState: PlayerState; success: boolean; message: string } {
  let inventory = [...state.inventory];
  for (const cost of CAMP_SETUP_COST) {
    const has = inventory.find((i) => i.name.trim() === cost.itemName.trim() && i.quantity >= cost.quantity);
    if (!has) {
      return {
        nextState: state,
        success: false,
        message: `야영지 설치를 위해서는 [${cost.itemName} x${cost.quantity}]이(가) 필요합니다.`,
      };
    }
  }

  for (const cost of CAMP_SETUP_COST) {
    inventory = removeItem(inventory, cost.itemName, cost.quantity).inventory;
  }

  const nextState: PlayerState = {
    ...state,
    inventory,
    campActionPoints: 3,
  };

  return {
    nextState,
    success: true,
    message: '⛺ 모닥불을 피우고 안락한 야영지를 성공적으로 구축했습니다! (야영 행동력 3 충전)',
  };
}

export function upgradeCampFacility(
  state: PlayerState,
  facilityId: CampFacilityType
): { nextState: PlayerState; success: boolean; message: string } {
  const facilityDef = CAMP_FACILITIES_DATABASE[facilityId];
  if (!facilityDef) {
    return { nextState: state, success: false, message: '존재하지 않는 시설입니다.' };
  }

  const currentProgress = state.campProgress.facilities.find((f) => f.facilityId === facilityId);
  const currentLvl = currentProgress ? currentProgress.level : 0;
  const targetLvl = currentLvl + 1;

  if (targetLvl > facilityDef.maxLevel) {
    return { nextState: state, success: false, message: '이미 최대 레벨에 도달한 시설입니다.' };
  }

  const upgradeCost = facilityDef.upgradeCosts[targetLvl];
  if (!upgradeCost) {
    return { nextState: state, success: false, message: '업그레이드 정보가 없습니다.' };
  }

  let inventory = [...state.inventory];
  let rupees = state.rupees;

  if (upgradeCost.rupees && rupees < upgradeCost.rupees) {
    return { nextState: state, success: false, message: `루피가 부족합니다. (${upgradeCost.rupees} 루피 필요)` };
  }

  for (const ing of upgradeCost.ingredients) {
    const has = inventory.find((i) => i.name.trim() === ing.itemName.trim() && i.quantity >= ing.quantity);
    if (!has) {
      return { nextState: state, success: false, message: `재료 [${ing.itemName} x${ing.quantity}]이(가) 부족합니다.` };
    }
  }

  for (const ing of upgradeCost.ingredients) {
    inventory = removeItem(inventory, ing.itemName, ing.quantity).inventory;
  }
  if (upgradeCost.rupees) {
    rupees -= upgradeCost.rupees;
  }

  const updatedFacilities = state.campProgress.facilities.map((f) =>
    f.facilityId === facilityId ? { ...f, level: targetLvl, isBuilt: true } : f
  );
  if (!currentProgress) {
    updatedFacilities.push({ facilityId, level: targetLvl, isBuilt: true });
  }

  let nextState: PlayerState = {
    ...state,
    inventory,
    rupees,
    campProgress: {
      ...state.campProgress,
      facilities: updatedFacilities,
    },
  };

  // 최초 건설과 증축을 구분해 퀘스트/로그 이벤트가 정확히 반응하도록 한다.
  const facilityEventType = currentLvl <= 0 ? 'CAMP_FACILITY_BUILT' : 'CAMP_FACILITY_UPGRADED';
  const facilityEv = dispatchGameEvent(nextState, facilityEventType, {
    facilityId,
    newLevel: targetLvl,
  });
  nextState = facilityEv.nextState;

  // 시설별 상세 행동 연출 서사
  let narrativeLog = `🛠️ [${facilityDef.name}] 시설을 Lv.${targetLvl}(으)로 성공적으로 증축했습니다!`;
  if (facilityId === 'anvil') {
    if (targetLvl === 1) narrativeLog = `⚒️ 야영지 구석에 모루를 세우고 간이 화덕을 쌓았습니다. 망치 소리가 맑게 울려 퍼집니다. [간이 대장간 Lv.1 구축 완료]`;
    else if (targetLvl === 2) narrativeLog = `🔥 낡은 용광로를 보강하고 새로운 내화 벽돌을 차곡차곡 쌓았습니다. 풀무와 주괴 틀까지 세팅한 뒤 불을 붙이자 이전보다 훨씬 매서운 주황빛 열기가 피어오릅니다. [대장 작업장 Lv.1 → Lv.2 증축]`;
    else narrativeLog = `💥 고강도 강화 모루와 정밀 급랭 물통, 대형 용광로를 완성했습니다. 영주의 명품 무구 수련장에 가까운 웅장함이 감돕니다. [대장 작업장 Lv.2 → Lv.3 최고급 정제 완료]`;
  } else if (facilityId === 'alchemy_bench') {
    if (targetLvl === 1) narrativeLog = `🧪 나무 작업대 위에 유리 플라스크와 은은한 정제 비커를 가볍게 정렬했습니다. [연금술 플라스크 작업대 Lv.1 구축 완료]`;
    else if (targetLvl === 2) narrativeLog = `⚗️ 다단계 증류 관과 정밀 알코올 램프, 정제 막자를 도입했습니다. 비약의 불순물을 완전 추출할 준비가 끝났습니다. [연금 작업대 Lv.1 → Lv.2 증축]`;
    else narrativeLog = `✨ 마력 집속 룬 회로와 비전 촉매 추출기를 연동했습니다. 연금술 아틀리에급의 비약 연성 효율을 갖췄습니다. [연금 작업대 Lv.2 → Lv.3 최고급 구축]`;
  } else if (facilityId === 'leather_bench') {
    if (targetLvl === 1) narrativeLog = `🧵 통나무 작업대에 가죽 무두질용 칼과 집게, 건조대를 거치했습니다. [가죽 무두질 작업대 Lv.1 구축 완료]`;
    else if (targetLvl === 2) narrativeLog = `👞 정밀 무두질 재단틀과 마감 왁스 통을 세팅했습니다. 질긴 가죽도 촉촉하게 다듬어집니다. [가죽 작업대 Lv.1 → Lv.2 증축]`;
    else narrativeLog = `✨ 마력 직조 실과 방수 탄성 재단기를 갖추어 최고급 가죽 장비 제작 환경을 구비했습니다. [가죽 작업대 Lv.2 → Lv.3 최고급 구축]`;
  } else if (facilityId === 'cook_stove') {
    if (targetLvl === 1) narrativeLog = `🍲 모닥불 위에 튼튼한 무쇠 솥을 걸고 향신료 선반을 설치했습니다. [야영 조리 솥 Lv.1 구축 완료]`;
    else if (targetLvl === 2) narrativeLog = `🔥 화덕의 석조 벽을 쌓아 열 보존력을 높이고 보존식 건조대를 확충했습니다. [조리대 & 화덕 Lv.1 → Lv.2 증축]`;
    else narrativeLog = `🍗 대형 연회용 양념 선반과 만찬 오븐을 설치했습니다. 어떤 야생 식재료도 만찬으로 탈바꿈합니다. [조리대 & 화덕 Lv.2 → Lv.3 최고급 구축]`;
  } else if (facilityId === 'storage') {
    if (targetLvl === 1) narrativeLog = `📦 두꺼운 나무 판자로 견고한 원자재 궤짝을 조립했습니다. [야영지 보관함 Lv.1 (100kg) 구축 완료]`;
    else if (targetLvl === 2) narrativeLog = `📦 철제 띠와 이중 놋쇠 자물쇠로 궤짝을 강화하여 공간을 대폭 넓혔습니다. [야영지 보관함 Lv.1 → Lv.2 (250kg) 증축]`;
    else narrativeLog = `📦 내습 방수 마감 및 공간 확장 보강대를 더해 대용량 적재 창고를 구비했습니다. [야영지 보관함 Lv.2 → Lv.3 (500kg) 최고급 증축]`;
  } else if (facilityId === 'tent') {
    if (targetLvl === 1) narrativeLog = `⛺ 방수 가죽과 방충 향을 피워 포근한 천막을 쳤습니다. [가죽 천막 Lv.1 구축 완료]`;
    else if (targetLvl === 2) narrativeLog = `⛺ 이중 단열 방풍막과 안감을 가미하여 악천후에도 거뜬한 보금자리를 만들었습니다. [가죽 천막 Lv.1 → Lv.2 증축]`;
    else narrativeLog = `⛺ 넓은 대형 쉘터 천막으로 개편하여 완벽한 야외 거처로 변모시켰습니다. [가죽 천막 Lv.2 → Lv.3 최고급 증축]`;
  } else if (facilityId === 'campfire') {
    if (targetLvl === 1) narrativeLog = `🔥 돌을 고르고 나뭇가지를 모아 따스한 모닥불을 피웠습니다. [모닥불 Lv.1 구축 완료]`;
    else if (targetLvl === 2) narrativeLog = `🔥 석조 바람막이와 발열 마나석을 더해 야간 추위를 차단하는 화덕을 만들었습니다. [모닥불 Lv.1 → Lv.2 증축]`;
    else narrativeLog = `🔥 마법 화로를 완성하여 온 야영지를 포근하게 감싸는 성채 모닥불을 피워냈습니다. [모닥불 Lv.2 → Lv.3 최고급 증축]`;
  } else {
    narrativeLog = `🛠️ 자재를 모아 [${facilityDef.name}] 시설의 정밀도와 완성도를 향상시켰습니다. [${facilityDef.name} ${currentLvl === 0 ? '신규 건설' : `Lv.${currentLvl} → Lv.${targetLvl} 증축 완료`}]`;
  }

  return {
    nextState,
    success: true,
    message: narrativeLog,
  };
}

export function performCampSleep(state: PlayerState): { nextState: PlayerState; message: string } {
  const tent = state.campProgress.facilities.find((f) => f.facilityId === 'tent');
  const bed = state.campProgress.facilities.find((f) => f.facilityId === 'bed');

  let hpRestore = Math.round(state.maxHp * 0.8);
  let mpRestore = Math.round(state.maxMana * 0.8);
  let sanityRestore = Math.round(state.maxSanity * 0.8);

  if (tent && tent.isBuilt) {
    sanityRestore = state.maxSanity;
  }
  if (bed && bed.isBuilt) {
    hpRestore = state.maxHp;
    mpRestore = state.maxMana;
    sanityRestore = state.maxSanity;
  }
  if (hasActivePotionEffect(state, 'status_potion_deep_sleep')) {
    hpRestore = state.maxHp;
    mpRestore = state.maxMana;
    sanityRestore = state.maxSanity;
  }

  const currentHour =
    typeof state.currentHour === 'number'
      ? clamp(Math.floor(state.currentHour), 0, 23)
      : getTimeOfDayMigrationHour(state.timeOfDay);

  const currentMinute =
    typeof state.currentMinute === 'number'
      ? clamp(Math.floor(state.currentMinute), 0, 59)
      : 0;

  const currentMinutesOfDay = currentHour * 60 + currentMinute;

  // 기존 규칙 유지: 수면하면 항상 "다음 날 08:00"으로 이동합니다.
  const elapsedSleepMinutes =
    24 * 60 - currentMinutesOfDay + 8 * 60;

  let nextState: PlayerState = {
    ...state,
    hp: Math.min(state.maxHp, state.hp + hpRestore),
    mana: Math.min(state.maxMana, state.mana + mpRestore),
    sanity: Math.min(state.maxSanity, state.sanity + sanityRestore),
    campActionPoints: 3,
  };

  // 날짜/시각 + 감도/미약 시간 경과를 공통 엔진에서 정확히 한 번 처리합니다.
  nextState = advanceGameTime(nextState, elapsedSleepMinutes);

  // 가이드/일반 퀘스트의 CAMP_SLEEP 목표가 실제 수면을 인식하도록 정식 이벤트를 발생시킨다.
  const sleepEvent = dispatchGameEvent(nextState, 'CAMP_SLEEP', {
    isRest: true,
    elapsedMinutes: elapsedSleepMinutes,
  });
  nextState = sleepEvent.nextState;

  return {
    nextState,
    message: `🌅 모닥불 곁에서 깊은 수면을 취했습니다. 피로와 상처가 말끔히 치유되었습니다! (Day ${nextState.dayCount} 아침)`,
  };
}

export function readBookInCamp(
  state: PlayerState,
  bookName: string
): { nextState: PlayerState; success: boolean; message: string } {
  const bookDef = READABLE_BOOKS_DATABASE[bookName];
  if (!bookDef) {
    return { nextState: state, success: false, message: '독서 가능한 책이 아닙니다.' };
  }

  const hasBook = state.inventory.find((i) => i.name.trim() === bookName.trim());
  if (!hasBook) {
    return { nextState: state, success: false, message: `가방에 [${bookName}]이(가) 없습니다.` };
  }

  let nextState = { ...state };
  let rewardMsg = '';

  if (bookDef.knowledgeReward.exp) {
    const expRes = applyExperience(
      nextState.level,
      nextState.experience,
      nextState.statPoints,
      nextState.talentPoints,
      bookDef.knowledgeReward.exp
    );
    nextState.level = expRes.level;
    nextState.experience = expRes.experience;
    nextState.statPoints = expRes.statPoints;
    nextState.talentPoints = expRes.talentPoints;
    rewardMsg += ` 경험치 +${bookDef.knowledgeReward.exp}`;
  }

  if (bookDef.knowledgeReward.statBonus) {
    const sb = bookDef.knowledgeReward.statBonus;
    nextState.baseStats = {
      ...nextState.baseStats,
      [sb.stat]: (nextState.baseStats[sb.stat as keyof PlayerStats] || 5) + sb.value,
    };
    nextState.stats = calculateEffectiveStats(nextState.baseStats, nextState.race, nextState.beastkinType);
    rewardMsg += ` ${sb.stat} +${sb.value}`;
  }

  // ITEM_READ 이벤트 디스패치
  const readEv = dispatchGameEvent(nextState, 'ITEM_READ', {
    itemName: bookName,
    itemId: hasBook.id || bookName,
  });
  nextState = readEv.nextState;

  return {
    nextState,
    success: true,
    message: `📖 [${bookName}]을(를) 읽고 깊은 지식을 얻었습니다! (${rewardMsg.trim()})`,
  };
}

// ============================================================
// 가방 (Bag) 및 소지 무게 / 야영지 보관함 (Camp Storage) 시스템
// ============================================================

/**
 * 플레이어에게 가방을 장착합니다.
 * 기존에 장착 중이던 가방이 있다면 인벤토리로 안전하게 반환하고, 새 가방을 인벤토리에서 차감합니다.
 */
export function equipBagToPlayer(
  state: PlayerState,
  bagIdOrName: string
): { nextState: PlayerState; success: boolean; message: string } {
  const targetBagDef = getBagDefinition(bagIdOrName);
  if (!targetBagDef) {
    return { nextState: state, success: false, message: '존재하지 않는 가방입니다.' };
  }

  // 인벤토리에 해당 가방 아이템이 있는지 확인
  const invBagIndex = state.inventory.findIndex(
    (i) => i.bagId === targetBagDef.id || i.name.trim() === targetBagDef.name.trim() || i.id === targetBagDef.id
  );

  if (invBagIndex === -1 && state.equippedBagId !== targetBagDef.id) {
    return { nextState: state, success: false, message: `가방 [${targetBagDef.name}]을(를) 소지하고 있지 않습니다.` };
  }

  let inventory = [...state.inventory];
  const oldBagId = state.equippedBagId;

  // 인벤토리에서 새 가방 차감 (장착 중인 가방을 재장착하는 경우가 아닐 때)
  if (invBagIndex !== -1) {
    const item = inventory[invBagIndex];
    if (item.quantity > 1) {
      inventory[invBagIndex] = { ...item, quantity: item.quantity - 1 };
    } else {
      inventory.splice(invBagIndex, 1);
    }
  }

  // 기존 장착 가방 인벤토리에 반환
  if (oldBagId && oldBagId !== targetBagDef.id) {
    const oldBagDef = getBagDefinition(oldBagId);
    if (oldBagDef) {
      inventory = addItem(inventory, {
        name: oldBagDef.name,
        quantity: 1,
        description: oldBagDef.description,
        bagId: oldBagDef.id,
        category: 'EQUIPMENT',
        quality: 'NORMAL',
      });
    }
  }

  const nextState: PlayerState = {
    ...state,
    equippedBagId: targetBagDef.id,
    inventory,
  };

  const curWeight = calculateInventoryWeight(inventory, targetBagDef.id);
  const maxWeight = calculatePartyCarryWeight(nextState);

  return {
    nextState,
    success: true,
    message: `🎒 [${targetBagDef.name}]을(를) 장착했습니다! (적재 한도: ${curWeight}/${maxWeight} kg)`,
  };
}

/**
 * 플레이어의 장착 가방을 해제하여 인벤토리에 보관합니다.
 */
export function unequipBagFromPlayer(
  state: PlayerState
): { nextState: PlayerState; success: boolean; message: string } {
  if (!state.equippedBagId) {
    return { nextState: state, success: false, message: '장착 중인 가방이 없습니다.' };
  }

  const oldBagDef = getBagDefinition(state.equippedBagId);
  let inventory = [...state.inventory];

  if (oldBagDef) {
    inventory = addItem(inventory, {
      name: oldBagDef.name,
      quantity: 1,
      description: oldBagDef.description,
      bagId: oldBagDef.id,
      category: 'EQUIPMENT',
      quality: 'NORMAL',
    });
  }

  const nextState: PlayerState = {
    ...state,
    equippedBagId: null,
    inventory,
  };

  const curWeight = calculateInventoryWeight(inventory, null);
  const maxWeight = calculatePartyCarryWeight(nextState);

  return {
    nextState,
    success: true,
    message: `🎒 [${oldBagDef?.name || '가방'}] 장착을 해제하여 소지품에 넣었습니다. (적재 한도: ${curWeight}/${maxWeight} kg)`,
  };
}

/**
 * 특정 동료에게 가방을 장착시킵니다.
 */
export function equipBagToCompanion(
  state: PlayerState,
  companionId: string,
  bagIdOrName: string
): { nextState: PlayerState; success: boolean; message: string } {
  const companion = state.companions.find((c) => c.id === companionId);
  if (!companion) {
    return { nextState: state, success: false, message: '동료를 찾을 수 없습니다.' };
  }

  const targetBagDef = getBagDefinition(bagIdOrName);
  if (!targetBagDef) {
    return { nextState: state, success: false, message: '존재하지 않는 가방입니다.' };
  }

  const invBagIndex = state.inventory.findIndex(
    (i) => i.bagId === targetBagDef.id || i.name.trim() === targetBagDef.name.trim() || i.id === targetBagDef.id
  );

  if (invBagIndex === -1 && companion.equippedBagId !== targetBagDef.id) {
    return { nextState: state, success: false, message: `가방 [${targetBagDef.name}]이(가) 인벤토리에 없습니다.` };
  }

  let inventory = [...state.inventory];
  const oldBagId = companion.equippedBagId;

  if (invBagIndex !== -1) {
    const item = inventory[invBagIndex];
    if (item.quantity > 1) {
      inventory[invBagIndex] = { ...item, quantity: item.quantity - 1 };
    } else {
      inventory.splice(invBagIndex, 1);
    }
  }

  if (oldBagId && oldBagId !== targetBagDef.id) {
    const oldBagDef = getBagDefinition(oldBagId);
    if (oldBagDef) {
      inventory = addItem(inventory, {
        name: oldBagDef.name,
        quantity: 1,
        description: oldBagDef.description,
        bagId: oldBagDef.id,
        category: 'EQUIPMENT',
        quality: 'NORMAL',
      });
    }
  }

  const updatedCompanions = state.companions.map((c) =>
    c.id === companionId ? { ...c, equippedBagId: targetBagDef.id } : c
  );

  const nextState: PlayerState = {
    ...state,
    companions: updatedCompanions,
    inventory,
  };

  const partyMaxWeight = calculatePartyCarryWeight(nextState);

  return {
    nextState,
    success: true,
    message: `🎒 동료 [${companion.name}]에게 [${targetBagDef.name}]을(를) 장착시켰습니다! (파티 총 적재량: ${partyMaxWeight} kg)`,
  };
}

/**
 * 특정 동료의 가방을 해제하여 플레이어 인벤토리로 회수합니다.
 */
export function unequipBagFromCompanion(
  state: PlayerState,
  companionId: string
): { nextState: PlayerState; success: boolean; message: string } {
  const companion = state.companions.find((c) => c.id === companionId);
  if (!companion || !companion.equippedBagId) {
    return { nextState: state, success: false, message: '해제할 가방이 없습니다.' };
  }

  const oldBagDef = getBagDefinition(companion.equippedBagId);
  let inventory = [...state.inventory];

  if (oldBagDef) {
    inventory = addItem(inventory, {
      name: oldBagDef.name,
      quantity: 1,
      description: oldBagDef.description,
      bagId: oldBagDef.id,
      category: 'EQUIPMENT',
      quality: 'NORMAL',
    });
  }

  const updatedCompanions = state.companions.map((c) =>
    c.id === companionId ? { ...c, equippedBagId: null } : c
  );

  const nextState: PlayerState = {
    ...state,
    companions: updatedCompanions,
    inventory,
  };

  const partyMaxWeight = calculatePartyCarryWeight(nextState);

  return {
    nextState,
    success: true,
    message: `🎒 [${companion.name}]의 가방 [${oldBagDef?.name || '가방'}]을(를) 인벤토리로 회수했습니다. (파티 총 적재량: ${partyMaxWeight} kg)`,
  };
}

/**
 * 인벤토리 아이템을 야영지 보관함(Camp Storage)으로 이전합니다.
 */
export function transferItemToCampStorage(
  state: PlayerState,
  itemNameOrId: string,
  quantity: number
): { nextState: PlayerState; success: boolean; message: string } {
  if (quantity <= 0) {
    return { nextState: state, success: false, message: '이동할 수량이 올바르지 않습니다.' };
  }

  const targetItem = state.inventory.find(
    (i) => i.name.trim() === itemNameOrId.trim() || i.id === itemNameOrId || i.equipmentId === itemNameOrId || i.bagId === itemNameOrId
  );

  if (!targetItem || targetItem.quantity < quantity) {
    return { nextState: state, success: false, message: '소지품에 해당 아이템 수량이 부족합니다.' };
  }

  // 보관함 용량 한도 검사
  const storageFacility = state.campProgress.facilities.find((f) => f.facilityId === 'storage');
  const facilityLevel = storageFacility && storageFacility.isBuilt ? storageFacility.level : 1;
  const maxStorageCapacity = getCampStorageMaxCapacity(facilityLevel);

  const currentStorageItems = state.campProgress.storageItems || [];
  const currentStorageWeight = calculateCampStorageWeight(currentStorageItems);
  const singleWeight = getItemSingleWeight(targetItem);
  const transferWeight = Number((singleWeight * quantity).toFixed(2));

  if (currentStorageWeight + transferWeight > maxStorageCapacity) {
    return {
      nextState: state,
      success: false,
      message: `📦 야영지 보관함의 용량이 부족합니다! (현재: ${currentStorageWeight}/${maxStorageCapacity} kg, 필요: +${transferWeight} kg)`,
    };
  }

  // 1. 플레이어 인벤토리에서 차감
  const removeRes = removeItem(state.inventory, targetItem.name, quantity);

  // 2. 보관함에 추가
  const updatedStorageItems = addItem(currentStorageItems, {
    ...targetItem,
    quantity,
  });

  const nextState: PlayerState = {
    ...state,
    inventory: removeRes.inventory,
    campProgress: {
      ...state.campProgress,
      storageItems: updatedStorageItems,
    },
  };

  const newStorageWeight = calculateCampStorageWeight(updatedStorageItems);

  return {
    nextState,
    success: true,
    message: `📦 [${targetItem.name} x${quantity}]을(를) 야영지 보관함에 보관했습니다. (보관함: ${newStorageWeight}/${maxStorageCapacity} kg)`,
  };
}

/**
 * 야영지 보관함(Camp Storage)에서 인벤토리로 아이템을 꺼냅니다.
 */
export function transferItemFromCampStorage(
  state: PlayerState,
  itemNameOrId: string,
  quantity: number
): { nextState: PlayerState; success: boolean; message: string } {
  if (quantity <= 0) {
    return { nextState: state, success: false, message: '이동할 수량이 올바르지 않습니다.' };
  }

  const currentStorageItems = state.campProgress.storageItems || [];
  const targetItem = currentStorageItems.find(
    (i) => i.name.trim() === itemNameOrId.trim() || i.id === itemNameOrId || i.equipmentId === itemNameOrId || i.bagId === itemNameOrId
  );

  if (!targetItem || targetItem.quantity < quantity) {
    return { nextState: state, success: false, message: '보관함에 해당 아이템 수량이 부족합니다.' };
  }

  // 1. 보관함에서 차감
  const removeRes = removeItem(currentStorageItems, targetItem.name, quantity);

  // 2. 플레이어 인벤토리에 추가
  const updatedInventory = addItem(state.inventory, {
    ...targetItem,
    quantity,
  });

  const nextState: PlayerState = {
    ...state,
    inventory: updatedInventory,
    campProgress: {
      ...state.campProgress,
      storageItems: removeRes.inventory,
    },
  };

  const curWeight = calculateInventoryWeight(updatedInventory, nextState.equippedBagId);
  const maxWeight = calculatePartyCarryWeight(nextState);

  return {
    nextState,
    success: true,
    message: `🎒 보관함에서 [${targetItem.name} x${quantity}]을(를) 꺼내 가방에 넣었습니다. (현재 무게: ${curWeight}/${maxWeight} kg)`,
  };
}

/**
 * 인벤토리의 아이템을 버리거나 폐기합니다 (퀘스트/중요 열쇠 아이템 안전 방지).
 */
export function discardInventoryItem(
  state: PlayerState,
  itemNameOrId: string,
  quantity: number
): { nextState: PlayerState; success: boolean; message: string } {
  if (quantity <= 0) {
    return { nextState: state, success: false, message: '버릴 수량이 올바르지 않습니다.' };
  }

  const targetItem = state.inventory.find(
    (i) => (i.id && i.id === itemNameOrId) || i.name.trim() === itemNameOrId.trim() || i.equipmentId === itemNameOrId || i.bagId === itemNameOrId
  );

  if (!targetItem || targetItem.quantity < quantity) {
    return { nextState: state, success: false, message: '소지품에 해당 아이템 수량이 부족합니다.' };
  }

  const itemDef = getItemDefinition(targetItem.id || targetItem.name);
  const isQuestOrKey =
    itemDef?.category === 'QUEST' ||
    itemDef?.category === 'KEY' ||
    targetItem.name.includes('열쇠') ||
    targetItem.name.includes('인장') ||
    targetItem.name.includes('비전서') ||
    targetItem.name.includes('퀘스트') ||
    targetItem.name.includes('징표') ||
    targetItem.name.includes('문장');

  if (isQuestOrKey) {
    return {
      nextState: state,
      success: false,
      message: `⚠️ [${targetItem.name}]은(는) 중요한 물품(퀘스트/열쇠)이므로 버릴 수 없습니다.`,
    };
  }

  const removeRes = removeItem(state.inventory, targetItem.name, quantity);
  let nextState: PlayerState = {
    ...state,
    inventory: removeRes.inventory,
  };

  const lostEv = dispatchGameEvent(nextState, 'ITEM_LOST', {
    itemId: itemDef?.id || targetItem.id,
    itemName: targetItem.name,
    quantity,
  });
  nextState = lostEv.nextState;

  return {
    nextState,
    success: true,
    message: `🗑️ [${targetItem.name} x${quantity}]을(를) 버렸습니다.`,
  };
}

// ============================================================
// 동료 관리 시스템 (장비, 전술, 유대)
// ============================================================

export function setCompanionTactic(
  state: PlayerState,
  companionId: string,
  tactic: CompanionTactic
): PlayerState {
  const companions = state.companions.map((c) => (c.id === companionId ? { ...c, combatTactic: tactic } : c));
  return { ...state, companions };
}

export function toggleCompanionActiveParty(
  state: PlayerState,
  companionId: string
): PlayerState {
  const target = state.companions.find((c) => c.id === companionId);
  if (!target) return state;

  // 전투 엔진의 실제 상한(4명)과 UI/상태를 항상 일치시킨다.
  if (!target.isActivePartyMember) {
    const activeCount = state.companions.filter((c) => c.isActivePartyMember).length;
    if (activeCount >= 4) return state;
  }

  const companions = state.companions.map((c) =>
    c.id === companionId ? { ...c, isActivePartyMember: !c.isActivePartyMember } : c
  );
  return { ...state, companions };
}

/**
 * 신규 동료를 영입하고 CHARACTER_RECRUITED GameEvent를 발생시킵니다.
 */
export function recruitCompanion(
  state: PlayerState,
  companion: CompanionData
): { nextState: PlayerState; message: string } {
  const companions = [...(state.companions || [])];
  const existing = companions.find((c) => c.id === companion.id);
  if (existing) {
    return { nextState: state, message: `이미 [${companion.name}]은(는) 동료로 영입되어 있습니다.` };
  }

  const kind = companion.kind === 'PET' ? 'PET' : 'HUMANOID';
  const bondObj = companion.bond || {
    bondLevel: companion.bondLevel || 1,
    bondExp: companion.bondExp || 0,
    trust: companion.trust || 30,
    affection: companion.trust || 30,
    personalFlags: {},
  };
  const normalizedBond = {
    ...bondObj,
    trust: clamp(Number(bondObj.trust) || 0, 0, 100),
    affection: clamp(Number(bondObj.affection ?? bondObj.trust) || 0, 0, 100),
  };

  companions.push({
    ...companion,
    kind,
    petState: kind === 'PET' ? normalizePetState(companion.petState) : undefined,
    gender: kind === 'HUMANOID' ? '남성' : companion.gender,
    physicalAge: kind === 'HUMANOID' ? normalizeAdultHumanoidPhysicalAge(companion.physicalAge) : companion.physicalAge,
    needs: normalizeCompanionNeeds(companion.needs || createInitialCompanionNeeds()),
    bond: normalizedBond,
    isActivePartyMember: companion.isActivePartyMember ?? true,
    bondLevel: normalizedBond.bondLevel,
    trust: normalizedBond.trust,
  });

  let nextState: PlayerState = {
    ...state,
    companions,
  };

  // 주요 인물 상태가 있으면 isRecruited 플래그 갱신
  if (nextState.majorCharacters?.[companion.id]) {
    const majorChars = { ...nextState.majorCharacters };
    majorChars[companion.id] = {
      ...majorChars[companion.id],
      isRecruited: true,
      trust: Math.max(majorChars[companion.id].trust, normalizedBond.trust),
      relationship: Math.max(majorChars[companion.id].relationship, normalizedBond.affection),
    };
    nextState.majorCharacters = majorChars;
  }

  // CHARACTER_RECRUITED 이벤트 디스패치
  const evRes = dispatchGameEvent(nextState, 'CHARACTER_RECRUITED', {
    companionId: companion.id,
    characterId: companion.id,
    companionName: companion.name,
  });
  nextState = evRes.nextState;

  return {
    nextState,
    message: `🤝 [동료 영입] ${companion.name}이(가) 파티에 합류했습니다!`,
  };
}

/**
 * 3.3 펫 전용 영입 함수. 인간형 연령/성별 마이그레이션을 통과하지 않는다.
 */
export function recruitPet(
  state: PlayerState,
  speciesId: import('./types').PetSpeciesId,
  options: { source: import('./types').PetAcquisitionSource; id?: string; name?: string; level?: number; appearance?: string; active?: boolean },
): { nextState: PlayerState; message: string; petId: string } {
  if (options?.source !== 'SHOP' && options?.source !== 'SPECIAL_ENCOUNTER') {
    return { nextState: state, message: '펫은 상점 또는 특수 인카운터를 통해서만 획득할 수 있습니다.', petId: options?.id || '' };
  }
  const petId = options?.id || `pet_${speciesId.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  if ((state.companions || []).some(c => c.id === petId)) {
    return { nextState: state, message: `이미 같은 ID의 펫이 존재합니다.`, petId };
  }
  const pet = createPetCompanionData(speciesId, { ...options, id: petId });
  const recruited = recruitCompanion(state, pet);
  return {
    nextState: recruited.nextState,
    message: `🐾 [펫 획득/${options.source === 'SHOP' ? '상점' : '특수 인카운터'}] ${pet.name}이(가) 동반자가 되었습니다!`,
    petId,
  };
}

/** 3.3: 전용 펫 장착 칸. 보유 중인 펫 하나만 장착하며 전투 파티 편성과는 별개다. */
export function setEquippedPet(
  state: PlayerState,
  petId: string | null,
): { nextState: PlayerState; message: string } {
  if (petId === null) {
    return { nextState: { ...state, equippedPetId: null }, message: '🐾 펫 장착을 해제했습니다.' };
  }
  const pet = (state.companions || []).find((c) => c.id === petId && c.kind === 'PET' && c.petState);
  if (!pet) return { nextState: state, message: '장착할 수 있는 펫을 찾지 못했습니다.' };
  return { nextState: { ...state, equippedPetId: petId }, message: `🐾 ${pet.name}을(를) 펫 장착 칸에 등록했습니다.` };
}

/** 3.3 펫 요청 응답 엔진 공개 래퍼. */
export function respondPetRequest(
  state: PlayerState,
  petId: string,
  response: 'ACCEPT' | 'REFUSE',
): { nextState: PlayerState; message: string } {
  return respondToPetNeedRequest(state, petId, response);
}


/** 3.3 3차: 펫 돌봄/훈련 공개 래퍼. */
export function careForPet(
  state: PlayerState,
  petId: string,
  action: import('./types').PetCareAction,
): ReturnType<typeof performPetCare> {
  return performPetCare(state, petId, action);
}

export function upgradePetMetabolismPerk(state: PlayerState, petId: string): ReturnType<typeof upgradePetMetabolism> {
  return upgradePetMetabolism(state, petId);
}

/** 3.3 3차: 현재 친밀/충성/야생성을 명령 확률로 환산한다. */
export function getPetBehaviorRates(pet: CompanionData): PetCommandRates {
  return getPetCommandRates(pet);
}

/** 3.3 3차: 펫 명령 판정 공개 래퍼. */
export function issuePetCommand(
  state: PlayerState,
  petId: string,
  randomValue?: number,
): { nextState: PlayerState; outcome?: PetCommandOutcome; message: string } {
  return resolvePetCommand(state, petId, randomValue);
}

export function recordPetBattleCommandOutcome(state: PlayerState, petId: string, outcome: PetCommandOutcome): PlayerState {
  return recordPetCommandOutcome(state, petId, outcome);
}

/** 3.3 4차: 인벤토리의 실제 먹이 아이템을 1개 소비해 펫에게 급여한다. */
export function feedPet(state: PlayerState, petId: string, itemId: string) {
  return feedPetItem(state, petId, itemId);
}

/** 3.3 4차: 현재 인벤토리에서 해당 펫에게 줄 수 있는 먹이만 반환한다. */
export function getAvailablePetFoods(state: PlayerState, petId: string) {
  return getPetFoodOptions(state, petId);
}

/**
 * 동료와의 신뢰도 및 유대 경험치를 갱신하고 COMPANION_BOND_CHANGED 이벤트를 발생시킵니다.
 */
export interface CompanionRelationshipChange {
  trustDelta?: number;
  affectionDelta?: number;
  bondExpDelta?: number;
}

/**
 * 3.3 관계 시스템의 정식 변경 함수.
 * 신뢰도 / 호감도 / 유대 경험치를 서로 독립적으로 변경한다.
 */
export function modifyCompanionRelationship(
  state: PlayerState,
  companionId: string,
  change: CompanionRelationshipChange,
): { nextState: PlayerState; message: string } {
  const trustDelta = Number(change.trustDelta || 0);
  const affectionDelta = Number(change.affectionDelta || 0);
  const bondExpDelta = Number(change.bondExpDelta || 0);
  let companionName = companionId;

  const companions = (state.companions || []).map((c) => {
    if (c.id !== companionId) return c;
    companionName = c.name;
    const currentTrust = c.bond?.trust ?? c.trust ?? 0;
    const currentAffection = c.bond?.affection ?? currentTrust;
    const currentBondExp = c.bond?.bondExp ?? c.bondExp ?? 0;
    let currentBondLevel = c.bond?.bondLevel ?? c.bondLevel ?? 1;

    const nextTrust = clamp(currentTrust + trustDelta, 0, 100);
    const nextAffection = clamp(currentAffection + affectionDelta, 0, 100);
    const nextBondExp = Math.max(0, currentBondExp + bondExpDelta);
    while (nextBondExp >= currentBondLevel * 100 && currentBondLevel < 10) currentBondLevel += 1;

    const bond = {
      ...(c.bond || { personalFlags: {} }),
      trust: nextTrust,
      affection: nextAffection,
      bondExp: nextBondExp,
      bondLevel: currentBondLevel,
    };
    return { ...c, bond, trust: nextTrust, bondExp: nextBondExp, bondLevel: currentBondLevel };
  });

  let nextState: PlayerState = { ...state, companions };
  const majorEntry = Object.entries(nextState.majorCharacters || {}).find(([, m]) => m.id === companionId || m.companionId === companionId);
  if (majorEntry) {
    const [majorId, major] = majorEntry;
    nextState = {
      ...nextState,
      majorCharacters: {
        ...nextState.majorCharacters,
        [majorId]: {
          ...major,
          trust: clamp(major.trust + trustDelta, 0, 100),
          relationship: clamp(major.relationship + affectionDelta, -100, 100),
        },
      },
    };
  }

  const evRes = dispatchGameEvent(nextState, 'COMPANION_BOND_CHANGED', {
    companionId,
    trustDelta,
    affectionDelta,
    bondExpDelta,
  });
  nextState = evRes.nextState;

  const parts: string[] = [];
  if (trustDelta) parts.push(`신뢰도 ${trustDelta >= 0 ? '+' : ''}${trustDelta}`);
  if (affectionDelta) parts.push(`호감도 ${affectionDelta >= 0 ? '+' : ''}${affectionDelta}`);
  if (bondExpDelta) parts.push(`유대 경험치 ${bondExpDelta >= 0 ? '+' : ''}${bondExpDelta}`);
  return {
    nextState,
    message: `💖 [${companionName}]과의 관계가 변화했습니다.${parts.length ? ` (${parts.join(', ')})` : ''}`,
  };
}

/**
 * 3.2 호환 래퍼.
 * 기존 호출부는 신뢰 변화가 호감도에도 함께 반영되던 의미를 유지한다.
 * 3.3 신규 코드에서는 modifyCompanionRelationship()을 사용한다.
 */
export function modifyCompanionBond(
  state: PlayerState,
  companionId: string,
  trustDelta: number,
  bondExpDelta?: number
): { nextState: PlayerState; message: string } {
  return modifyCompanionRelationship(state, companionId, {
    trustDelta,
    affectionDelta: trustDelta,
    bondExpDelta: bondExpDelta || 0,
  });
}

/**
 * 스탯 판정을 수행하고 STAT_CHECK_RESOLVED GameEvent를 발생시킵니다.
 */
export function resolveStatCheckAction(
  state: PlayerState,
  stat: StatCheckType,
  difficulty: number
): { nextState: PlayerState; result: StatCheckResult; message: string } {
  const result = performStatCheck(stat, difficulty, state.stats);

  const evRes = dispatchGameEvent(state, 'STAT_CHECK_RESOLVED', {
    statType: stat,
    difficulty,
    checkOutcome: result.outcome,
  });

  return {
    nextState: evRes.nextState,
    result,
    message: result.description,
  };
}

/**
 * 새로운 지역에 진입하고 LOCATION_ENTERED GameEvent를 발생시킵니다.
 */
export function enterLocation(
  state: PlayerState,
  locationName: string
): { nextState: PlayerState; message: string } {
  const evRes = dispatchGameEvent(state, 'LOCATION_ENTERED', {
    location: locationName,
  });

  return {
    nextState: evRes.nextState,
    message: `📍 [${locationName}]에 진입했습니다.`,
  };
}

/**
 * 진행 중인 일반 인카운터 안에서 발생한 실제 지리 이동을 월드맵 Hex에 반영합니다.
 * 일반 인카운터와 여행 인카운터 모두 월드맵 실제 위치에 반영합니다.
 * 여행 인카운터에서 경로 밖으로 이동하면 현재 Hex에서 기존 목적지 경로를 중단합니다.
 */
export function movePlayerByEncounter(
  state: PlayerState,
  targetHexId?: string,
  locationName?: string,
  movementType?: EncounterMovementType,
  direction?: HexMoveDirection,
): { nextState: PlayerState; success: boolean; message: string } {
  if (!state.activeEncounterId) return { nextState: state, success: false, message: '진행 중인 인카운터가 없습니다.' };
  if (state.activeBattle) return { nextState: state, success: false, message: '전투 중의 위치 변화는 전투 시스템이 담당합니다.' };
  const interruptedTravel = Boolean(state.worldMap.travelSession?.active);
  const currentTravelUnit = interruptedTravel
    ? state.worldMap.travelSession?.encounters?.[state.worldMap.travelSession.currentEncounterIndex]
    : undefined;
  const current = WORLD_HEX_TILES[state.worldMap.currentHexId];
  if (!current) return { nextState: state, success: false, message: '현재 월드맵 위치를 찾을 수 없습니다.' };

  const resolvedTarget = resolveEncounterMovementTarget(state, targetHexId, direction);
  if (!resolvedTarget) {
    const attempted = targetHexId ? ` [${targetHexId}]` : direction ? ` ${direction} 방향` : '';
    return { nextState: state, success: false, message: `현재 인카운터에서${attempted}으로 실제 이동할 수 없습니다. 월드맵 위치는 유지됩니다.` };
  }
  const target = WORLD_HEX_TILES[resolvedTarget.hexId];
  if (!target) return { nextState: state, success: false, message: '유효하지 않은 월드맵 위치입니다.' };
  const access = canEnterHex(state, target);
  if (!access.ok) return { nextState: state, success: false, message: access.reason || '현재 해당 지역으로 이동할 수 없습니다.' };

  // 여행 인카운터에서 경로를 이탈하는 경우, 이미 해당 Hex까지 이동한 시간 중 현재 사건 몫은
  // 이 시점에 확정 소비한다. App 쪽에서는 이 행동의 일반 timeDelta를 0으로 유지해 중복 진행을 막는다.
  const movementBaseState = interruptedTravel && currentTravelUnit
    ? advanceGameTime(state, Math.max(1, Number(currentTravelUnit.minutes) || 1))
    : state;

  let nextState: PlayerState = {
    ...movementBaseState,
    worldMap: {
      ...movementBaseState.worldMap,
      currentHexId: target.id,
      currentRegionId: target.regionId,
      currentLayer: target.layer,
      activeEncounterHexId: target.id,
      lastSelectedHexId: target.id,
      exploredHexIds: Array.from(new Set([...(movementBaseState.worldMap.exploredHexIds || []), target.id])),
      discoveredHexIds: Array.from(new Set([...(movementBaseState.worldMap.discoveredHexIds || []), target.id])),
      mapRevision: (movementBaseState.worldMap.mapRevision || 0) + 1,
      // 인카운터 안에서 경로 밖의 실제 이동이 발생하면 기존 목적지 여행은 현재 Hex에서 중단한다.
      travelSession: interruptedTravel ? null : movementBaseState.worldMap.travelSession,
    },
  };
  nextState = revealAround(nextState, target.id, 1);
  const displayName = locationName || target.locationName || target.featureName || target.sectorName || target.id;
  const eventResult = dispatchGameEvent(nextState, 'LOCATION_ENTERED', {
    location: displayName,
    locationId: target.id,
    locationName: displayName,
  });
  return {
    nextState: eventResult.nextState,
    success: true,
    message: `📍 인카운터 진행에 따라 [${displayName}] Hex로 ${movementType === 'RUN' ? '달려' : movementType === 'ESCAPE' ? '도주해' : '이동해'} 진입했습니다.${interruptedTravel ? ' 기존 목적지 여행 경로는 현재 위치에서 중단되었습니다.' : ''}`,
  };
}

/**
 * 인물과 조우하거나 대화하고 CHARACTER_MET / CHARACTER_TALKED 이벤트를 발생시킵니다.
 */
export function interactWithCharacter(
  state: PlayerState,
  characterId: string,
  type: 'MET' | 'TALKED',
  characterName?: string
): { nextState: PlayerState; message: string } {
  const char = state.majorCharacters?.[characterId];
  if (!char || !char.isAlive) {
    return { nextState: state, message: '현재 상호작용할 수 있는 주요 인물이 아닙니다.' };
  }

  // 직접 대화는 반드시 먼저 실제 조우한 인물이며, 현재 같은 Hex에 있어야 한다.
  // MET 이벤트는 스토리/인카운터가 실제 조우를 성립시키는 진입점이므로 예외로 허용한다.
  if (type === 'TALKED') {
    const hasMet = Boolean(char.hasMet || (char.interactionHistory?.length || 0) > 0);
    if (!hasMet) {
      return { nextState: state, message: `${char.name}와(과) 아직 실제로 조우하지 않았습니다.` };
    }
    if (!char.currentHexId || char.currentHexId !== state.worldMap?.currentHexId) {
      return { nextState: state, message: `${char.name}와(과) 현재 같은 장소에 있지 않아 대화할 수 없습니다.` };
    }
  }

  const eventType = type === 'MET' ? 'CHARACTER_MET' : 'CHARACTER_TALKED';
  const evRes = dispatchGameEvent(state, eventType, {
    characterId,
    characterName: characterName || char.name,
  });

  return {
    nextState: evRes.nextState,
    message: `🗣️ ${characterName || char.name}와(과) ${type === 'MET' ? '조우' : '대화'}했습니다.`,
  };
}

export function acknowledgeQuestAlerts(state: PlayerState): PlayerState {
  if (!state.questAlertQuestIds?.length) return state;
  return { ...state, questAlertQuestIds: [] };
}

/**
 * 제안된 퀘스트(OFFERED)를 수락하여 ACTIVE 상태로 전환하고 첫 단계 상태 기반 목표를 즉시 평가합니다.
 */
export function acceptQuest(
  state: PlayerState,
  questId: string
): { nextState: PlayerState; success: boolean; message: string; systemMessages?: string[] } {
  const def = QUEST_DATABASE[questId];
  if (!def) {
    return { nextState: state, success: false, message: '퀘스트 정보를 찾을 수 없습니다.' };
  }

  const quests = { ...(state.quests || {}) };
  const currentProgress = quests[questId];
  if (currentProgress && currentProgress.status !== 'OFFERED' && currentProgress.status !== 'AVAILABLE') {
    return { nextState: state, success: false, message: '이미 진행 중이거나 완료된 퀘스트입니다.' };
  }

  const initialStageId = def.stages[0]?.stageId || 1;
  const newProgress: QuestProgress = {
    questId,
    status: 'ACTIVE',
    currentStageId: initialStageId,
    objectives: currentProgress?.objectives ? { ...currentProgress.objectives } : {},
    startedAt: Date.now(),
  };

  let nextState: PlayerState = {
    ...state,
    quests: {
      ...quests,
      [questId]: newProgress,
    },
    trackedQuestId: state.trackedQuestId || questId,
    questAlertQuestIds: (state.questAlertQuestIds || []).filter((id) => id !== questId),
  };

  const systemMessages: string[] = [`🌟 [퀘스트 수락] ${def.title}: ${def.summary || def.description}`];

  // 상태 기반 목표 즉시 재평가
  const firstStage = def.stages.find((s) => s.stageId === initialStageId);
  if (firstStage) {
    for (const obj of firstStage.objectives) {
      const stateCount = evaluateStateBasedObjective(nextState, obj);
      if (stateCount !== null) {
        const isComp = stateCount >= obj.requiredCount;
        newProgress.objectives[obj.id] = {
          currentCount: stateCount,
          isCompleted: isComp,
        };
        if (isComp) {
          systemMessages.push(`📜 [퀘스트 목표 달성] ${def.title} - ${obj.description}`);
        }
      }
    }

    const allRequiredCompleted = firstStage.objectives
      .filter((o) => !o.optional)
      .every((o) => newProgress.objectives[o.id]?.isCompleted);

    if (allRequiredCompleted) {
      if (firstStage.nextStageId) {
        newProgress.currentStageId = firstStage.nextStageId;
        const nextStageDef = def.stages.find((s) => s.stageId === firstStage.nextStageId);
        systemMessages.push(`✨ [퀘스트 단계 완료] ${def.title} -> 다음 단계: ${nextStageDef?.title || '진행'}`);
      } else {
        newProgress.status = 'COMPLETED';
        newProgress.completedAt = Date.now();
        systemMessages.push(`🏆 [퀘스트 완료] ${def.title}! 보상을 획득했습니다.`);
        const rewarded = grantQuestRewards(nextState, def.rewards);
        nextState = rewarded.state;
        systemMessages.push(...rewarded.messages);
      }
    }
  }

  nextState.quests[questId] = newProgress;

  return {
    nextState,
    success: true,
    message: `[${def.title}] 퀘스트를 수락했습니다.`,
    systemMessages,
  };
}

/**
 * 제안된 퀘스트(OFFERED)를 거절합니다.
 * COMPLETED/FAILED 처리하지 않고, declinedQuestIds에 기록하여 즉시 재제안을 방지합니다.
 */
export function declineQuest(
  state: PlayerState,
  questId: string
): { nextState: PlayerState; success: boolean; message: string } {
  const def = QUEST_DATABASE[questId];
  const quests = { ...(state.quests || {}) };

  if (quests[questId]) {
    delete quests[questId];
  }

  const declinedQuestIds = Array.from(new Set([...(state.declinedQuestIds || []), questId]));

  const nextState: PlayerState = {
    ...state,
    quests,
    declinedQuestIds,
    trackedQuestId: state.trackedQuestId === questId ? undefined : state.trackedQuestId,
  };

  return {
    nextState,
    success: true,
    message: def ? `[${def.title}] 퀘스트 제안을 거절했습니다.` : '퀘스트 제안을 거절했습니다.',
  };
}

// ============================================================
// 스탯 투자 및 상태 변화 적용
// ============================================================

export function allocateStatPoint(
  state: PlayerState,
  statKey: keyof PlayerStats
): { nextState: PlayerState; message: string } {
  const cleanState = sanitizePlayerState(state);
  const currentValue = cleanState.baseStats[statKey] ?? 5;
  const cost = getStatUpgradeCost(currentValue);

  if (cleanState.statPoints < cost) {
    return {
      nextState: cleanState,
      message: `스탯 포인트가 부족합니다. (${statKey} 현재 ${currentValue} -> 필요 포인트: ${cost})`,
    };
  }

  const nextBase = {
    ...cleanState.baseStats,
    [statKey]: currentValue + 1,
  };

  const nextStats = calculateEffectiveStats(nextBase, cleanState.race, cleanState.beastkinType);
  const nextStatPoints = cleanState.statPoints - cost;

  const learnedTalents = {
    ...(cleanState.learnedTalents || {}),
    ...(cleanState.talents?.learnedTalents || {}),
  };
  const { hpBonus, manaBonus, sanityBonus } = calculateTalentResourceBonuses(learnedTalents);
  const maxHp = calculateMaxHp(nextStats.vitality, cleanState.level, hpBonus);
  const maxSanity = calculateMaxSanity(nextStats.spirit, sanityBonus);
  const maxMana = calculateMaxMana(nextStats.intelligence, cleanState.level, manaBonus);

  const hpGain = statKey === 'vitality' ? 10 : 0;
  const manaGain = statKey === 'intelligence' ? 5 : 0;
  const sanityGain = statKey === 'spirit' ? 10 : 0;

  const nextHp = clamp((cleanState.hp || maxHp) + hpGain, 0, maxHp);
  const nextMana = clamp((cleanState.mana || maxMana) + manaGain, 0, maxMana);
  const nextSanity = clamp((cleanState.sanity || maxSanity) + sanityGain, 0, maxSanity);

  const nextState: PlayerState = {
    ...cleanState,
    baseStats: nextBase,
    stats: nextStats,
    statPoints: nextStatPoints,
    hp: nextHp,
    maxHp,
    sanity: nextSanity,
    maxSanity,
    mana: nextMana,
    maxMana,
    learnedTalents,
    talents: {
      ...cleanState.talents,
      category: cleanState.talents?.category || 'GENERAL',
      learnedTalents,
      unlockedNodeIds: cleanState.talents?.unlockedNodeIds || Object.keys(learnedTalents),
    },
  };

  return {
    nextState,
    message: `📈 [${statKey}] 능력치가 ${currentValue + 1}로 상승했습니다. (소모 포인트: ${cost})`,
  };
}

export function applyStateChanges(
  state: PlayerState,
  changes?: StateChanges
): { nextState: PlayerState; levelUpMessage?: string; changeSummary?: string[] } {
  // 직전 GM 로그에서 사용된 동료 욕구 임계 큐는 이번 상태 적용 시 소비한다.
  // 이후 시간 진행/스토리 로그에서 새로 발생한 임계 이벤트만 다음 GM 로그에 전달된다.
  const sanitizedState = sanitizePlayerState(state);
  const cleanState: PlayerState = { ...sanitizedState, companionNeedQueue: [] };
  const safeChanges: StateChanges = changes || {};
  const summaries: string[] = [];

  const learnedTalents = {
    ...(cleanState.learnedTalents || {}),
    ...(cleanState.talents?.learnedTalents || {}),
  };
  const { hpBonus, manaBonus, sanityBonus } = calculateTalentResourceBonuses(learnedTalents);
  let maxHp = calculateMaxHp(cleanState.stats.vitality, cleanState.level, hpBonus);
  let maxSanity = calculateMaxSanity(cleanState.stats.spirit, sanityBonus);
  let maxMana = calculateMaxMana(cleanState.stats.intelligence, cleanState.level, manaBonus);

  let hp = typeof safeChanges.hpDelta === 'number' ? clamp(cleanState.hp + safeChanges.hpDelta, 0, maxHp) : cleanState.hp;
  let sanity =
    typeof safeChanges.sanityDelta === 'number'
      ? clamp(cleanState.sanity + safeChanges.sanityDelta, 0, maxSanity)
      : cleanState.sanity;
  let mana =
    typeof safeChanges.manaDelta === 'number' ? clamp(cleanState.mana + safeChanges.manaDelta, 0, maxMana) : cleanState.mana;
  let rupees =
    typeof safeChanges.rupeeDelta === 'number' ? Math.max(0, cleanState.rupees + safeChanges.rupeeDelta) : cleanState.rupees;

  let currentLevel = cleanState.level;
  let currentExp = cleanState.experience;
  let statPoints = cleanState.statPoints;
  let talentPoints = cleanState.talentPoints;
  let levelUpMessage: string | undefined;

  if (typeof safeChanges.expGain === 'number' && safeChanges.expGain > 0) {
    const expResult = applyExperience(currentLevel, currentExp, statPoints, talentPoints, safeChanges.expGain);
    currentLevel = expResult.level;
    currentExp = expResult.experience;
    statPoints = expResult.statPoints;
    talentPoints = expResult.talentPoints;

    if (expResult.levelUpResult) {
      maxHp = calculateMaxHp(cleanState.stats.vitality, currentLevel, hpBonus);
      maxMana = calculateMaxMana(cleanState.stats.intelligence, currentLevel, manaBonus);
      hp = maxHp;
      mana = maxMana;
      levelUpMessage = `✨ 레벨 업! Lv.${expResult.levelUpResult.oldLevel} ➔ Lv.${expResult.levelUpResult.newLevel} (스탯 +${expResult.levelUpResult.earnedStatPoints}, 재능 +${expResult.levelUpResult.earnedTalentPoints})`;
    }
  }

  let inventory = [...cleanState.inventory];
  let equippedBagId = cleanState.equippedBagId;
  const actualItemsGained: Array<{ id?: string; name: string; quantity: number; quality?: 'POOR' | 'NORMAL' | 'FINE' | 'SUPERIOR' | 'MASTERWORK' }> = [];
  const actualItemsLost: Array<{ id?: string; name: string; quantity: number }> = [];

  if (Array.isArray(safeChanges.addItems) && safeChanges.addItems.length > 0) {
    safeChanges.addItems.forEach((item) => {
      if (item && item.name && typeof item.quantity === 'number' && item.quantity > 0) {
        const itemDef = getItemDefinition(item.id || item.name);
        const bagDef = getBagDefinition(item.bagId || item.id || item.name);
        const inferredMeta = inferItemMetadata(item.id || item.name, item.description);
        const isQuestOrKey =
          itemDef?.category === 'QUEST' ||
          itemDef?.category === 'KEY' ||
          item.name.includes('열쇠') ||
          item.name.includes('인장') ||
          item.name.includes('비전서') ||
          item.name.includes('퀘스트') ||
          item.name.includes('증표') ||
          item.name.includes('문장');

        const currentWeight = calculateInventoryWeight(inventory, equippedBagId);
        const currentCarryWeight = calculatePartyCarryWeight({ ...cleanState, inventory, equippedBagId });
        const encState = calculateEncumbranceState(currentWeight, currentCarryWeight);
        const isImportantOrBag = isQuestOrKey || Boolean(bagDef);

        if (encState.level === 'OVERLOADED' && !isImportantOrBag) {
          summaries.push(`⚠️ [심각한 과적 상태] 가방이 너무 무거워 [${item.name} x${item.quantity}]을(를) 더 이상 담지 못했습니다.`);
        } else {
          // 가방이 없는 상태에서 가방을 보상/인카운터로 획득하면 첫 1개는 즉시 장착한다.
          // 장착된 가방은 인벤토리 수량에 중복으로 남기지 않는다.
          const shouldAutoEquipBag = Boolean(bagDef) && !getBagDefinition(equippedBagId || '');
          const quantityToInventory = Math.max(0, item.quantity - (shouldAutoEquipBag ? 1 : 0));
          if (shouldAutoEquipBag && bagDef) {
            equippedBagId = bagDef.id;
            summaries.push(`🎒 자동 장착: ${bagDef.name}`);
          }
          if (quantityToInventory > 0) {
            inventory = addItem(inventory, {
              id: item.id || itemDef?.id || bagDef?.id,
              name: item.name,
              quantity: quantityToInventory,
              description: item.description || itemDef?.description || bagDef?.description || inferredMeta.description,
              flavorText: itemDef?.flavorText || bagDef?.flavorText,
              illustrationUrl: itemDef?.illustrationUrl || bagDef?.illustrationUrl,
              equipmentId: item.equipmentId || itemDef?.equipmentId,
              bagId: item.bagId || bagDef?.id,
              category: item.category || itemDef?.category || (bagDef ? 'EQUIPMENT' : inferredMeta.category),
              quality: item.quality || 'NORMAL',
            });
          }
          summaries.push(`획득: ${item.name} x${item.quantity}${isImportantOrBag && encState.level === 'OVERLOADED' ? ' (중요/가방 물품)' : ''}`);
          actualItemsGained.push({
            id: item.id || itemDef?.id || bagDef?.id,
            name: item.name,
            quantity: item.quantity,
            quality: (['POOR','NORMAL','FINE','SUPERIOR','MASTERWORK'] as const).includes(item.quality as any) ? item.quality as 'POOR' | 'NORMAL' | 'FINE' | 'SUPERIOR' | 'MASTERWORK' : undefined,
          });
        }
      }
    });
  }

  if (Array.isArray(safeChanges.removeItems) && safeChanges.removeItems.length > 0) {
    safeChanges.removeItems.forEach((item) => {
      if (item && item.name && typeof item.quantity === 'number' && item.quantity > 0) {
        const removeResult = removeItem(inventory, item.name, item.quantity);
        inventory = removeResult.inventory;
        if (removeResult.removedQuantity > 0) {
          summaries.push(`소실: ${item.name} x${removeResult.removedQuantity}`);
          const itemDef = getItemDefinition(item.name);
          actualItemsLost.push({
            id: itemDef?.id,
            name: item.name,
            quantity: removeResult.removedQuantity,
          });
        }
      }
    });
  }

const adultEligible =
  isAdultStatusEligible(cleanState);

const previousCorruption = clamp(
  cleanState.corruptionStatus?.corruption ?? 0,
  0,
  10
);

const rawCorruptionDelta =
  typeof safeChanges.corruptionDelta === 'number'
    ? safeChanges.corruptionDelta
    : 0;

const adjustedCorruptionDelta = rawCorruptionDelta > 0
  ? Math.min(
      ADULT_SYSTEM_CONFIG.permanentCorruption.maxGainPerLog,
      rawCorruptionDelta *
        getPermanentCorruptionGainMultiplier(previousCorruption)
    )
  : rawCorruptionDelta;

let corruptionStatus = {
  ...cleanState.corruptionStatus,
  effectiveCorruption:
    cleanState.corruptionStatus?.effectiveCorruption ?? previousCorruption,
  corruption: adultEligible
    ? clamp(previousCorruption + adjustedCorruptionDelta, 0, 10)
    : 0,
};

let adultStatus = cleanState.adultStatus
  ? { ...cleanState.adultStatus }
  : undefined;

if (adultEligible) {
  if (!adultStatus) {
    adultStatus = {
      desire: 0,
      effectiveDesire: 0,
      baseLewdness: 0,
      lewdness: 0,
      baseSensitivity: 0,
      sensitivity: 0,
      sensitivityDecayProgressMinutes: 0,
      aphrodisiacLevel: 0,
      aphrodisiacDecayProgressMinutes: 0,
      addiction: 0,
      clothingState: 'CLOTHED',
    };
  }

  if (typeof safeChanges.desireDelta === 'number') {
    adultStatus.desire = clamp(
      adultStatus.desire + safeChanges.desireDelta,
      0,
      100
    );
  }

  if (typeof safeChanges.lewdnessDelta === 'number') {
    adultStatus.baseLewdness = clamp(
      (adultStatus.baseLewdness ?? adultStatus.lewdness ?? 0) +
        safeChanges.lewdnessDelta,
      0,
      10
    );
  } else {
    adultStatus.baseLewdness = clamp(
      adultStatus.baseLewdness ?? adultStatus.lewdness ?? 0,
      0,
      10
    );
  }

  if (typeof safeChanges.sensitivityDelta === 'number') {
    adultStatus.baseSensitivity = clamp(
      (adultStatus.baseSensitivity ?? 0) + safeChanges.sensitivityDelta,
      0,
      100
    );
  }

  if (typeof safeChanges.aphrodisiacDelta === 'number') {
    const delta = safeChanges.aphrodisiacDelta;

    adultStatus.aphrodisiacLevel = clamp(
      (adultStatus.aphrodisiacLevel ?? 0) + delta,
      0,
      ADULT_SYSTEM_CONFIG.aphrodisiac.maxLevel
    );

    // 새 효과가 들어오면 감소 간격은 적용 시점부터 다시 계산합니다.
    if (delta > 0) {
      adultStatus.aphrodisiacDecayProgressMinutes = 0;
    }
  }

  if (typeof safeChanges.addictionDelta === 'number') {
    adultStatus.addiction = clamp(
      (adultStatus.addiction ?? 0) + safeChanges.addictionDelta,
      0,
      ADULT_SYSTEM_CONFIG.addiction.maxLevel
    );
  }

  if (safeChanges.clothingState) {
    adultStatus.clothingState = safeChanges.clothingState;
  }
} else {
  adultStatus = undefined;
}
  let nextState: PlayerState = {
    ...cleanState,
    level: currentLevel,
    experience: currentExp,
    statPoints,
    talentPoints,
    hp,
    maxHp,
    sanity,
    maxSanity,
    mana,
    maxMana,
    rupees,
    inventory,
    equippedBagId,

    adultStatus,
    corruptionStatus,
  };

  if (currentLevel > cleanState.level) {
    nextState = applyProgressionLevelMilestones(nextState, cleanState.level, currentLevel);
    summaries.push(`패시브 해방석 +${currentLevel - cleanState.level}`);
    if (cleanState.level < 5 && currentLevel >= 5) summaries.push('기본 전직 퀘스트가 발생했습니다.');
    if (cleanState.level < 20 && currentLevel >= 20 && nextState.combatClass && nextState.combatClass !== 'NONE') summaries.push('심화 전직 퀘스트가 발생했습니다.');
  }

  if (Array.isArray(safeChanges.bodyPayloadChanges) && safeChanges.bodyPayloadChanges.length > 0) {
    nextState = applyBodyPayloadChanges(nextState, safeChanges.bodyPayloadChanges);
  }
  if (safeChanges.bladderVoidRequested === true) nextState = voidBladder(nextState);
  if (safeChanges.customReflexTriggerOccurred === true && safeChanges.partnerCategory) {
    nextState = resolveReflexRelease(nextState, safeChanges.partnerCategory);
  }
  if (safeChanges.pregnancyRequest) {
    nextState = startPregnancy(nextState, safeChanges.pregnancyRequest.parentA, safeChanges.pregnancyRequest.parentB, safeChanges.pregnancyRequest.gestationMinutes);
  }
  if (Array.isArray(safeChanges.companionNeedChanges) && safeChanges.companionNeedChanges.length > 0) {
    nextState = applyCompanionNeedChanges(nextState, safeChanges.companionNeedChanges);
  }

  // Gemini/이벤트가 반환한 동료 유대 변화도 실제 상태에 적용한다.
  if (Array.isArray(safeChanges.companionBondChanges) && safeChanges.companionBondChanges.length > 0) {
    for (const bondChange of safeChanges.companionBondChanges) {
      if (!bondChange?.companionId) continue;
      if (!(nextState.companions || []).some((c) => c.id === bondChange.companionId)) continue;
      const bondResult = modifyCompanionBond(
        nextState,
        bondChange.companionId,
        typeof bondChange.trustDelta === 'number' ? bondChange.trustDelta : 0,
        typeof bondChange.bondExpGain === 'number' ? bondChange.bondExpGain : 0
      );
      nextState = bondResult.nextState;
      summaries.push(bondResult.message);
    }
  }

  nextState =
    recalculateAdultDerivedStatus(nextState);

  // 게임 시간 진행 (timeDeltaMinutes 지정 시)
  if (typeof safeChanges.timeDeltaMinutes === 'number' && safeChanges.timeDeltaMinutes > 0) {
    const validMinutes = clamp(Math.floor(safeChanges.timeDeltaMinutes), 1, 1440);
    nextState = advanceGameTime(nextState, validMinutes);
  }

  // 아이템 획득 이벤트는 '요청된 수량'이 아니라 실제 인벤토리/장착 상태에 반영된 수량만 디스패치한다.
  for (const item of actualItemsGained) {
    const itemDef = getItemDefinition(item.id || item.name);
    const res = dispatchGameEvent(nextState, 'ITEM_GAINED', {
      itemId: itemDef?.id || item.id,
      itemName: item.name,
      quantity: item.quantity,
      quality: item.quality,
    });
    nextState = res.nextState;
    if (res.messages.length > 0) summaries.push(...res.messages);
  }

  // 아이템 상실 이벤트 역시 실제 제거된 수량만 디스패치한다.
  for (const item of actualItemsLost) {
    const itemDef = getItemDefinition(item.id || item.name);
    const res = dispatchGameEvent(nextState, 'ITEM_LOST', {
      itemId: itemDef?.id || item.id,
      itemName: item.name,
      quantity: item.quantity,
    });
    nextState = res.nextState;
    if (res.messages.length > 0) summaries.push(...res.messages);
  }

  return { nextState, levelUpMessage, changeSummary: summaries };
}

export function clearGameData() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn('Clear game data failed:', err);
  }
}

export function saveGameData(playerState: PlayerState, messages: GameMessage[], suggestions: string[]) {
  try {
    const data = {
      playerState,
      messages,
      suggestions,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Auto-save failed:', err);
  }
}

export function loadGameData(): { playerState: PlayerState; messages: GameMessage[]; suggestions: string[] } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.playerState && Array.isArray(parsed.messages)) {
      let p = parsed.playerState;
      while (p && p.nextState && typeof p.nextState === 'object') {
        p = p.nextState;
      }

      const race: Race = p.race || 'HUMAN';
      const beastkinType: BeastkinType | undefined = p.beastkinType;
      const baseStats: PlayerStats = {
        strength: Number(p.baseStats?.strength ?? p.stats?.strength ?? 5),
        vitality: Number(p.baseStats?.vitality ?? p.stats?.vitality ?? 5),
        agility: Number(p.baseStats?.agility ?? p.stats?.agility ?? 5),
        intelligence: Number(p.baseStats?.intelligence ?? p.stats?.intelligence ?? 5),
        spirit: Number(p.baseStats?.spirit ?? p.stats?.spirit ?? 5),
        luck: Number(p.baseStats?.luck ?? p.stats?.luck ?? 5),
      };
      const effectiveStats: PlayerStats = calculateEffectiveStats(baseStats, race, beastkinType);
      const raceDef = getRaceDefinition(race, beastkinType);

      const charName = p.characterName || p.profile?.inGameName || p.profile?.name || '모험가';
      const fullProfile: CharacterProfile = {
        ...DEFAULT_CHARACTER_PROFILE,
        ...(p.profile || {}),
        inGameName: p.profile?.inGameName || p.profile?.name || charName,
        name: p.profile?.name || p.profile?.inGameName || charName,
        race: p.profile?.race || race,
        gender: '여성',
        beastkinType:
          race === 'BEASTKIN'
            ? p.profile?.beastkinType || beastkinType || 'CAT'
            : undefined,
        // 체형 탭의 저장값이 종족 기본값보다 항상 우선한다. 종족은 값이 없을 때만 fallback이다.
        height: Number(p.profile?.height ?? DEFAULT_CHARACTER_PROFILE.height),
        build: p.profile?.build ?? DEFAULT_CHARACTER_PROFILE.build,
        breastSize: p.profile?.breastSize || 'SLENDER',
        hipSize: p.profile?.hipSize || 'AVERAGE',
        speechStyle: p.profile?.speechStyle || DEFAULT_CHARACTER_PROFILE.speechStyle,
      };

      const learnedTalents: Record<string, number> = {
        ...(p.learnedTalents || {}),
        ...(p.talents?.learnedTalents || {}),
      };
      const { hpBonus, manaBonus, sanityBonus } = calculateTalentResourceBonuses(learnedTalents);
      const lvl = Math.max(1, Number(p.level) || 1);
      const maxHp = calculateMaxHp(effectiveStats.vitality, lvl, hpBonus);
      const maxSanity = calculateMaxSanity(effectiveStats.spirit, sanityBonus);
      const maxMana = calculateMaxMana(effectiveStats.intelligence, lvl, manaBonus);

      // 신규 시스템 마이그레이션 기본값 주입
      const equipment: EquippedItems = p.equipment || createInitialEquippedItems();
      const equippedBagId: string | null = p.equippedBagId !== undefined ? p.equippedBagId : 'backpack_traveler';
      const professions: ProfessionProgress[] = Array.isArray(p.professions) && p.professions.length > 0
        ? p.professions
        : createInitialProfessions();
      const campProgress = normalizeCampProgress(p.campProgress);
      const companions: CompanionData[] = (Array.isArray(p.companions) ? p.companions : []).map((c: any) => ({
        ...c,
        gender: '남성',
        physicalAge: normalizeAdultHumanoidPhysicalAge(c.physicalAge),
        needs: normalizeCompanionNeeds(c.needs || createInitialCompanionNeeds()),
        equippedBagId: c.equippedBagId !== undefined ? c.equippedBagId : null,
      }));
      const unlockedLocks: string[] = Array.isArray(p.unlockedLocks) ? p.unlockedLocks : [];
      const encounters = p.encounters || {};
      const scheduledEncounters = Array.isArray(p.scheduledEncounters) ? p.scheduledEncounters : [];
      const majorCharacters = { ...INITIAL_MAJOR_CHARACTERS, ...(p.majorCharacters || {}) };
      // 2.0.5: 기존 2.0 세이브에는 신규 45명의 customQuestIds: []가 저장되어 있다.
      // 사용자 진행 상태는 보존하면서, 이번 패치에서 공식 추가된 캐릭터 퀘스트 연결만 보강한다.
      for (const [characterId, defaultCharacter] of Object.entries(INITIAL_MAJOR_CHARACTERS)) {
        const patchQuestIds = (defaultCharacter.customQuestIds || []).filter((id) => id.startsWith('quest_v205_') || id.startsWith('quest_fate_'));
        if (patchQuestIds.length === 0) continue;
        const savedCharacter = majorCharacters[characterId];
        const savedQuestIds = Array.isArray(savedCharacter?.customQuestIds) ? savedCharacter.customQuestIds : [];
        const mergedQuestIds = Array.from(new Set([...savedQuestIds, ...patchQuestIds]));
        if (mergedQuestIds.length !== savedQuestIds.length) {
          majorCharacters[characterId] = { ...savedCharacter, customQuestIds: mergedQuestIds };
        }
      }
      for (const [characterId, character] of Object.entries(majorCharacters as Record<string, any>)) {
        if (character?.isRecruitable) {
          majorCharacters[characterId] = { ...character, gender: '남성' };
        }
      }
      const quests = p.quests && Object.keys(p.quests).length > 0
        ? p.quests
        : {
            quest_main_awakening: { questId: 'quest_main_awakening', status: 'ACTIVE', currentStageId: 1, objectives: {}, startedAt: Date.now() },
            ...Object.fromEntries(Object.keys(QUEST_DATABASE).filter((id)=>id.startsWith('guide_')&&id!=='guide_airship_flight'&&id!=='guide_recruitment').map((id)=>[id,{questId:id,status:'OFFERED' as const,currentStageId:1,objectives:{}}])),
          };
      const trackedQuestId = p.trackedQuestId || 'quest_main_awakening';
      const questAlertQuestIds = Array.isArray(p.questAlertQuestIds) ? Array.from(new Set(p.questAlertQuestIds.filter((id: string) => Boolean(quests[id])))) : Object.values(quests).filter((q: any)=>q.status==='OFFERED').map((q: any)=>q.questId);

      // 인벤토리 아이템 메타데이터 보강
      const rawInventory = Array.isArray(p.inventory) ? p.inventory : [];
      const inventory = rawInventory.map((item: any) => {
        const enriched = enrichInventoryItem(item);
        return {
          ...item,
          id: enriched.id,
          category: item.category || enriched.category,
          description: item.description || enriched.description,
          flavorText: item.flavorText || enriched.flavorText,
          illustrationUrl: item.illustrationUrl || enriched.illustrationUrl,
          bagId: item.bagId || getBagDefinition(item.id || item.name)?.id,
          quality: item.quality || 'NORMAL',
        };
      });

      // 시간 시스템 마이그레이션 (구 세이브 호환)
      const rawHour = typeof p.currentHour === 'number' ? p.currentHour : getTimeOfDayMigrationHour(p.timeOfDay);
      const currentHour = clamp(Math.floor(rawHour), 0, 23);
      const currentMinute = typeof p.currentMinute === 'number' ? clamp(Math.floor(p.currentMinute), 0, 59) : 0;
      const timeOfDay: TimeOfDay = getTimeOfDayFromHour(currentHour);
      const dayCount = Math.max(1, Number(p.dayCount || 1));

      // 성인 상태 시스템 마이그레이션 (구 세이브 호환)
      const adultEligible = isAdultPhysicalAge(fullProfile.physicalAge);

      const migratedAdultStatus = adultEligible
        ? {
            desire: clamp(Number(p.adultStatus?.desire ?? 0), 0, 100),
            effectiveDesire: clamp(Number(p.adultStatus?.effectiveDesire ?? p.adultStatus?.desire ?? 0), 0, 100),
            baseLewdness: clamp(
              Number(p.adultStatus?.baseLewdness ?? p.adultStatus?.lewdness ?? 0),
              0,
              10
            ),
            lewdness: clamp(Number(p.adultStatus?.lewdness ?? 0), 0, 10),
            baseSensitivity: clamp(
              Number(p.adultStatus?.baseSensitivity ?? p.adultStatus?.sensitivity ?? 0),
              0,
              100
            ),
            sensitivity: clamp(Number(p.adultStatus?.sensitivity ?? 0), 0, 100),
            sensitivityDecayProgressMinutes: Math.max(
              0,
              Math.floor(Number(p.adultStatus?.sensitivityDecayProgressMinutes ?? 0))
            ),
            aphrodisiacLevel: clamp(
              Number(p.adultStatus?.aphrodisiacLevel ?? 0),
              0,
              ADULT_SYSTEM_CONFIG.aphrodisiac.maxLevel
            ),
            aphrodisiacDecayProgressMinutes: Math.max(
              0,
              Math.floor(Number(p.adultStatus?.aphrodisiacDecayProgressMinutes ?? 0))
            ),
            addiction: clamp(
              Number(p.adultStatus?.addiction ?? 0),
              0,
              ADULT_SYSTEM_CONFIG.addiction.maxLevel
            ),
            clothingState:
              p.adultStatus?.clothingState === 'PARTIAL' ||
              p.adultStatus?.clothingState === 'NAKED'
                ? p.adultStatus.clothingState
                : ('CLOTHED' as const),
          }
        : undefined;

      const migratedCorruptionStatus = {
        corruption: adultEligible ? clamp(Number(p.corruptionStatus?.corruption ?? 0), 0, 10) : 0,
        effectiveCorruption: adultEligible ? clamp(Number(p.corruptionStatus?.effectiveCorruption ?? p.corruptionStatus?.corruption ?? 0), 0, 10) : 0,
      };

      const migratedAdultNarrativeQueue: AdultNarrativeCue[] =
        adultEligible && Array.isArray(p.adultNarrativeQueue)
          ? p.adultNarrativeQueue
              .filter((cue: any) => cue && typeof cue.type === 'string')
              .slice(-20)
          : [];

      const migratedPlayer: PlayerState = {
        ...p,
        characterName: charName,
        race,
        beastkinType,
        profile: fullProfile,
        level: lvl,
        experience: Math.max(0, Number(p.experience) || 0),
        statPoints: Math.max(0, Number(p.statPoints) || 0),
        talentPoints: Math.max(0, Number(p.talentPoints) || 0),
        combatClass: p.combatClass || 'NONE',
        classEvolutionTier: Math.max(1, Number(p.classEvolutionTier) || 1),
        learnedTalents,
        learnedSkills: Array.from(new Set([...(Array.isArray(p.learnedSkills) && p.learnedSkills.length > 0 ? p.learnedSkills : ['basic_attack','defend_stance','first_aid']), ...(race === 'DRAGONKIN' ? ['dragonkin_sacred_breath','dragonkin_scale_guard'] : [])])),
        activeBattle: p.activeBattle || null,
        baseStats,
        stats: effectiveStats,
        maxHp,
        hp: clamp(Number(p.hp) || maxHp, 0, maxHp),
        maxSanity,
        sanity: clamp(Number(p.sanity) || maxSanity, 0, maxSanity),
        maxMana,
        mana: clamp(Number(p.mana) || maxMana, 0, maxMana),
        passives: Array.isArray(p.passives) && p.passives.length > 0 ? p.passives : raceDef.passiveIds,
        storyFlags: Array.isArray(p.storyFlags) && p.storyFlags.length > 0 ? p.storyFlags : raceDef.storyFlags,
        isCharacterCreated: p.isCharacterCreated ?? true,
        equipment,
        equipmentEnhancements: p.equipmentEnhancements && typeof p.equipmentEnhancements === 'object' ? Object.fromEntries(Object.entries(p.equipmentEnhancements).map(([id, value]) => [id, normalizeEquipmentEnhancementState(value as any)])) : {},
        equippedBagId,
        professions,
        campProgress,
        campActionPoints: Number(p.campActionPoints ?? 3),
        companions,
        dragonkinState: race === 'DRAGONKIN' ? { hunterThreat: Math.max(0, Math.min(100, Number(p.dragonkinState?.hunterThreat ?? 10))), hunterEncounterCount: Math.max(0, Math.floor(Number(p.dragonkinState?.hunterEncounterCount ?? 0))) } : undefined,
        airship: p.airship && typeof p.airship === 'object' ? { ...DEFAULT_AIRSHIP_STATE, ...p.airship, unlockedUpgradeIds: Array.isArray(p.airship.unlockedUpgradeIds) ? p.airship.unlockedUpgradeIds : [] } : { ...DEFAULT_AIRSHIP_STATE },
        timeOfDay,
        dayCount,
        currentHour,
        currentMinute,
        unlockedLocks,
        encounters,
        scheduledEncounters,
        majorCharacters,
        quests,
        trackedQuestId,
        questAlertQuestIds,
        skillProgression: ensureProgressionState({ ...p, profile: fullProfile, race, baseStats, stats: effectiveStats } as PlayerState).skillProgression,
        fate: normalizeFateState(p.fate, p.worldMap?.currentRegionId || 'GRANDIA', p.worldMap?.currentHexId || 'SURFACE:-12:0', dayCount, p.dialogueCount),
        worldMap: p.worldMap ? { ...p.worldMap, travelSession: p.worldMap.travelSession?.active ? { ...p.worldMap.travelSession, status: p.worldMap.travelSession.status === 'ENCOUNTER_PAUSED' ? 'ENCOUNTER_PAUSED' : 'MOVING', currentPathIndex: Math.max(0, Math.floor(Number(p.worldMap.travelSession.currentPathIndex ?? p.worldMap.travelSession.completedHexSteps ?? 0))), pausedAtHexId: p.worldMap.travelSession.status === 'ENCOUNTER_PAUSED' ? (p.worldMap.travelSession.pausedAtHexId || p.worldMap.activeEncounterHexId || p.worldMap.currentHexId) : undefined } : null, activeEncounterHexId: p.activeEncounterId ? (p.worldMap.activeEncounterHexId || p.worldMap.currentHexId) : null, discoveredWaystationIds: Array.isArray(p.worldMap.discoveredWaystationIds) ? p.worldMap.discoveredWaystationIds : [], hostileSiteStates: p.worldMap.hostileSiteStates && typeof p.worldMap.hostileSiteStates === 'object' ? p.worldMap.hostileSiteStates : {} } : createInitialWorldMapState('THE_PELLESS_LOWER', Array.isArray(p.storyFlags) ? p.storyFlags : raceDef.storyFlags),
        dungeonExploration: p.dungeonExploration || null,
        dungeonRecords: p.dungeonRecords && typeof p.dungeonRecords === 'object' ? p.dungeonRecords : {},
        declinedQuestIds: Array.isArray(p.declinedQuestIds) ? p.declinedQuestIds : [],
        adultStatus: migratedAdultStatus,
        corruptionStatus: migratedCorruptionStatus,
        tattoos: Array.isArray(p.tattoos) ? p.tattoos : [],
        restraints: Array.isArray(p.restraints) ? p.restraints : [],
        adultNarrativeQueue: migratedAdultNarrativeQueue,
        companionNeedQueue: Array.isArray(p.companionNeedQueue) ? p.companionNeedQueue : [],
        bodyPayloads: normalizeSavedBodyPayloads(p.bodyPayloads),
        eggCohorts: Array.isArray(p.eggCohorts) ? p.eggCohorts.flatMap((cohort: any) => {
          if (!cohort || !['INSECTOID_EGG','TENTACLE_EGG'].includes(String(cohort.eggType || ''))) return [];
          if (!['COMPARTMENT_1','COMPARTMENT_2'].includes(String(cohort.compartmentId || ''))) return [];
          return [{
            ...cohort,
            count: Math.max(1, Math.floor(Number(cohort.count) || 1)),
            occupiedAmount: Math.max(0, Number(cohort.occupiedAmount) || 0),
            elapsedActiveMinutes: Math.max(0, Number(cohort.elapsedActiveMinutes) || 0),
            incubationMinutes: Math.max(1, Number(cohort.incubationMinutes) || EGG_SYSTEM_CONFIG.incubationMinutes[cohort.eggType as EggType]),
            stage: ['DORMANT','ACTIVE','DEVELOPING','HATCH_READY'].includes(String(cohort.stage || '')) ? cohort.stage : 'DORMANT',
            plannedGrowthMode: cohort.plannedGrowthMode === 'INSERTED' ? 'INSERTED' : 'INTERNAL',
          } as EggCohort];
        }) : [],
        parasiteStates: Array.isArray(p.parasiteStates) ? p.parasiteStates.map((parasite: any) => ({
          ...parasite,
          originRoute: parasite.originRoute || (parasite.originCompartmentId === 'COMPARTMENT_2' ? 'ANAL' : parasite.originCompartmentId === 'COMPARTMENT_1' ? 'VAGINAL' : undefined),
          maturationMinutes: Math.max(1, Number(parasite.maturationMinutes ?? parasite.incubationMinutes ?? PARASITE_GROWTH_CONFIG.maturationMinutes)),
          stage: parasite.stage === 'MATURE' ? 'MATURE' : parasite.stage === 'RESOLVING' ? 'RESOLVING' : parasite.stage === 'DEVELOPING' ? 'JUVENILE' : parasite.stage === 'JUVENILE' ? 'JUVENILE' : 'HATCHLING',
          compartmentId: undefined,
          incubationMinutes: undefined,
        })) : [],
        pheromoneState: p.pheromoneState && typeof p.pheromoneState === 'object' ? {
          ...createEmptyPheromoneState(),
          INSECTOID: { ...createEmptyPheromoneState().INSECTOID, ...(p.pheromoneState.INSECTOID || {}) },
          TENTACLE: { ...createEmptyPheromoneState().TENTACLE, ...(p.pheromoneState.TENTACLE || {}) },
        } : createEmptyPheromoneState(),
        defeatAdultEvent: p.defeatAdultEvent?.active ? p.defeatAdultEvent : null,
        bladderStatus: p.bladderStatus && typeof p.bladderStatus === 'object' ? {
          amount: clamp(Number(p.bladderStatus.amount ?? 0), 0, Number(p.bladderStatus.capacity ?? BLADDER_CONFIG.capacity)),
          capacity: Math.max(1, Number(p.bladderStatus.capacity ?? BLADDER_CONFIG.capacity)),
          urge: clamp(Number(p.bladderStatus.urge ?? 0), 0, 100),
          productionPerMinute: Math.max(0, Number(p.bladderStatus.productionPerMinute ?? BLADDER_CONFIG.productionPerMinute)),
        } : { amount: 0, capacity: BLADDER_CONFIG.capacity, urge: 0, productionPerMinute: BLADDER_CONFIG.productionPerMinute },
        pregnancy: p.pregnancy?.active ? p.pregnancy : undefined,
        dialogueCount: Math.max(0, Number(p.dialogueCount ?? 0)),
        activePotionEffects: Array.isArray(p.activePotionEffects) ? p.activePotionEffects.filter((effect: any) => effect && effect.statusEffectId && Number(effect.remainingMinutes) > 0).map((effect: any) => ({ statusEffectId: String(effect.statusEffectId), sourceItemId: String(effect.sourceItemId || ''), name: String(effect.name || effect.statusEffectId), remainingMinutes: Math.max(1, Math.floor(Number(effect.remainingMinutes) || 0)) })) : [],
        explorationConditions: Array.isArray(p.explorationConditions) ? Array.from(new Set(p.explorationConditions.filter(Boolean).map(String))) : [],
        inventory,
      };

      const normalizedPlayer = recalculateAdultDerivedStatus(sanitizePlayerState(migratedPlayer));

      return {
        playerState: normalizedPlayer,
        messages: parsed.messages,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      };
    }
  } catch (err) {
    console.warn('Auto-load failed:', err);
  }
  return null;
}
