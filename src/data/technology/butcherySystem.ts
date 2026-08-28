import type { PlayerState, InventoryItem } from '../../types';
import { calculateGatheringQuality, MaterialQuality } from './craftingQuality';
import { addTechnologyExp } from './technologyUtils';
import { getItemDefinition } from '../items/itemDatabase';

export interface ButcheryLootTableEntry {
  itemId: string;
  name: string;
  minCount: number;
  maxCount: number;
  dropRate: number; // 0.0 ~ 1.0
  categoryTag: 'MEAT' | 'LEATHER' | 'BONE' | 'HORN' | 'FEATHER' | 'SPECIAL';
}

export interface CreatureButcheryDefinition {
  monsterId: string;
  name: string;
  requiredLevel: number;
  baseButcheryMinutes: number; // 기본 20분
  baseExp: number;
  lootTable: ButcheryLootTableEntry[];
}

export const CREATURE_BUTCHERY_DATABASE: Record<string, CreatureButcheryDefinition> = {
  wild_boar: {
    monsterId: 'wild_boar',
    name: '야생 멧돼지',
    requiredLevel: 1,
    baseButcheryMinutes: 20,
    baseExp: 30,
    lootTable: [
      { itemId: 'dried_meat', name: '말린 고기', minCount: 2, maxCount: 4, dropRate: 0.9, categoryTag: 'MEAT' },
      { itemId: 'raw_hide', name: '생가죽', minCount: 1, maxCount: 2, dropRate: 0.8, categoryTag: 'LEATHER' },
      { itemId: 'bone_piece', name: '단단한 뼈', minCount: 1, maxCount: 2, dropRate: 0.6, categoryTag: 'BONE' },
      { itemId: 'horn_piece', name: '뿔 조각', minCount: 1, maxCount: 1, dropRate: 0.3, categoryTag: 'HORN' },
    ],
  },
  dire_wolf: {
    monsterId: 'dire_wolf',
    name: '다이어 울프',
    requiredLevel: 3,
    baseButcheryMinutes: 20,
    baseExp: 40,
    lootTable: [
      { itemId: 'dried_meat', name: '말린 고기', minCount: 1, maxCount: 3, dropRate: 0.85, categoryTag: 'MEAT' },
      { itemId: 'raw_hide', name: '생가죽', minCount: 2, maxCount: 3, dropRate: 0.9, categoryTag: 'LEATHER' },
      { itemId: 'fine_fur', name: '고운 모피', minCount: 1, maxCount: 1, dropRate: 0.35, categoryTag: 'LEATHER' },
      { itemId: 'beast_tendon', name: '마수 힘줄', minCount: 1, maxCount: 2, dropRate: 0.5, categoryTag: 'SPECIAL' },
    ],
  },
  frost_bear: {
    monsterId: 'frost_bear',
    name: '빙원 곰',
    requiredLevel: 10,
    baseButcheryMinutes: 25,
    baseExp: 75,
    lootTable: [
      { itemId: 'dried_meat', name: '말린 고기', minCount: 3, maxCount: 6, dropRate: 0.95, categoryTag: 'MEAT' },
      { itemId: 'thick_fur', name: '두꺼운 모피', minCount: 2, maxCount: 4, dropRate: 0.85, categoryTag: 'LEATHER' },
      { itemId: 'bone_piece', name: '단단한 뼈', minCount: 2, maxCount: 3, dropRate: 0.7, categoryTag: 'BONE' },
    ],
  },
  giant_hawk: {
    monsterId: 'giant_hawk',
    name: '거대 매',
    requiredLevel: 5,
    baseButcheryMinutes: 20,
    baseExp: 45,
    lootTable: [
      { itemId: 'dried_meat', name: '말린 고기', minCount: 1, maxCount: 2, dropRate: 0.8, categoryTag: 'MEAT' },
      { itemId: 'feather_bundle', name: '깃털 다발', minCount: 3, maxCount: 6, dropRate: 0.95, categoryTag: 'FEATHER' },
      { itemId: 'skyfeather', name: '천공깃', minCount: 1, maxCount: 2, dropRate: 0.25, categoryTag: 'FEATHER' },
    ],
  },
  cave_crawler: {
    monsterId: 'cave_crawler',
    name: '동굴 크롤러',
    requiredLevel: 8,
    baseButcheryMinutes: 20,
    baseExp: 60,
    lootTable: [
      { itemId: 'insect_chitin', name: '곤충 갑각', minCount: 2, maxCount: 4, dropRate: 0.9, categoryTag: 'SPECIAL' },
      { itemId: 'royal_chitin', name: '왕갑각', minCount: 1, maxCount: 1, dropRate: 0.2, categoryTag: 'SPECIAL' },
      { itemId: 'silk_cocoon', name: '동굴 명주고치', minCount: 1, maxCount: 3, dropRate: 0.6, categoryTag: 'LEATHER' },
    ],
  },
};

export interface ButcheryExecutionResult {
  success: boolean;
  message: string;
  nextState: PlayerState;
  obtainedItems: Array<{ id: string; name: string; quantity: number; quality: MaterialQuality }>;
  expGained: number;
  minutesSpent: number;
}

/**
 * 몬스터 도축 작업 실행
 */
export function executeButchery(
  state: PlayerState,
  monsterId: string,
  monsterDisplayName?: string
): ButcheryExecutionResult {
  const butcheryDef = CREATURE_BUTCHERY_DATABASE[monsterId] || {
    monsterId,
    name: monsterDisplayName || '야생 생물',
    requiredLevel: 1,
    baseButcheryMinutes: 20,
    baseExp: 35,
    lootTable: [
      { itemId: 'dried_meat', name: '말린 고기', minCount: 1, maxCount: 3, dropRate: 0.85, categoryTag: 'MEAT' },
      { itemId: 'raw_hide', name: '생가죽', minCount: 1, maxCount: 2, dropRate: 0.75, categoryTag: 'LEATHER' },
      { itemId: 'bone_piece', name: '단단한 뼈', minCount: 1, maxCount: 2, dropRate: 0.5, categoryTag: 'BONE' },
    ],
  };

  const techState = state.technologyState || {};
  const gatheringProgress = techState['GATHERING'] || { level: 1, exp: 0 };
  const gatheringLevel = gatheringProgress.level || 1;

  // 품질 계산
  const qualityInfo = calculateGatheringQuality({
    techLevel: gatheringLevel,
    recommendedLevel: butcheryDef.requiredLevel,
    toolTier: 1,
  });

  const obtained: Array<{ id: string; name: string; quantity: number; quality: MaterialQuality }> = [];
  let updatedInv = [...(state.inventory || [])];

  butcheryDef.lootTable.forEach((entry) => {
    if (Math.random() <= entry.dropRate) {
      const count = entry.minCount + Math.floor(Math.random() * (entry.maxCount - entry.minCount + 1));
      if (count > 0) {
        obtained.push({
          id: entry.itemId,
          name: entry.name,
          quantity: count,
          quality: qualityInfo.quality,
        });

        const def = getItemDefinition(entry.itemId);
        const idx = updatedInv.findIndex(
          (i) => (i.id === entry.itemId || i.name === entry.name) && (i.quality === qualityInfo.quality || (!i.quality && qualityInfo.quality === 'NORMAL'))
        );

        if (idx >= 0) {
          updatedInv[idx] = { ...updatedInv[idx], quantity: updatedInv[idx].quantity + count };
        } else {
          updatedInv.push({
            id: entry.itemId,
            name: entry.name,
            quantity: count,
            category: def?.category || 'MATERIAL',
            description: def?.description || `${entry.name} - 도축을 통해 획득한 생물 소재.`,
            quality: qualityInfo.quality,
          });
        }
      }
    }
  });

  const minutesSpent = butcheryDef.baseButcheryMinutes;
  const expGained = butcheryDef.baseExp;

  const nextTechState = addTechnologyExp(techState, 'GATHERING', expGained);

  const nextState: PlayerState = {
    ...state,
    inventory: updatedInv,
    technologyState: nextTechState,
  };

  const itemSummaryText = obtained.length > 0
    ? obtained.map((x) => `${x.name} x${x.quantity}`).join(', ')
    : '소재 획득 실패';

  const msg = `${butcheryDef.name} 도축 완료: [${itemSummaryText}] (품질: ${qualityInfo.name}) 획득! [도축/채집 EXP +${expGained}] [게임 시간 +${minutesSpent}분]`;

  return {
    success: true,
    message: msg,
    nextState,
    obtainedItems: obtained,
    expGained,
    minutesSpent,
  };
}
