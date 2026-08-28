export type MaterialQuality = 'CRUDE' | 'NORMAL' | 'GOOD' | 'EXCELLENT' | 'MASTERWORK';

export interface QualityInfo {
  quality: MaterialQuality;
  name: string;
  score: number;
  equipmentMultiplier: number; // e.g., 0.95, 1.00, 1.03, 1.06, 1.10
  consumableMultiplier: number; // e.g., 0.95, 1.00, 1.04, 1.08, 1.12
  badgeColor: string;
}

export const QUALITY_TIERS: Record<MaterialQuality, QualityInfo> = {
  CRUDE: {
    quality: 'CRUDE',
    name: '조악',
    score: 30,
    equipmentMultiplier: 0.95,
    consumableMultiplier: 0.95,
    badgeColor: 'bg-stone-800 text-stone-400 border-stone-700',
  },
  NORMAL: {
    quality: 'NORMAL',
    name: '보통',
    score: 50,
    equipmentMultiplier: 1.00,
    consumableMultiplier: 1.00,
    badgeColor: 'bg-stone-900 text-stone-300 border-stone-800',
  },
  GOOD: {
    quality: 'GOOD',
    name: '양질',
    score: 65,
    equipmentMultiplier: 1.03,
    consumableMultiplier: 1.04,
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  },
  EXCELLENT: {
    quality: 'EXCELLENT',
    name: '우수',
    score: 80,
    equipmentMultiplier: 1.06,
    consumableMultiplier: 1.08,
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
  },
  MASTERWORK: {
    quality: 'MASTERWORK',
    name: '명품',
    score: 95,
    equipmentMultiplier: 1.10,
    consumableMultiplier: 1.12,
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-600 font-bold shadow-sm',
  },
};

export function getQualityFromScore(score: number): QualityInfo {
  if (score <= 34) return QUALITY_TIERS.CRUDE;
  if (score <= 59) return QUALITY_TIERS.NORMAL;
  if (score <= 74) return QUALITY_TIERS.GOOD;
  if (score <= 89) return QUALITY_TIERS.EXCELLENT;
  return QUALITY_TIERS.MASTERWORK;
}

export function qualityToNumeric(quality?: MaterialQuality | string): number {
  switch (quality) {
    case 'CRUDE': return 1;
    case 'NORMAL': return 2;
    case 'GOOD': return 3;
    case 'EXCELLENT': return 4;
    case 'MASTERWORK': return 5;
    default: return 2; // 기본값 보통
  }
}

export function numericToQuality(num: number): MaterialQuality {
  if (num <= 1) return 'CRUDE';
  if (num === 2) return 'NORMAL';
  if (num === 3) return 'GOOD';
  if (num === 4) return 'EXCELLENT';
  return 'MASTERWORK';
}

export interface CalculateQualityScoreParams {
  techLevel: number;
  recommendedLevel: number;
  facilityBonus?: number;
  toolBonus?: number;
  materialQualityBonus?: number;
  perkBonus?: number;
  treeBonus?: number;
  randomOffset?: number; // -8 ~ +8
}

/**
 * 제작 품질 점수 공식:
 * 기본 품질 점수: 50
 * + 0.7 * (기술 레벨 - 제작법 권장 레벨)
 * + 시설 보너스
 * + 도구 보너스
 * + 재료 품질 보너스
 * + 특전 보너스
 * + 스킬트리 보너스
 * + 무작위 변동 -8 ~ +8
 */
export function calculateCraftingQualityScore(params: CalculateQualityScoreParams): number {
  const baseScore = 50;
  const levelDiff = params.techLevel - params.recommendedLevel;
  const levelBonus = 0.7 * levelDiff;

  const facilityBonus = params.facilityBonus || 0;
  const toolBonus = params.toolBonus || 0;
  const matBonus = params.materialQualityBonus || 0;
  const perkBonus = params.perkBonus || 0;
  const treeBonus = params.treeBonus || 0;

  // 소규모 무작위 변동 (-8 ~ +8)
  const offset = params.randomOffset !== undefined 
    ? params.randomOffset 
    : (Math.random() * 16 - 8);

  const rawScore = baseScore + levelBonus + facilityBonus + toolBonus + matBonus + perkBonus + treeBonus + offset;
  return Math.min(100, Math.max(10, Math.round(rawScore)));
}

/**
 * 채집 결과 품질 계산
 */
export function calculateGatheringQuality(params: {
  techLevel: number;
  recommendedLevel: number;
  toolTier: number;
  perkBonus?: number;
  treeBonus?: number;
  resourceRarity?: number;
}): QualityInfo {
  const baseScore = 45;
  const levelBonus = 0.6 * (params.techLevel - params.recommendedLevel);
  const toolBonus = (params.toolTier - 1) * 5;
  const perkBonus = params.perkBonus || 0;
  const treeBonus = params.treeBonus || 0;
  const randomOffset = Math.random() * 14 - 7;

  const score = Math.min(100, Math.max(10, Math.round(baseScore + levelBonus + toolBonus + perkBonus + treeBonus + randomOffset)));
  return getQualityFromScore(score);
}
