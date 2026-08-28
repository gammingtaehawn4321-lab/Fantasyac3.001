export type TechnologyCategory = 'LIFE' | 'COMBAT' | 'MISC';

export type LifeTechKind = 'SPECIALIZED' | 'GATHERING';

export type SpecializedTechId = 
  | 'SMITHING'        // 대장기술
  | 'LEATHERWORKING'  // 가죽세공
  | 'ALCHEMY'         // 연금술
  | 'COOKING'         // 요리
  | 'JEWELCRAFTING';  // 보석세공

export type GatheringTechId = 
  | 'LOGGING'         // 벌목
  | 'MINING'          // 채광
  | 'HERBALISM'       // 채집
  | 'FISHING'         // 낚시
  | 'BUTCHERY';       // 도축

export type TechId = SpecializedTechId | GatheringTechId;

export interface TechPerkDefinition {
  id: string;
  requiredLevel: number; // Lv.10, 20, 40, 60, 80, 100
  name: string;
  description: string;
  effectSummary: string;
  iconSymbol?: string;
}

export interface TechTreeNodeDefinition {
  id: string;
  name: string;
  description: string;
  branchId: string;       // 계통 ID (e.g., 'WEAPON_SMITHING', 'ARMOR_SMITHING', 'PRECISION_SMITHING')
  branchName: string;     // 계통명 (e.g., '무기단조', '방어구단조', '정밀단조')
  tier: number;           // Tier (1 ~ 6)
  maxRank: number;        // Lv.5~70 = 3랭크, Lv.90(최종) = 1랭크
  requiredLevel: number;  // Lv.5, 20, 35, 50, 70, 90
  requiredNodeId?: string; // 선행 노드 ID
  statOrBonusEffect: string;
  iconSymbol?: string;
}

export interface TechBranchDefinition {
  id: string;
  name: string;
  description: string;
  iconSymbol: string;
}

export interface TechnologyDefinition {
  id: TechId;
  name: string;
  kind: LifeTechKind;
  category: TechnologyCategory;
  description: string;
  iconSymbol: string;
  associatedFacilityId?: string;
  primaryStatBonus: string;
  branches: TechBranchDefinition[];
  perks: TechPerkDefinition[]; // 자동 특전 6종 (Lv.10, 20, 40, 60, 80, 100)
  treeNodes: TechTreeNodeDefinition[]; // 3개 계통 스킬트리 노드들
  unlockablesSummary: string[];
  gatheredResourceTypes?: string[];
}

export interface TechnologyProgress {
  techId: TechId;
  level: number;
  exp: number;
  totalMastery: number;
  skillPoints: number;
  unlockedPerkIds: string[];
  treeNodeRanks: Record<string, number>; // nodeId -> rank (0~maxRank)
  unlockedRecipes: string[];
  firstCraftRecords?: Record<string, boolean>;
  firstGatherRecords?: Record<string, boolean>;
  discoveredResources?: string[];
  stats: {
    totalActionCount: number;
    successfulCrafts: number;
    masterworkCount: number;
    itemsProduced: number;
    discoveredResourceCount?: number;
    [key: string]: any;
  };
}

export type TechnologyState = Record<TechId, TechnologyProgress>;
