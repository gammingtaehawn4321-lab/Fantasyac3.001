export type ProfessionType =
  | 'BLACKSMITH'     // 대장장이
  | 'LEATHERWORKER'  // 가죽 세공인
  | 'ALCHEMIST'      // 연금술사
  | 'COOK'           // 요리사
  | 'CARPENTER'      // 목수
  | 'TAILOR';        // 재봉사

export type ItemQuality = 'POOR' | 'NORMAL' | 'FINE' | 'GOOD' | 'SUPERIOR' | 'EXCELLENT' | 'MASTERWORK' | 'PERFECT';
export type CraftingRank = 'NOVICE'|'APPRENTICE'|'SKILLED'|'ARTISAN'|'MASTER'|'GRANDMASTER';
export interface ProfessionRequirement { professionId: ProfessionType; minimumLevel: number; minimumRank?: CraftingRank; }

export interface ProfessionProgress {
  professionId: ProfessionType;
  level: number;
  exp: number;
  learnedRecipes: string[];
  learnedPerks: string[];
  skillPoints?: number;
}

export interface RecipeIngredient {
  itemName: string;
  quantity: number;
}

export interface RecipeOutput {
  itemName: string;
  baseQuantity: number;
  equipmentId?: string;
  qualityBonusChance?: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  professionId: ProfessionType; // primary profession
  requiredLevel: number;
  professionRequirements?: ProfessionRequirement[];
  requiredRank?: CraftingRank;
  tier?: number;
  grade?: 'NORMAL'|'ELITE'|'LEGENDARY';
  craftingCategory?: 'WEAPON'|'ARMOR'|'ACCESSORY_FRAME'|'ACCESSORY_CORE'|'ACCESSORY'|'POTION'|'ELIXIR'|'HEAVY_PART'|'LIGHT_PART'|'ENCHANTMENT'|'OTHER';
  requiredFacilityId?: string;
  description: string;
  category: 'EQUIPMENT' | 'CONSUMABLE' | 'MATERIAL' | 'CAMP_UPGRADE';
  ingredients: RecipeIngredient[];
  output: RecipeOutput;
  expReward: number;
  baseSuccessRate?: number; // 0 ~ 100
}

export interface ProfessionDefinition {
  id: ProfessionType;
  name: string;
  role: string;
  description: string;
  iconSymbol: string;
  associatedFacility: string;
  primaryStatBonus: string;
  recipes: RecipeDefinition[];
}
