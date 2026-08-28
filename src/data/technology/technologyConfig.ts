/**
 * 판타지악 v3.0 기술과 숙련 (Skills & Mastery) 시스템 공통 밸런스 데이터 및 상수 설정
 */

export const MAX_TECH_LEVEL = 100;

/** 숙련 등급 데이터 */
export interface TechRankDefinition {
  minLevel: number;
  maxLevel: number;
  rankName: string;
  badgeColor: string;
}

export const TECH_RANKS: TechRankDefinition[] = [
  { minLevel: 1, maxLevel: 19, rankName: '견습', badgeColor: 'text-stone-300 border-stone-600 bg-stone-900/60' },
  { minLevel: 20, maxLevel: 39, rankName: '숙련', badgeColor: 'text-emerald-300 border-emerald-600 bg-emerald-950/60' },
  { minLevel: 40, maxLevel: 59, rankName: '전문', badgeColor: 'text-sky-300 border-sky-600 bg-sky-950/60' },
  { minLevel: 60, maxLevel: 79, rankName: '장인', badgeColor: 'text-purple-300 border-purple-600 bg-purple-950/60' },
  { minLevel: 80, maxLevel: 99, rankName: '명장', badgeColor: 'text-amber-300 border-amber-600 bg-amber-950/60' },
  { minLevel: 100, maxLevel: 100, rankName: '대가', badgeColor: 'text-rose-300 border-rose-600 bg-rose-950/60 animate-pulse' },
];

/** 레벨 요구 경험치 공식 상수 */
export const EXP_FORMULA_CONSTANTS = {
  BASE_OFFSET: 120,
  LINEAR_FACTOR: 28,
  EXPONENT_FACTOR: 7,
  POWER: 1.45,
};

/** 콘텐츠 Tier 데이터 */
export interface TierDefinition {
  tier: number;
  minLevel: number;
  maxLevel: number;
  tierName: string;
  recommendedBaseExpMin: number;
  recommendedBaseExpMax: number;
}

export const TECH_TIERS: TierDefinition[] = [
  { tier: 1, minLevel: 1, maxLevel: 19, tierName: 'Tier 1 (견습)', recommendedBaseExpMin: 12, recommendedBaseExpMax: 20 },
  { tier: 2, minLevel: 20, maxLevel: 39, tierName: 'Tier 2 (숙련)', recommendedBaseExpMin: 24, recommendedBaseExpMax: 40 },
  { tier: 3, minLevel: 40, maxLevel: 59, tierName: 'Tier 3 (전문)', recommendedBaseExpMin: 45, recommendedBaseExpMax: 70 },
  { tier: 4, minLevel: 60, maxLevel: 79, tierName: 'Tier 4 (장인)', recommendedBaseExpMin: 75, recommendedBaseExpMax: 110 },
  { tier: 5, minLevel: 80, maxLevel: 100, tierName: 'Tier 5 (명장/대가)', recommendedBaseExpMin: 120, recommendedBaseExpMax: 170 },
];

/** 쉬운 작업 반복 경험치 감쇄 비율 */
export const EXP_DECAY_TABLE = [
  { maxDiff: 4, multiplier: 1.0 },   // 0~4차이: 100%
  { maxDiff: 9, multiplier: 0.90 },  // 5~9차이: 90%
  { maxDiff: 19, multiplier: 0.65 }, // 10~19차이: 65%
  { maxDiff: 29, multiplier: 0.35 }, // 20~29차이: 35%
  { maxDiff: Infinity, multiplier: 0.10 }, // 30차이 이상: 10%
];

/** 최초 경험 보너스 비율 */
export const FIRST_TIME_EXP_BONUSES = {
  FIRST_CRAFT: 0.25,        // 최초 제작: +25%
  FIRST_GATHER: 0.25,       // 최초 채집: +25%
  FIRST_RARE_DISCOVERY: 0.50, // 최초 희귀 발견: +50%
  FIRST_MASTER_SUCCESS: 0.75, // 최초 MASTER/SPECIAL 성공: +75%
};

/** 실패 시 경험치 비율 (정상 시도 후 실패 시) */
export const FAILURE_EXP_MULTIPLIER = 0.20;

/** 기술 포인트 획득 규칙 */
export const SKILL_POINT_INTERVAL = 4; // 4레벨당 1포인트
export const RANK_PROMOTION_BONUS_LEVELS = [20, 40, 60, 80, 100]; // 승급 보너스 1포인트
