import { InventoryItem } from '../../types';

export type CampFacilityType =
  | 'campfire'         // 모닥불 (기초 휴식 및 보온)
  | 'tent'             // 천막 (비바람 차단 및 안정)
  | 'bed'              // 침상 (수면 회복 효율 대폭 증가)
  | 'storage'          // 야영지 물품 보관함 (대용량 중량 적재)
  | 'workbench'        // 기본 작업대 (기초 도구 제작)
  | 'anvil'            // 간이 대장간 (대장장이 전용 금속 제련)
  | 'leather_bench'    // 가죽 작업대 (가죽 세공 전용)
  | 'alchemy_bench'    // 연금술 작업대 (포션 및 마나 정제)
  | 'cook_stove'       // 조리대 (요리사 전용 식사 제작)
  | 'wood_bench'       // 목공 작업대 (목수 전용 활/지팡이)
  | 'tailor_bench'     // 재봉 작업대 (재봉사 전용 천옷/망토)
  | 'training_dummy'   // 훈련용 허수아비 (경험치 및 스킬 숙련)
  | 'reading_corner';  // 독서 공간 (책 읽기 및 지식 습득)

export interface CampFacilityProgress {
  facilityId: CampFacilityType;
  level: number;
  isBuilt: boolean;
  assignedCompanionId?: string; // 시설에 배치된 동료 ID
}

export interface CampUpgradeCost {
  ingredients: Array<{ itemName: string; quantity: number }>;
  rupees?: number;
  requiredCampLevel?: number;
}

export interface CampFacilityDefinition {
  id: CampFacilityType;
  name: string;
  maxLevel: number;
  iconSymbol: string;
  description: string;
  associatedProfession?: string;
  upgradeCosts: Record<number, CampUpgradeCost>; // level -> cost to reach that level
  benefits: string[];
}

export interface CampProgress {
  level: number;
  facilities: CampFacilityProgress[];
  unlockedActivities: string[];
  upgrades: string[];
  storageItems?: InventoryItem[]; // 야영지 보관함 수납 아이템 목록
}

export interface CampActivityCost {
  actionPoints: number; // 기본 행동력 소모량 (1 또는 2)
  description: string;
}

export interface ReadableBookDefinition {
  itemId: string;
  name: string;
  lore: string;
  knowledgeReward: {
    exp?: number;
    professionExp?: { professionId: string; exp: number };
    unlockedRecipeId?: string;
    statBonus?: { stat: string; value: number };
  };
}
