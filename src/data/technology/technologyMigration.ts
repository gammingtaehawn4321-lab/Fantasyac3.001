import { INITIAL_TECHNOLOGY_STATE } from './technologyDatabase';
import { TechId, TechnologyState } from './technologyTypes';
import { calculateTotalSkillPoints, calculateUsedSkillPoints } from './technologyUtils';

export function migrateProfessionsToTechnologies(state: any): TechnologyState {
  const existingTechs: Record<string, any> = JSON.parse(JSON.stringify(INITIAL_TECHNOLOGY_STATE));

  // 1. 기존 state.technologyState 또는 state.technologies 병합
  const inputTechs = state?.technologyState || state?.technologies;
  if (inputTechs && typeof inputTechs === 'object') {
    Object.keys(inputTechs).forEach((key) => {
      const tech = inputTechs[key];
      if (tech && tech.techId && existingTechs[tech.techId]) {
        existingTechs[tech.techId] = {
          ...existingTechs[tech.techId],
          ...tech,
          stats: {
            ...existingTechs[tech.techId].stats,
            ...(tech.stats || {}),
          },
        };
      }
    });
  }

  // 2. 레가시 professions 배열 마이그레이션
  const legacyProfessions = state?.professions;
  if (Array.isArray(legacyProfessions)) {
    legacyProfessions.forEach((prof) => {
      if (!prof || !prof.professionId) return;
      let targetTechId: TechId | null = null;
      switch (prof.professionId) {
        case 'BLACKSMITH':
          targetTechId = 'SMITHING';
          break;
        case 'LEATHERWORKER':
          targetTechId = 'LEATHERWORKING';
          break;
        case 'ALCHEMIST':
          targetTechId = 'ALCHEMY';
          break;
        case 'COOK':
          targetTechId = 'COOKING';
          break;
        case 'CARPENTER':
          targetTechId = 'LOGGING';
          break;
        case 'TAILOR':
          targetTechId = 'LEATHERWORKING';
          break;
      }

      if (targetTechId && existingTechs[targetTechId]) {
        const currentLevel = Math.max(existingTechs[targetTechId].level || 1, Number(prof.level) || 1);
        const currentExp = Math.max(existingTechs[targetTechId].exp || 0, Number(prof.exp) || 0);
        const mergedRecipes = Array.from(
          new Set([
            ...(existingTechs[targetTechId].unlockedRecipes || []),
            ...(prof.learnedRecipes || []),
          ])
        );

        existingTechs[targetTechId] = {
          ...existingTechs[targetTechId],
          level: currentLevel,
          exp: currentExp,
          totalMastery: Math.max(existingTechs[targetTechId].totalMastery || 10, currentLevel * 10),
          unlockedRecipes: mergedRecipes,
        };
      }
    });
  }

  // 3. 모든 10종 기술의 스킬포인트 및 레벨별 자동 특전 정비
  Object.keys(existingTechs).forEach((key) => {
    const tech = existingTechs[key];
    const level = Math.min(100, Math.max(1, Math.floor(tech.level || 1)));
    const totalEarnedPoints = calculateTotalSkillPoints(level);
    const usedPoints = calculateUsedSkillPoints(tech.treeNodeRanks || {});
    const skillPoints = Math.max(0, totalEarnedPoints - usedPoints);

    // 특전 자동 해금
    const milestoneLevels = [10, 20, 40, 60, 80, 100];
    const unlockedPerkIds = new Set<string>(tech.unlockedPerkIds || []);
    milestoneLevels.forEach((lvl) => {
      if (level >= lvl) {
        unlockedPerkIds.add(`${tech.techId.toLowerCase()}_perk_lv${lvl}`);
      }
    });

    existingTechs[key] = {
      ...tech,
      level,
      exp: level >= 100 ? 0 : tech.exp || 0,
      skillPoints,
      unlockedPerkIds: Array.from(unlockedPerkIds),
      treeNodeRanks: tech.treeNodeRanks || {},
      unlockedRecipes: tech.unlockedRecipes || [],
      firstCraftRecords: tech.firstCraftRecords || {},
      firstGatherRecords: tech.firstGatherRecords || {},
      discoveredResources: tech.discoveredResources || [],
      stats: {
        totalActionCount: 0,
        successfulCrafts: 0,
        masterworkCount: 0,
        itemsProduced: 0,
        ...(tech.stats || {}),
      },
    };
  });

  return existingTechs as TechnologyState;
}
