// ==========================================
// 전투 관련 설정 및 파생 능력치 / 소프트캡 공식
// ==========================================

import { PlayerStats } from '../types';

export interface CombatDerivedStats {
  physicalAttack: number;     // 물리 공격력
  magicAttack: number;        // 마법 공격력
  physicalDefense: number;    // 물리 방어력
  magicDefense: number;       // 마법 방어력
  accuracy: number;           // 명중률 (기본 95)
  evasion: number;            // 회피율 (%)
  criticalChance: number;     // 치명타 확률 (%)
  criticalDamage: number;     // 치명타 피해 배율 (기본 1.5)
  actionSpeed: number;        // 행동 속도 (턴 우선도)
  physicalPenetration?: number;// 물리 관통
  magicPenetration?: number;   // 마법 관통
  elementalPenetration?: number;// 속성 저항 관통(%)
  maxCost?: number;             // 전투 COST 최대치
  costRegen?: number;           // 자신의 행동 시작 시 COST 회복
  statusHitRate?: number;      // 상태이상 적중 보정 (%)
  statusResistance?: number;   // 상태이상 저항 (%)
  tenacity?: number;           // 강인함 (흐트러짐 저항)
  maxHp?: number;
  maxMp?: number;
  maxSanity?: number;
}


// ==========================================
// CTB / COST / CRITICAL 전투 상수
// ==========================================
export const ACTION_THRESHOLD = 1000;
export const CTB_TIMELINE_PREVIEW_COUNT = 12;
export const BATTLE_START_COST = 10;
export const BASE_MAX_COST = 30;
export const BASE_COST_REGEN = 5;
export const CRITICAL_CHANCE_CAP = 85;
export const CRITICAL_DAMAGE_CAP = 3.0;
export const ELEMENT_RESISTANCE_MIN = -100;
export const ELEMENT_RESISTANCE_MAX = 80;
export const HIT_CHANCE_MIN = 5;
export const HIT_CHANCE_MAX = 99;
export const BASE_HIT_CHANCE = 98;
export const ACCURACY_HIT_SCALING = 0.4;
export const EVASION_HIT_SCALING = 0.5;

export interface LevelGrowthConfig {
  hpPerLevel: number;
  mpPerLevel: number;
  sanityPerLevel: number;
  physicalAttackPerLevel: number;
  magicAttackPerLevel: number;
  physicalDefensePerLevel: number;
  magicDefensePerLevel: number;
}

export const DEFAULT_LEVEL_GROWTH: LevelGrowthConfig = {
  hpPerLevel: 10,
  mpPerLevel: 5,
  sanityPerLevel: 3,
  physicalAttackPerLevel: 1.2,
  magicAttackPerLevel: 1.2,
  physicalDefensePerLevel: 1.0,
  magicDefensePerLevel: 1.0,
};

// 레벨업 시 지급 자원
export const STAT_POINTS_PER_LEVEL = 3;
export const TALENT_POINTS_PER_LEVEL = 1;

// 특정 레벨 달성 시 보너스 재능 포인트
export const BONUS_TALENT_POINTS_BY_LEVEL: Record<number, number> = {
  5: 1,
  10: 2,
  15: 1,
  20: 3,
  25: 1,
  30: 4,
};

// ==========================================
// 스탯 고투자 소프트캡 (Soft Cap) 시스템
// ==========================================
export const STAT_SOFT_CAP_THRESHOLDS = {
  TIER1_MAX: 20, // 1 ~ 20: 1포인트 소비
  TIER2_MAX: 40, // 21 ~ 40: 2포인트 소비
  // 41+: 3포인트 소비
};

export function getStatUpgradeCost(currentValue: number): number {
  if (currentValue < STAT_SOFT_CAP_THRESHOLDS.TIER1_MAX) {
    return 1;
  } else if (currentValue < STAT_SOFT_CAP_THRESHOLDS.TIER2_MAX) {
    return 2;
  } else {
    return 3;
  }
}

// ==========================================
// 방어구 적성 3단계 패널티 설정
// ==========================================
export type ArmorProficiency = 'OPTIMAL' | 'UNFAMILIAR' | 'MISMATCHED';

export interface ArmorProficiencyPenalty {
  speedPenaltyPercent: number; // 행동 속도 감소율 (%)
  evasionPenaltyPercent: number; // 회피율 감소율 (%)
  tenacityPenaltyPercent: number; // 강인함/상태저항 감소율 (%)
  label: string;
  badgeClass: string;
}

export const ARMOR_PROFICIENCY_CONFIG: Record<ArmorProficiency, ArmorProficiencyPenalty> = {
  OPTIMAL: {
    speedPenaltyPercent: 0,
    evasionPenaltyPercent: 0,
    tenacityPenaltyPercent: 0,
    label: '최적 적성',
    badgeClass: 'text-emerald-400 border-emerald-700/60 bg-emerald-950/40',
  },
  UNFAMILIAR: {
    speedPenaltyPercent: 5,
    evasionPenaltyPercent: 5,
    tenacityPenaltyPercent: 0,
    label: '낯선 방어구',
    badgeClass: 'text-amber-400 border-amber-700/60 bg-amber-950/40',
  },
  MISMATCHED: {
    speedPenaltyPercent: 12,
    evasionPenaltyPercent: 10,
    tenacityPenaltyPercent: 10,
    label: '부적합 방어구',
    badgeClass: 'text-rose-400 border-rose-700/60 bg-rose-950/40',
  },
};

/**
 * 방어구 적성 판정 헬퍼
 * 전사: HEAVY (중갑)
 * 궁수, 도적: LIGHT (경갑)
 * 성직자, 마법사, 무희: CLOTH (천옷)
 */
export function getArmorProficiency(
  armorType: 'LIGHT' | 'HEAVY' | 'CLOTH' | undefined,
  recommendedArmor: 'LIGHT' | 'HEAVY' | 'CLOTH' | undefined
): ArmorProficiency {
  if (!armorType || !recommendedArmor) return 'OPTIMAL';
  if (armorType === recommendedArmor) return 'OPTIMAL';

  // 인접 적성 (예: 경갑-천옷, 경갑-중갑) vs 완전 불일치 (중갑-천옷)
  if (
    (recommendedArmor === 'HEAVY' && armorType === 'LIGHT') ||
    (recommendedArmor === 'LIGHT' && (armorType === 'HEAVY' || armorType === 'CLOTH')) ||
    (recommendedArmor === 'CLOTH' && armorType === 'LIGHT')
  ) {
    return 'UNFAMILIAR';
  }

  // 중갑을 입은 천옷 직업(마법사, 성직자, 무희) 또는 천옷을 입은 중갑 직업(전사)
  return 'MISMATCHED';
}

// 쌍수 무기 보조무기 공격력 반영 비율 (60%)
export const DUAL_WIELD_OFFHAND_RATIO = 0.6;

/**
 * 기본 스탯, 레벨, 장비 및 보정치로부터 전투 파생 능력치 계산
 */
export function calculateCombatStats(
  stats: PlayerStats,
  level: number = 1,
  growthConfig: LevelGrowthConfig = DEFAULT_LEVEL_GROWTH,
  talentBonuses: Partial<CombatDerivedStats> = {},
  equipmentBonuses: Partial<CombatDerivedStats> = {},
  buffBonuses: Partial<CombatDerivedStats> = {}
): CombatDerivedStats {
  const lvl = Math.max(1, level);
  const lvlBonus = lvl - 1;

  const str = stats.strength ?? 5;
  const vit = stats.vitality ?? 5;
  const agi = stats.agility ?? 5;
  const int = stats.intelligence ?? 5;
  const spi = stats.spirit ?? 5;
  const luk = stats.luck ?? 5;

  // 1. 물리 공격력: 근력 * 2.2 + 민첩 * 0.6 + 레벨 성장치
  const basePhysAtk = str * 2.2 + agi * 0.6 + lvlBonus * growthConfig.physicalAttackPerLevel;

  // 2. 마법 공격력: 지능 * 2.6 + 정신 * 0.6 + 레벨 성장치
  const baseMagAtk = int * 2.6 + spi * 0.6 + lvlBonus * growthConfig.magicAttackPerLevel;

  // 3. 물리 방어력: 체력 * 1.6 + 근력 * 0.4 + 레벨 성장치
  const basePhysDef = vit * 1.6 + str * 0.4 + lvlBonus * growthConfig.physicalDefensePerLevel;

  // 4. 마법 방어력: 정신 * 1.8 + 지능 * 0.4 + 레벨 성장치
  const baseMagDef = spi * 1.8 + int * 0.4 + lvlBonus * growthConfig.magicDefensePerLevel;

  // 5. 명중률: 95 + 민첩 * 0.7 + 행운 * 0.3
  const baseAccuracy = 95 + agi * 0.7 + luk * 0.3;

  // 6. 회피율: 3 + 민첩 * 0.6 + 행운 * 0.25 (최대 65%)
  const baseEvasion = Math.min(65, 3 + agi * 0.6 + luk * 0.25);

  // 7. 치명타 확률: 5 + 행운 * 1.1 + 민첩 * 0.4 (최대 75%)
  const baseCritChance = Math.min(75, 5 + luk * 1.1 + agi * 0.4);

  // 8. 치명타 피해: 1.5 + 행운 * 0.015 (최대 3.0)
  const baseCritDamage = Math.min(3.0, 1.5 + luk * 0.015);

  // 9. 행동 속도: 10 + 민첩 * 1.6 + 레벨 * 0.4
  const baseActionSpeed = 10 + agi * 1.6 + lvl * 0.4;

  // 10. 물리 관통: 근력 * 0.5 + 민첩 * 0.3
  const basePhysPen = str * 0.5 + agi * 0.3;

  // 10-2. 마법/속성 관통은 기본 0. 장비·특성·직업 효과로 확장한다.
  const baseMagicPen = 0;
  const baseElementPen = 0;
  const baseMaxCost = BASE_MAX_COST;
  const baseCostRegen = BASE_COST_REGEN;

  // 11. 상태이상 적중: 지능 * 0.8 + 행운 * 0.4
  const baseStatusHit = int * 0.8 + luk * 0.4;

  // 12. 상태이상 저항: 정신 * 0.8 + 체력 * 0.4
  const baseStatusRes = spi * 0.8 + vit * 0.4;

  // 13. 강인함 (흐트러짐 저항): 체력 * 1.5 + 근력 * 0.5
  const baseTenacity = vit * 1.5 + str * 0.5;

  const sumStat = (base: number, key: keyof CombatDerivedStats) => {
    return (
      base +
      (talentBonuses[key] ?? 0) +
      (equipmentBonuses[key] ?? 0) +
      (buffBonuses[key] ?? 0)
    );
  };

  return {
    physicalAttack: Math.max(1, Math.round(sumStat(basePhysAtk, 'physicalAttack'))),
    magicAttack: Math.max(1, Math.round(sumStat(baseMagAtk, 'magicAttack'))),
    physicalDefense: Math.max(0, Math.round(sumStat(basePhysDef, 'physicalDefense'))),
    magicDefense: Math.max(0, Math.round(sumStat(baseMagDef, 'magicDefense'))),
    accuracy: Math.max(40, Math.round(sumStat(baseAccuracy, 'accuracy'))),
    evasion: Math.max(0, Math.round(sumStat(baseEvasion, 'evasion'))),
    criticalChance: Math.min(CRITICAL_CHANCE_CAP, Math.max(1, Math.round(sumStat(baseCritChance, 'criticalChance')))),
    criticalDamage: Math.min(CRITICAL_DAMAGE_CAP, Number(sumStat(baseCritDamage, 'criticalDamage').toFixed(2))),
    actionSpeed: Math.max(1, Math.round(sumStat(baseActionSpeed, 'actionSpeed'))),
    physicalPenetration: Math.max(0, Math.round(sumStat(basePhysPen, 'physicalPenetration'))),
    magicPenetration: Math.max(0, Math.round(sumStat(baseMagicPen, 'magicPenetration'))),
    elementalPenetration: Math.max(0, Math.round(sumStat(baseElementPen, 'elementalPenetration'))),
    maxCost: Math.max(1, Math.round(sumStat(baseMaxCost, 'maxCost'))),
    costRegen: Math.max(0, Math.round(sumStat(baseCostRegen, 'costRegen'))),
    statusHitRate: Math.max(0, Math.round(sumStat(baseStatusHit, 'statusHitRate'))),
    statusResistance: Math.max(0, Math.round(sumStat(baseStatusRes, 'statusResistance'))),
    tenacity: Math.max(0, Math.round(sumStat(baseTenacity, 'tenacity'))),
  };
}

