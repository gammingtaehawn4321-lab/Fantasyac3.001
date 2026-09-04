import type { PetSpeciesCategory, PetSpeciesId, PlayerStats } from '../../types';
import { getPetUserEventSlots, type PetUserEventSlots } from './petEventReferences';

export interface PetSpeciesDefinition {
  id: PetSpeciesId;
  displayName: string;
  category: PetSpeciesCategory;
  baseWildness: number;
  baseFamiliarity: number;
  baseLoyalty: number;
  desireGainMultiplier: number;
  bathroomGainMultiplier: number;
  refusalLimits: { desire: number; bathroom: number };
  careMultipliers: { familiarity: number; loyalty: number; wildness: number };
  preferredFoodIds: string[];
  likedFoodIds: string[];
  userEventSlots: PetUserEventSlots;
  baseStats: PlayerStats;
}

function pet(
  id: PetSpeciesId,
  displayName: string,
  category: PetSpeciesCategory,
  baseWildness: number,
  baseFamiliarity = 10,
  baseLoyalty = 10,
  desireGainMultiplier = 1,
  bathroomGainMultiplier = 1,
  refusalLimit = 4,
  preferredFoodIds: string[] = [],
  likedFoodIds: string[] = [],
  baseStats: PlayerStats = { strength:5, vitality:5, agility:5, intelligence:1, spirit:3, luck:3 },
): PetSpeciesDefinition {
  return {
    id,
    displayName,
    category,
    baseWildness,
    baseFamiliarity,
    baseLoyalty,
    desireGainMultiplier,
    bathroomGainMultiplier,
    refusalLimits: { desire: refusalLimit, bathroom: refusalLimit },
    careMultipliers: {
      familiarity: category === 'ANIMAL' ? 1 : 0.85,
      loyalty: category === 'ANIMAL' ? 1 : 0.8,
      wildness: category === 'ANIMAL' ? 1 : 0.75,
    },
    preferredFoodIds,
    likedFoodIds,
    userEventSlots: getPetUserEventSlots(id),
    baseStats,
  };
}

/**
 * 3.3 확정 펫 9종 DB.
 * 획득은 상점/특수 인카운터 경로에서만 수행하며 일반 동료 영입과 분리한다.
 */
export const PET_SPECIES_DATABASE: Record<PetSpeciesId, PetSpeciesDefinition> = {
  // 동물형 5종
  WOLF: pet('WOLF', '늑대', 'ANIMAL', 72, 8, 12, 1.15, 1.05, 4, ['fresh_meat','dried_meat'], ['river_fish','sea_fish'], { strength:6,vitality:5,agility:8,intelligence:1,spirit:3,luck:4 }),
  DOG: pet('DOG', '개', 'ANIMAL', 35, 20, 20, 0.95, 1.05, 4, ['dried_meat','fresh_meat'], ['cheese_wheel','river_fish'], { strength:5,vitality:6,agility:6,intelligence:2,spirit:4,luck:5 }),
  SABER_TIGER: pet('SABER_TIGER', '검치호랑이', 'ANIMAL', 86, 5, 7, 1.20, 1.10, 3, ['fresh_meat','dried_meat'], ['sea_fish','river_fish'], { strength:9,vitality:6,agility:9,intelligence:1,spirit:3,luck:3 }),
  BEAR: pet('BEAR', '곰', 'ANIMAL', 78, 6, 10, 1.00, 1.20, 4, ['fresh_meat','honey_jar'], ['river_fish','red_berry'], { strength:10,vitality:10,agility:3,intelligence:1,spirit:4,luck:2 }),
  BOAR: pet('BOAR', '멧돼지', 'ANIMAL', 82, 5, 8, 1.10, 1.15, 4, ['bitter_root','forest_mushroom'], ['potato_sack','red_berry'], { strength:8,vitality:9,agility:4,intelligence:1,spirit:3,luck:3 }),

  // 곤충형 4종
  CHAURUS: pet('CHAURUS', '챠루스', 'INSECT', 84, 4, 5, 1.00, 0.90, 4, ['fresh_meat'], ['river_fish'], { strength:7,vitality:7,agility:6,intelligence:1,spirit:2,luck:3 }),
  CHAURUS_REAPER: pet('CHAURUS_REAPER', '챠루스 리퍼', 'INSECT', 94, 2, 3, 1.15, 0.95, 3, ['fresh_meat','dried_meat'], ['river_fish'], { strength:10,vitality:7,agility:8,intelligence:1,spirit:2,luck:2 }),
  MOTH: pet('MOTH', '나방', 'INSECT', 54, 10, 7, 0.90, 0.80, 4, ['honey_jar','red_berry'], ['blue_berry','medicinal_leaf'], { strength:2,vitality:4,agility:9,intelligence:2,spirit:6,luck:5 }),
  EUMYO_BUG: pet('EUMYO_BUG', '음요충', 'INSECT', 90, 3, 4, 1.25, 0.90, 3, ['fresh_meat'], ['honey_jar'], { strength:5,vitality:5,agility:7,intelligence:2,spirit:7,luck:3 }),
};

export function getPetSpeciesDefinition(id: PetSpeciesId): PetSpeciesDefinition {
  return PET_SPECIES_DATABASE[id];
}

export function isPetSpeciesId(value: unknown): value is PetSpeciesId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PET_SPECIES_DATABASE, value);
}
