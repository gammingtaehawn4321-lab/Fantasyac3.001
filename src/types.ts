import { CombatClassType } from './data/classes';
import { BattleState } from './combat/combatTypes';
import { EquippedItems, EquipmentEnhancementTable } from './data/equipment/equipmentTypes';
import { ProfessionProgress, ProfessionType } from './data/professions/professionTypes';
import { CampProgress, CampFacilityType } from './data/camp/campTypes';

export type Race = 'HUMAN' | 'ELF' | 'BEASTKIN' | 'YETI' | 'MERFOLK' | 'DRAGONKIN';
export type BeastkinType = 'FOX' | 'CAT' | 'DOG' | 'WOLF' | 'BIRD';
export type BuildType = 'SMALL' | 'AVERAGE' | 'LARGE';
export type BreastSizeType = 'SMALL' | 'SLENDER' | 'LARGE';
export type HipSizeType = 'SLIM' | 'AVERAGE' | 'FULL';
export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

// ============================================================
// v1.0 성장 / 운명 / 월드맵 시스템
// ============================================================
export type SkillGrade = 'BASIC' | 'ADVANCED' | 'UNIQUE';
export type PassiveGrade = 'BASIC' | 'ADVANCED' | 'UNIQUE';

export interface SkillProgressEntry {
  skillId: string;
  level: number;
  exp: number;
  unlocked: boolean;
}

export interface PassiveProgressEntry {
  passiveId: string;
  grade: PassiveGrade;
  level: number;
  copies: number;
  unlocked: boolean;
}

export interface SkillProgressionState {
  basicClassQuestCompleted: boolean;
  advancedClassQuestCompleted: boolean;
  basicClassChosen?: string;
  advancedClassChosen?: string;
  unlockedTreeNodeIds: string[];
  skillProgress: Record<string, SkillProgressEntry>;
  passiveProgress: Record<string, PassiveProgressEntry>;
  passiveAwakeningStones: number;
  knownPassiveRecipeIds: string[];
  uniquePassiveResidue: number;
  uniquePassivePity: number;
  acquiredUniqueActiveIds: string[];
  acquiredUniquePassiveIds: string[];
}

export type WorldRegionId = 'GRANDIA' | 'SEIRE' | 'FOREZIN' | 'SANTIMAC' | 'PROSTI' | 'SCROZE';
export type WorldMapLayer = 'SURFACE' | 'SKY' | 'CELESTIAL' | 'UNDERWATER' | 'DEEP_SEA' | 'UNDERGROUND' | 'DEEP_UNDERGROUND' | 'HELL';
export type HexTerrain =
  | 'PLAINS' | 'HILL' | 'FOREST' | 'RIVER' | 'URBAN' | 'COAST' | 'SEA' | 'DEEP_SEA'
  | 'SNOW' | 'MOUNTAIN' | 'FLOATING_LAND' | 'CLOUD' | 'STORM' | 'SHRINE'
  | 'CAVE' | 'TUNNEL' | 'UNDERGROUND_RIVER' | 'CHASM' | 'CRYSTAL_CAVE' | 'FUNGAL_CAVE' | 'MAGMA_RIFT' | 'DEEP_UNDERGROUND' | 'UNKNOWN';

export type RoutePreference = 'SHORTEST' | 'FASTEST' | 'SAFEST';

export interface AirshipState {
  built: boolean;
  name: string;
  level: number; // 0~5
  fuel: number;
  maxFuel: number;
  hull: number;
  maxHull: number;
  cargoLevel: number;
  engineLevel: number;
  navigationLevel: number;
  unlockedUpgradeIds: string[];
}

export interface TravelRangeBreakdown {
  base: number;
  raceBonus: number;
  passiveBonus: number;
  toolBonus: number;
  equipmentBonus: number;
  total: number;
  sources: string[];
}

export type DungeonKind = 'DEEP_DUNGEON' | 'TEMPLE' | 'GRAND_TEMPLE';
export type DungeonSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'MEGA';
export type DungeonTileKind =
  | 'WALL' | 'FLOOR' | 'ENTRANCE' | 'CORRIDOR' | 'ENEMY' | 'ELITE' | 'BOSS'
  | 'TREASURE' | 'LOOT_ROOM' | 'DOOR' | 'BUTTON' | 'ALTAR' | 'TRAP' | 'ADULT_TRAP' | 'EXIT';

export interface DungeonExplorationState {
  dungeonId: string;
  currentTileId: string;
  discoveredTileIds: string[];
  clearedTileIds: string[];
  openedDoorIds: string[];
  pressedButtonIds: string[];
  claimedTreasureIds: string[];
  triggeredTrapIds: string[];
  bossDefeated: boolean;
  completed: boolean;
  pendingCombatTileId?: string;
  pendingCombatMonsterId?: string;
  enteredAtDay: number;
}

export interface HexPosition {
  q: number;
  r: number;
  layer: WorldMapLayer;
}

export interface WorldNavigationTools {
  map: boolean;
  compass: boolean;
  telescope: boolean;
}

export interface WorldMapState {
  currentHexId: string;
  currentRegionId: WorldRegionId;
  currentLayer: WorldMapLayer;
  discoveredHexIds: string[];
  exploredHexIds: string[];
  routePreference: RoutePreference;
  skyTools: WorldNavigationTools;
  celestialTools: WorldNavigationTools;
  accessFlags: string[];
  lastSelectedHexId?: string;
  abellaLastKnownHexId?: string;
  /** 발견한 역참. 실제 이용 가능 여부는 현재 Hex와 역참 연결망으로 판정한다. */
  discoveredWaystationIds?: string[];
  mapRevision: number;
}

export type FateProgressStatus = 'SELECTED' | 'IN_PROGRESS' | 'BRANCHED' | 'COMPLETED' | 'ABANDONED';

export interface FateChoiceRecord {
  chapterId: string;
  choiceId: string;
  choiceLabel?: string;
  chosenAtDay: number;
  chosenAtDialogue: number;
}

export interface FateState {
  fateId: string;
  startingRegionId: WorldRegionId;
  startingHexId: string;
  /** 구 세이브 호환 필드. COMPLETED일 때 true로 유지한다. */
  resolved: boolean;
  status: FateProgressStatus;
  currentChapterId?: string;
  completedChapterIds: string[];
  choiceHistory: FateChoiceRecord[];
  fateFlags: string[];
  endingId?: string;
  permanentRewardIds: string[];
  startedAtDay: number;
  startedAtDialogue: number;
  completedAtDay?: number;
}


// ============================================================
// 한국어 시스템 라벨 매핑 및 헬퍼
// ============================================================
export const SYSTEM_LABELS: Record<string, string> = {
  // 턴 및 전투 단계
  PLAYER_TURN: '플레이어 턴',
  COMPANION_TURN: '동료 턴',
  ENEMY_TURN: '적의 턴',
  VICTORY: '전투 승리',
  DEFEAT: '전투 패배',
  ESCAPED: '도주 성공',
  ACTION_SELECT: '행동 선택',
  ACTION_RESOLVE: '행동 실행',
  ROUND_END: '라운드 종료',
  BATTLE_START: '전투 개시',
  ESCAPE_FAILED: '도주 실패',

  // 아이템 & 시스템
  ITEM_GAINED: '아이템 획득',
  ITEM_LOST: '아이템 소실',
  UNAVAILABLE: '사용할 수 없음',
  SUCCESS: '성공',
  FAILURE: '실패',
  CHARM: '매혹',
  CRITICAL: '치명타',
  BLOCKED: '방어됨',
  MISSED: '빗나감',
  EVADED: '회피함',
  STAGGERED: '흐트러짐!',

  // 기본 행동
  ATTACK: '공격',
  DEFEND: '방어',
  SKILL: '스킬',
  ITEM: '아이템',
  ESCAPE: '도주',

  // 상태이상 (StatusEffectType)
  BLEED: '출혈',
  POISON: '중독',
  STUN: '기절',
  SHIELD: '보호막',
  DEFEND_STANCE: '방어 태세',
  ATK_UP: '공격력 상승',
  DEF_UP: '방어력 상승',
  SPEED_UP: '속도 상승',
  TAUNT: '도발',
  REGENERATION: '재생',
  BLIND: '실명',
  SLOW: '둔화',
  WEAKEN: '공격력 저하',
  VULNERABLE: '취약 (방어 저하)',

  // 적 티어 (EnemyTier)
  WEAK: '하급',
  NORMAL: '일반',
  ELITE: '정예',
  BOSS: '보스',

  // AI 성향
  AGGRESSIVE: '공격적',
  DEFENSIVE: '방어적',
  TACTICAL: '전술적',
  BERSERK: '광포',
  SUPPORT: '지원형',

  // 종족 & 기본
  HUMAN: '인간',
  ELF: '엘프',
  BEASTKIN: '수인',
  FOX: '여우',
  CAT: '고양이',
  DOG: '개',
  WOLF: '늑대',
  BIRD: '조류',

  // 스탯 및 능력치
  strength: '근력',
  vitality: '체력',
  agility: '민첩',
  intelligence: '지능',
  spirit: '정신',
  luck: '행운',
  physicalAttack: '물리 공격력',
  physicalDefense: '물리 방어력',
  magicAttack: '마법 공격력',
  magicDefense: '마법 방어력',
  accuracy: '명중률',
  evasion: '회피율',
  criticalChance: '치명타율',
  criticalDamage: '치명타 피해',
  actionSpeed: '행동 속도',
  physicalPenetration: '물리 관통',
  statusHitRate: '상태이상 적중',
  statusResistance: '상태이상 저항',
  tenacity: '강인함 (흐트러짐 저항)',
  maxHp: '최대 체력',
  maxMp: '최대 마나',
  maxSanity: '최대 정신력',

  // 기본 전투 직업
  WARRIOR: '전사',
  ARCHER: '궁수',
  ROGUE: '도적',
  CLERIC: '성직자',
  DANCER: '무희',
  MAGE: '마법사',
  NONE: '무직',

  // 생활 직업
  BLACKSMITH: '대장장이',
  LEATHERWORKER: '가죽 세공인',
  ALCHEMIST: '연금술사',
  COOK: '요리사',
  CARPENTER: '목수',
  TAILOR: '재봉사',

  // 장비 슬롯
  MAIN_HAND: '주무기',
  OFF_HAND: '보조',
  HEAD: '투구',
  CHEST: '상의',
  LEGS: '하의',
  BOOTS: '신발',
  GLOVES: '장갑',
  RING_1: '반지 1',
  RING_2: '반지 2',
  NECKLACE: '목걸이',
  BRACELET: '팔찌',
  EARRING: '귀걸이',
  CLOAK: '망토',

  // 장비 등급
  COMMON: '일반',
  UNCOMMON: '고급',
  RARE: '희귀',
  EPIC: '영웅',
  LEGENDARY: '전설',

  // 제작 품질
  POOR: '조잡함',
  FINE: '우수',
  SUPERIOR: '고급',
  MASTERWORK: '명품',

  // 동료 전술
  BALANCED: '균형 전술',
  SUPPORT_PRIORITY: '지원 우선',
  HEAL_PRIORITY: '회복 우선',
  STATUS_PRIORITY: '상태이상 우선',
  RESOURCE_SAVING: '자원 절약',
};

export function getKoreanLabel(key: string, fallback?: string): string {
  if (!key) return fallback || '';
  if (SYSTEM_LABELS[key]) return SYSTEM_LABELS[key];
  return fallback || key;
}

// ============================================================
// 플레이어 행동 의도 및 판정 타입
// ============================================================
export type PlayerIntent =
  | 'EXPLORE'        // 주변 탐색/관찰
  | 'MOVE'           // 이동/진행
  | 'TALK'           // 대화/협상
  | 'SOCIAL'         // 사회적 상호작용
  | 'ROMANCE'        // 로맨스/유혹
  | 'ADULT_SOCIAL'   // 성인 관계/성인 인카운터 상호작용
  | 'TRADE'          // 거래/상점
  | 'USE_ITEM'       // 아이템 사용
  | 'COMBAT_ATTACK'  // 명시적 물리 공격/적대 돌격
  | 'COMBAT_PROVOKE' // 명시적 도발/무기 뽑고 위협
  | 'ESCAPE'         // 후퇴/도주
  | 'CAMP'           // 야영 설치/진입
  | 'CRAFT'          // 제작 활동
  | 'OTHER';         // 기타

export type StatCheckType = 'strength' | 'vitality' | 'agility' | 'intelligence' | 'spirit' | 'luck';

export type StatCheckOutcome = 'CRITICAL_SUCCESS' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE' | 'CRITICAL_FAILURE';

export interface StatCheckResult {
  stat: StatCheckType;
  difficulty: number;
  roll: number;
  statValue: number;
  totalScore: number;
  outcome: StatCheckOutcome;
  description: string;
}

export interface ActionInterpretation {
  intent: PlayerIntent;
  startsCombat: boolean;
  hostileAction: boolean;
  forcedCombat?: boolean;
  relationshipEventOccurred?: boolean;
  targetId?: string;
  description?: string;
  statCheckRequested?: {
    stat: StatCheckType;
    difficulty: number; // e.g. 10(쉬움), 14(보통), 18(어려움), 22(극난)
    reason: string;
  };
}

export interface RemoveItemResult {
  inventory: InventoryItem[];
  removedQuantity: number;
}

export interface AppliedItemChange {
  name: string;
  quantity: number;
  type: 'ADD' | 'REMOVE';
}

export interface PlayerStats {
  strength: number;     // 근력: 물리 공격력, 관통, 흐트러짐 피해, 완력 판정
  vitality: number;     // 체력: 최대 HP, 물리 방어, 강인함, 흐트러짐 저항, 상태이상 저항
  agility: number;      // 민첩: 행동 속도, 명중, 회피, 선공, 은신, 도주
  intelligence: number; // 지능: 마법 공격력, 최대 MP, 마법 효율, 상태이상 적중, 고급 제작
  spirit: number;       // 정신: 최대 정신력, 마법 방어, 상태이상 저항, 공포 저항, 의지 판정
  luck: number;         // 행운: 치명타율, 희귀 전리품, 제작 품질, 우연한 사건
}

export interface InventoryItem {
  id?: string; // 내부 고유 itemId (기존 세이브 호환을 위해 선택 필드)
  name: string;
  quantity: number;
  description?: string;
  flavorText?: string;
  illustrationUrl?: string;
  equipmentId?: string;
  bagId?: string;
  category?: ItemCategory;
  quality?: 'CRUDE' | 'POOR' | 'NORMAL' | 'FINE' | 'GOOD' | 'SUPERIOR' | 'EXCELLENT' | 'MASTERWORK';
}

export interface BeastFeatures {
  earDescription?: string;
  earColor?: string;
  tailDescription?: string;
  tailColor?: string;
  furDescription?: string;
  wingDescription?: string;
  wingColor?: string;
  hasWings?: boolean;
}

export interface SpeechStyleData {
  presetId?: string;
  description: string;
  tone?: string;
  politeness?: string;
  quirks?: string[];
  exampleLines?: string[];
}

export interface CharacterProfile {
  inGameName: string; // 인게임 공식 이름
  name: string;
  gender: string;
  physicalAge: number;
  race: Race;
  beastkinType?: BeastkinType;
  height: number;
  build: BuildType;
  breastSize: BreastSizeType;
  hipSize: HipSizeType;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  skinDescription: string;
  features: string;
  appearance: string;
  speechStyle: SpeechStyleData;
  portraitUrl?: string;
  beastFeatures?: BeastFeatures;
}

// =========================
// 특수 상태 시스템
// =========================

export type PartnerCategory = 'HUMANOID' | 'ABERRANT';
export type SapienceType = 'SAPIENT' | 'INSTINCTIVE' | 'HIVE' | 'UNKNOWN';
export type BodyCompartmentId = 'COMPARTMENT_1' | 'COMPARTMENT_2' | 'COMPARTMENT_3';
export type BodyPayloadKind = 'STANDARD_FLUID' | 'INSECTOID_SECRETION' | 'URINE' | 'EGG' | 'PARASITE' | 'OTHER';
export type BodyPayloadVisualKind = 'MATERIAL' | 'EGG' | 'PARASITE'; // legacy visual grouping
export type BodyPayloadChannel = 'A' | 'B' | 'C';
export type BodyPayloadSourceType = 'CHARACTER' | 'MONSTER' | 'PARASITE' | 'ENVIRONMENT' | 'UNKNOWN';
export type BodyPayloadSourceSex = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export interface BodyPayloadTimestamp { day: number; hour: number; minute: number; }
export type BodyLoadStage = 'EMPTY' | 'TRACE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'SATURATED';
export type ParasiteMode = 'INSERTED' | 'INTERNAL';
export type ParasiteStage = 'DORMANT' | 'DEVELOPING' | 'MATURE' | 'RESOLVING';
export type InternalParasiteRegion = 'ENTRY_REGION' | 'ABDOMINAL_REGION' | 'SYSTEMIC' | 'CUSTOM';

export interface PartnerClassification {
  category: PartnerCategory;
  sapience: SapienceType;
  speciesId?: string;
  aberrantSubtype?: string;
}

export interface BodyPayloadEntry {
  id: string;
  compartmentId: BodyCompartmentId;
  payloadKind: BodyPayloadKind;
  /** 사용자 정의 내용물 3계열. UI/삽화/몬스터 배출량은 이 채널을 기준으로 한다. */
  payloadChannel?: BodyPayloadChannel;
  /** 같은 세부종/채널을 동일 물질 계열로 취급하기 위한 내부 키. UI에는 노출하지 않는다. */
  payloadFamilyKey?: string;
  amount: number;

  // 출처 추적: 같은 종족이라도 sourceId/sourceName이 다르면 별도 내용물 묶음으로 유지한다.
  sourceId?: string;
  sourceName?: string;
  sourceSpeciesId?: string;
  sourceSpeciesName?: string;
  sourceType?: BodyPayloadSourceType;
  sourceSex?: BodyPayloadSourceSex;
  sourceEventId?: string;

  firstAddedAt?: BodyPayloadTimestamp;
  lastAddedAt?: BodyPayloadTimestamp;

  elapsedMinutes: number;
  decayPerHour?: number;
}

export interface ParasiteState {
  id: string;
  speciesId: string;
  mode: ParasiteMode;
  originCompartmentId?: BodyCompartmentId;
  compartmentId?: BodyCompartmentId;
  currentRegion?: InternalParasiteRegion;
  count: number;
  elapsedMinutes: number;
  incubationMinutes: number;
  stage: ParasiteStage;
  removable: boolean;
  emissionProgressMinutes?: number;
  emissionIntervalMinutes?: number;
  emissionAmount?: number;
}

export interface BladderStatus {
  amount: number;
  capacity: number;
  urge: number;
  productionPerMinute: number;
}

export type PregnancyStage = 'NONE' | 'EARLY' | 'MID' | 'LATE' | 'READY';
export interface PregnancyState {
  active: boolean;
  parentASpeciesId?: string;
  parentBSpeciesId?: string;
  childSpeciesId?: string;
  startedAtDay: number;
  startedAtHour: number;
  startedAtMinute: number;
  elapsedMinutes: number;
  gestationMinutes: number;
  stage: PregnancyStage;
}

export interface BodyPayloadChange {
  operation: 'ADD' | 'REMOVE' | 'SET';
  compartmentId: BodyCompartmentId;
  payloadKind: BodyPayloadKind;
  payloadChannel?: BodyPayloadChannel;
  payloadFamilyKey?: string;
  amount: number;

  // Gemini/게임 이벤트가 알고 있는 출처 정보를 그대로 엔진으로 전달한다.
  sourceId?: string;
  sourceName?: string;
  sourceSpeciesId?: string;
  sourceSpeciesName?: string;
  sourceType?: BodyPayloadSourceType;
  sourceSex?: BodyPayloadSourceSex;
  sourceEventId?: string;

  parasiteMode?: ParasiteMode;
}

export type ClothingState =
  | 'CLOTHED'
  | 'PARTIAL'
  | 'NAKED';

export type AddictionTier =
  | 'NONE'
  | 'MILD'
  | 'MODERATE'
  | 'SEVERE'
  | 'EXTREME';

export type AdultNarrativeCueType =
  | 'DESIRE_INCREASE'
  | 'DESIRE_HIGH'

  | 'LEWDNESS_INCREASE'
  | 'LEWDNESS_HIGH'

  | 'SENSITIVITY_INCREASE'
  | 'SENSITIVITY_DECREASE'
  | 'SENSITIVITY_HIGH'

  | 'CORRUPTION_INCREASE'
  | 'CORRUPTION_TIER_UP'

  | 'APHRODISIAC_APPLIED'
  | 'APHRODISIAC_INTENSIFIED'
  | 'APHRODISIAC_DECAY'
  | 'APHRODISIAC_CLEARED'

  | 'ADDICTION_INCREASE'
  | 'ADDICTION_TIER_UP'

  | 'CUSTOM';

export interface AdultNarrativeCue {
  type: AdultNarrativeCueType;

  amount?: number;

  previousValue?: number;
  currentValue?: number;

  sourceId?: string;
}

export interface AdultStatus {
  // =========================
  // 성욕
  // =========================

  desire: number; // 0 ~ 100, 저장되는 기반값
  effectiveDesire: number; // payload/미약 등 현재 보정을 반영한 파생값


  // =========================
  // 음란도
  // =========================

  // 사건으로 누적되는 기초값
  baseLewdness: number; // 0 ~ 10

  // 기초값 + 장비 + 의복 + 기타 보정
  lewdness: number; // 0 ~ 10


  // =========================
  // 감도
  // =========================

  baseSensitivity: number; // 0 ~ 100

  sensitivity: number; // 0 ~ 100

  // 144분 단위 감소 계산에서 남은 시간
  sensitivityDecayProgressMinutes: number;


  // =========================
  // 미약
  // =========================

  aphrodisiacLevel: number; // 0 ~ 100

  // 60분 단위 감소 계산에서 남은 시간
  aphrodisiacDecayProgressMinutes: number;


  // =========================
  // 중독
  // =========================

  addiction: number; // 0 ~ 100


  // =========================
  // 의복
  // =========================

  // 전투 CHEST/LEGS 슬롯과 별개
  clothingState: ClothingState;
}
export interface CorruptionStatus {
  corruption: number;      // 0 ~ 10, 영구 누적
  effectiveCorruption: number; // 현재 payload 보정 포함 파생값
}
export interface Tattoo {
  id: string;
  name: string;
  bodyPart: string;
  triggerInterval: number;
  triggerChance: number;
  desireDelta?: number;
  sensitivityModifier?: number;
  lewdnessModifier?: number;
  corruptionDelta?: number;
  removable: boolean;
}

export type RestraintCategory = "NORMAL" | "EROTIC";

export interface Restraint {
  id: string;
  name: string;
  category: RestraintCategory;
  bodyPart: string;
  restraintPower: number;
  movementMultiplier?: number;
  blocksSpeech?: boolean;
  blocksMovement?: boolean;
  blockedActionTags?: string[];
  statModifiers?: Partial<PlayerStats>;
  desireDeltaPerTrigger?: number;
  sensitivityModifier?: number;
  lewdnessModifier?: number;
  triggerInterval?: number;
  triggerChance?: number;
  removable: boolean;
}

export interface BattleTriggerInfo {
  enemyTemplate?: string;
  enemyName?: string;
  enemyLevel?: number;
  enemyTier?: 'WEAK' | 'NORMAL' | 'ELITE' | 'BOSS';
  battlefield?: {
    name: string;
    description?: string;
    environmentType?: 'FOREST' | 'DUNGEON' | 'RUINS' | 'CITY' | 'CAVE' | 'PLAIN' | 'CASTLE';
  };
  canEscape?: boolean;
}

// ============================================================
// 동료 (Companion) 인터페이스
// ============================================================
export type CompanionTactic =
  | 'AGGRESSIVE'
  | 'BALANCED'
  | 'DEFENSIVE'
  | 'SUPPORT_PRIORITY'
  | 'HEAL_PRIORITY'
  | 'STATUS_PRIORITY'
  | 'RESOURCE_SAVING';

export interface CompanionBond {
  bondLevel: number;
  bondExp: number;
  trust: number; // 0 ~ 100
  personalFlags: Record<string, boolean>;
}

export interface CompanionNeedsState {
  /** UI 표기: 성욕 (0~100) */
  desire: number;
  /** UI 표기: 배설 욕구(소변) (0~100) */
  urinationUrge: number;
  desireTriggeredThresholds: number[];
  urinationTriggeredThresholds: number[];
}

export interface CompanionNeedCue {
  id: string;
  companionId: string;
  companionName: string;
  kind: 'DESIRE' | 'URINATION';
  threshold: 30 | 50 | 70 | 100;
  secondaryCompanionId?: string;
  createdAtDialogue: number;
}

export interface CompanionData {
  id: string;
  name: string;
  gender: string;
  /** 영입 동료는 성인으로 생성/마이그레이션한다. */
  physicalAge?: number;
  race: Race;
  beastkinType?: BeastkinType;
  appearance: string;
  portraitUrl?: string;
  level: number;
  experience: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sanity: number;
  maxSanity: number;
  baseStats: PlayerStats;
  stats: PlayerStats;
  combatClass?: CombatClassType;
  classEvolutionId?: string;
  classEvolutionTier?: number;
  classEvolutionName?: string;
  talentPoints: number;
  learnedTalents: Record<string, number>;
  learnedSkills: string[];
  /** 전투 UI에 실제 장착한 액티브 스킬. 미설정 시 learnedSkills 전체를 사용한다. */
  equippedCombatSkillIds?: string[];
  professions: ProfessionProgress[];
  equipment: EquippedItems;
  equipmentEnhancements?: EquipmentEnhancementTable;
  equippedBagId?: string | null; // 전용 가방 슬롯
  bond: CompanionBond;
  bondLevel?: number;
  bondExp?: number;
  trust?: number;
  needs: CompanionNeedsState;
  combatTactic: CompanionTactic;
  /** 전투 중 해당 동료를 플레이어가 직접 조작할지 여부. 기본 false(AI). */
  manualCombatControl?: boolean;
  isActivePartyMember: boolean;
  isKnockedOut?: boolean; // 전투 불능 상태 여부
  assignedFacilityId?: string;
  recentConversationTopics?: string[];
  personalStoryProgress?: Record<string, any>;
}

// ============================================================
// 메인 플레이어 상태 인터페이스
// ============================================================

export type DefeatAftermathKind = 'SOLD_INTO_SLAVERY' | 'MONSTER_LAIR' | 'ABDUCTED' | 'ROBBED_AND_ABANDONED' | 'RESCUED' | 'DEATH';
export interface DefeatAftermathState {
  id: string;
  kind: DefeatAftermathKind;
  title: string;
  description: string;
  sourceEnemyIds: string[];
  sourceEnemyNames: string[];
  canSkipBattle: boolean;
  blockedByEliteOrBoss: boolean;
  canUseResurrectionPotion: boolean;
  resolved: boolean;
}


export interface DragonkinState {
  /** 용족을 노리는 전문 사냥 세력의 관심도. 0~100 */
  hunterThreat: number;
  /** 용족 전용 사냥꾼 인카운터 누적 발생 횟수. */
  hunterEncounterCount: number;
}

export interface PlayerState {
  characterName: string;
  race: Race;
  beastkinType?: BeastkinType;
  profile: CharacterProfile;
  level: number;
  experience: number;
  statPoints: number;
  baseStats: PlayerStats;
  stats: PlayerStats;
  passives: string[];
  storyFlags: string[];
  isCharacterCreated: boolean;
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  mana: number;
  maxMana: number;
  rupees: number;
  inventory: InventoryItem[];

  // 1. 전투 및 전직 / 재능 시스템
  characterClass?: string;
  combatClass?: CombatClassType;
  classEvolutionId?: string;
  classEvolutionTier?: number;
  classEvolutionName?: string;
  talentPoints: number;
  talents?: {
    category: string;
    learnedTalents: Record<string, number>;
    unlockedNodeIds: string[];
  };
  learnedTalents: Record<string, number>; // talentId -> rank
  learnedSkills: string[];
  /** 전투 UI에 실제 장착한 액티브 스킬. 미설정 시 learnedSkills 전체를 사용한다. */
  equippedCombatSkillIds?: string[];
  activeBattle?: BattleState | null;
  /** 전투 패배 후 포획/납치/사망/전투 외 부활 처리 상태. */
  defeatAftermath?: DefeatAftermathState | null;
  /** 최근 전투/패배에서 등장한 몬스터. Gemini 몬스터별 참조용 단기 문맥. */
  recentMonsterContextIds?: string[];
  /** dialogueCount가 이 값을 넘으면 recentMonsterContextIds를 성인 장면 참조에 사용하지 않는다. */
  recentMonsterContextExpiresAtDialogue?: number;
  /** 현재 진행 중인 데이터 기반 인카운터. sceneReference를 Gemini에 연결할 때 사용. */
  activeEncounterId?: string | null;

  // 2. 생활 직업 및 공통 기술 숙련 시스템 (Technology & Professions)
  professions: ProfessionProgress[];
  technologyState?: Record<string, any>;


  // 3. 13개 슬롯 장비 시스템 (Equipment) 및 전용 가방 슬롯
  equipment: EquippedItems;
  /** 장비 정의 ID별 +0~+20 강화/룬워드 진행. 구 세이브는 빈 객체로 마이그레이션한다. */
  equipmentEnhancements: EquipmentEnhancementTable;
  equippedBagId?: string | null; // 플레이어 착용 가방 ID

  // 4. 야영 시스템 (Camp)
  campProgress: CampProgress;
  campActionPoints: number; // 기본 3

  // 5. 동료 시스템 (Companions)
  companions: CompanionData[];
  /** 다음 GM 로그에서 1회 소비되는 동료 욕구 임계 이벤트 큐. */
  companionNeedQueue: CompanionNeedCue[];

  // 5.25 용족 전용 상태
  dragonkinState?: DragonkinState;

  // 5.5 생활·이동 시스템
  airship: AirshipState;

  // 6. 시간대 & 탐험 상태
  timeOfDay: TimeOfDay;
  dayCount: number;
  currentHour: number;
  currentMinute: number;

  // 7. 열쇠 & 잠금 해제 기록
  unlockedLocks: string[];

  // 8. 지속형 인카운터 및 예약 이벤트
  encounters: Record<string, EncounterState>;
  scheduledEncounters: ScheduledEncounter[];

  // 9. 지속형 주요 인물 (Major Characters)
  majorCharacters: Record<string, MajorCharacter>;

  // 10. 퀘스트 시스템 (Quests)
  quests: Record<string, QuestProgress>;
  trackedQuestId?: string;
  declinedQuestIds?: string[];

  // v1.0 전직/스킬트리/패시브 성장
  skillProgression: SkillProgressionState;

  // v1.0 운명/세계/육각 지도
  fate: FateState;
  worldMap: WorldMapState;
  /** 현재 별도 던전 탐사 UI 진행 상태. */
  dungeonExploration?: DungeonExplorationState | null;
  /** 던전별 고정 탐사 진행도. 다른 던전에 다녀와도 보물/보스/기믹 상태를 보존한다. */
  dungeonRecords?: Record<string, DungeonExplorationState>;
  /** 사용자 작성 성인 던전 함정 참고자료를 다음 Gemini 장면에 전달하기 위한 임시 슬롯. 18+에서만 사용. */
  activeDungeonAdultTrapSlotId?: string;
  activeDungeonAdultTrapExpiresAtDialogue?: number;

  // 성인 및 타락 상태
adultStatus?: AdultStatus;
corruptionStatus: CorruptionStatus;

tattoos: Tattoo[];
restraints: Restraint[];

// 다음 GM 로그에서 소비할 연출 이벤트
adultNarrativeQueue: AdultNarrativeCue[];

bodyPayloads: BodyPayloadEntry[];
parasiteStates: ParasiteState[];
bladderStatus: BladderStatus;
pregnancy?: PregnancyState;

dialogueCount: number;
}

export interface StateChanges {
  hpDelta?: number;
  sanityDelta?: number;
  manaDelta?: number;
  rupeeDelta?: number;
  expGain?: number;
  addItems?: Array<{ name: string; quantity: number; id?: string; equipmentId?: string; description?: string; category?: ItemCategory; quality?: 'POOR' | 'NORMAL' | 'FINE' | 'SUPERIOR' | 'MASTERWORK' }>;
  removeItems?: Array<{ name: string; quantity: number }>;
  companionNeedChanges?: Array<{ companionId: string; desireDelta?: number; urinationDelta?: number; relieveUrination?: boolean }>;

// adultStatus가 활성화된 캐릭터에서만 적용
desireDelta?: number;

lewdnessDelta?: number;

sensitivityDelta?: number;

// 미약
aphrodisiacDelta?: number;

// 중독도
addictionDelta?: number;

clothingState?: ClothingState;

// 타락도
corruptionDelta?: number;

// 구조화된 체내 상태 변화 (Gemini 판정 -> 엔진 검증/적용)
bodyPayloadChanges?: BodyPayloadChange[];
bladderVoidRequested?: boolean;
partnerCategory?: PartnerCategory;
customReflexTriggerOccurred?: boolean;

pregnancyRequest?: {
  parentA: PartnerClassification;
  parentB: PartnerClassification;
  gestationMinutes?: number;
};

  // 전투 발생 제안
  battleTrigger?: BattleTriggerInfo;

  // 게임 시간 진행 (분 단위)
  timeDeltaMinutes?: number;

  // 시간대 변화 (호환성용 필드 유지)
  timeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  dayIncrement?: number;

  // 동료 유대 변화
  companionBondChanges?: Array<{
    companionId: string;
    bondExpGain?: number;
    trustDelta?: number;
  }>;
}

export interface GameMessage {
  id: string;
  role: 'system' | 'user' | 'gm';
  content: string;
  timestamp: number;
  actionText?: string;
  status?: 'success' | 'error' | 'loading';
  appliedChanges?: StateChanges;
  systemChangeLogs?: string[];
  pendingBattle?: BattleTriggerInfo;
  statCheckResult?: StatCheckResult;
}

export interface RpgActionRequest {
  action: string;
  playerState: PlayerState;
  history: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}

export interface WorldAction {
  type: 'TALK_CHARACTER' | 'MEET_CHARACTER' | 'ENTER_LOCATION';
  characterId?: string;
  characterName?: string;
  location?: string;
}

export interface LockActionRequest {
  lockId: string;
  method: 'KEY' | 'LOCKPICK' | 'FORCE' | 'MAGIC' | 'QUEST' | 'NPC_PERMISSION';
  keyItemId?: string;
}

export interface EncounterActionRequest {
  type: 'RESOLVE' | 'FAIL';
  encounterId?: string;
  outcome?: string;
}

export interface RpgActionResponse {
  story: string;
  actionResult?: ActionInterpretation;
  changes?: StateChanges;
  systemChangeLogs?: string[];
  suggestions?: string[];
  battleTrigger?: BattleTriggerInfo;
  statCheck?: StatCheckResult;
  lockAction?: LockActionRequest;
  worldAction?: WorldAction;
  encounterAction?: EncounterActionRequest;
}

// ============================================================
// 1. 중앙 GameEvent 시스템
// ============================================================
export type GameEventType =
  | 'ITEM_GAINED'
  | 'ITEM_LOST'
  | 'ITEM_USED'
  | 'ITEM_READ'
  | 'ITEM_CRAFTED'
  | 'ITEM_EQUIPPED'
  | 'LOCK_UNLOCKED'
  | 'LOCATION_ENTERED'
  | 'CHARACTER_MET'
  | 'CHARACTER_TALKED'
  | 'CHARACTER_RECRUITED'
  | 'BATTLE_STARTED'
  | 'BATTLE_WON'
  | 'BATTLE_LOST'
  | 'ENEMY_DEFEATED'
  | 'ENCOUNTER_STARTED'
  | 'ENCOUNTER_RESOLVED'
  | 'ENCOUNTER_FAILED'
  | 'QUEST_STARTED'
  | 'QUEST_STAGE_COMPLETED'
  | 'QUEST_COMPLETED'
  | 'QUEST_FAILED'
  | 'PROFESSION_LEVEL_UP'
  | 'CAMP_FACILITY_BUILT'
  | 'CAMP_FACILITY_UPGRADED'
  | 'COMPANION_BOND_CHANGED'
  | 'STAT_CHECK_RESOLVED'
  | 'WAYSTATION_USED'
  | 'AIRSHIP_BUILT'
  | 'AIRSHIP_UPGRADED'
  | 'AIRSHIP_TRAVELED'
  | 'RESOURCE_GATHERED';

export interface GameEventPayload {
  // 아이템 관련
  itemId?: string;
  itemName?: string;
  quantity?: number;
  quality?: 'POOR' | 'NORMAL' | 'FINE' | 'SUPERIOR' | 'MASTERWORK';
  equipmentSlot?: string;

  // 잠금 및 장소
  lockId?: string;
  lockName?: string;
  unlockMethod?: UnlockMethod | string;
  location?: string;
  locationId?: string;
  locationName?: string;

  // 인물 및 동료
  characterId?: string;
  characterName?: string;
  companionId?: string;
  companionName?: string;
  trustDelta?: number;
  relationshipDelta?: number;
  bondLevel?: number;
  targetCharacterId?: string;

  // 전투 및 적
  enemyId?: string;
  enemyName?: string;
  enemyTier?: string;
  turns?: number;

  // 인카운터
  encounterId?: string;
  encounterOutcome?: string;

  // 퀘스트
  questId?: string;
  stageId?: number;
  branchChoiceId?: string;

  // 생활 직업 & 캠프
  professionId?: ProfessionType;
  professionLevel?: number;
  newLevel?: number;
  facilityId?: CampFacilityType;
  facilityLevel?: number;

  // 생활·이동 2.0
  waystationId?: string;
  waystationDestinationId?: string;
  airshipLevel?: number;
  fuelSpent?: number;
  gatheredMaterialId?: string;
  gatheredMaterialName?: string;

  // 스탯 판정
  stat?: StatCheckType;
  statType?: StatCheckType;
  difficulty?: number;
  statCheckOutcome?: StatCheckOutcome;
  checkOutcome?: StatCheckOutcome;

  // 기타 임의 확장 데이터
  customData?: Record<string, any>;
  [key: string]: any;
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  timestamp: number;
  gameTime?: { day: number; timeOfDay: string };
  sourceId?: string;
  targetId?: string;
  data?: Record<string, any>;
  payload?: GameEventPayload;
}

// ============================================================
// 2. 아이템 시스템 확장 (ItemDefinition)
// ============================================================
export type ItemCategory =
  | 'CONSUMABLE'
  | 'MATERIAL'
  | 'EQUIPMENT'
  | 'KEY'
  | 'QUEST'
  | 'TOOL'
  | 'BOOK'
  | 'DOCUMENT'
  | 'GIFT'
  | 'VALUABLE'
  | 'MISC';

export type ItemUsageTarget =
  | 'HEAL'
  | 'MANA_RESTORE'
  | 'SANITY_RESTORE'
  | 'CLIMB_CLIFF'
  | 'EXCAVATE'
  | 'LIGHT_AREA'
  | 'READ'
  | 'GIFT'
  | 'UNLOCK_LOCK'
  | 'BUFF'
  | 'CRAFT'
  | 'SPECIAL';

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  flavorText?: string;
  illustrationUrl?: string;
  usable: boolean;
  consumedOnUse?: boolean; // 소모품/일회용 여부 (기본 true, 도구/영구열쇠 false)
  uses?: ItemUsageTarget[];
  // 향후 가방 개편을 위한 선택 필드 (이번 작업에서는 실제 용량 제한 미적용)
  weight?: number;
  bulk?: number;
  size?: 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'BULKY';
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  equipmentId?: string;
  keyForLockId?: string; // 열쇠일 경우 대응하는 lockId
  isReusableKey?: boolean;
  bookKnowledge?: {
    exp?: number;
    statBonus?: { stat: keyof PlayerStats; value: number };
    recipeUnlockId?: string;
    loreText?: string;
  };
  giftValue?: {
    preferredCharacters?: string[];
    baseTrustGain: number;
  };
  toolEffect?: {
    statBonus?: Partial<PlayerStats>;
    unlockBonus?: number;
  };
  useEffect?: {
    hpDelta?: number;
    mpDelta?: number;
    sanityDelta?: number;
    desireDelta?: number;
    lewdnessDelta?: number;
    sensitivityDelta?: number;
    corruptionDelta?: number;
    buffName?: string;
    message?: string;
  };
}

// ============================================================
// 3. 열쇠 / 잠금 시스템 (LockDefinition)
// ============================================================
export type UnlockMethod =
  | 'KEY'
  | 'LOCKPICK'
  | 'FORCE'
  | 'MAGIC'
  | 'QUEST'
  | 'NPC_PERMISSION';

export interface LockDefinition {
  lockId: string;
  name: string;
  description: string;
  location?: string;
  keyItemId?: string;
  consumeKeyOnUnlock?: boolean;
  supportedMethods: UnlockMethod[];
  difficultyByMethod?: Partial<Record<UnlockMethod, number>>; // e.g. FORCE: 14, LOCKPICK: 12, MAGIC: 16
  requiredQuestId?: string;
  requiredNpcId?: string;
  requiredNpcTrust?: number;
  rewards?: {
    exp?: number;
    rupees?: number;
    items?: Array<{ itemId: string; name: string; quantity: number }>;
    equipmentIds?: string[];
    storyFlags?: string[];
  };
}

// ============================================================
// 4. 공통 GameCondition 엔진
// ============================================================
export type ConditionOperator =
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'HAS'
  | 'NOT_HAS';

export type ConditionType =
  | 'PLAYER_LEVEL'
  | 'LOCATION'
  | 'TIME'
  | 'GENDER'
  | 'RACE'
  | 'COMBAT_CLASS'
  | 'CLASS_EVOLUTION'
  | 'PROFESSION_LEVEL'
  | 'STAT'
  | 'HAS_ITEM'
  | 'HAS_COMPANION'
  | 'STORY_FLAG'
  | 'LOCK_UNLOCKED'
  | 'QUEST_STATUS'
  | 'CAMP_FACILITY'
  | 'MAJOR_CHARACTER_TRUST'
  | 'MAJOR_CHARACTER_RELATIONSHIP'
  | 'MAJOR_CHARACTER_FLAG';

export interface GameCondition {
  // 1. 단일 원자 조건 필드 (Atomic condition)
  type?: ConditionType;
  target?: string;
  operator?: ConditionOperator;
  value?: any;

  // 2. 논리 조합 (Composite conditions)
  AND?: GameCondition[];
  OR?: GameCondition[];
  NOT?: GameCondition;

  // 3. 기존 구조 하위 호환 필드
  minLevel?: number;
  maxLevel?: number;
  stats?: Partial<Record<keyof PlayerStats, number>>;
  itemsPossessed?: Array<{ itemId?: string; itemName?: string; count: number }>;
  locksUnlocked?: string[];
  questsCompleted?: string[];
  questsActive?: string[];
  questStageMin?: { questId: string; stageId: number };
  encountersResolved?: string[];
  majorCharacterStatus?: Array<{
    characterId: string;
    isAlive?: boolean;
    minRelationship?: number;
    minTrust?: number;
    isRecruited?: boolean;
    requiredFlags?: string[];
  }>;
  companionRequired?: {
    companionId?: string;
    minBondLevel?: number;
    minTrust?: number;
    inActiveParty?: boolean;
  };
  location?: string;
  timeOfDay?: Array<'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'>;
  minDayCount?: number;
  combatClass?: CombatClassType[];
  classEvolutionTier?: number;
  facilityBuilt?: Array<{ facilityId: CampFacilityType; minLevel?: number }>;
  professionLevel?: Array<{ professionId: ProfessionType; minLevel: number }>;
  storyFlags?: string[];
}

// ============================================================
// 5. 인카운터 지속 상태 및 연쇄 (Encounters)
// ============================================================
export type EncounterStatus =
  | 'AVAILABLE'
  | 'PENDING'
  | 'ACTIVE'
  | 'RESOLVED'
  | 'FAILED'
  | 'CANCELLED';

export interface ScheduledEncounter {
  encounterId: string;
  scheduledDay: number;
  scheduledTimeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  conditions?: GameCondition;
  sourceEncounterId?: string;
}

export interface EncounterState {
  status: EncounterStatus;
  currentStep?: number;
  historyLogs?: string[];
  outcome?: string;
  resolvedAt?: number;
}

export interface EncounterDefinition {
  id: string;
  title: string;
  summary: string;
  location?: string;
  isPersistent?: boolean;
  totalSteps?: number;
  conditions?: GameCondition;
  chainOnResolve?: Array<{
    nextEncounterId: string;
    delayDays?: number;
    delayTimeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
    conditions?: GameCondition;
  }>;
  chainOnFail?: Array<{
    nextEncounterId: string;
    delayDays?: number;
    delayTimeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  }>;
  associatedNpcId?: string;
  associatedQuestId?: string;
  startsCombat?: boolean;
  combatEnemyTemplate?: string;
  /** 사용자 작성용 인카운터를 DB에 보관하되 아직 자동 사용하지 않을 때 false. */
  enabled?: boolean;
  /** Gemini/GM이 장면을 구성할 때 사용할 사용자 작성 연출 참고 칸. */
  sceneReference?: string;
  /** 인카운터 해결 시 자동 지급되는 보상. 비워 둘 수 있다. */
  rewards?: QuestRewards;
  /** 편집용 빈 슬롯임을 표시. */
  userEditableSlot?: boolean;
}

// ============================================================
// 6. 주요 인물 시스템 (MajorCharacter)
// ============================================================
export interface MajorCharacter {
  id: string;
  name: string;
  title: string;
  gender: string;
  race: Race;
  beastkinType?: BeastkinType;
  personality: string;
  speechStyle: SpeechStyleData;
  location: string;
  faction?: string;
  relationship: number; // -100 ~ 100
  trust: number;        // 0 ~ 100
  isAlive: boolean;
  isRecruited: boolean;
  isRecruitable: boolean;
  recruitmentCondition?: GameCondition;
  companionId?: string;
  profession?: ProfessionType;
  combatClass?: CombatClassType;
  memoryFlags: Record<string, boolean>;
  interactionHistory: Array<{ timestamp: number; summary: string }>;
  customQuestIds?: string[];
  /** 2.0 주요 인물 확장: 악의를 가지고 접근하거나 배신 가능성이 있는 인물. */
  villainous?: boolean;
  betrayalRisk?: number; // 0~1
  recruitmentTrust?: number;
  guideRoles?: string[];
}

// ============================================================
// 7. 정식 퀘스트 시스템 (Quest)
// ============================================================
export type QuestType =
  | 'MAIN'
  | 'SUB'
  | 'CHARACTER'
  | 'COMPANION'
  | 'PROFESSION'
  | 'FACTION'
  | 'HIDDEN'
  | 'REPEATABLE'
  | 'CLASS'
  | 'GUIDE';

export type QuestStatus =
  | 'AVAILABLE'
  | 'OFFERED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED'
  | 'LOCKED';

export type ObjectiveType =
  | 'TALK_NPC'
  | 'DEFEAT_ENEMY'
  | 'GAIN_ITEM'
  | 'POSSESS_ITEM'
  | 'USE_ITEM'
  | 'UNLOCK_LOCK'
  | 'VISIT_LOCATION'
  | 'CRAFT_ITEM'
  | 'CRAFT_QUALITY_ITEM'
  | 'PROFESSION_LEVEL'
  | 'CAMP_FACILITY'
  | 'RECRUIT_COMPANION'
  | 'COMPANION_BOND'
  | 'ENCOUNTER_RESULT'
  | 'STAT_CHECK'
  | 'EQUIP_ITEM'
  | 'READ_BOOK'
  | 'WIN_BATTLE'
  | 'CAMP_SLEEP'
  | 'WAYSTATION_TRAVEL'
  | 'BUILD_AIRSHIP'
  | 'UPGRADE_AIRSHIP'
  | 'AIRSHIP_TRAVEL'
  | 'GATHER_RESOURCE';

export interface QuestObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  targetId?: string; // npcId, enemyId, itemId, lockId, facilityId, locationId, etc.
  targetName?: string;
  requiredCount: number;
  currentCount: number;
  isCompleted: boolean;
  optional?: boolean;
  branchChoiceId?: string;
}

export interface QuestStage {
  stageId: number;
  title: string;
  description: string;
  objectives: QuestObjective[];
  nextStageId?: number;
  branches?: Array<{
    choiceId: string;
    description: string;
    nextStageId: number;
  }>;
}

export interface QuestRewards {
  exp?: number;
  rupees?: number;
  items?: Array<{ itemId?: string; name: string; quantity: number; quality?: 'POOR' | 'NORMAL' | 'FINE' | 'SUPERIOR' | 'MASTERWORK' }>;
  equipmentIds?: string[];
  keyIds?: string[];
  recipes?: string[];
  professionExp?: { professionId: ProfessionType; exp: number };
  talentPoints?: number;
  statPoints?: number;
  characterRelationship?: { characterId: string; delta: number };
  companionTrust?: { companionId: string; delta: number };
  reputationDelta?: { faction: string; delta: number };
  unlockedLocations?: string[];
  followUpQuestIds?: string[];
}

export interface QuestDefinition {
  id: string;
  title: string;
  category: QuestType;
  giverNpcId?: string;
  giverName?: string;
  description: string;
  summary: string;
  stages: QuestStage[];
  rewards: QuestRewards;
  startConditions?: GameCondition;
  autoStart?: boolean;
  isHidden?: boolean;
  failureConditions?: GameCondition;
  onCompleteEncounterId?: string;
  onFailEncounterId?: string;
}

export interface QuestProgress {
  questId: string;
  status: QuestStatus;
  currentStageId: number;
  objectives: Record<string, { currentCount: number; isCompleted: boolean }>;
  startedAt?: number;
  completedAt?: number;
  failedAt?: number;
  chosenBranch?: string;
}

