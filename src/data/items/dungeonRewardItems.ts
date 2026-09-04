import type { ItemDefinition, WorldRegionId } from '../../types';
import { WORLD_DUNGEONS } from '../dungeons/dungeonSystem';

const REGION_LABEL: Record<WorldRegionId, string> = {
  GRANDIA: '그란디아',
  FOREZIN: '포레진',
  SEIRE: '세이레',
  SANTIMAC: '산티맥',
  PROSTI: '프로스티',
  SCROZE: '스크로제',
};

export function getDungeonRelicItemId(regionId: WorldRegionId): string {
  return `dungeon_relic_${regionId.toLowerCase()}`;
}

export function getDungeonCoreItemId(dungeonId: string): string {
  return `dungeon_core_${dungeonId}`;
}

const regionalRelics: Record<string, ItemDefinition> = Object.fromEntries(
  (Object.keys(REGION_LABEL) as WorldRegionId[]).map((regionId) => {
    const id = getDungeonRelicItemId(regionId);
    const label = REGION_LABEL[regionId];
    return [id, {
      id,
      name: `${label} 던전 유물편`,
      category: 'MATERIAL',
      description: `${label} 지역의 심층 던전과 유적에서 회수한 공통 유물 재료. 던전 관련 제작·교환 콘텐츠에서 참조할 수 있도록 정식 아이템 ID로 등록되어 있다.`,
      usageHint: '사용처: 던전 관련 제작·교환 및 수집용 희귀 재료.',
      usable: false,
      consumedOnUse: false,
      weight: 0.2,
      bulk: 1,
      size: 'SMALL',
      rarity: 'RARE',
    } satisfies ItemDefinition];
  })
);

const dungeonCores: Record<string, ItemDefinition> = Object.fromEntries(
  WORLD_DUNGEONS.map((dungeon) => {
    const id = getDungeonCoreItemId(dungeon.id);
    const rarity: ItemDefinition['rarity'] = dungeon.rewardTier >= 4 ? 'LEGENDARY' : dungeon.rewardTier >= 3 ? 'EPIC' : 'RARE';
    return [id, {
      id,
      name: `${dungeon.name} 공략 전리품`,
      category: 'MATERIAL',
      description: `${dungeon.name}의 보스를 쓰러뜨리고 최종 전리품방에서 확보한 희귀 공략 재료. 던전별 고유 ID로 보존된다.`,
      usageHint: '사용처: 던전별 고유 제작·교환 및 공략 기록용 희귀 재료.',
      usable: false,
      consumedOnUse: false,
      weight: 0.4,
      bulk: 1,
      size: 'SMALL',
      rarity,
    } satisfies ItemDefinition];
  })
);

export const DUNGEON_REWARD_ITEM_DATABASE: Record<string, ItemDefinition> = {
  ...regionalRelics,
  ...dungeonCores,
};
