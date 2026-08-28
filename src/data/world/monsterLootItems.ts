import type { ItemDefinition } from '../../types';
import { REGIONAL_MONSTERS } from './monsterData';

export const RESURRECTION_POTION_ID = 'resurrection_potion';
export const RESURRECTION_POTION_NAME = '부활의 물약';

const materialItems = Object.fromEntries(
  REGIONAL_MONSTERS.map((monster) => [
    monster.lootMaterialId,
    {
      id: monster.lootMaterialId,
      name: monster.lootMaterialName,
      category: 'MATERIAL',
      description: `${monster.name}에게서 얻는 제작 재료. 장비 제작·강화·향후 몬스터 전용 장비 확장에 사용된다.`,
      flavorText: `${monster.regionId} 지역의 ${monster.name}이(가) 남긴 전리품.`,
      usable: false,
      consumedOnUse: false,
      uses: ['CRAFT'],
      weight: monster.tier === 'ELITE' ? 0.6 : 0.35,
      bulk: 1,
      size: 'SMALL',
      rarity: monster.tier === 'ELITE' ? 'RARE' : 'COMMON',
    } satisfies ItemDefinition,
  ])
) as Record<string, ItemDefinition>;

export const MONSTER_LOOT_ITEM_DATABASE: Record<string, ItemDefinition> = {
  [RESURRECTION_POTION_ID]: {
    id: RESURRECTION_POTION_ID,
    name: RESURRECTION_POTION_NAME,
    category: 'CONSUMABLE',
    description: '일반 전투에서 패배하여 사망 처리될 때 전투 결과를 뒤집지 않고, 해당 전투를 포기한 채 현 위치에서 생환하게 하는 희귀 물약. 엘리트·보스 전투에는 사용할 수 없다.',
    flavorText: '전투 중 쓰러진 몸을 즉시 일으키는 약이 아니다. 패배가 확정된 뒤 마지막 숨이 끊어지기 직전, 모험가를 전장에서 이탈시키는 비상용 약이다.',
    usable: false,
    consumedOnUse: true,
    uses: ['SPECIAL'],
    weight: 0.2,
    bulk: 1,
    size: 'SMALL',
    rarity: 'EPIC',
  },
  ...materialItems,
};
