import { CombatDerivedStats } from '../data/combatConfig';
import { PlayerStats } from '../types';

/**
 * 전투 속성.
 * 현재 데이터에 실제로 등장하는 속성만 우선 정의하며, 상성은 하드코딩하지 않고
 * Actor별 resistance(양수=저항, 음수=약점)로 처리한다.
 */
export type CombatElement =
  | 'NEUTRAL'
  | 'FIRE'
  | 'ICE'
  | 'LIGHTNING'
  | 'HOLY'
  | 'DARK'
  | 'ARCANE'
  | 'PSYCHIC'
  | 'POISON'
  | 'NATURE';

export type StatusEffectType =
  | 'BLEED'
  | 'POISON'
  | 'BURN'
  | 'STUN'
  | 'CHARM'
  | 'FEAR'
  | 'DEFEND'
  | 'SHIELD'
  | 'INVULNERABLE'
  | 'ATK_UP'
  | 'MAGIC_ATK_UP'
  | 'DEF_UP'
  | 'PHYSICAL_DEF_UP'
  | 'MAGIC_DEF_UP'
  | 'ACCURACY_UP'
  | 'ACCURACY_DOWN'
  | 'EVASION_UP'
  | 'CRIT_UP'
  | 'SPEED_UP'
  | 'TAUNT'
  | 'REGENERATION'
  | 'BLIND'
  | 'SLOW'
  | 'WEAKEN'
  | 'VULNERABLE';

export type EnemyTier = 'WEAK' | 'NORMAL' | 'ELITE' | 'BOSS';

export type EnemyIntentType =
  | 'ATTACK'
  | 'HEAVY_ATTACK'
  | 'DEFEND'
  | 'PREPARE_SKILL'
  | 'DEBUFF'
  | 'HEAL'
  | 'ESCAPE'
  | 'UNKNOWN';

export interface EnemyIntent {
  type: EnemyIntentType;
  label: string;
  description: string;
  targetActorId?: string;
  isSecret?: boolean;
}

export interface StatusEffect {
  id: string;
  type: StatusEffectType;
  name: string;
  /** 대상 자신의 행동 종료를 기준으로 감소한다. */
  duration: number;
  /** 효과 종류별 수치. 버프/디버프는 기본적으로 % 또는 %p, 보호막은 잔여량. */
  value?: number;
  sourceActorId?: string;
  /** 자기 행동 도중 새로 생긴 버프가 같은 행동 종료에 즉시 1턴 깎이지 않도록 보호. */
  skipNextDurationTick?: boolean;
}

export interface BattleEquipmentSummary {
  slot: string;
  equipmentId: string;
  name: string;
  description?: string;
  enhancementLevel?: number;
  runewords?: Array<{ milestone: number; runeword: string; runeLevel: number }>;
}

export interface AdultEquipmentCombatContext {
  eligible: true;
  effectiveCorruption: number;
  effectiveDesire: number;
  lewdness: number;
  sensitivity: number;
  fluidTotal: number;
  fluidByCompartment: Record<string, number>;
  pregnancyActive: boolean;
  pregnancyStage?: string;
}

export interface BattleSkillModifier {
  skillId: string;
  damageMultiplierBonus?: number;
  cooldownReduction?: number;
  costReduction?: number;
}

export interface EquipmentRuntimeState {
  counters: Record<string, number>;
  flags: Record<string, boolean>;
  links: Record<string, string>;
  strings: Record<string, string>;
  recentSkillIds: string[];
  recentElements: CombatElement[];
  attackedTargetIds: string[];
  lastSkillId?: string;
  lastElement?: CombatElement;
  lastTargetId?: string;
  lastActionKind?: 'ATTACK' | 'DEFENSE' | 'SUPPORT';
  tookDamageSinceLastTurn?: boolean;
}


export interface BattleSpeechProfile {
  /** 원본 캐릭터 성별 문자열. resolver에서 MALE/FEMALE/UNKNOWN으로 정규화한다. */
  gender?: string;
  /** HUMAN / ELF / BEASTKIN / MONSTER. */
  race?: string;
  beastkinType?: string;
  /** NONE / WARRIOR / ARCHER / ROGUE / CLERIC / DANCER / MAGE. */
  combatClass?: string;
  physicalAge?: number;
}

export interface BattleActor {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;

  /** 기존 세이브/비전투 마나 호환 필드. 전투 스킬의 핵심 자원은 COST다. */
  mp: number;
  maxMp: number;

  /** CTB 전투 핵심 자원. */
  cost: number;
  maxCost: number;
  costRegen: number;

  /** CTB 게이지. 1000 이상이 되면 행동 가능하며 Action Delay만큼 소비된다. */
  actionGauge: number;
  stableTieBreaker: number;
  skillCooldowns: Record<string, number>;
  manualControl?: boolean;

  sanity?: number;
  maxSanity?: number;
  stagger: number;
  maxStagger: number;
  isStaggered: boolean;
  stats: CombatDerivedStats;
  baseStats?: PlayerStats;
  skills: string[];
  /** 명시적으로 장착된 전투 스킬. 구 세이브는 skills 전체를 장착된 것으로 취급한다. */
  equippedSkillIds?: string[];
  traits: string[];
  equipmentSummary?: BattleEquipmentSummary[];
  skillModifiers?: BattleSkillModifier[];
  statusEffects: StatusEffect[];
  consumedBattleEffects?: string[];
  /** 장비/세트의 전투 중 스택·기록. 세이브 영구 상태가 아닌 전투 한정 런타임. */
  equipmentRuntime?: EquipmentRuntimeState;
  portraitUrl?: string;
  /** 카드 말풍선 참조에 사용하는 캐릭터 정체성 메타데이터. */
  speechProfile?: BattleSpeechProfile;
  isPlayer: boolean;
  isCompanion?: boolean;
  tier?: EnemyTier;
  archetype?: string;
  nextIntent?: EnemyIntent;

  /** 속성 저항(%). 양수는 피해 감소, 음수는 약점으로 추가 피해. */
  elementResistances?: Partial<Record<CombatElement, number>>;
  /** 특정 속성으로 주는 최종 피해 보너스(%). */
  elementDamageBonuses?: Partial<Record<CombatElement, number>>;
  /** 전신 장비 룬워드 키워드 합계. */
  runewordLevels?: Record<string, number>;
  /** 성인(신체 나이 18+) 플레이어에게만 생성되는 무희 장비 연동 컨텍스트. */
  adultEquipmentContext?: AdultEquipmentCombatContext;

  aiProfile?: {
    personality: 'AGGRESSIVE' | 'DEFENSIVE' | 'TACTICAL' | 'BERSERK' | 'SUPPORT';
    preferredSkills: string[];
  };
}

export type BattlePhase =
  | 'ROUND_START' // legacy save compatibility
  | 'PLAYER_TURN'
  | 'COMPANION_TURN'
  | 'ENEMY_TURN'
  | 'ACTION_RESOLVING'
  | 'VICTORY'
  | 'DEFEAT'
  | 'ESCAPED';

export interface BattlefieldState {
  id: string;
  name: string;
  description: string;
  environmentType: 'FOREST' | 'DUNGEON' | 'RUINS' | 'CITY' | 'CAVE' | 'PLAIN' | 'CASTLE';
  effectModifiers?: {
    accuracyModifier?: number;
    evasionModifier?: number;
    escapeChanceModifier?: number;
    speedModifier?: number;
    physicalDefenseModifier?: number;
  };
}

export interface BattleLogEntry {
  id: string;
  /** roundless CTB에서도 기존 UI/세이브 호환을 위해 행동 번호를 turn 필드에 기록한다. */
  turn: number;
  actorName: string;
  isPlayer: boolean;
  text: string;
  speechText?: string;
  badge?: {
    text: string;
    type: 'damage' | 'heal' | 'buff' | 'crit' | 'miss' | 'info' | 'stagger';
  };
  timestamp: number;
}

export interface BattleVictoryCondition {
  type: 'DEFEAT_ALL' | 'SURVIVE_TURNS' | 'DEFEAT_TARGET';
  targetEnemyId?: string;
  surviveTurnsTarget?: number;
}

export interface TimelineEntry {
  actorId: string;
  actorName: string;
  occurrenceIndex: number;
  predictedTime: number;
  isPlayer: boolean;
  isCompanion: boolean;
}

export interface BattleState {
  id: string;
  /** legacy UI 호환용: 현재 행동 번호. 라운드 개념으로 사용하지 않는다. */
  turn: number;
  actionCount: number;
  phase: BattlePhase;
  battlefield: BattlefieldState;
  player: BattleActor;
  companions: BattleActor[];
  enemies: BattleActor[];
  battleLog: BattleLogEntry[];
  victoryCondition: BattleVictoryCondition;
  canEscape: boolean;
  currentActorId?: string;
  /** 현재 Actor의 턴 시작(COST/CD/DoT)이 이미 처리되었는지 여부. */
  currentTurnStarted?: boolean;
  activeActorIndex?: number; // legacy
  /** 앞으로의 예상 행동 ID. 중복 Actor가 들어갈 수 있다. */
  turnOrder: string[];
  timeline: TimelineEntry[];
}

export type CombatMotionType = 'MELEE' | 'RANGED' | 'MAGIC' | 'SUPPORT' | 'DEFEND' | 'ITEM_SELF' | 'ITEM_THROW' | 'ESCAPE';

export interface PlannedCombatAction {
  actorId: string;
  skillId: string;
  targetIds: string[];
  primaryTargetId?: string;
  actionDelay: number;
}

export interface BattleActionResult {
  battleState: BattleState;
  logEntries: BattleLogEntry[];
  isBattleEnded: boolean;
  outcome?: 'VICTORY' | 'DEFEAT' | 'ESCAPED';
  rewards?: {
    exp: number;
    rupees: number;
    items: Array<{ name: string; quantity: number; id?: string; equipmentId?: string; description?: string; category?: 'MATERIAL' | 'EQUIPMENT' | 'CONSUMABLE' }>;
    breakdown?: Array<{ enemyId: string; enemyName: string; exp: number; rupees: number; items: Array<{ name: string; quantity: number }> }>;
  };
  consumedItem?: {
    itemNameOrId: string;
    quantity: number;
  };
}

