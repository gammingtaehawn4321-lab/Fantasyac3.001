import type { EquipmentDefinition } from './equipmentTypes';

/** 2.0 생활·이동 패치용 원정 장비. tags는 지상 최대 이동거리 계산에 직접 사용된다. */
export const LIFE_TRAVEL_EQUIPMENT_DATABASE: Record<string, EquipmentDefinition> = {
  wayfarer_boots: {
    id: 'wayfarer_boots', name: '원정자의 장거리 장화', slot: 'BOOTS', equipmentType: 'ARMOR', rarity: 'UNCOMMON', grade: 'NORMAL', tier: 3,
    quality: 'GOOD', requiredLevel: 8, armorType: 'LIGHT', baseStats: { physicalDefense: 5, actionSpeed: 2 }, statModifiers: { vitality: 1, agility: 2 },
    tags: ['TRAVEL_RANGE_2'], acquisition: { methods: ['CRAFT','QUEST'] },
    description: '발목과 발바닥의 피로를 분산시키도록 제작된 장거리 여행용 장화.', effectDescription: '지상에서 한 번에 지정할 수 있는 최대 이동거리 +2 Hex.', sellPrice: 180,
  },
  roadwarden_cloak: {
    id: 'roadwarden_cloak', name: '도로감시자의 방풍 망토', slot: 'CLOAK', equipmentType: 'ACCESSORY', rarity: 'UNCOMMON', grade: 'NORMAL', tier: 4,
    quality: 'GOOD', requiredLevel: 12, baseStats: { magicDefense: 5, statusResistance: 4 }, statModifiers: { vitality: 1, spirit: 1 },
    tags: ['TRAVEL_RANGE_2'], acquisition: { methods: ['CRAFT','QUEST'] },
    description: '비바람과 먼지를 막고 장시간 이동 시 체온을 유지하는 두꺼운 여행 망토.', effectDescription: '지상 최대 이동거리 +2 Hex.', sellPrice: 210,
  },
  pathfinder_ring: {
    id: 'pathfinder_ring', name: '개척자의 방위 반지', slot: 'RING_1', equipmentType: 'ACCESSORY', rarity: 'RARE', grade: 'ELITE', tier: 6,
    quality: 'EXCELLENT', requiredLevel: 20, baseStats: { accuracy: 4, evasion: 3 }, statModifiers: { luck: 2 },
    tags: ['TRAVEL_RANGE_1'], acquisition: { methods: ['CRAFT','QUEST'] },
    description: '약한 지맥 진동으로 진행 방향을 알려 주는 탐험가용 반지.', effectDescription: '지상 최대 이동거리 +1 Hex.', sellPrice: 360,
  },
  grand_expedition_charm: {
    id: 'grand_expedition_charm', name: '대원정대의 항로 부적', slot: 'NECKLACE', equipmentType: 'ACCESSORY', rarity: 'EPIC', grade: 'ELITE', tier: 8,
    quality: 'MASTERWORK', requiredLevel: 30, baseStats: { statusResistance: 8, maxSanity: 18 }, statModifiers: { vitality: 2, spirit: 2 },
    tags: ['TRAVEL_RANGE_3'], acquisition: { methods: ['CRAFT','QUEST'] },
    description: '오래된 원정대의 길표식과 지형 기록을 작은 결정판에 새겨 넣은 목걸이.', effectDescription: '지상 최대 이동거리 +3 Hex.', sellPrice: 620,
  },
};
