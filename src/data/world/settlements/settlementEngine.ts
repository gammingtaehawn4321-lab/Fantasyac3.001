import type { InventoryItem, PlayerState, SettlementGuildMembership } from '../../../types';
import { getItemDefinition } from '../../items/itemDatabase';
import {
  createShopTransactionId,
  executeShopTransaction,
  prepareShop,
} from '../shops/shopEngine';
import type { EconomyMarketSector, ShopPriceContext, ShopTransactionResult } from '../shops/shopTypes';
import { getSettlementBoardQuestIds } from './settlementBoardQuests';
import { SETTLEMENT_DEFINITIONS, SETTLEMENT_LIST } from './settlementCatalog';
import type { OpeningHours, SettlementDefinition, SettlementRuntimeState } from './settlementTypes';

export const SETTLEMENT_RUNTIME_SCHEMA_VERSION = 3 as const;
const MAX_AUCTION_BID_KEYS = 96;

const MARKET_SECTORS: EconomyMarketSector[] = ['GENERAL','FOOD','MATERIAL','EQUIPMENT','MAGIC','LUXURY'];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function addInventoryItem(inventory: InventoryItem[], itemId: string, quantity: number): InventoryItem[] {
  const def = getItemDefinition(itemId);
  if (!def || quantity <= 0) return inventory;
  const index = inventory.findIndex((entry) => entry.id === def.id || (!entry.equipmentId && entry.name === def.name));
  if (index < 0) {
    return [...inventory, {
      id: def.id,
      name: def.name,
      quantity,
      description: def.description,
      flavorText: def.flavorText,
      illustrationUrl: def.illustrationUrl,
      category: def.category,
      quality: 'NORMAL',
    }];
  }
  return inventory.map((entry, i) => i === index ? { ...entry, quantity: Math.max(0, entry.quantity) + quantity } : entry);
}

export function createEmptySettlementRuntimeState(): SettlementRuntimeState {
  return {
    schemaVersion: SETTLEMENT_RUNTIME_SCHEMA_VERSION,
    visitedSettlementIds: [],
    bankBalance: 0,
    guildMemberships: {},
    blackMarketUnlockedSettlementIds: [],
    recentAuctionBidKeys: [],
    visitCounts: {},
    lastVisitDayBySettlement: {},
    innStayCounts: {},
  };
}

export function normalizeSettlementRuntimeState(raw?: Partial<SettlementRuntimeState> | null): SettlementRuntimeState {
  const visited = Array.isArray(raw?.visitedSettlementIds)
    ? Array.from(new Set(raw.visitedSettlementIds.map(String).filter((id) => Boolean(SETTLEMENT_DEFINITIONS[id]))))
    : [];
  const last = raw?.lastSettlementId && SETTLEMENT_DEFINITIONS[String(raw.lastSettlementId)]
    ? String(raw.lastSettlementId)
    : undefined;

  const guildMemberships: Record<string, SettlementGuildMembership> = {};
  if (raw?.guildMemberships && typeof raw.guildMemberships === 'object') {
    for (const [settlementId, value] of Object.entries(raw.guildMemberships)) {
      if (!SETTLEMENT_DEFINITIONS[settlementId] || !value || typeof value !== 'object') continue;
      const membership = value as SettlementGuildMembership;
      guildMemberships[settlementId] = {
        settlementId,
        joinedDay: Math.max(1, Math.floor(Number(membership.joinedDay) || 1)),
        lastSupplyClaimDay: membership.lastSupplyClaimDay == null
          ? undefined
          : Math.max(1, Math.floor(Number(membership.lastSupplyClaimDay) || 1)),
      };
    }
  }

  return {
    schemaVersion: SETTLEMENT_RUNTIME_SCHEMA_VERSION,
    visitedSettlementIds: visited,
    lastSettlementId: last,
    bankBalance: Math.max(0, Math.floor(Number(raw?.bankBalance) || 0)),
    guildMemberships,
    blackMarketUnlockedSettlementIds: Array.isArray(raw?.blackMarketUnlockedSettlementIds)
      ? Array.from(new Set(raw.blackMarketUnlockedSettlementIds.map(String).filter((id) => Boolean(SETTLEMENT_DEFINITIONS[id]))))
      : [],
    recentAuctionBidKeys: Array.isArray(raw?.recentAuctionBidKeys)
      ? raw.recentAuctionBidKeys.filter(Boolean).map(String).slice(-MAX_AUCTION_BID_KEYS)
      : [],
    visitCounts: Object.fromEntries(Object.entries(raw?.visitCounts || {})
      .filter(([settlementId]) => Boolean(SETTLEMENT_DEFINITIONS[settlementId]))
      .map(([settlementId, value]) => [settlementId, Math.max(0, Math.floor(Number(value) || 0))])),
    lastVisitDayBySettlement: Object.fromEntries(Object.entries(raw?.lastVisitDayBySettlement || {})
      .filter(([settlementId]) => Boolean(SETTLEMENT_DEFINITIONS[settlementId]))
      .map(([settlementId, value]) => [settlementId, Math.max(1, Math.floor(Number(value) || 1))])),
    innStayCounts: Object.fromEntries(Object.entries(raw?.innStayCounts || {})
      .filter(([settlementId]) => Boolean(SETTLEMENT_DEFINITIONS[settlementId]))
      .map(([settlementId, value]) => [settlementId, Math.max(0, Math.floor(Number(value) || 0))])),
  };
}

export function markSettlementVisited(state: PlayerState, settlementId: string): PlayerState {
  if (!SETTLEMENT_DEFINITIONS[settlementId]) return state;
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  const day = Math.max(1, Math.floor(Number(state.dayCount) || 1));
  const alreadyCountedToday = runtime.lastVisitDayBySettlement[settlementId] === day;
  return {
    ...state,
    settlementState: {
      ...runtime,
      visitedSettlementIds: Array.from(new Set([...runtime.visitedSettlementIds, settlementId])),
      lastSettlementId: settlementId,
      visitCounts: {
        ...runtime.visitCounts,
        [settlementId]: (runtime.visitCounts[settlementId] || 0) + (alreadyCountedToday ? 0 : 1),
      },
      lastVisitDayBySettlement: {
        ...runtime.lastVisitDayBySettlement,
        [settlementId]: day,
      },
    },
  };
}

export function getSettlementFamiliarity(state: PlayerState, settlementId: string): { level: number; name: string; visits: number; nextAt?: number } {
  const visits = normalizeSettlementRuntimeState(state.settlementState).visitCounts[settlementId] || 0;
  if (visits >= 15) return { level:3, name:'현지인 수준', visits };
  if (visits >= 7) return { level:2, name:'익숙한 방문객', visits, nextAt:15 };
  if (visits >= 3) return { level:1, name:'단골 여행자', visits, nextAt:7 };
  return { level:0, name:'초행/낯선 방문객', visits, nextAt:3 };
}

export function getSettlementDefinition(id?: string | null): SettlementDefinition | undefined {
  return id ? SETTLEMENT_DEFINITIONS[id] : undefined;
}

export function getSettlementByGroupId(groupId?: string | null): SettlementDefinition | undefined {
  if (!groupId) return undefined;
  return SETTLEMENT_LIST.find((entry) => entry.worldStructureGroupId === groupId);
}

function economyTagSectorBias(tags: string[], sector: EconomyMarketSector): number {
  let bias = 0;
  const has = (tag:string) => tags.includes(tag);
  if (sector === 'FOOD') {
    if (has('CHEAP_FOOD')) bias -= 0.04;
    if (has('EXPENSIVE_FOOD')) bias += 0.04;
  }
  if (sector === 'MATERIAL') {
    if (has('CHEAP_MATERIAL')) bias -= 0.04;
    if (has('EXPENSIVE_MATERIAL')) bias += 0.04;
    if (has('HIGH_DEMAND_MATERIAL')) bias += 0.035;
    if (has('LOW_DEMAND_MATERIAL')) bias -= 0.035;
  }
  if (sector === 'EQUIPMENT') {
    if (has('CHEAP_EQUIPMENT')) bias -= 0.04;
    if (has('EXPENSIVE_EQUIPMENT')) bias += 0.04;
    if (has('HIGH_DEMAND_EQUIPMENT')) bias += 0.035;
    if (has('LOW_DEMAND_EQUIPMENT')) bias -= 0.035;
  }
  if (sector === 'MAGIC') {
    if (has('CHEAP_MAGIC')) bias -= 0.04;
    if (has('EXPENSIVE_MAGIC')) bias += 0.04;
    if (has('HIGH_DEMAND_MAGIC')) bias += 0.035;
    if (has('LOW_DEMAND_MAGIC')) bias -= 0.035;
  }
  if (sector === 'LUXURY' && has('LUXURY_MARKET')) bias += 0.045;
  if (sector === 'GENERAL' && has('REMOTE_MARKET')) bias += 0.035;
  return bias;
}

export function getRegionalMarketIndices(
  settlement: SettlementDefinition,
  state?: Pick<PlayerState, 'dayCount'>,
): Record<EconomyMarketSector, number> {
  const day = Math.max(1, Math.floor(Number(state?.dayCount) || 1));
  return Object.fromEntries(MARKET_SECTORS.map((sector) => {
    const h = hashString(`${settlement.regionId}:${settlement.id}:${day}:${sector}`);
    const noise = ((h / 4294967295) * 2 - 1) * 0.06;
    const index = clamp(1 + noise + economyTagSectorBias(settlement.economyTags, sector), 0.82, 1.18);
    return [sector, Math.round(index * 1000) / 1000];
  })) as Record<EconomyMarketSector, number>;
}

export function getRegionalMarketTrend(
  settlement: SettlementDefinition,
  state?: Pick<PlayerState, 'dayCount'>,
): Record<EconomyMarketSector, number> {
  const current = getRegionalMarketIndices(settlement, state);
  const previousDay = Math.max(1, Math.floor(Number(state?.dayCount) || 1) - 1);
  const previous = getRegionalMarketIndices(settlement, { dayCount: previousDay });
  return Object.fromEntries(MARKET_SECTORS.map((sector) => [sector, Math.round((current[sector] - previous[sector]) * 1000) / 1000])) as Record<EconomyMarketSector, number>;
}

export function getSettlementPriceContext(
  settlement: SettlementDefinition,
  state?: PlayerState,
): ShopPriceContext {
  const familiarity = state ? getSettlementFamiliarity(state, settlement.id) : { level:0 };
  const guild = state ? getSettlementGuildRank(state, settlement.id) : { rank:0 };
  // 지역에 익숙하고 길드 지위가 높을수록 정식 상권에서 소폭 우대받는다.
  const purchaseModifier = clamp(1 - familiarity.level * 0.01 - guild.rank * 0.0125, 0.92, 1);
  const sellModifier = clamp(1 + familiarity.level * 0.008 + guild.rank * 0.01, 1, 1.08);
  return {
    settlementId: settlement.id,
    regionId: settlement.regionId,
    economyTags: settlement.economyTags,
    specialtyTags: settlement.specialtyTags,
    purchaseModifier,
    sellModifier,
    marketIndices: getRegionalMarketIndices(settlement, state),
  };
}

export function getInnStayQuote(
  state: PlayerState,
  settlementId: string,
  rate: { price: number },
): { price: number; discountRate: number; stayCount: number; familiarityLevel: number } {
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  const stayCount = runtime.innStayCounts[settlementId] || 0;
  const familiarityLevel = getSettlementFamiliarity(state, settlementId).level;
  const loyaltyDiscount = stayCount >= 10 ? 0.08 : stayCount >= 5 ? 0.05 : stayCount >= 2 ? 0.02 : 0;
  const familiarityDiscount = familiarityLevel * 0.01;
  const discountRate = clamp(loyaltyDiscount + familiarityDiscount, 0, 0.12);
  return {
    price: Math.max(1, Math.round(Math.max(0, Number(rate.price) || 0) * (1 - discountRate))),
    discountRate,
    stayCount,
    familiarityLevel,
  };
}

export function recordInnStay(state: PlayerState, settlementId: string): PlayerState {
  if (!SETTLEMENT_DEFINITIONS[settlementId]) return state;
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  return {
    ...state,
    settlementState: {
      ...runtime,
      innStayCounts: { ...runtime.innStayCounts, [settlementId]: (runtime.innStayCounts[settlementId] || 0) + 1 },
    },
  };
}

export function isOpeningHoursOpen(hours: OpeningHours | undefined, hour: number): boolean {
  if (!hours) return true;
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (hours.open === hours.close || (hours.open === 0 && hours.close === 24)) return true;
  if (hours.open < hours.close) return h >= hours.open && h < hours.close;
  return h >= hours.open || h < hours.close;
}

export function formatOpeningHours(hours?: OpeningHours): string {
  if (!hours || (hours.open === 0 && hours.close === 24)) return '24시간';
  const pad = (value:number) => String(value).padStart(2, '0');
  return `${pad(hours.open)}:00~${pad(hours.close % 24)}:00`;
}

export function transferBankFunds(
  state: PlayerState,
  amountInput: number,
  direction: 'DEPOSIT' | 'WITHDRAW',
): { state: PlayerState; ok: boolean; message: string } {
  const amount = Math.max(0, Math.floor(Number(amountInput) || 0));
  if (amount <= 0) return { state, ok:false, message:'이체 금액을 입력해 주세요.' };
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  if (direction === 'DEPOSIT') {
    if (state.rupees < amount) return { state, ok:false, message:'소지 루피가 부족합니다.' };
    return {
      state: { ...state, rupees: state.rupees - amount, settlementState: { ...runtime, bankBalance: runtime.bankBalance + amount } },
      ok: true,
      message: `${amount.toLocaleString()} R을 예치했습니다.`,
    };
  }
  if (runtime.bankBalance < amount) return { state, ok:false, message:'예치금이 부족합니다.' };
  return {
    state: { ...state, rupees: state.rupees + amount, settlementState: { ...runtime, bankBalance: runtime.bankBalance - amount } },
    ok: true,
    message: `${amount.toLocaleString()} R을 인출했습니다.`,
  };
}

export function joinSettlementGuild(
  state: PlayerState,
  settlementId: string,
  fee = 120,
): { state: PlayerState; ok: boolean; message: string } {
  if (!SETTLEMENT_DEFINITIONS[settlementId]) return { state, ok:false, message:'길드 정보를 찾을 수 없습니다.' };
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  if (runtime.guildMemberships[settlementId]) return { state, ok:false, message:'이미 이 지부에 등록되어 있습니다.' };
  if (state.rupees < fee) return { state, ok:false, message:'가입비가 부족합니다.' };
  return {
    state: {
      ...state,
      rupees: state.rupees - fee,
      settlementState: {
        ...runtime,
        guildMemberships: {
          ...runtime.guildMemberships,
          [settlementId]: { settlementId, joinedDay: Math.max(1, state.dayCount) },
        },
      },
    },
    ok: true,
    message: `모험가 길드에 등록했습니다. 가입비 ${fee} R`,
  };
}

export function getSettlementGuildRank(state: PlayerState, settlementId: string): { joined: boolean; rank: number; completedContracts: number; canClaimSupply: boolean } {
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  const membership = runtime.guildMemberships[settlementId];
  const completedContracts = getSettlementBoardQuestIds(settlementId)
    .filter((questId) => state.quests?.[questId]?.status === 'COMPLETED').length;
  const rank = membership ? Math.min(3, 1 + completedContracts) : 0;
  return {
    joined: Boolean(membership),
    rank,
    completedContracts,
    canClaimSupply: Boolean(membership) && membership?.lastSupplyClaimDay !== state.dayCount,
  };
}

export function claimGuildSupplies(
  state: PlayerState,
  settlementId: string,
): { state: PlayerState; ok: boolean; message: string } {
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  const membership = runtime.guildMemberships[settlementId];
  if (!membership) return { state, ok:false, message:'먼저 이 지부에 가입해야 합니다.' };
  if (membership.lastSupplyClaimDay === state.dayCount) return { state, ok:false, message:'오늘의 길드 보급품은 이미 받았습니다.' };
  const guild = getSettlementGuildRank(state, settlementId);
  let inventory = addInventoryItem(state.inventory, 'potion_small_health', guild.rank >= 2 ? 2 : 1);
  if (guild.rank >= 3) inventory = addInventoryItem(inventory, 'potion_mana_draught', 1);
  const updatedMembership: SettlementGuildMembership = { ...membership, lastSupplyClaimDay: state.dayCount };
  return {
    state: {
      ...state,
      inventory,
      settlementState: { ...runtime, guildMemberships: { ...runtime.guildMemberships, [settlementId]: updatedMembership } },
    },
    ok: true,
    message: guild.rank >= 3 ? '길드 보급품: 작은 회복약 ×2, 마나 드라우트 ×1' : `길드 보급품: 작은 회복약 ×${guild.rank >= 2 ? 2 : 1}`,
  };
}

export function isBlackMarketUnlocked(state: PlayerState, settlementId: string): boolean {
  return normalizeSettlementRuntimeState(state.settlementState).blackMarketUnlockedSettlementIds.includes(settlementId);
}

export function unlockBlackMarket(
  state: PlayerState,
  settlementId: string,
  intelCost = 100,
): { state: PlayerState; ok: boolean; message: string } {
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  if (runtime.blackMarketUnlockedSettlementIds.includes(settlementId)) return { state, ok:false, message:'이미 암시장 위치를 알고 있습니다.' };
  if (state.rupees < intelCost) return { state, ok:false, message:'정보값을 낼 루피가 부족합니다.' };
  return {
    state: {
      ...state,
      rupees: state.rupees - intelCost,
      settlementState: {
        ...runtime,
        blackMarketUnlockedSettlementIds: [...runtime.blackMarketUnlockedSettlementIds, settlementId],
      },
    },
    ok: true,
    message: `정보상에게 ${intelCost} R을 지불해 암시장 위치를 알아냈습니다.`,
  };
}

export interface AuctionBidOutcome {
  state: PlayerState;
  ok: boolean;
  won: boolean;
  message: string;
  result?: ShopTransactionResult;
}

export function executeAuctionBid(
  state: PlayerState,
  request: {
    merchantId: string;
    stockId: string;
    itemId: string;
    bidRatio: number;
    context?: ShopPriceContext;
  },
): AuctionBidOutcome {
  const bidRatio = clamp(Number(request.bidRatio) || 1, 0.8, 1);
  const runtime = normalizeSettlementRuntimeState(state.settlementState);
  const key = `${Math.max(1, state.dayCount)}:${request.merchantId}:${request.stockId}`;
  if (runtime.recentAuctionBidKeys.includes(key)) {
    return { state, ok:false, won:false, message:'이 경매품에는 오늘 이미 입찰했습니다.' };
  }

  const markedState: PlayerState = {
    ...state,
    settlementState: {
      ...runtime,
      recentAuctionBidKeys: [...runtime.recentAuctionBidKeys, key].slice(-MAX_AUCTION_BID_KEYS),
    },
  };

  const chance = bidRatio >= 1 ? 1 : clamp(0.45 + (bidRatio - 0.8) * 2.75, 0.45, 0.995);
  const roll = hashString(`${key}:${request.itemId}:auction`) / 4294967295;
  if (roll > chance) {
    return { state: markedState, ok:true, won:false, message:`입찰 경쟁에서 밀렸습니다. (낙찰 확률 ${Math.round(chance * 100)}%)` };
  }

  const transactionId = createShopTransactionId(markedState, request.merchantId, 'BUY');
  const purchaseModifier = (Number(request.context?.purchaseModifier) || 1) * bidRatio;
  const transaction = executeShopTransaction(markedState, {
    transactionId,
    merchantId: request.merchantId,
    kind: 'BUY',
    itemId: request.itemId,
    quantity: 1,
    stockId: request.stockId,
    context: { ...request.context, purchaseModifier },
  });
  if (!transaction.result.ok) {
    return { state: transaction.state, ok:false, won:false, message:transaction.result.message, result:transaction.result };
  }
  return {
    state: transaction.state,
    ok:true,
    won:true,
    message:`낙찰! ${transaction.result.message}`,
    result:transaction.result,
  };
}

export function getAuctionSnapshot(
  state: PlayerState,
  merchantId: string,
  context?: ShopPriceContext,
) {
  return prepareShop(state, merchantId, context);
}
