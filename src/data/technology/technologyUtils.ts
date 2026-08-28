import {
  MAX_TECH_LEVEL,
  TECH_RANKS,
  EXP_FORMULA_CONSTANTS,
  TECH_TIERS,
  EXP_DECAY_TABLE,
  FIRST_TIME_EXP_BONUSES,
  FAILURE_EXP_MULTIPLIER,
  SKILL_POINT_INTERVAL,
  RANK_PROMOTION_BONUS_LEVELS,
  TechRankDefinition,
  TierDefinition,
} from './technologyConfig';
import { TechnologyProgress, TechId } from './technologyTypes';

/** 레벨 L -> L+1에 필요한 필요 경험치 계산 (공식 상수 기반) */
export function getRequiredExpForTechLevel(level: number): number {
  const safeLevel = Math.min(MAX_TECH_LEVEL, Math.max(1, Math.floor(level)));
  if (safeLevel >= MAX_TECH_LEVEL) return Infinity; // 만렙(100)에서는 EXP 증가 중단

  const L = safeLevel - 1;
  const reqExp = Math.round(
    EXP_FORMULA_CONSTANTS.BASE_OFFSET +
      EXP_FORMULA_CONSTANTS.LINEAR_FACTOR * L +
      EXP_FORMULA_CONSTANTS.EXPONENT_FACTOR * Math.pow(L, EXP_FORMULA_CONSTANTS.POWER)
  );
  return Math.max(10, reqExp);
}

/** 레벨에 따른 숙련 등급 정보 반환 */
export function getTechRankInfo(level: number): TechRankDefinition {
  const safeLevel = Math.min(MAX_TECH_LEVEL, Math.max(1, Math.floor(level)));
  const found = TECH_RANKS.find((r) => safeLevel >= r.minLevel && safeLevel <= r.maxLevel);
  return (
    found || {
      minLevel: 1,
      maxLevel: 19,
      rankName: '견습',
      badgeColor: 'text-stone-300 border-stone-600 bg-stone-900/60',
    }
  );
}

/** 레벨에 따른 Tier 정보 반환 */
export function getTechTierInfo(level: number): TierDefinition {
  const safeLevel = Math.min(MAX_TECH_LEVEL, Math.max(1, Math.floor(level)));
  const found = TECH_TIERS.find((t) => safeLevel >= t.minLevel && safeLevel <= t.maxLevel);
  return (
    found || {
      tier: 1,
      minLevel: 1,
      maxLevel: 19,
      tierName: 'Tier 1 (견습)',
      recommendedBaseExpMin: 12,
      recommendedBaseExpMax: 20,
    }
  );
}

/** 특정 레벨에서 획득하는 누적 기술 포인트 총합 (4레벨당 1pt + 승급 1pt) */
export function calculateTotalSkillPoints(level: number): number {
  const safeLevel = Math.min(MAX_TECH_LEVEL, Math.max(1, Math.floor(level)));
  const intervalPoints = Math.floor(safeLevel / SKILL_POINT_INTERVAL);
  const bonusPoints = RANK_PROMOTION_BONUS_LEVELS.filter((lvl) => safeLevel >= lvl).length;
  return intervalPoints + bonusPoints;
}

/** 스킬트리에 이미 사용한 포인트 계산 */
export function calculateUsedSkillPoints(treeNodeRanks: Record<string, number> = {}): number {
  return Object.values(treeNodeRanks).reduce((sum, rank) => sum + (rank || 0), 0);
}

/** 사용 가능한 보유 기술 포인트 계산 */
export function calculateAvailableSkillPoints(level: number, treeNodeRanks: Record<string, number> = {}): number {
  const totalEarned = calculateTotalSkillPoints(level);
  const used = calculateUsedSkillPoints(treeNodeRanks);
  return Math.max(0, totalEarned - used);
}

/** 쉬운 작업 레벨 차이에 따른 EXP 감쇄 비율 계산 */
export function getExpDecayMultiplier(playerLevel: number, targetRecommendedLevel: number): number {
  const diff = playerLevel - targetRecommendedLevel;
  if (diff <= 0) return 1.0;
  for (const entry of EXP_DECAY_TABLE) {
    if (diff <= entry.maxDiff) {
      return entry.multiplier;
    }
  }
  return 0.10;
}

export interface CalculateExpOptions {
  baseExp: number;
  playerLevel: number;
  recommendedLevel?: number;
  isFirstCraft?: boolean;
  isFirstGather?: boolean;
  isFirstRareDiscovery?: boolean;
  isFirstMasterSuccess?: boolean;
  isFailure?: boolean;
  masteryBonusPercent?: number;
}

/** 최종 경험치 획득량 산출 */
export function calculateFinalTechExp(opts: CalculateExpOptions): {
  finalExp: number;
  decayMultiplier: number;
  firstTimeBonusMultiplier: number;
  failureMultiplier: number;
} {
  const recLevel = opts.recommendedLevel ?? opts.playerLevel;
  const decayMultiplier = getExpDecayMultiplier(opts.playerLevel, recLevel);

  let firstTimeBonusMultiplier = 1.0;
  if (opts.isFirstMasterSuccess) firstTimeBonusMultiplier += FIRST_TIME_EXP_BONUSES.FIRST_MASTER_SUCCESS;
  else if (opts.isFirstRareDiscovery) firstTimeBonusMultiplier += FIRST_TIME_EXP_BONUSES.FIRST_RARE_DISCOVERY;
  else if (opts.isFirstCraft) firstTimeBonusMultiplier += FIRST_TIME_EXP_BONUSES.FIRST_CRAFT;
  else if (opts.isFirstGather) firstTimeBonusMultiplier += FIRST_TIME_EXP_BONUSES.FIRST_GATHER;

  const failureMultiplier = opts.isFailure ? FAILURE_EXP_MULTIPLIER : 1.0;
  const masteryBonus = 1 + (opts.masteryBonusPercent || 0) / 100;

  const rawExp = opts.baseExp * decayMultiplier * firstTimeBonusMultiplier * failureMultiplier * masteryBonus;
  const finalExp = Math.max(1, Math.round(rawExp));

  return { finalExp, decayMultiplier, firstTimeBonusMultiplier, failureMultiplier };
}

/** 경험치 추가 및 레벨업 / 특전 해금 / 기술포인트 업데이트 처리 */
export function addTechExpToProgress(
  prevProgress: TechnologyProgress,
  gainedExp: number
): {
  nextProgress: TechnologyProgress;
  didLevelUp: boolean;
  leveledUpFrom: number;
  leveledUpTo: number;
  earnedSkillPoints: number;
  newUnlockedPerkIds: string[];
  rankChanged: boolean;
} {
  if (prevProgress.level >= MAX_TECH_LEVEL) {
    return {
      nextProgress: { ...prevProgress, exp: 0 },
      didLevelUp: false,
      leveledUpFrom: MAX_TECH_LEVEL,
      leveledUpTo: MAX_TECH_LEVEL,
      earnedSkillPoints: 0,
      newUnlockedPerkIds: [],
      rankChanged: false,
    };
  }

  let currentLevel = prevProgress.level;
  let currentExp = prevProgress.exp + gainedExp;
  const startLevel = currentLevel;
  const startRank = getTechRankInfo(startLevel).rankName;
  let didLevelUp = false;

  let reqExp = getRequiredExpForTechLevel(currentLevel);
  while (currentExp >= reqExp && currentLevel < MAX_TECH_LEVEL) {
    currentExp -= reqExp;
    currentLevel += 1;
    didLevelUp = true;
    reqExp = getRequiredExpForTechLevel(currentLevel);
  }

  if (currentLevel >= MAX_TECH_LEVEL) {
    currentExp = 0;
  }

  const endRank = getTechRankInfo(currentLevel).rankName;
  const rankChanged = startRank !== endRank;

  const totalPoints = calculateTotalSkillPoints(currentLevel);
  const usedPoints = calculateUsedSkillPoints(prevProgress.treeNodeRanks || {});
  const availableSkillPoints = Math.max(0, totalPoints - usedPoints);

  // 레벨업에 따른 자동 특전 해금 체크 (Lv.10, 20, 40, 60, 80, 100)
  const milestoneLevels = [10, 20, 40, 60, 80, 100];
  const newUnlockedPerkIds: string[] = [];
  milestoneLevels.forEach((lvl) => {
    if (currentLevel >= lvl) {
      const perkId = `${prevProgress.techId.toLowerCase()}_perk_lv${lvl}`;
      if (!prevProgress.unlockedPerkIds?.includes(perkId)) {
        newUnlockedPerkIds.push(perkId);
      }
    }
  });

  const mergedPerks = Array.from(new Set([...(prevProgress.unlockedPerkIds || []), ...newUnlockedPerkIds]));

  const nextProgress: TechnologyProgress = {
    ...prevProgress,
    level: currentLevel,
    exp: currentExp,
    totalMastery: (prevProgress.totalMastery || 0) + gainedExp,
    skillPoints: availableSkillPoints,
    unlockedPerkIds: mergedPerks,
  };

  return {
    nextProgress,
    didLevelUp,
    leveledUpFrom: startLevel,
    leveledUpTo: currentLevel,
    earnedSkillPoints: availableSkillPoints,
    newUnlockedPerkIds,
    rankChanged,
  };
}

/** PlayerState의 technologyState 맵에서 특정 기술의 EXP를 추가하는 유틸리티 */
export function addTechnologyExp(
  techState: Record<string, any>,
  techId: string,
  gainedExp: number
): Record<string, any> {
  const current = techState[techId] || {
    techId,
    level: 1,
    exp: 0,
    totalMastery: 0,
    skillPoints: 0,
    unlockedPerkIds: [],
    treeNodeRanks: {},
  };

  const result = addTechExpToProgress(current, gainedExp);

  return {
    ...techState,
    [techId]: result.nextProgress,
  };
}

