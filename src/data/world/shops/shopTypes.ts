import type { ItemCategory, MerchantTrait, ShopStockKind, ShopType } from '../../../types';
import type { EquipmentType, EquipmentRarity } from '../../equipment/equipmentTypes';

export type ShopRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface FixedShopStockRule {
  kind: ShopStockKind;
  itemId: string;
  minQuantity: number;
  maxQuantity: number;
  limited?: boolean;
}

export interface ShopRandomStockRule {
  kind: ShopStockKind;
  slots: number;
  minQuantity: number;
  maxQuantity: number;
  itemCategories?: ItemCategory[];
  equipmentTypes?: EquipmentType[];
  requiredTags?: string[];
  forbiddenTags?: string[];
  maxRarity?: ShopRarity;
  minRarity?: ShopRarity;
  /** 던전 코어/지역 유물편 같은 공략 전용 재료를 랜덤 재고에 허용할지 여부. 기본 false. */
  allowDungeonRewards?: boolean;
}

export interface ShopTypeProfile {
  id: ShopType;
  name: string;
  description: string;
  restockHours: number;
  stockSize: number;
  purchasePriceMultiplier: number;
  playerSellMultiplier: number;
  acceptedItemCategories?: ItemCategory[];
  acceptedEquipmentTypes?: EquipmentType[];
  acceptedEquipmentTags?: string[];
  fixedStock: FixedShopStockRule[];
  randomStock: ShopRandomStockRule[];
  defaultTraits?: MerchantTrait[];
  specialFlags?: string[];
}

export interface MerchantDefinition {
  id: string;
  name: string;
  shopType: ShopType;
  traits?: MerchantTrait[];
  priceModifier?: number;
  sellModifier?: number;
  restockHours?: number;
  stockSizeModifier?: number;
  fixedStock?: FixedShopStockRule[];
  specialFlags?: string[];
}

export type EconomyMarketSector = 'GENERAL' | 'FOOD' | 'MATERIAL' | 'EQUIPMENT' | 'MAGIC' | 'LUXURY';

export interface ShopPriceContext {
  regionId?: string;
  settlementId?: string;
  economyTags?: string[];
  purchaseModifier?: number;
  sellModifier?: number;
  /** 4.0.4: 날짜/지역에 따라 달라지는 시장 지수. 1.0이 기준가. */
  marketIndices?: Partial<Record<EconomyMarketSector, number>>;
  /** 4.0.5: 정착지 대표 특산 태그. 전문점/수집가 우대 판정에 사용한다. */
  specialtyTags?: string[];
}

export interface ShopSnapshotEntry {
  stockId: string;
  kind: ShopStockKind;
  itemId: string;
  name: string;
  quantity: number;
  limited: boolean;
  rarity: ShopRarity;
  unitBuyPrice: number;
  unitSellPrice: number | null;
}

export interface ShopSnapshot {
  merchantId: string;
  merchantName: string;
  shopType: ShopType;
  shopTypeName: string;
  affinity: number;
  affinityTier: string;
  totalTransactions: number;
  haggleAvailable: boolean;
  haggleEffectLabel?: string;
  restockCycle: number;
  nextRestockAbsoluteMinute: number;
  entries: ShopSnapshotEntry[];
}


export interface ShopSellOffer {
  itemId: string;
  name: string;
  kind: ShopStockKind;
  quantity: number;
  unitSellPrice: number;
}

export interface ShopHaggleResult {
  stateChanged: boolean;
  ok: boolean;
  success: boolean;
  message: string;
  chance: number;
  modifier: number;
  kind: 'BUY' | 'SELL';
}

export type ShopTransactionKind = 'BUY' | 'SELL';

export interface ShopTransactionRequest {
  transactionId: string;
  merchantId: string;
  kind: ShopTransactionKind;
  itemId: string;
  quantity: number;
  stockId?: string;
  context?: ShopPriceContext;
}

export type ShopTransactionFailureReason =
  | 'INVALID_REQUEST'
  | 'UNKNOWN_MERCHANT'
  | 'UNKNOWN_ITEM'
  | 'OUT_OF_STOCK'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_ITEMS'
  | 'MERCHANT_REJECTS_ITEM'
  | 'DUPLICATE_TRANSACTION';

export interface ShopTransactionResult {
  ok: boolean;
  reason?: ShopTransactionFailureReason;
  message: string;
  transactionId: string;
  merchantId: string;
  kind: ShopTransactionKind;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export const SHOP_RARITY_ORDER: Record<ShopRarity, number> = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
};

export function normalizeShopRarity(value?: string | null): ShopRarity {
  const clean = String(value || 'COMMON').toUpperCase();
  return clean === 'UNCOMMON' || clean === 'RARE' || clean === 'EPIC' || clean === 'LEGENDARY'
    ? clean
    : 'COMMON';
}
