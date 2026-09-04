import type {
  CommerceRuntimeState,
  InventoryItem,
  MerchantRuntimeState,
  MerchantTrait,
  PlayerState,
  ShopStockEntry,
  ShopStockKind,
} from '../../../types';
import { ITEM_DATABASE, getItemDefinition } from '../../items/itemDatabase';
import { EQUIPMENT_DATABASE, getEquipmentDefinition } from '../../equipment/equipmentDatabase';
import type { EquipmentDefinition } from '../../equipment/equipmentTypes';
import { getMerchantDefinition, getShopTypeProfile } from './shopCatalog';
import {
  SHOP_RARITY_ORDER,
  normalizeShopRarity,
  type EconomyMarketSector,
  type MerchantDefinition,
  type ShopPriceContext,
  type ShopRandomStockRule,
  type ShopSnapshot,
  type ShopSnapshotEntry,
  type ShopSellOffer,
  type ShopHaggleResult,
  type ShopTransactionRequest,
  type ShopTransactionResult,
} from './shopTypes';

const COMMERCE_SCHEMA_VERSION = 2 as const;
const MAX_RECENT_TRANSACTION_IDS = 32;

const ITEM_PRICE_OVERRIDES: Record<string, number> = {
  potion_small_health: 45,
  potion_lesser_health: 90,
  potion_greater_health: 220,
  potion_mana_draught: 75,
  potion_concentrated_mana: 180,
  calm_herb_tea: 28,
  holy_silver_water: 120,
  rope: 35,
  shovel: 80,
  torch: 18,
  lockpick_set: 90,
  wood_branch: 4,
  wood_timber: 16,
  stone_rock: 5,
  iron_ore: 22,
  silver_ingot: 95,
  thread: 8,
  clear_dew: 14,
  fresh_meat: 12,
  plant_root: 8,
  wild_herb: 10,
  wolf_pelt: 42,
  mana_crystal_shard: 85,
};

const CATEGORY_BASE_VALUE: Record<string, number> = {
  CONSUMABLE: 35,
  MATERIAL: 18,
  EQUIPMENT: 80,
  KEY: 30,
  QUEST: 1,
  MAP: 120,
  TOOL: 65,
  BOOK: 110,
  DOCUMENT: 75,
  GIFT: 70,
  VALUABLE: 150,
  MISC: 20,
};

const RARITY_VALUE_MULTIPLIER: Record<string, number> = {
  COMMON: 1,
  UNCOMMON: 1.8,
  RARE: 3.4,
  EPIC: 6.5,
  LEGENDARY: 12,
};

const ECONOMY_TAG_PURCHASE_MODIFIERS: Record<string, number> = {
  CHEAP_MATERIAL: 0.82,
  CHEAP_FOOD: 0.85,
  CHEAP_EQUIPMENT: 0.88,
  CHEAP_MAGIC: 0.88,
  EXPENSIVE_MATERIAL: 1.18,
  EXPENSIVE_FOOD: 1.18,
  EXPENSIVE_EQUIPMENT: 1.20,
  EXPENSIVE_MAGIC: 1.22,
  LUXURY_MARKET: 1.12,
  REMOTE_MARKET: 1.15,
};

const ECONOMY_TAG_SELL_MODIFIERS: Record<string, number> = {
  HIGH_DEMAND_MATERIAL: 1.22,
  HIGH_DEMAND_EQUIPMENT: 1.18,
  HIGH_DEMAND_MAGIC: 1.18,
  LOW_DEMAND_MATERIAL: 0.84,
  LOW_DEMAND_EQUIPMENT: 0.86,
  LOW_DEMAND_MAGIC: 0.86,
};

interface TradableDescriptor {
  kind: ShopStockKind;
  id: string;
  name: string;
  rarity: ReturnType<typeof normalizeShopRarity>;
  itemCategory?: string;
  equipmentType?: string;
  equipmentTags: string[];
  purchaseBaseValue: number;
  sellBaseValue: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function currentAbsoluteMinute(state: Pick<PlayerState, 'dayCount' | 'currentHour' | 'currentMinute'>): number {
  const day = Math.max(1, Math.floor(Number(state.dayCount) || 1));
  const hour = clamp(Math.floor(Number(state.currentHour) || 0), 0, 23);
  const minute = clamp(Math.floor(Number(state.currentMinute) || 0), 0, 59);
  return (day - 1) * 1440 + hour * 60 + minute;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = hashString(seed) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng: () => number, min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function equipmentValue(def: EquipmentDefinition): { purchase: number; sell: number } {
  const sell = Math.max(1, Math.round(Number(def.sellPrice) || 1));
  return { purchase: Math.max(sell + 1, Math.round(sell * 2.15)), sell };
}

function itemValue(itemId: string): { purchase: number; sell: number } {
  const def = getItemDefinition(itemId);
  if (!def) return { purchase: 20, sell: 8 };
  const override = ITEM_PRICE_OVERRIDES[def.id];
  const rarity = normalizeShopRarity(def.rarity);
  const base = override ?? Math.max(2, Math.round((CATEGORY_BASE_VALUE[def.category] || 20) * (RARITY_VALUE_MULTIPLIER[rarity] || 1)));
  return { purchase: base, sell: Math.max(1, Math.round(base * 0.42)) };
}

function describeTradable(kind: ShopStockKind, itemId: string): TradableDescriptor | undefined {
  if (kind === 'EQUIPMENT') {
    const def = getEquipmentDefinition(itemId);
    if (!def) return undefined;
    const value = equipmentValue(def);
    return {
      kind,
      id: def.id,
      name: def.name,
      rarity: normalizeShopRarity(def.rarity),
      equipmentType: def.equipmentType,
      equipmentTags: Array.isArray(def.tags) ? def.tags : [],
      purchaseBaseValue: value.purchase,
      sellBaseValue: value.sell,
    };
  }
  const def = getItemDefinition(itemId);
  if (!def) return undefined;
  const value = itemValue(def.id);
  return {
    kind,
    id: def.id,
    name: def.name,
    rarity: normalizeShopRarity(def.rarity),
    itemCategory: def.category,
    equipmentTags: [],
    purchaseBaseValue: value.purchase,
    sellBaseValue: value.sell,
  };
}

function resolveInventoryTradable(item: InventoryItem): TradableDescriptor | undefined {
  if (item.equipmentId) return describeTradable('EQUIPMENT', item.equipmentId);
  const equipment = getEquipmentDefinition(item.id || item.name);
  if (equipment) return describeTradable('EQUIPMENT', equipment.id);
  const def = getItemDefinition(item.id || item.name);
  if (def) return describeTradable('ITEM', def.id);

  // Gemini/구세이브에서 생성된 비정규 아이템도 카테고리 정보가 있으면 매입 판정을 할 수 있다.
  // 단, 정식 DB 정의가 없으므로 상점 재판매 재고에는 넣지 않는다.
  if (item.category && item.category !== 'QUEST' && item.category !== 'KEY') {
    const rarity = normalizeShopRarity('COMMON');
    const base = Math.max(2, CATEGORY_BASE_VALUE[item.category] || 20);
    return {
      kind: 'ITEM',
      id: item.id || item.name,
      name: item.name,
      rarity,
      itemCategory: item.category,
      equipmentTags: [],
      purchaseBaseValue: base,
      sellBaseValue: Math.max(1, Math.round(base * 0.42)),
    };
  }
  return undefined;
}

function makeInventoryItem(descriptor: TradableDescriptor, quantity: number): InventoryItem {
  if (descriptor.kind === 'EQUIPMENT') {
    const def = getEquipmentDefinition(descriptor.id)!;
    return {
      id: def.id,
      name: def.name,
      quantity,
      description: def.description,
      flavorText: def.flavorText,
      illustrationUrl: def.illustrationUrl,
      equipmentId: def.id,
      category: 'EQUIPMENT',
      quality: 'NORMAL',
    };
  }
  const def = getItemDefinition(descriptor.id)!;
  return {
    id: def.id,
    name: def.name,
    quantity,
    description: def.description,
    flavorText: def.flavorText,
    illustrationUrl: def.illustrationUrl,
    category: def.category,
    quality: 'NORMAL',
  };
}

function addInventoryItem(inventory: InventoryItem[], incoming: InventoryItem): InventoryItem[] {
  const index = inventory.findIndex((entry) =>
    (entry.id && incoming.id && entry.id === incoming.id)
    || (entry.equipmentId && incoming.equipmentId && entry.equipmentId === incoming.equipmentId && entry.quality === incoming.quality)
    || (!entry.equipmentId && !incoming.equipmentId && entry.name.trim() === incoming.name.trim())
  );
  if (index < 0) return [...inventory, incoming];
  return inventory.map((entry, i) => i === index ? { ...entry, quantity: Math.max(0, entry.quantity) + incoming.quantity } : entry);
}

function removeInventoryItem(inventory: InventoryItem[], target: InventoryItem, quantity: number): InventoryItem[] {
  let remaining = Math.max(0, quantity);
  return inventory
    .map((entry) => {
      if (remaining <= 0) return entry;
      const same = entry === target
        || (target.id && entry.id === target.id)
        || (target.equipmentId && entry.equipmentId === target.equipmentId && entry.quality === target.quality)
        || (!target.id && !target.equipmentId && entry.name === target.name);
      if (!same) return entry;
      const remove = Math.min(Math.max(0, entry.quantity), remaining);
      remaining -= remove;
      return { ...entry, quantity: entry.quantity - remove };
    })
    .filter((entry) => entry.quantity > 0);
}

function traitPurchaseModifier(traits: MerchantTrait[]): number {
  let out = 1;
  if (traits.includes('GENEROUS')) out *= 0.95;
  if (traits.includes('GREEDY')) out *= 1.12;
  if (traits.includes('CAUTIOUS')) out *= 1.04;
  if (traits.includes('EXPERT')) out *= 1.04;
  return out;
}

function traitSellModifier(traits: MerchantTrait[]): number {
  let out = 1;
  if (traits.includes('GENEROUS')) out *= 1.05;
  if (traits.includes('GREEDY')) out *= 0.90;
  if (traits.includes('CAUTIOUS')) out *= 0.95;
  if (traits.includes('EXPERT')) out *= 1.05;
  if (traits.includes('COLLECTOR')) out *= 1.12;
  return out;
}

function affinityPurchaseModifier(affinity: number): number {
  if (affinity >= 80) return 0.89;
  if (affinity >= 60) return 0.92;
  if (affinity >= 40) return 0.95;
  if (affinity >= 20) return 0.97;
  return 1;
}

function affinitySellModifier(affinity: number): number {
  if (affinity >= 80) return 1.12;
  if (affinity >= 60) return 1.08;
  if (affinity >= 40) return 1.05;
  if (affinity >= 20) return 1.03;
  return 1;
}

export function getMerchantAffinityTier(affinityInput: number): { level: number; name: string; nextAt?: number } {
  const affinity = clamp(Number(affinityInput) || 0, 0, 100);
  if (affinity >= 80) return { level: 4, name: 'VIP 단골' };
  if (affinity >= 60) return { level: 3, name: '신뢰받는 단골', nextAt: 80 };
  if (affinity >= 40) return { level: 2, name: '친숙한 손님', nextAt: 60 };
  if (affinity >= 20) return { level: 1, name: '단골', nextAt: 40 };
  return { level: 0, name: '낯선 손님', nextAt: 20 };
}

function pendingHagglePurchaseModifier(runtime: MerchantRuntimeState): number {
  return (runtime.pendingHaggleUses || 0) > 0
    ? clamp(Number(runtime.pendingHaggleBuyModifier) || 1, 0.85, 1)
    : 1;
}

function pendingHaggleSellModifier(runtime: MerchantRuntimeState): number {
  return (runtime.pendingHaggleUses || 0) > 0
    ? clamp(Number(runtime.pendingHaggleSellModifier) || 1, 1, 1.18)
    : 1;
}

function descriptorMatchesSpecialty(descriptor: TradableDescriptor, specialtyTags?: string[]): boolean {
  const tags = new Set((specialtyTags || []).map((value) => String(value).toUpperCase()));
  if (!tags.size) return false;
  const id = descriptor.id.toUpperCase();
  const itemCategory = String(descriptor.itemCategory || '').toUpperCase();
  if ((tags.has('ORE') || tags.has('METAL')) && /(ORE|INGOT|IRON|SILVER|METAL)/.test(id)) return true;
  if (tags.has('CRYSTAL') && /(CRYSTAL|GEM|JEWEL)/.test(id)) return true;
  if ((tags.has('HERB') || tags.has('FUNGUS')) && /(HERB|ROOT|MUSHROOM|FUNG|PLANT)/.test(id)) return true;
  if ((tags.has('FOOD') || tags.has('AQUATIC')) && (itemCategory === 'CONSUMABLE' || /(MEAT|FOOD|TEA|FISH)/.test(id))) return true;
  if ((tags.has('HUNTER') || tags.has('FUR')) && /(PELT|HIDE|MEAT|LEATHER)/.test(id)) return true;
  if ((tags.has('MAGIC') || tags.has('MAGITECH')) && /(MANA|MAGIC|ARCANE|RUNE|HOLY|CRYSTAL)/.test(id)) return true;
  if ((tags.has('TRAVEL') || tags.has('PORT')) && (itemCategory === 'TOOL' || itemCategory === 'MAP')) return true;
  if (tags.has('JEWEL') && (itemCategory === 'VALUABLE' || descriptor.equipmentType === 'ACCESSORY')) return true;
  return false;
}

function specialtyPurchaseModifier(descriptor: TradableDescriptor, merchant: MerchantDefinition, context?: ShopPriceContext): number {
  if (merchant.shopType !== 'SPECIALTY' || !descriptorMatchesSpecialty(descriptor, context?.specialtyTags)) return 1;
  return 0.94;
}

function specialtySellModifier(descriptor: TradableDescriptor, merchant: MerchantDefinition, traits: MerchantTrait[], context?: ShopPriceContext): number {
  let out = 1;
  if (merchant.shopType === 'SPECIALTY' && descriptorMatchesSpecialty(descriptor, context?.specialtyTags)) out *= 1.15;
  if (traits.includes('COLLECTOR')) {
    const rare = SHOP_RARITY_ORDER[descriptor.rarity] >= SHOP_RARITY_ORDER.RARE;
    if (rare) out *= 1.12;
    else if (descriptor.itemCategory === 'MATERIAL' || descriptor.itemCategory === 'VALUABLE' || descriptor.equipmentType === 'ACCESSORY') out *= 1.07;
  }
  return clamp(out, 1, 1.28);
}

function descriptorMarketSector(descriptor: TradableDescriptor): EconomyMarketSector {
  if (descriptor.kind === 'EQUIPMENT') {
    return descriptor.equipmentType === 'ACCESSORY' ? 'LUXURY' : 'EQUIPMENT';
  }
  const id = descriptor.id.toLowerCase();
  if (descriptor.itemCategory === 'VALUABLE' || descriptor.itemCategory === 'GIFT') return 'LUXURY';
  if (descriptor.itemCategory === 'MATERIAL') return 'MATERIAL';
  if (descriptor.itemCategory === 'BOOK' || descriptor.itemCategory === 'DOCUMENT' || id.includes('mana') || id.includes('potion') || id.includes('holy')) return 'MAGIC';
  if (id.includes('meat') || id.includes('food') || id.includes('tea') || id.includes('root')) return 'FOOD';
  return 'GENERAL';
}

function marketIndexModifier(descriptor: TradableDescriptor, context?: ShopPriceContext): number {
  const sector = descriptorMarketSector(descriptor);
  const raw = Number(context?.marketIndices?.[sector]);
  return Number.isFinite(raw) && raw > 0 ? clamp(raw, 0.72, 1.38) : 1;
}

function economyPurchaseModifier(descriptor: TradableDescriptor, context?: ShopPriceContext): number {
  let out = Number(context?.purchaseModifier) || 1;
  for (const tag of context?.economyTags || []) out *= ECONOMY_TAG_PURCHASE_MODIFIERS[tag] || 1;
  out *= marketIndexModifier(descriptor, context);
  return clamp(out, 0.60, 1.70);
}

function economySellModifier(descriptor: TradableDescriptor, context?: ShopPriceContext): number {
  let out = Number(context?.sellModifier) || 1;
  for (const tag of context?.economyTags || []) out *= ECONOMY_TAG_SELL_MODIFIERS[tag] || 1;
  const marketIndex = marketIndexModifier(descriptor, context);
  out *= 1 + (marketIndex - 1) * 0.72;
  return clamp(out, 0.60, 1.70);
}

function getMerchantTraits(def: MerchantDefinition): MerchantTrait[] {
  const profile = getShopTypeProfile(def.shopType);
  return Array.from(new Set([...(profile.defaultTraits || []), ...(def.traits || [])]));
}

export function calculateShopBuyPrice(
  descriptor: TradableDescriptor,
  merchant: MerchantDefinition,
  runtime: MerchantRuntimeState,
  context?: ShopPriceContext,
): number {
  const profile = getShopTypeProfile(merchant.shopType);
  const traits = getMerchantTraits(merchant);
  const modifier = profile.purchasePriceMultiplier
    * Math.max(0.5, Number(merchant.priceModifier) || 1)
    * traitPurchaseModifier(traits)
    * affinityPurchaseModifier(runtime.affinity)
    * pendingHagglePurchaseModifier(runtime)
    * specialtyPurchaseModifier(descriptor, merchant, context)
    * economyPurchaseModifier(descriptor, context);
  return Math.max(1, Math.round(descriptor.purchaseBaseValue * clamp(modifier, 0.45, 2.5)));
}

export function calculateShopSellPrice(
  descriptor: TradableDescriptor,
  merchant: MerchantDefinition,
  runtime: MerchantRuntimeState,
  context?: ShopPriceContext,
): number | null {
  if (!merchantAcceptsDescriptor(merchant, descriptor)) return null;
  const profile = getShopTypeProfile(merchant.shopType);
  const traits = getMerchantTraits(merchant);
  const modifier = profile.playerSellMultiplier
    * Math.max(0.5, Number(merchant.sellModifier) || 1)
    * traitSellModifier(traits)
    * affinitySellModifier(runtime.affinity)
    * pendingHaggleSellModifier(runtime)
    * specialtySellModifier(descriptor, merchant, traits, context)
    * economySellModifier(descriptor, context);
  const rawSellPrice = Math.max(1, Math.round(descriptor.purchaseBaseValue * clamp(modifier, 0.12, 1.65)));
  // 동일 상점에서 즉시 되팔아 루피를 복제하는 가격 역전은 어떤 지역/호감도 조합에서도 금지한다.
  const buyCapRuntime: MerchantRuntimeState = {
    ...runtime,
    pendingHaggleBuyModifier: undefined,
    pendingHaggleUses: runtime.pendingHaggleSellModifier && runtime.pendingHaggleSellModifier > 1 ? runtime.pendingHaggleUses : 0,
  };
  const sameShopBuyPrice = calculateShopBuyPrice(descriptor, merchant, buyCapRuntime, context);
  return Math.max(1, Math.min(rawSellPrice, Math.floor(sameShopBuyPrice * 0.90)));
}

function merchantAcceptsDescriptor(merchant: MerchantDefinition, descriptor: TradableDescriptor): boolean {
  const profile = getShopTypeProfile(merchant.shopType);
  if (descriptor.kind === 'ITEM') {
    if (!profile.acceptedItemCategories?.length) return false;
    return profile.acceptedItemCategories.includes(descriptor.itemCategory as any);
  }
  if (profile.acceptedEquipmentTypes?.includes(descriptor.equipmentType as any)) return true;
  if (profile.acceptedEquipmentTags?.some((tag) => descriptor.equipmentTags.includes(tag))) return true;
  return false;
}

function descriptorMatchesRandomRule(descriptor: TradableDescriptor, rule: ShopRandomStockRule): boolean {
  if (descriptor.kind !== rule.kind) return false;
  if (!rule.allowDungeonRewards && (descriptor.id.startsWith('dungeon_core_') || descriptor.id.startsWith('dungeon_relic_'))) return false;
  const rarity = SHOP_RARITY_ORDER[descriptor.rarity];
  if (rule.minRarity && rarity < SHOP_RARITY_ORDER[rule.minRarity]) return false;
  if (rule.maxRarity && rarity > SHOP_RARITY_ORDER[rule.maxRarity]) return false;
  if (descriptor.kind === 'ITEM') {
    if (rule.itemCategories?.length && !rule.itemCategories.includes(descriptor.itemCategory as any)) return false;
  } else {
    if (rule.equipmentTypes?.length && !rule.equipmentTypes.includes(descriptor.equipmentType as any)) return false;
    if (rule.requiredTags?.length && !rule.requiredTags.every((tag) => descriptor.equipmentTags.includes(tag))) return false;
    if (rule.forbiddenTags?.some((tag) => descriptor.equipmentTags.includes(tag))) return false;
  }
  return true;
}

function getCandidateDescriptors(kind: ShopStockKind): TradableDescriptor[] {
  if (kind === 'EQUIPMENT') {
    return Object.values(EQUIPMENT_DATABASE)
      .map((def) => describeTradable('EQUIPMENT', def.id))
      .filter((value): value is TradableDescriptor => Boolean(value));
  }
  return Object.values(ITEM_DATABASE)
    .map((def) => describeTradable('ITEM', def.id))
    .filter((value): value is TradableDescriptor => Boolean(value))
    .filter((value) => value.itemCategory !== 'QUEST' && value.itemCategory !== 'KEY');
}

function generateMerchantStock(merchant: MerchantDefinition, cycle: number, affinityInput = 0): ShopStockEntry[] {
  const profile = getShopTypeProfile(merchant.shopType);
  const rng = seededRandom(`${merchant.id}:${cycle}:${merchant.shopType}`);
  const output: ShopStockEntry[] = [];
  const used = new Set<string>();
  const fixedRules = [...profile.fixedStock, ...(merchant.fixedStock || [])];

  for (const rule of fixedRules) {
    const descriptor = describeTradable(rule.kind, rule.itemId);
    if (!descriptor || used.has(`${rule.kind}:${descriptor.id}`)) continue;
    const quantity = randomInt(rng, rule.minQuantity, rule.maxQuantity);
    output.push({
      stockId: `${merchant.id}:${rule.kind}:${descriptor.id}`,
      kind: rule.kind,
      itemId: descriptor.id,
      quantity,
      targetQuantity: quantity,
      limited: Boolean(rule.limited),
      generatedCycle: cycle,
    });
    used.add(`${rule.kind}:${descriptor.id}`);
  }

  for (const rule of profile.randomStock) {
    const pool = getCandidateDescriptors(rule.kind).filter((descriptor) => descriptorMatchesRandomRule(descriptor, rule));
    for (let slot = 0; slot < rule.slots && pool.length > 0; slot += 1) {
      const eligible = pool.filter((descriptor) => !used.has(`${descriptor.kind}:${descriptor.id}`));
      if (eligible.length === 0) break;
      const picked = eligible[Math.floor(rng() * eligible.length)];
      const quantity = randomInt(rng, rule.minQuantity, rule.maxQuantity);
      output.push({
        stockId: `${merchant.id}:${picked.kind}:${picked.id}`,
        kind: picked.kind,
        itemId: picked.id,
        quantity,
        targetQuantity: quantity,
        limited: picked.kind === 'EQUIPMENT' || quantity <= 1,
        generatedCycle: cycle,
      });
      used.add(`${picked.kind}:${picked.id}`);
    }
  }

  // 4.0.5: 친밀도 40/80에서 각각 단골 전용 랜덤 재고 슬롯이 1칸씩 열린다.
  const affinity = clamp(Number(affinityInput) || 0, 0, 100);
  const bonusSlots = affinity >= 80 ? 2 : affinity >= 40 ? 1 : 0;
  const bonusRules = profile.randomStock.filter((rule) => rule.slots > 0);
  for (let slot = 0; slot < bonusSlots && bonusRules.length > 0; slot += 1) {
    const rule = bonusRules[slot % bonusRules.length];
    const pool = getCandidateDescriptors(rule.kind)
      .filter((descriptor) => descriptorMatchesRandomRule(descriptor, rule))
      .filter((descriptor) => !used.has(`${descriptor.kind}:${descriptor.id}`));
    if (!pool.length) continue;
    const picked = pool[Math.floor(rng() * pool.length)];
    const quantity = randomInt(rng, rule.minQuantity, rule.maxQuantity);
    output.push({
      stockId: `${merchant.id}:${picked.kind}:${picked.id}`,
      kind: picked.kind,
      itemId: picked.id,
      quantity,
      targetQuantity: quantity,
      limited: picked.kind === 'EQUIPMENT' || quantity <= 1,
      generatedCycle: cycle,
    });
    used.add(`${picked.kind}:${picked.id}`);
  }

  const limit = Math.max(1, Math.round(profile.stockSize * Math.max(0.5, Number(merchant.stockSizeModifier) || 1))) + bonusSlots;
  return output.slice(0, Math.max(limit, fixedRules.length));
}

export function createEmptyCommerceRuntimeState(): CommerceRuntimeState {
  return { schemaVersion: COMMERCE_SCHEMA_VERSION, merchants: {}, transactionSequence: 0 };
}

export function normalizeCommerceRuntimeState(raw?: Partial<CommerceRuntimeState> | null): CommerceRuntimeState {
  const merchants: Record<string, MerchantRuntimeState> = {};
  if (raw?.merchants && typeof raw.merchants === 'object') {
    for (const [merchantId, value] of Object.entries(raw.merchants)) {
      if (!value || typeof value !== 'object') continue;
      const runtime = value as MerchantRuntimeState;
      merchants[merchantId] = {
        merchantId,
        affinity: clamp(Number(runtime.affinity) || 0, 0, 100),
        stock: Array.isArray(runtime.stock)
          ? runtime.stock.filter((entry) => entry && entry.stockId && entry.itemId && (entry.kind === 'ITEM' || entry.kind === 'EQUIPMENT')).map((entry) => ({
              stockId: String(entry.stockId),
              kind: entry.kind,
              itemId: String(entry.itemId),
              quantity: Math.max(0, Math.floor(Number(entry.quantity) || 0)),
              targetQuantity: Math.max(0, Math.floor(Number(entry.targetQuantity ?? entry.quantity) || 0)),
              limited: Boolean(entry.limited),
              generatedCycle: Math.max(0, Math.floor(Number(entry.generatedCycle) || 0)),
            }))
          : [],
        restockCycle: Math.max(-1, Math.floor(Number(runtime.restockCycle) || 0)),
        lastRestockAbsoluteMinute: Math.max(0, Math.floor(Number(runtime.lastRestockAbsoluteMinute) || 0)),
        recentTransactionIds: Array.isArray(runtime.recentTransactionIds)
          ? runtime.recentTransactionIds.filter(Boolean).map(String).slice(-MAX_RECENT_TRANSACTION_IDS)
          : [],
        lastHaggleDay: runtime.lastHaggleDay == null ? undefined : Math.max(1, Math.floor(Number(runtime.lastHaggleDay) || 1)),
        pendingHaggleBuyModifier: runtime.pendingHaggleBuyModifier == null ? undefined : clamp(Number(runtime.pendingHaggleBuyModifier) || 1, 0.85, 1),
        pendingHaggleSellModifier: runtime.pendingHaggleSellModifier == null ? undefined : clamp(Number(runtime.pendingHaggleSellModifier) || 1, 1, 1.18),
        pendingHaggleUses: Math.max(0, Math.min(1, Math.floor(Number(runtime.pendingHaggleUses) || 0))),
        totalTransactions: Math.max(0, Math.floor(Number(runtime.totalTransactions) || 0)),
      };
    }
  }
  return {
    schemaVersion: COMMERCE_SCHEMA_VERSION,
    merchants,
    transactionSequence: Math.max(0, Math.floor(Number(raw?.transactionSequence) || 0)),
  };
}

function ensureMerchantRuntime(
  state: PlayerState,
  merchant: MerchantDefinition,
): { commerce: CommerceRuntimeState; runtime: MerchantRuntimeState; changed: boolean } {
  const commerce = normalizeCommerceRuntimeState(state.commerce);
  const profile = getShopTypeProfile(merchant.shopType);
  const now = currentAbsoluteMinute(state);
  const restockMinutes = Math.max(60, Math.round((merchant.restockHours || profile.restockHours) * 60));
  const cycle = Math.floor(now / restockMinutes);
  const saved = commerce.merchants[merchant.id];

  if (saved && saved.restockCycle === cycle && saved.stock.length > 0) {
    return { commerce, runtime: saved, changed: false };
  }

  const affinity = clamp(Number(saved?.affinity) || 0, 0, 100);
  const runtime: MerchantRuntimeState = {
    merchantId: merchant.id,
    affinity,
    stock: generateMerchantStock(merchant, cycle, affinity),
    restockCycle: cycle,
    lastRestockAbsoluteMinute: now,
    recentTransactionIds: saved?.recentTransactionIds || [],
    lastHaggleDay: saved?.lastHaggleDay,
    pendingHaggleBuyModifier: saved?.pendingHaggleBuyModifier,
    pendingHaggleSellModifier: saved?.pendingHaggleSellModifier,
    pendingHaggleUses: saved?.pendingHaggleUses || 0,
    totalTransactions: saved?.totalTransactions || 0,
  };
  commerce.merchants[merchant.id] = runtime;
  return { commerce, runtime, changed: true };
}

function stockToSnapshotEntry(
  stock: ShopStockEntry,
  merchant: MerchantDefinition,
  runtime: MerchantRuntimeState,
  context?: ShopPriceContext,
): ShopSnapshotEntry | undefined {
  const descriptor = describeTradable(stock.kind, stock.itemId);
  if (!descriptor) return undefined;
  return {
    stockId: stock.stockId,
    kind: stock.kind,
    itemId: descriptor.id,
    name: descriptor.name,
    quantity: stock.quantity,
    limited: stock.limited,
    rarity: descriptor.rarity,
    unitBuyPrice: calculateShopBuyPrice(descriptor, merchant, runtime, context),
    unitSellPrice: calculateShopSellPrice(descriptor, merchant, runtime, context),
  };
}

export function prepareShop(
  state: PlayerState,
  merchantId: string,
  context?: ShopPriceContext,
): { state: PlayerState; snapshot: ShopSnapshot | null } {
  const merchant = getMerchantDefinition(merchantId);
  if (!merchant) return { state, snapshot: null };
  const prepared = ensureMerchantRuntime(state, merchant);
  const profile = getShopTypeProfile(merchant.shopType);
  const restockMinutes = Math.max(60, Math.round((merchant.restockHours || profile.restockHours) * 60));
  const nextState = prepared.changed ? { ...state, commerce: prepared.commerce } : state;
  return {
    state: nextState,
    snapshot: {
      merchantId: merchant.id,
      merchantName: merchant.name,
      shopType: merchant.shopType,
      shopTypeName: profile.name,
      affinity: prepared.runtime.affinity,
      affinityTier: getMerchantAffinityTier(prepared.runtime.affinity).name,
      totalTransactions: prepared.runtime.totalTransactions || 0,
      haggleAvailable: prepared.runtime.lastHaggleDay !== Math.max(1, Math.floor(Number(state.dayCount) || 1)),
      haggleEffectLabel: (prepared.runtime.pendingHaggleUses || 0) > 0
        ? prepared.runtime.pendingHaggleBuyModifier && prepared.runtime.pendingHaggleBuyModifier < 1
          ? `다음 구매 ${Math.round((1 - prepared.runtime.pendingHaggleBuyModifier) * 100)}% 할인`
          : prepared.runtime.pendingHaggleSellModifier && prepared.runtime.pendingHaggleSellModifier > 1
            ? `다음 판매 ${Math.round((prepared.runtime.pendingHaggleSellModifier - 1) * 100)}% 우대`
            : undefined
        : undefined,
      restockCycle: prepared.runtime.restockCycle,
      nextRestockAbsoluteMinute: (prepared.runtime.restockCycle + 1) * restockMinutes,
      entries: prepared.runtime.stock
        .filter((entry) => entry.quantity > 0)
        .map((entry) => stockToSnapshotEntry(entry, merchant, prepared.runtime, context))
        .filter((entry): entry is ShopSnapshotEntry => Boolean(entry)),
    },
  };
}

export function attemptMerchantHaggle(
  inputState: PlayerState,
  merchantId: string,
  kind: 'BUY' | 'SELL',
): { state: PlayerState; result: ShopHaggleResult } {
  const merchant = getMerchantDefinition(merchantId);
  if (!merchant) {
    return { state: inputState, result: { stateChanged:false, ok:false, success:false, message:'존재하지 않는 상인입니다.', chance:0, modifier:1, kind } };
  }
  const prepared = ensureMerchantRuntime(inputState, merchant);
  const day = Math.max(1, Math.floor(Number(inputState.dayCount) || 1));
  const runtime = prepared.runtime;
  const baseState = prepared.changed ? { ...inputState, commerce: prepared.commerce } : inputState;
  if (runtime.lastHaggleDay === day) {
    return { state: baseState, result: { stateChanged:prepared.changed, ok:false, success:false, message:'이 상인과는 오늘 이미 흥정했습니다.', chance:0, modifier:1, kind } };
  }

  const traits = getMerchantTraits(merchant);
  let chance = 0.46 + clamp(runtime.affinity, 0, 100) * 0.0032;
  if (traits.includes('GENEROUS')) chance += 0.08;
  if (traits.includes('GREEDY')) chance -= 0.10;
  if (traits.includes('CAUTIOUS')) chance -= 0.05;
  if (traits.includes('ECCENTRIC')) chance += ((hashString(`${merchant.id}:${day}:mood`) % 9) - 4) / 100;
  chance = clamp(chance, 0.25, 0.88);
  const roll = hashString(`${merchant.id}:${day}:${kind}:${runtime.totalTransactions || 0}:haggle`) / 4294967295;
  const success = roll < chance;
  const magnitude = clamp(0.03 + runtime.affinity * 0.00045, 0.03, 0.075);
  const modifier = success ? (kind === 'BUY' ? 1 - magnitude : 1 + magnitude) : 1;

  const nextRuntime: MerchantRuntimeState = {
    ...runtime,
    lastHaggleDay: day,
    pendingHaggleBuyModifier: success && kind === 'BUY' ? modifier : undefined,
    pendingHaggleSellModifier: success && kind === 'SELL' ? modifier : undefined,
    pendingHaggleUses: success ? 1 : 0,
  };
  const commerce: CommerceRuntimeState = {
    ...prepared.commerce,
    merchants: { ...prepared.commerce.merchants, [merchant.id]: nextRuntime },
  };
  const percent = Math.round(Math.abs(1 - modifier) * 100);
  return {
    state: { ...baseState, commerce },
    result: {
      stateChanged: true,
      ok: true,
      success,
      message: success
        ? kind === 'BUY' ? `흥정 성공! 다음 구매 1회 ${percent}% 할인.` : `흥정 성공! 다음 판매 1회 ${percent}% 우대 매입.`
        : '흥정에 실패했습니다. 오늘은 더 이상 가격을 조정해 주지 않을 것 같습니다.',
      chance,
      modifier,
      kind,
    },
  };
}

function consumePendingHaggle(runtime: MerchantRuntimeState, kind: 'BUY' | 'SELL'): MerchantRuntimeState {
  if ((runtime.pendingHaggleUses || 0) <= 0) return runtime;
  const applies = kind === 'BUY'
    ? Boolean(runtime.pendingHaggleBuyModifier && runtime.pendingHaggleBuyModifier < 1)
    : Boolean(runtime.pendingHaggleSellModifier && runtime.pendingHaggleSellModifier > 1);
  if (!applies) return runtime;
  return {
    ...runtime,
    pendingHaggleUses: 0,
    pendingHaggleBuyModifier: undefined,
    pendingHaggleSellModifier: undefined,
  };
}

function rememberTransaction(runtime: MerchantRuntimeState, transactionId: string): MerchantRuntimeState {
  return {
    ...runtime,
    recentTransactionIds: [...runtime.recentTransactionIds.filter((id) => id !== transactionId), transactionId].slice(-MAX_RECENT_TRANSACTION_IDS),
  };
}

function fail(request: ShopTransactionRequest, reason: ShopTransactionResult['reason'], message: string): ShopTransactionResult {
  return {
    ok: false,
    reason,
    message,
    transactionId: request.transactionId,
    merchantId: request.merchantId,
    kind: request.kind,
    itemId: request.itemId,
    quantity: Math.max(0, Math.floor(Number(request.quantity) || 0)),
    unitPrice: 0,
    totalPrice: 0,
  };
}

export function getShopSellOffers(
  inputState: PlayerState,
  merchantId: string,
  context?: ShopPriceContext,
): { state: PlayerState; offers: ShopSellOffer[] } {
  const merchant = getMerchantDefinition(merchantId);
  if (!merchant) return { state: inputState, offers: [] };
  const prepared = ensureMerchantRuntime(inputState, merchant);
  const state = prepared.changed ? { ...inputState, commerce: prepared.commerce } : inputState;
  const offers: ShopSellOffer[] = [];
  for (const inventoryItem of state.inventory || []) {
    if (!inventoryItem || inventoryItem.quantity <= 0) continue;
    const descriptor = resolveInventoryTradable(inventoryItem);
    if (!descriptor) continue;
    const unitSellPrice = calculateShopSellPrice(descriptor, merchant, prepared.runtime, context);
    if (unitSellPrice === null) continue;
    offers.push({
      itemId: inventoryItem.equipmentId || inventoryItem.id || inventoryItem.name,
      name: inventoryItem.name,
      kind: descriptor.kind,
      quantity: Math.max(0, Math.floor(inventoryItem.quantity)),
      unitSellPrice,
    });
  }
  return { state, offers };
}

export function executeShopTransaction(
  inputState: PlayerState,
  request: ShopTransactionRequest,
): { state: PlayerState; result: ShopTransactionResult } {
  const transactionId = String(request.transactionId || '').trim();
  const quantity = Math.floor(Number(request.quantity));
  if (!transactionId || !request.merchantId || !request.itemId || !Number.isFinite(quantity) || quantity <= 0 || (request.kind !== 'BUY' && request.kind !== 'SELL')) {
    return { state: inputState, result: fail(request, 'INVALID_REQUEST', '잘못된 거래 요청입니다.') };
  }

  const merchant = getMerchantDefinition(request.merchantId);
  if (!merchant) return { state: inputState, result: fail(request, 'UNKNOWN_MERCHANT', '존재하지 않는 상인입니다.') };

  const prepared = ensureMerchantRuntime(inputState, merchant);
  let commerce = prepared.commerce;
  let runtime = prepared.runtime;
  let state: PlayerState = prepared.changed ? { ...inputState, commerce } : inputState;

  if (runtime.recentTransactionIds.includes(transactionId)) {
    return { state, result: fail(request, 'DUPLICATE_TRANSACTION', '이미 처리된 거래입니다.') };
  }

  if (request.kind === 'BUY') {
    const stock = runtime.stock.find((entry) => request.stockId ? entry.stockId === request.stockId : entry.itemId === request.itemId);
    if (!stock || stock.quantity < quantity) return { state, result: fail(request, 'OUT_OF_STOCK', '상점 재고가 부족합니다.') };
    const descriptor = describeTradable(stock.kind, stock.itemId);
    if (!descriptor) return { state, result: fail(request, 'UNKNOWN_ITEM', '상품 정보를 찾을 수 없습니다.') };
    const unitPrice = calculateShopBuyPrice(descriptor, merchant, runtime, request.context);
    const totalPrice = unitPrice * quantity;
    if (Math.max(0, Number(state.rupees) || 0) < totalPrice) {
      return { state, result: fail(request, 'INSUFFICIENT_FUNDS', '루피가 부족합니다.') };
    }

    runtime = consumePendingHaggle(runtime, 'BUY');
    runtime = rememberTransaction({
      ...runtime,
      affinity: clamp(runtime.affinity + Math.min(0.5, 0.08 + totalPrice / 5000), 0, 100),
      totalTransactions: (runtime.totalTransactions || 0) + 1,
      stock: runtime.stock.map((entry) => entry.stockId === stock.stockId ? { ...entry, quantity: entry.quantity - quantity } : entry),
    }, transactionId);
    commerce = { ...commerce, transactionSequence: commerce.transactionSequence + 1, merchants: { ...commerce.merchants, [merchant.id]: runtime } };
    state = {
      ...state,
      rupees: Math.max(0, state.rupees - totalPrice),
      inventory: addInventoryItem(state.inventory, makeInventoryItem(descriptor, quantity)),
      commerce,
    };
    return {
      state,
      result: { ok:true, message:`${descriptor.name} ×${quantity} 구매 완료.`, transactionId, merchantId:merchant.id, kind:'BUY', itemId:descriptor.id, quantity, unitPrice, totalPrice },
    };
  }

  const inventoryItem = state.inventory.find((entry) => {
    const refs = [entry.id, entry.equipmentId, entry.name].filter(Boolean).map(String);
    return refs.includes(request.itemId) || refs.some((ref) => ref.trim().toLowerCase() === request.itemId.trim().toLowerCase());
  });
  if (!inventoryItem || inventoryItem.quantity < quantity) {
    return { state, result: fail(request, 'INSUFFICIENT_ITEMS', '판매할 아이템 수량이 부족합니다.') };
  }
  const descriptor = resolveInventoryTradable(inventoryItem);
  if (!descriptor) return { state, result: fail(request, 'UNKNOWN_ITEM', '판매할 아이템 정보를 찾을 수 없습니다.') };
  const unitPrice = calculateShopSellPrice(descriptor, merchant, runtime, request.context);
  if (unitPrice === null) return { state, result: fail(request, 'MERCHANT_REJECTS_ITEM', '이 상인은 해당 물품을 매입하지 않습니다.') };
  const totalPrice = unitPrice * quantity;

  const existingStock = runtime.stock.find((entry) => entry.kind === descriptor.kind && entry.itemId === descriptor.id);
  let nextStock = runtime.stock;
  const profile = getShopTypeProfile(merchant.shopType);
  const softUniqueLimit = Math.max(profile.stockSize + 8, profile.fixedStock.length);
  if (existingStock) {
    nextStock = runtime.stock.map((entry) => entry.stockId === existingStock.stockId ? { ...entry, quantity: entry.quantity + quantity } : entry);
  } else if (describeTradable(descriptor.kind, descriptor.id) && runtime.stock.length < softUniqueLimit) {
    // 정식 DB에 존재하는 물품만 다시 판매 가능한 상점 재고에 편입한다.
    // 동적 생성 아이템은 매입 대금만 지급하고 상점 재고에는 남기지 않는다.
    nextStock = [...runtime.stock, {
      stockId: `${merchant.id}:${descriptor.kind}:${descriptor.id}`,
      kind: descriptor.kind,
      itemId: descriptor.id,
      quantity,
      targetQuantity: 0,
      limited: false,
      generatedCycle: runtime.restockCycle,
    }];
  }

  runtime = consumePendingHaggle(runtime, 'SELL');
  runtime = rememberTransaction({
    ...runtime,
    affinity: clamp(runtime.affinity + Math.min(0.6, 0.10 + totalPrice / 4500), 0, 100),
    totalTransactions: (runtime.totalTransactions || 0) + 1,
    stock: nextStock,
  }, transactionId);
  commerce = { ...commerce, transactionSequence: commerce.transactionSequence + 1, merchants: { ...commerce.merchants, [merchant.id]: runtime } };
  state = {
    ...state,
    rupees: Math.max(0, state.rupees + totalPrice),
    inventory: removeInventoryItem(state.inventory, inventoryItem, quantity),
    commerce,
  };
  return {
    state,
    result: { ok:true, message:`${descriptor.name} ×${quantity} 판매 완료.`, transactionId, merchantId:merchant.id, kind:'SELL', itemId:descriptor.id, quantity, unitPrice, totalPrice },
  };
}

export function createShopTransactionId(state: Pick<PlayerState, 'commerce'>, merchantId: string, kind: 'BUY' | 'SELL'): string {
  const sequence = Math.max(0, Number(state.commerce?.transactionSequence) || 0) + 1;
  return `${merchantId}:${kind}:${sequence}:${Date.now().toString(36)}`;
}
