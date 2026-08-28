import { InventoryItem, PlayerState, PlayerStats } from '../../types';
import { ITEM_DATABASE } from '../items/itemDatabase';
import { EQUIPMENT_DATABASE } from '../equipment/equipmentDatabase';
import { EquipmentSlot } from '../equipment/equipmentTypes';
import { BAG_DATABASE, getBagDefinition } from './bagDatabase';
import { EncumbranceLevel, EncumbranceState } from './bagTypes';

// ==========================================
// 가방 및 소지 무게 핵심 설정치
// ==========================================

export const BASE_CARRY_WEIGHT = 15.0; // 기본 운반 한도 (kg)
export const STR_CARRY_WEIGHT_MULT = 2.0; // 근력 1당 운반 한도 증가량 (kg)
export const VIT_CARRY_WEIGHT_MULT = 1.0; // 체력 1당 운반 한도 증가량 (kg)

// 과적 단계별 한도 비율
export const ENCUMBRANCE_THRESHOLDS = {
  NORMAL_MAX: 1.0,     // 0 ~ 100%
  ENCUMBERED_1_MAX: 1.2,// 100 ~ 120%
  ENCUMBERED_2_MAX: 1.5,// 120 ~ 150%
  // > 150%: OVERLOADED (심각한 과적)
};

// 야영지 보관함 레벨별 용량 (kg)
export const CAMP_STORAGE_CAPACITY_BY_LEVEL: Record<number, number> = {
  1: 100.0,
  2: 250.0,
  3: 500.0,
  4: 1000.0,
};

// 장비 슬롯별 표준 기본 무게 (EquipmentDefinition에 weight가 없을 경우 안전한 폴백)
export const DEFAULT_EQUIPMENT_SLOT_WEIGHTS: Record<EquipmentSlot, number> = {
  MAIN_HAND: 2.5,
  OFF_HAND: 2.0,
  HEAD: 1.5,
  CHEST: 6.0,
  LEGS: 3.5,
  BOOTS: 1.5,
  GLOVES: 0.8,
  CLOAK: 0.8,
  NECKLACE: 0.2,
  RING_1: 0.1,
  RING_2: 0.1,
  BRACELET: 0.2,
  EARRING: 0.1,
};

/**
 * 단일 아이템의 개당 무게(kg)를 안전하게 산출합니다.
 */
export function getItemSingleWeight(item: InventoryItem | string): number {
  const itemName = typeof item === 'string' ? item : item.name;
  const itemId = typeof item === 'string' ? item : item.id;
  const equipmentId = typeof item === 'object' ? item.equipmentId : undefined;
  const bagId = typeof item === 'object' ? item.bagId : undefined;

  // 1. 가방 정의 우선 조회
  if (bagId && BAG_DATABASE[bagId]) {
    return BAG_DATABASE[bagId].weight;
  }
  const bagDef = getBagDefinition(itemName) || (itemId ? getBagDefinition(itemId) : undefined);
  if (bagDef) {
    return bagDef.weight;
  }

  // 2. 일반 아이템 DB 조회
  const itemDef = itemId ? ITEM_DATABASE[itemId] : Object.values(ITEM_DATABASE).find((i) => i.name === itemName);
  if (itemDef && typeof itemDef.weight === 'number' && itemDef.weight > 0) {
    return itemDef.weight;
  }

  // 3. 장비 아이템 DB 조회
  if (equipmentId && EQUIPMENT_DATABASE[equipmentId]) {
    const eq = EQUIPMENT_DATABASE[equipmentId];
    if (typeof (eq as any).weight === 'number' && (eq as any).weight > 0) {
      return (eq as any).weight;
    }
    return DEFAULT_EQUIPMENT_SLOT_WEIGHTS[eq.slot] || 1.5;
  }

  // 4. 이름 기반 지능형 기본 무게 추론
  const lower = itemName.toLowerCase();
  if (lower.includes('주괴') || lower.includes('철광석') || lower.includes('금광석') || lower.includes('은광석') || lower.includes('돌') || lower.includes('광석')) {
    return 1.0;
  }
  if (lower.includes('목재') || lower.includes('장작')) {
    return 0.8;
  }
  if (lower.includes('나뭇가지') || lower.includes('깃털') || lower.includes('잎') || lower.includes('약초') || lower.includes('꽃')) {
    return 0.1;
  }
  if (lower.includes('물약') || lower.includes('포션') || lower.includes('엘릭서') || lower.includes('시약') || lower.includes('병')) {
    return 0.4;
  }
  if (lower.includes('책') || lower.includes('고서') || lower.includes('일지') || lower.includes('비전서')) {
    return 0.8;
  }
  if (lower.includes('열쇠') || lower.includes('인장') || lower.includes('반지') || lower.includes('목걸이') || lower.includes('스크롤') || lower.includes('양피지')) {
    return 0.1;
  }
  if (lower.includes('고기') || lower.includes('빵') || lower.includes('식량') || lower.includes('사과')) {
    return 0.3;
  }
  if (lower.includes('갑옷') || lower.includes('흉갑') || lower.includes('플레이트')) {
    return 6.0;
  }
  if (lower.includes('검') || lower.includes('도끼') || lower.includes('창') || lower.includes('둔기') || lower.includes('활')) {
    return 2.5;
  }
  if (lower.includes('단검') || lower.includes('지팡이') || lower.includes('완드')) {
    return 1.2;
  }
  if (lower.includes('방패')) {
    return 3.0;
  }

  return 0.3; // 기본 표준 무게
}

/**
 * 인벤토리 아이템 1종의 총 무게(kg) = 개당 무게 × 수량
 */
export function calculateItemTotalWeight(item: InventoryItem): number {
  const single = getItemSingleWeight(item);
  const qty = Math.max(1, item.quantity || 1);
  return Number((single * qty).toFixed(2));
}

/**
 * 플레이어 인벤토리 전체 소지 무게(kg) 계산
 * = 모든 인벤토리 아이템 무게 합산 + 플레이어가 착용 중인 가방 자체의 무게
 */
export function calculateInventoryWeight(
  inventory: InventoryItem[],
  playerEquippedBagId?: string | null
): number {
  let total = 0;

  if (Array.isArray(inventory)) {
    for (const item of inventory) {
      total += calculateItemTotalWeight(item);
    }
  }

  if (playerEquippedBagId) {
    const bagDef = getBagDefinition(playerEquippedBagId);
    if (bagDef) {
      total += bagDef.weight;
    }
  }

  return Number(total.toFixed(1));
}

/**
 * 플레이어 단독 기본 운반 용량(kg) = 15 + 근력 * 2 + 체력 * 1
 */
export function calculateBaseCarryWeight(stats: PlayerStats): number {
  const str = stats.strength ?? 5;
  const vit = stats.vitality ?? 5;
  return Number((BASE_CARRY_WEIGHT + str * STR_CARRY_WEIGHT_MULT + vit * VIT_CARRY_WEIGHT_MULT).toFixed(1));
}

/**
 * 파티 전체의 최종 최대 운반 용량(kg) 계산
 * = 플레이어 기본 운반 용량
 * + 플레이어 장착 가방 보너스
 * + 활성 파티 동료(isActivePartyMember === true) 장착 가방 보너스 합산
 */
export function calculatePartyCarryWeight(playerState: PlayerState): number {
  let maxWeight = calculateBaseCarryWeight(playerState.stats);

  // 플레이어 장착 가방 보너스
  if (playerState.equippedBagId) {
    const bagDef = getBagDefinition(playerState.equippedBagId);
    if (bagDef) {
      maxWeight += bagDef.bonusCarryWeight;
    }
  }

  // 활성 파티 동료 장착 가방 보너스
  if (Array.isArray(playerState.companions)) {
    for (const comp of playerState.companions) {
      if (comp.isActivePartyMember && comp.equippedBagId) {
        const compBag = getBagDefinition(comp.equippedBagId);
        if (compBag) {
          maxWeight += compBag.bonusCarryWeight;
        }
      }
    }
  }

  return Number(maxWeight.toFixed(1));
}

/**
 * 현재 무게와 최대 무게를 바탕으로 과적 상태(EncumbranceState) 산출
 */
export function calculateEncumbranceState(
  currentWeight: number,
  maxWeight: number
): EncumbranceState {
  const safeMax = Math.max(1, maxWeight);
  const ratio = currentWeight / safeMax;

  if (ratio <= ENCUMBRANCE_THRESHOLDS.NORMAL_MAX) {
    return {
      level: 'NORMAL',
      ratio,
      label: '정상',
      speedPenaltyPercent: 0,
      evasionPenaltyPercent: 0,
      escapePenaltyPercent: 0,
      canLootNormalItems: true,
      badgeClass: 'text-emerald-400 border-emerald-700/60 bg-emerald-950/40',
      description: '소지품의 무게가 적정하여 가뿐하고 원활하게 움직일 수 있습니다.',
    };
  }

  if (ratio <= ENCUMBRANCE_THRESHOLDS.ENCUMBERED_1_MAX) {
    return {
      level: 'ENCUMBERED_1',
      ratio,
      label: '과적 I',
      speedPenaltyPercent: 5,
      evasionPenaltyPercent: 0,
      escapePenaltyPercent: 10,
      canLootNormalItems: true,
      badgeClass: 'text-amber-400 border-amber-700/60 bg-amber-950/40',
      description: '가방이 다소 무거워져 행동 속도가 5% 감소하고 전투 중 도주 시 약간의 불리함을 겪습니다.',
    };
  }

  if (ratio <= ENCUMBRANCE_THRESHOLDS.ENCUMBERED_2_MAX) {
    return {
      level: 'ENCUMBERED_2',
      ratio,
      label: '과적 II',
      speedPenaltyPercent: 15,
      evasionPenaltyPercent: 10,
      escapePenaltyPercent: 25,
      canLootNormalItems: true,
      badgeClass: 'text-orange-400 border-orange-700/60 bg-orange-950/40',
      description: '가방이 꽉 차 무거워져 행동 속도 15% 감소, 회피율 10% 감소 및 도주율이 크게 떨어집니다.',
    };
  }

  return {
    level: 'OVERLOADED',
    ratio,
    label: '심각한 과적',
    speedPenaltyPercent: 30,
    evasionPenaltyPercent: 20,
    escapePenaltyPercent: 50,
    canLootNormalItems: false,
    badgeClass: 'text-rose-400 border-rose-700/70 bg-rose-950/60 animate-pulse',
    description: '극심한 무게로 인해 행동 속도 30% 감소, 회피율 20% 감소 및 일반 물품을 추가로 수납할 수 없습니다 (퀘스트/열쇠 등 중요 물품만 가능).',
  };
}

/**
 * 야영지 보관함의 총 무게(kg) 계산
 */
export function calculateCampStorageWeight(storageItems: InventoryItem[] = []): number {
  let total = 0;
  if (Array.isArray(storageItems)) {
    for (const item of storageItems) {
      total += calculateItemTotalWeight(item);
    }
  }
  return Number(total.toFixed(1));
}

/**
 * 야영지 보관함 시설 레벨에 따른 최대 보관 용량(kg) 반환
 */
export function getCampStorageMaxCapacity(facilityLevel: number = 1): number {
  return CAMP_STORAGE_CAPACITY_BY_LEVEL[facilityLevel] || 100.0;
}
