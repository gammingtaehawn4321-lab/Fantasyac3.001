import type { QuestDefinition, WorldRegionId } from '../../../types';
import { SETTLEMENT_LIST } from './settlementCatalog';

interface SupplySpec {
  itemId: string;
  itemName: string;
  count: number;
  reward: number;
}

const REGION_SUPPLIES: Record<WorldRegionId, SupplySpec> = {
  GRANDIA: { itemId:'iron_ore', itemName:'철광석', count:4, reward:110 },
  SANTIMAC: { itemId:'clear_dew', itemName:'맑은 이슬', count:4, reward:120 },
  FOREZIN: { itemId:'wild_herb', itemName:'야생 약초', count:5, reward:95 },
  PROSTI: { itemId:'fresh_meat', itemName:'신선한 고기', count:4, reward:115 },
  SCROZE: { itemId:'mana_crystal_shard', itemName:'마나 결정 파편', count:2, reward:145 },
  SEIRE: { itemId:'clear_dew', itemName:'맑은 이슬', count:5, reward:105 },
};

function slug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
}

function makeSupplyQuest(settlementId:string, settlementName:string, regionId:WorldRegionId): QuestDefinition {
  const spec = REGION_SUPPLIES[regionId];
  return {
    id: `settlement_board_${slug(settlementId)}_supply`,
    title: `[${settlementName}] 긴급 물자 조달`,
    category: 'SUB',
    giverName: `${settlementName} 의뢰 게시판`,
    description: `${settlementName}의 상인과 주민들이 부족한 물자를 추가로 요청하고 있다. 의뢰를 수락한 뒤 필요한 물자를 새로 확보하자.`,
    summary: `${spec.itemName} ${spec.count}개를 새로 획득하세요.`,
    stages: [{
      stageId: 1,
      title: '요청 물자 확보',
      description: `${spec.itemName}을 필요한 만큼 새로 확보한다.`,
      objectives: [{
        id: 'supply_gain',
        description: `${spec.itemName} ${spec.count}개 획득`,
        type: 'GAIN_ITEM',
        targetId: spec.itemId,
        targetName: spec.itemName,
        requiredCount: spec.count,
        currentCount: 0,
        isCompleted: false,
      }],
    }],
    rewards: { exp: 70, rupees: spec.reward, items: [{ itemId:'potion_small_health', name:'작은 회복약', quantity:1, quality:'NORMAL' }] },
  };
}

function makePatrolQuest(settlementId:string, settlementName:string): QuestDefinition {
  return {
    id: `settlement_board_${slug(settlementId)}_patrol`,
    title: `[${settlementName}] 주변 순찰 지원`,
    category: 'SUB',
    giverName: `${settlementName} 의뢰 게시판`,
    description: `${settlementName} 생활권 주변의 위협을 줄이기 위한 단기 순찰 의뢰다.`,
    summary: '의뢰 수락 후 전투에서 2회 승리하세요.',
    stages: [{
      stageId: 1,
      title: '생활권 순찰',
      description: '주변을 탐색하며 실제 위협을 정리한다.',
      objectives: [{
        id: 'patrol_wins',
        description: '전투 2회 승리',
        type: 'WIN_BATTLE',
        requiredCount: 2,
        currentCount: 0,
        isCompleted: false,
      }],
    }],
    rewards: { exp: 110, rupees: 140 },
  };
}

export const SETTLEMENT_BOARD_QUESTS: Record<string, QuestDefinition> = Object.fromEntries(
  SETTLEMENT_LIST.flatMap((settlement) => {
    const quests = [makeSupplyQuest(settlement.id, settlement.name, settlement.regionId), makePatrolQuest(settlement.id, settlement.name)];
    return quests.map((quest) => [quest.id, quest] as const);
  }),
);

export function getSettlementBoardQuestIds(settlementId: string): string[] {
  const prefix = `settlement_board_${slug(settlementId)}_`;
  return Object.keys(SETTLEMENT_BOARD_QUESTS).filter((id) => id.startsWith(prefix));
}
