export type PotionCategory = 'ELIXIR' | 'POTION'; // ELIXIR = 비약 (전투용), POTION = 물약 (비전투용)

export type PotionRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type UsableContext = 'COMBAT_ONLY' | 'NON_COMBAT_ONLY' | 'ANYTIME';

export interface PotionIngredient {
  itemName: string;
  quantity: number;
}

export interface PotionGameplayEffect {
  hpDelta?: number;
  hpPercent?: number;
  mpDelta?: number;
  sanityDelta?: number;
  energyDelta?: number;
  statBonus?: Record<string, number>;
  statusEffectId?: string;
  buffName?: string;
  durationTurns?: number;
  durationMinutes?: number;
  resurrectRatio?: number; // 0.5 = 50% HP 부활
  cleanseDebuffs?: boolean;
  detoxPoison?: boolean;
  cureDisease?: boolean;
  healBleeding?: boolean;
}

export interface PotionDefinition {
  id: string; // 내부 ID (UI 미표시)
  name: string; // 표시명
  category: PotionCategory; // 'ELIXIR' (비약) or 'POTION' (물약)
  categoryLabel: string; // '전투 비약' or '비전투 물약'
  description: string;
  rarity: PotionRarity;
  ingredients: PotionIngredient[];
  requiredAlchemyLevel: number; // 요구 연금술 Lv
  recipeName: string; // 제작법
  requiredFacilityTier: number; // 요구 시설 Tier (1~3)
  baseCraftMinutes: number; // 제작 시간
  gameplayEffect: PotionGameplayEffect; // 실제 효과
  durationMinutes?: number; // 지속시간 (분)
  durationTurns?: number; // 지속시간 (턴)
  usableContext: UsableContext; // 사용 가능 상황
  restrictions?: string; // 사용 제한 / 쿨다운
  visualEffectRef: string; // 고유 시각 이펙트 참조 키
  drinkingPresentation: string; // 마실 때의 고유 감각/시각 연출 (1문장)
  actionLogText: string; // 마시는 행동 연출 (1문장)
  effectLogText: string; // 효과 적용 시스템 결과
  statusEffectId: string; // 상태효과 ID
}
