import { CombatClassType } from '../classes';
import type { CombatElement } from '../../combat/combatTypes';

export type EquipmentSlot =
  // 일반 장비 7슬롯
  | 'MAIN_HAND'
  | 'OFF_HAND'
  | 'HEAD'
  | 'CHEST'
  | 'LEGS'
  | 'BOOTS'
  | 'GLOVES'
  // 장신구 6슬롯
  | 'RING_1'
  | 'RING_2'
  | 'NECKLACE'
  | 'BRACELET'
  | 'EARRING'
  | 'CLOAK';

export type EquipmentType = 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'OFFHAND';

export type ArmorType = 'LIGHT' | 'HEAVY' | 'CLOTH';

export type WeaponType =
  | 'SWORD'
  | 'GREATSWORD'
  | 'SPEAR'
  | 'BOW'
  | 'CROSSBOW'
  | 'DAGGER'
  | 'STAFF'
  | 'CANE'
  | 'KNUCKLE'
  | 'MAGIC_ORB'
  | 'SHIELD'
  | 'AMULET'
  | 'CATALYST'
  | 'CHAKRAM'
  | 'THOUGHT'
  | 'EXECUTION_BLADE'
  | 'FAN';

export const WEAPON_TYPE_KOREAN: Record<WeaponType, string> = {
  SWORD: '한손검',
  GREATSWORD: '대검',
  SPEAR: '창',
  BOW: '활',
  CROSSBOW: '석궁',
  DAGGER: '단검',
  STAFF: '지팡이',
  CANE: '홀리 케인',
  KNUCKLE: '너클',
  MAGIC_ORB: '마법구',
  SHIELD: '방패',
  AMULET: '아뮬렛',
  CATALYST: '마법 촉매',
  CHAKRAM: '차크람',
  THOUGHT: '사념',
  EXECUTION_BLADE: '처형도',
  FAN: '부채',
};

export const ARMOR_TYPE_KOREAN: Record<ArmorType, string> = {
  LIGHT: '경갑',
  HEAVY: '중갑',
  CLOTH: '천옷',
};

export const EQUIPMENT_SLOT_KOREAN: Record<EquipmentSlot, string> = {
  MAIN_HAND: '주무기',
  OFF_HAND: '보조장비',
  HEAD: '투구',
  CHEST: '상의',
  LEGS: '하의',
  BOOTS: '신발',
  GLOVES: '장갑',
  RING_1: '반지 1',
  RING_2: '반지 2',
  NECKLACE: '목걸이',
  BRACELET: '팔찌',
  EARRING: '귀걸이',
  CLOAK: '망토',
};

export type WeaponStyle = 'TWO_HANDED' | 'ONE_HANDED' | 'DUAL_WIELD' | 'MAGIC';

export type ArmorProficiency = 'OPTIMAL' | 'UNFAMILIAR' | 'MISMATCHED';

export type EquipmentRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

// Equipment System 2.0: rarity(legacy drop rarity) is retained for old saves; grade is the new gameplay grade.
export type EquipmentGrade = 'NORMAL' | 'ELITE' | 'LEGENDARY';
export type EquipmentQuality = 'POOR' | 'NORMAL' | 'GOOD' | 'EXCELLENT' | 'MASTERWORK' | 'PERFECT';
export type EquipmentAcquisitionMethod = 'CRAFT' | 'QUEST' | 'LOOT';

export type RunewordType = 'VENOM' | 'FLAME' | 'RADIANCE' | 'DARKNESS' | 'DRAGON' | 'FROST' | 'TEMPEST' | 'ASTRAL';
export type EquipmentEnhancementMilestone = 5 | 10 | 15 | 20;
export interface EquipmentEnhancementState {
  level: number; // 0~20
  /** +5/+10/+15/+20 슬롯. 각 슬롯은 각각 룬 레벨 1/2/3/4로 전신 키워드에 기여한다. */
  runeChoices: Partial<Record<EquipmentEnhancementMilestone, RunewordType>>;
}
export type EquipmentEnhancementTable = Record<string, EquipmentEnhancementState>;
export type EquipmentAffixType = 'PREFIX' | 'SUFFIX' | 'LEGENDARY';
export type EquipmentAffixCategory = 'OFFENSE' | 'DEFENSE' | 'RESOURCE' | 'UTILITY' | 'SPECIAL';

export interface EquipmentEffectPayload { type: string; statKey?: string; value?: number; valueText?: string; }
export interface EquipmentEffectCondition { type: string; key?: string; value?: string | number | boolean; }
export interface EquipmentEffect { id: string; trigger?: string; conditions?: EquipmentEffectCondition[]; effects: EquipmentEffectPayload[]; description?: string; }
export interface EquipmentAffix { id: string; name: string; type: EquipmentAffixType; category: EquipmentAffixCategory; statKey?: string; baseValue?: number; perTierValue?: number; minTier?: number; maxTier?: number; description: string; effects?: EquipmentEffect[]; }
export interface EquipmentAcquisitionData { methods: EquipmentAcquisitionMethod[]; craftingRecipeId?: string; questIds?: string[]; lootTableIds?: string[]; }
export interface EquipmentSetBonus { requiredPieces: number; effects: EquipmentEffect[]; description: string; }
export interface EquipmentSetDefinition { id: string; name: string; sourceMonsterId: string; pieceItemIds: string[]; bonuses: EquipmentSetBonus[]; description?: string; }


export interface MagicWeaponData {
  spellCapacity: number;
  availableSpellIds: string[];
  magicTags: string[];
  spellPowerMultiplier: number;
  exclusiveSpellIds?: string[];
  grantedSkillId?: string;
  grantedSpellId?: string;
}

export interface SkillModifier {
  skillId: string;
  damageMultiplierBonus?: number;
  cooldownReduction?: number;
  mpCostReduction?: number; // legacy name
  costReduction?: number;
  description: string;
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  equipmentType: EquipmentType;
  rarity: EquipmentRarity;
  grade?: EquipmentGrade;
  tier?: number; // 1~12
  quality?: EquipmentQuality;
  affixes?: EquipmentAffix[];
  acquisition?: EquipmentAcquisitionData;
  sourceMonsterId?: string;
  setId?: string;
  uniqueEffects?: EquipmentEffect[];
  tags?: string[];
  description?: string;
  flavorText?: string;
  illustrationUrl?: string;
  isTwoHanded?: boolean;
  requiredLevel?: number;
  armorType?: ArmorType;
  /**
 * 현재 음란도에 더해지는 장비 보정치.
 * 일반 장비는 생략하면 0으로 처리한다.
 */
  lewdnessModifier?: number;
  weaponType?: WeaponType;
  weaponStyle?: WeaponStyle;
  recommendedClasses?: CombatClassType[];
  recommendedEvolutions?: string[];
  /** 속성 저항(%). 양수=저항, 음수=약점. 전투 Actor에 합산된다. */
  elementResistances?: Partial<Record<CombatElement, number>>;
  /** 특정 속성으로 주는 최종 피해 보너스(%). 전투 Actor에 합산된다. */
  elementDamageBonuses?: Partial<Record<CombatElement, number>>;
  baseStats: {
    physicalAttack?: number;
    magicAttack?: number;
    physicalDefense?: number;
    magicDefense?: number;
    accuracy?: number;
    evasion?: number;
    criticalChance?: number;
    criticalDamage?: number;
    actionSpeed?: number;
    physicalPenetration?: number;
    magicPenetration?: number;
    elementalPenetration?: number;
    maxCost?: number;
    costRegen?: number;
    statusHitRate?: number;
    statusResistance?: number;
    tenacity?: number;
    maxHp?: number;
    maxMp?: number;
    maxSanity?: number;
  };
  statModifiers?: {
    strength?: number;
    vitality?: number;
    agility?: number;
    intelligence?: number;
    spirit?: number;
    luck?: number;
  };
  specialEffectIds?: string[]; // e.g. 'vampirism_10', 'revive_once', 'shield_on_overheal', 'bleed_synergy'
  skillModifiers?: SkillModifier[];
  magicWeapon?: MagicWeaponData;
  equipDescription?: string;
  combatDescription?: string;
  effectDescription?: string;
  sellPrice: number;
}

export type EquippedItems = Record<EquipmentSlot, string | null | undefined>;
