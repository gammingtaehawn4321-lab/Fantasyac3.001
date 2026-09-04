import type { PlayerState, WorldRegionId, HexTerrain } from '../../types';
import { MaterialQuality, calculateGatheringQuality, QualityInfo } from './craftingQuality';

export type GatheringTechType = 'LOGGING' | 'MINING' | 'GATHERING' | 'FISHING';

export interface RareByproduct {
  itemId: string;
  name: string;
  rate: number; // 0.0 ~ 1.0 (0% ~ 100%)
  count: number;
}

export interface ResourceNodeDefinition {
  id: string; // 내부 ID (UI 미표시)
  name: string; // 자원 노드 이름 (예: 참나무 무성한 숲, 동광맥, 자생 치유잎 군락)
  techId: GatheringTechType;
  tier: number; // 1 ~ 5
  requiredLevel: number;
  recommendedLevel: number;
  regionIds: WorldRegionId[];
  terrains: HexTerrain[];
  requiredToolCategory: string; // 'AXE' | 'PICKAXE' | 'SICKLE' | 'FISHING_ROD'
  requiredToolTier: number; // 1 ~ 5
  baseYield: number; // 1회 채집 시 획득량
  primaryResourceId: string;
  primaryResourceName: string;
  rareByproducts: RareByproduct[];
  baseDurationMinutes: number; // 기본 시간 (분) - 채집 10, 낚시 20, 채광 25, 벌목 30 등
  maxYieldCount: number; // 최대 채집 가능 횟수 (고갈 전)
  respawnMinutes: number; // 게임 내 시간 기준 고갈 후 재생 시간 (분)
  discoveryCondition?: {
    requiredLevel?: number;
    perceptionBonus?: number;
  };
  specialConditions?: string;
}

export interface ResourceNodeRuntimeState {
  nodeId: string;
  tileId: string;
  currentYieldCount: number;
  maxYieldCount: number;
  isDepleted: boolean;
  depletedAtGameMinutes: number;
}

export const WORLD_RESOURCE_NODES: Record<string, ResourceNodeDefinition> = {
  // ==========================================
  // 벌목 (LOGGING) 노드 - 30분 기본
  // ==========================================
  node_oak_grove: {
    id: 'node_oak_grove',
    name: '참나무 무성한 숲',
    techId: 'LOGGING',
    tier: 1,
    requiredLevel: 1,
    recommendedLevel: 1,
    regionIds: ['GRANDIA', 'FOREZIN'],
    terrains: ['FOREST', 'PLAINS'],
    requiredToolCategory: 'AXE',
    requiredToolTier: 1,
    baseYield: 3,
    primaryResourceId: 'oak_log',
    primaryResourceName: '참나무 원목',
    rareByproducts: [{ itemId: 'resin_lump', name: '수지 덩어리', rate: 0.35, count: 1 }],
    baseDurationMinutes: 30,
    maxYieldCount: 8,
    respawnMinutes: 180, // 게임 시간 3시간
  },
  node_ironwood_cluster: {
    id: 'node_ironwood_cluster',
    name: '단단한 철심목 군락',
    techId: 'LOGGING',
    tier: 2,
    requiredLevel: 10,
    recommendedLevel: 15,
    regionIds: ['FOREZIN'],
    terrains: ['FOREST'],
    requiredToolCategory: 'AXE',
    requiredToolTier: 2,
    baseYield: 2,
    primaryResourceId: 'ironwood_log',
    primaryResourceName: '철심목 원목',
    rareByproducts: [{ itemId: 'amber_resin', name: '호박 수지', rate: 0.25, count: 1 }],
    baseDurationMinutes: 35,
    maxYieldCount: 6,
    respawnMinutes: 240,
  },
  node_bamboo_thicket: {
    id: 'node_bamboo_thicket',
    name: '강변 죽림 자생지',
    techId: 'LOGGING',
    tier: 1,
    requiredLevel: 5,
    recommendedLevel: 8,
    regionIds: ['FOREZIN', 'SEIRE'],
    terrains: ['RIVER', 'COAST'],
    requiredToolCategory: 'AXE',
    requiredToolTier: 1,
    baseYield: 4,
    primaryResourceId: 'bamboo_cane',
    primaryResourceName: '강죽 대',
    rareByproducts: [{ itemId: 'resin_lump', name: '수지 덩어리', rate: 0.30, count: 1 }],
    baseDurationMinutes: 25,
    maxYieldCount: 10,
    respawnMinutes: 120,
  },

  // ==========================================
  // 채광 (MINING) 노드 - 25분 기본
  // ==========================================
  node_copper_vein: {
    id: 'node_copper_vein',
    name: '노천 동광맥',
    techId: 'MINING',
    tier: 1,
    requiredLevel: 1,
    recommendedLevel: 1,
    regionIds: ['GRANDIA', 'SANTIMAC'],
    terrains: ['HILL', 'CAVE', 'PLAINS'],
    requiredToolCategory: 'PICKAXE',
    requiredToolTier: 1,
    baseYield: 3,
    primaryResourceId: 'copper_ore',
    primaryResourceName: '동광석',
    rareByproducts: [
      { itemId: 'tin_ore', name: '주석광석', rate: 0.25, count: 1 },
      { itemId: 'topaz_rough', name: '토파즈 원석', rate: 0.10, count: 1 },
    ],
    baseDurationMinutes: 25,
    maxYieldCount: 8,
    respawnMinutes: 180,
  },
  node_iron_vein: {
    id: 'node_iron_vein',
    name: '풍부한 철광맥',
    techId: 'MINING',
    tier: 1,
    requiredLevel: 5,
    recommendedLevel: 5,
    regionIds: ['GRANDIA', 'SANTIMAC', 'PROSTI'],
    terrains: ['HILL', 'CAVE', 'MOUNTAIN'],
    requiredToolCategory: 'PICKAXE',
    requiredToolTier: 1,
    baseYield: 3,
    primaryResourceId: 'iron_ore',
    primaryResourceName: '철광석',
    rareByproducts: [
      { itemId: 'coal_chunk', name: '석탄', rate: 0.40, count: 1 },
      { itemId: 'obsidian_shard', name: '흑요석 조각', rate: 0.15, count: 1 },
    ],
    baseDurationMinutes: 25,
    maxYieldCount: 8,
    respawnMinutes: 180,
  },
  node_mithril_sand_bed: {
    id: 'node_mithril_sand_bed',
    name: '에테르 친화 미스릴 사금층',
    techId: 'MINING',
    tier: 3,
    requiredLevel: 25,
    recommendedLevel: 30,
    regionIds: ['PROSTI', 'SCROZE'],
    terrains: ['CRYSTAL_CAVE', 'FLOATING_LAND', 'DEEP_UNDERGROUND'],
    requiredToolCategory: 'PICKAXE',
    requiredToolTier: 3,
    baseYield: 2,
    primaryResourceId: 'mithril_sand',
    primaryResourceName: '미스릴 사금',
    rareByproducts: [{ itemId: 'aether_crystal', name: '에테르 결정', rate: 0.20, count: 1 }],
    baseDurationMinutes: 35,
    maxYieldCount: 5,
    respawnMinutes: 360,
  },

  // ==========================================
  // 채집 (GATHERING) 노드 - 10분 기본
  // ==========================================
  node_herb_patch: {
    id: 'node_herb_patch',
    name: '야생 치유잎 군락지',
    techId: 'GATHERING',
    tier: 1,
    requiredLevel: 1,
    recommendedLevel: 1,
    regionIds: ['GRANDIA', 'FOREZIN'],
    terrains: ['PLAINS', 'FOREST'],
    requiredToolCategory: 'SICKLE',
    requiredToolTier: 1,
    baseYield: 4,
    primaryResourceId: 'medicinal_leaf',
    primaryResourceName: '치유잎',
    rareByproducts: [
      { itemId: 'red_berry', name: '붉은 열매', rate: 0.40, count: 2 },
      { itemId: 'bitter_root', name: '쓴뿌리', rate: 0.25, count: 1 },
    ],
    baseDurationMinutes: 10,
    maxYieldCount: 10,
    respawnMinutes: 90,
  },
  node_flax_field: {
    id: 'node_flax_field',
    name: '야생 아마 섬유밭',
    techId: 'GATHERING',
    tier: 1,
    requiredLevel: 1,
    recommendedLevel: 3,
    regionIds: ['GRANDIA', 'FOREZIN'],
    terrains: ['PLAINS'],
    requiredToolCategory: 'SICKLE',
    requiredToolTier: 1,
    baseYield: 5,
    primaryResourceId: 'flax_bundle',
    primaryResourceName: '아마 섬유 다발',
    rareByproducts: [{ itemId: 'river_reed', name: '강갈대', rate: 0.30, count: 2 }],
    baseDurationMinutes: 10,
    maxYieldCount: 12,
    respawnMinutes: 90,
  },
  node_moonflower_shrine: {
    id: 'node_moonflower_shrine',
    name: '신성한 월광화 자생지',
    techId: 'GATHERING',
    tier: 3,
    requiredLevel: 20,
    recommendedLevel: 25,
    regionIds: ['FOREZIN', 'SCROZE'],
    terrains: ['FOREST', 'SHRINE'],
    requiredToolCategory: 'SICKLE',
    requiredToolTier: 2,
    baseYield: 2,
    primaryResourceId: 'moonflower',
    primaryResourceName: '월광화',
    rareByproducts: [{ itemId: 'glowcap', name: '발광버섯', rate: 0.35, count: 1 }],
    baseDurationMinutes: 15,
    maxYieldCount: 4,
    respawnMinutes: 300,
  },

  // ==========================================
  // 낚시 (FISHING) 노드 - 20분 기본
  // ==========================================
  node_river_fishing_spot: {
    id: 'node_river_fishing_spot',
    name: '맑은 강가 낚시터',
    techId: 'FISHING',
    tier: 1,
    requiredLevel: 1,
    recommendedLevel: 1,
    regionIds: ['FOREZIN', 'GRANDIA'],
    terrains: ['RIVER', 'UNDERGROUND_RIVER'],
    requiredToolCategory: 'FISHING_ROD',
    requiredToolTier: 1,
    baseYield: 3,
    primaryResourceId: 'river_fish',
    primaryResourceName: '민물고기',
    rareByproducts: [
      { itemId: 'silver_trout', name: '은빛 송어', rate: 0.25, count: 1 },
      { itemId: 'clean_water', name: '정제수', rate: 0.50, count: 1 },
    ],
    baseDurationMinutes: 20,
    maxYieldCount: 8,
    respawnMinutes: 150,
  },
  node_coastal_fishing_spot: {
    id: 'node_coastal_fishing_spot',
    name: '남해안 풍부한 갯벌',
    techId: 'FISHING',
    tier: 1,
    requiredLevel: 5,
    recommendedLevel: 5,
    regionIds: ['SEIRE'],
    terrains: ['COAST', 'SEA'],
    requiredToolCategory: 'FISHING_ROD',
    requiredToolTier: 1,
    baseYield: 3,
    primaryResourceId: 'sea_fish',
    primaryResourceName: '바다생선',
    rareByproducts: [
      { itemId: 'shellfish_basket', name: '조개 바구니', rate: 0.40, count: 1 },
      { itemId: 'coral_fragment', name: '산호 조각', rate: 0.15, count: 1 },
    ],
    baseDurationMinutes: 20,
    maxYieldCount: 8,
    respawnMinutes: 150,
  },
};

/**
 * 재생 상태 업데이트 (passTime 호출 시 연동)
 */
export function updateResourceNodeRespawns(
  nodeStates: Record<string, ResourceNodeRuntimeState>,
  currentTotalGameMinutes: number
): Record<string, ResourceNodeRuntimeState> {
  const updated = { ...nodeStates };
  let changed = false;

  for (const key of Object.keys(updated)) {
    const state = updated[key];
    if (state.isDepleted) {
      const def = WORLD_RESOURCE_NODES[state.nodeId];
      const respawnTime = def ? def.respawnMinutes : 180;
      const elapsed = currentTotalGameMinutes - state.depletedAtGameMinutes;

      if (elapsed >= respawnTime) {
        updated[key] = {
          ...state,
          currentYieldCount: state.maxYieldCount,
          isDepleted: false,
        };
        changed = true;
      }
    }
  }

  return changed ? updated : nodeStates;
}
