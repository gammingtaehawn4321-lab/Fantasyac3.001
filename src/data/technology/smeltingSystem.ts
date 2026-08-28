import type { PlayerState, InventoryItem } from '../../types';
import { MaterialQuality, calculateCraftingQualityScore, getQualityFromScore, QualityInfo } from './craftingQuality';
import { getItemDefinition } from '../items/itemDatabase';
import { addTechnologyExp } from './technologyUtils';

export interface SmeltingRecipe {
  id: string;
  name: string;
  category: 'SMELTING' | 'ALLOY' | 'REFINING';
  inputOreId: string;
  inputOreName: string;
  inputOreCount: number;
  fuelId: string;
  fuelName: string;
  fuelCount: number;
  extraMatId?: string;
  extraMatName?: string;
  extraMatCount?: number;
  requiredSmithingLevel: number;
  requiredFacilityTier: number; // 1 ~ 3 (1: 모닥불/기초대장간, 2: 중급 대장간, 3: 명장 대장간)
  baseSmeltMinutes: number; // 15 ~ 60분
  outputIngotId: string;
  outputIngotName: string;
  baseOutputCount: number;
  byproducts: Array<{ itemId: string; name: string; count: number; chance: number }>;
  baseExp: number;
  recommendedLevel: number;
  difficulty: number;
  description: string;
}

export const SMELTING_RECIPES: Record<string, SmeltingRecipe> = {
  smelt_copper_ingot: {
    id: 'smelt_copper_ingot',
    name: '동 주괴 제련',
    category: 'SMELTING',
    inputOreId: 'copper_ore',
    inputOreName: '동광석',
    inputOreCount: 3,
    fuelId: 'charcoal_sack',
    fuelName: '숯 자루',
    fuelCount: 1,
    requiredSmithingLevel: 1,
    requiredFacilityTier: 1,
    baseSmeltMinutes: 15,
    outputIngotId: 'copper_ingot',
    outputIngotName: '동 주괴',
    baseOutputCount: 2,
    byproducts: [{ itemId: 'slag_dust', name: '광질 슬래그 가루', count: 1, chance: 0.3 }],
    baseExp: 25,
    recommendedLevel: 1,
    difficulty: 10,
    description: '동광석을 용해하여 불순물을 제거하고 동 주괴로 제련합니다.',
  },
  smelt_iron_ingot: {
    id: 'smelt_iron_ingot',
    name: '철 주괴 제련',
    category: 'SMELTING',
    inputOreId: 'copper_ore', // 철광석 맵핑
    inputOreName: '철광석',
    inputOreCount: 4,
    fuelId: 'charcoal_sack',
    fuelName: '숯 자루',
    fuelCount: 1,
    requiredSmithingLevel: 5,
    requiredFacilityTier: 1,
    baseSmeltMinutes: 20,
    outputIngotId: 'iron_ingot',
    outputIngotName: '철 주괴',
    baseOutputCount: 2,
    byproducts: [{ itemId: 'slag_dust', name: '광질 슬래그 가루', count: 1, chance: 0.4 }],
    baseExp: 35,
    recommendedLevel: 5,
    difficulty: 15,
    description: '철광석을 단조 가열하여 순도 높은 무쇠 철 주괴를 만듭니다.',
  },
  smelt_bronze_ingot: {
    id: 'smelt_bronze_ingot',
    name: '청동 합금 주괴 주조',
    category: 'ALLOY',
    inputOreId: 'copper_ore',
    inputOreName: '동광석',
    inputOreCount: 2,
    fuelId: 'charcoal_sack',
    fuelName: '숯 자루',
    fuelCount: 1,
    extraMatId: 'tin_ore',
    extraMatName: '주석광석',
    extraMatCount: 1,
    requiredSmithingLevel: 8,
    requiredFacilityTier: 1,
    baseSmeltMinutes: 25,
    outputIngotId: 'bronze_ingot',
    outputIngotName: '청동 주괴',
    baseOutputCount: 2,
    byproducts: [{ itemId: 'slag_dust', name: '광질 슬래그 가루', count: 1, chance: 0.25 }],
    baseExp: 45,
    recommendedLevel: 8,
    difficulty: 20,
    description: '동과 주석을 정밀 비율로 용합하여 단단한 청동 주괴를 만듭니다.',
  },
  smelt_steel_ingot: {
    id: 'smelt_steel_ingot',
    name: '강철 주괴 단조 제련',
    category: 'ALLOY',
    inputOreId: 'iron_ingot',
    inputOreName: '철 주괴',
    inputOreCount: 2,
    fuelId: 'coal_chunk',
    fuelName: '석탄',
    fuelCount: 2,
    requiredSmithingLevel: 15,
    requiredFacilityTier: 2,
    baseSmeltMinutes: 30,
    outputIngotId: 'steel_ingot',
    outputIngotName: '강철 주괴',
    baseOutputCount: 2,
    byproducts: [{ itemId: 'coal_ash', name: '고열 재 파편', count: 1, chance: 0.35 }],
    baseExp: 65,
    recommendedLevel: 15,
    difficulty: 30,
    description: '철 주괴에 고열 석탄 침탄 처리를 거쳐 강철 주괴를 제작합니다.',
  },
  smelt_silver_ingot: {
    id: 'smelt_silver_ingot',
    name: '순은 주괴 정제',
    category: 'SMELTING',
    inputOreId: 'frost_silver_ore',
    inputOreName: '빙은광',
    inputOreCount: 3,
    fuelId: 'charcoal_sack',
    fuelName: '숯 자루',
    fuelCount: 2,
    requiredSmithingLevel: 20,
    requiredFacilityTier: 2,
    baseSmeltMinutes: 35,
    outputIngotId: 'silver_ingot',
    outputIngotName: '순은 주괴',
    baseOutputCount: 2,
    byproducts: [{ itemId: 'silver_dust', name: '은 분말', count: 1, chance: 0.3 }],
    baseExp: 80,
    recommendedLevel: 20,
    difficulty: 35,
    description: '빙은광의 한기를 몰아내고 정화된 순은 주괴를 정제합니다.',
  },
  smelt_mithril_ingot: {
    id: 'smelt_mithril_ingot',
    name: '미스릴 합금 주괴 제련',
    category: 'ALLOY',
    inputOreId: 'mithril_sand',
    inputOreName: '미스릴 사금',
    inputOreCount: 4,
    fuelId: 'coal_chunk',
    fuelName: '석탄',
    fuelCount: 3,
    extraMatId: 'silver_ingot',
    extraMatName: '순은 주괴',
    extraMatCount: 1,
    requiredSmithingLevel: 30,
    requiredFacilityTier: 3,
    baseSmeltMinutes: 45,
    outputIngotId: 'mithril_ingot',
    outputIngotName: '미스릴 주괴',
    baseOutputCount: 1,
    byproducts: [{ itemId: 'mithril_dust', name: '빛나는 미스릴 미분', count: 1, chance: 0.4 }],
    baseExp: 130,
    recommendedLevel: 30,
    difficulty: 50,
    description: '미스릴 사금과 순은을 극고열로 용융하여 명품 미스릴 주괴를 벼릅니다.',
  },
  smelt_sky_iron_ingot: {
    id: 'smelt_sky_iron_ingot',
    name: '천철 합금 주괴 제련',
    category: 'ALLOY',
    inputOreId: 'sky_iron_ore',
    inputOreName: '천철광',
    inputOreCount: 3,
    fuelId: 'coal_chunk',
    fuelName: '석탄',
    fuelCount: 3,
    extraMatId: 'aether_crystal',
    extraMatName: '에테르 결정',
    extraMatCount: 1,
    requiredSmithingLevel: 35,
    requiredFacilityTier: 3,
    baseSmeltMinutes: 50,
    outputIngotId: 'sky_iron_ingot',
    outputIngotName: '천철 주괴',
    baseOutputCount: 1,
    byproducts: [{ itemId: 'sky_shard', name: '천경 파편', count: 1, chance: 0.3 }],
    baseExp: 160,
    recommendedLevel: 35,
    difficulty: 60,
    description: '천철광에 에테르 결정을 반응시켜 부유선 전용 경체 천철 주괴를 제작합니다.',
  },
};

/**
 * 금속 회수율 계산 (70% ~ 120%)
 */
export function calculateMetalRecoveryRate(params: {
  smithingLevel: number;
  recommendedLevel: number;
  facilityTier: number;
  requiredFacilityTier: number;
  hasPrecisionForgingPerk?: boolean;
}): { ratePercent: number; bonusIngotChance: number; lossReductionPercent: number } {
  const levelDiff = params.smithingLevel - params.recommendedLevel;
  let baseRate = 75 + levelDiff * 1.5;

  if (params.facilityTier > params.requiredFacilityTier) {
    baseRate += (params.facilityTier - params.requiredFacilityTier) * 10;
  }
  if (params.hasPrecisionForgingPerk) {
    baseRate += 15;
  }

  const ratePercent = Math.min(135, Math.max(60, Math.round(baseRate)));
  const bonusIngotChance = ratePercent > 100 ? (ratePercent - 100) / 100 : 0;
  const lossReductionPercent = Math.min(80, Math.max(0, ratePercent - 70));

  return { ratePercent, bonusIngotChance, lossReductionPercent };
}

export interface SmeltingExecutionResult {
  success: boolean;
  message: string;
  nextState: PlayerState;
  craftedIngots: Array<{ id: string; name: string; quantity: number; quality: MaterialQuality }>;
  byproducts: Array<{ id: string; name: string; quantity: number }>;
  expGained: number;
  minutesSpent: number;
}

/**
 * 제련 작업 실행 (1회, 5회, 10회, MAX)
 */
export function executeSmelting(
  state: PlayerState,
  recipeId: string,
  batchCountRequested: number | 'MAX',
  facilityTier: number = 1
): SmeltingExecutionResult {
  const recipe = SMELTING_RECIPES[recipeId];
  if (!recipe) {
    return {
      success: false,
      message: '존재하지 않는 제련 레시피입니다.',
      nextState: state,
      craftedIngots: [],
      byproducts: [],
      expGained: 0,
      minutesSpent: 0,
    };
  }

  const techState = state.technologyState || {};
  const smithingProgress = techState['SMITHING'] || { level: 1, exp: 0 };
  const smithingLevel = smithingProgress.level || 1;

  if (smithingLevel < recipe.requiredSmithingLevel) {
    return {
      success: false,
      message: `대장기술 숙련 레벨이 부족합니다. (필요: Lv.${recipe.requiredSmithingLevel}, 현재: Lv.${smithingLevel})`,
      nextState: state,
      craftedIngots: [],
      byproducts: [],
      expGained: 0,
      minutesSpent: 0,
    };
  }

  if (facilityTier < recipe.requiredFacilityTier) {
    return {
      success: false,
      message: `대장 시설 등급이 부족합니다. (필요: Tier ${recipe.requiredFacilityTier})`,
      nextState: state,
      craftedIngots: [],
      byproducts: [],
      expGained: 0,
      minutesSpent: 0,
    };
  }

  const inventory = state.inventory || [];
  const countAvailable = (itemNameOrId: string) =>
    inventory
      .filter((i) => i.id === itemNameOrId || i.name === itemNameOrId)
      .reduce((s, i) => s + (i.quantity || 1), 0);

  const oreAvail = countAvailable(recipe.inputOreId) || countAvailable(recipe.inputOreName);
  const fuelAvail = countAvailable(recipe.fuelId) || countAvailable(recipe.fuelName);
  const extraAvail = recipe.extraMatId ? (countAvailable(recipe.extraMatId) || countAvailable(recipe.extraMatName || '')) : 99999;

  const maxPossibleByOre = Math.floor(oreAvail / recipe.inputOreCount);
  const maxPossibleByFuel = Math.floor(fuelAvail / recipe.fuelCount);
  const maxPossibleByExtra = recipe.extraMatId && recipe.extraMatCount ? Math.floor(extraAvail / recipe.extraMatCount) : 99999;

  const maxCount = Math.min(maxPossibleByOre, maxPossibleByFuel, maxPossibleByExtra);

  if (maxCount <= 0) {
    return {
      success: false,
      message: `제련에 필요한 재료나 연료가 부족합니다. (${recipe.inputOreName} ${recipe.inputOreCount}개, ${recipe.fuelName} ${recipe.fuelCount}개 필요)`,
      nextState: state,
      craftedIngots: [],
      byproducts: [],
      expGained: 0,
      minutesSpent: 0,
    };
  }

  const actualBatchCount = batchCountRequested === 'MAX' 
    ? maxCount 
    : Math.min(batchCountRequested, maxCount);

  if (actualBatchCount <= 0) {
    return {
      success: false,
      message: '제련 작업을 진행할 수 없습니다.',
      nextState: state,
      craftedIngots: [],
      byproducts: [],
      expGained: 0,
      minutesSpent: 0,
    };
  }

  // 재료 소비
  let updatedInv = [...inventory];
  const removeItems = (idOrName: string, amount: number) => {
    let remain = amount;
    updatedInv = updatedInv.map((item) => {
      if (remain <= 0) return item;
      if (item.id === idOrName || item.name === idOrName) {
        if (item.quantity > remain) {
          const qty = item.quantity - remain;
          remain = 0;
          return { ...item, quantity: qty };
        } else {
          remain -= item.quantity;
          return { ...item, quantity: 0 };
        }
      }
      return item;
    }).filter((i) => i.quantity > 0);
  };

  removeItems(recipe.inputOreId, recipe.inputOreCount * actualBatchCount);
  removeItems(recipe.fuelId, recipe.fuelCount * actualBatchCount);
  if (recipe.extraMatId && recipe.extraMatCount) {
    removeItems(recipe.extraMatId, recipe.extraMatCount * actualBatchCount);
  }

  // 회수율 & 품질 계산
  const recoveryInfo = calculateMetalRecoveryRate({
    smithingLevel,
    recommendedLevel: recipe.recommendedLevel,
    facilityTier,
    requiredFacilityTier: recipe.requiredFacilityTier,
  });

  const qualityScore = calculateCraftingQualityScore({
    techLevel: smithingLevel,
    recommendedLevel: recipe.recommendedLevel,
    facilityBonus: (facilityTier - recipe.requiredFacilityTier) * 10,
  });
  const qualityInfo = getQualityFromScore(qualityScore);

  let totalIngotCount = recipe.baseOutputCount * actualBatchCount;
  if (recoveryInfo.bonusIngotChance > 0) {
    for (let i = 0; i < actualBatchCount; i++) {
      if (Math.random() < recoveryInfo.bonusIngotChance) {
        totalIngotCount += 1;
      }
    }
  }

  // 주괴 아이템 추가
  const ingotDef = getItemDefinition(recipe.outputIngotId);
  const ingotItemName = ingotDef?.name || recipe.outputIngotName;

  const existingIndex = updatedInv.findIndex(
    (i) => (i.id === recipe.outputIngotId || i.name === ingotItemName) && (i.quality === qualityInfo.quality || (!i.quality && qualityInfo.quality === 'NORMAL'))
  );

  if (existingIndex >= 0) {
    updatedInv[existingIndex] = {
      ...updatedInv[existingIndex],
      quantity: updatedInv[existingIndex].quantity + totalIngotCount,
    };
  } else {
    updatedInv.push({
      id: recipe.outputIngotId,
      name: ingotItemName,
      quantity: totalIngotCount,
      category: 'MATERIAL',
      description: ingotDef?.description || `${ingotItemName} - 대장 단조 및 장비 제작의 주재료.`,
      quality: qualityInfo.quality,
    });
  }

  // 부산물 계산
  const byproductSummary: Record<string, { name: string; count: number }> = {};
  recipe.byproducts.forEach((bp) => {
    let gotCount = 0;
    for (let b = 0; b < actualBatchCount; b++) {
      if (Math.random() < bp.chance) {
        gotCount += bp.count;
      }
    }
    if (gotCount > 0) {
      byproductSummary[bp.itemId] = { name: bp.name, count: gotCount };
      const bpIndex = updatedInv.findIndex((i) => i.id === bp.itemId || i.name === bp.name);
      if (bpIndex >= 0) {
        updatedInv[bpIndex] = { ...updatedInv[bpIndex], quantity: updatedInv[bpIndex].quantity + gotCount };
      } else {
        updatedInv.push({
          id: bp.itemId,
          name: bp.name,
          quantity: gotCount,
          category: 'MATERIAL',
          description: `${bp.name} - 제련 과정에서 발생한 부가 부산물.`,
          quality: 'NORMAL',
        });
      }
    }
  });

  // 소요 시간 & 경험치
  // 시간 하한선: 기본 시간의 30% 또는 5분
  const rawMinutes = recipe.baseSmeltMinutes * actualBatchCount;
  const speedBonusRatio = Math.min(0.5, smithingLevel * 0.008);
  const minutesSpent = Math.max(5 * actualBatchCount, Math.round(rawMinutes * (1 - speedBonusRatio)));

  const totalExp = recipe.baseExp * actualBatchCount;
  const nextTechState = addTechnologyExp(techState, 'SMITHING', totalExp);

  // 상태 업데이트
  let nextState: PlayerState = {
    ...state,
    inventory: updatedInv,
    technologyState: nextTechState,
  };

  const byproductsArray = Object.entries(byproductSummary).map(([id, val]) => ({
    id,
    name: val.name,
    quantity: val.count,
  }));

  const msg = `${recipe.name} ×${actualBatchCount} 진행: [${ingotItemName} ×${totalIngotCount}] (품질: ${qualityInfo.name}) 획득! [대장기술 EXP +${totalExp}] [게임 시간 +${minutesSpent}분]`;

  return {
    success: true,
    message: msg,
    nextState,
    craftedIngots: [{ id: recipe.outputIngotId, name: ingotItemName, quantity: totalIngotCount, quality: qualityInfo.quality }],
    byproducts: byproductsArray,
    expGained: totalExp,
    minutesSpent,
  };
}
