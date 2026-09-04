import type { MerchantTrait, ShopType, WorldRegionId } from '../../../types';

export type SettlementTier = 'HAMLET' | 'VILLAGE' | 'CITY' | 'METROPOLIS';
export type SettlementFacilityType = 'SHOP' | 'INN' | 'NOTICE_BOARD' | 'GUILD' | 'BANK' | 'MARKET' | 'SERVICE' | 'SPECIAL';

export interface OpeningHours {
  open: number;
  close: number;
}

export interface SettlementShopPlacement {
  merchantId: string;
  merchantName: string;
  shopType: ShopType;
  traits?: MerchantTrait[];
  priceModifier?: number;
  sellModifier?: number;
  openingHours?: OpeningHours;
}

export interface SettlementFacilityDefinition {
  id: string;
  name: string;
  type: SettlementFacilityType;
  description: string;
  districtId?: string;
  openingHours?: OpeningHours;
  shop?: SettlementShopPlacement;
  serviceFlags?: string[];
}

export interface SettlementDistrictDefinition {
  id: string;
  name: string;
  description: string;
  facilityIds: string[];
}

export interface InnRateDefinition {
  id: string;
  name: string;
  price: number;
  minutes: number;
  recoveryRatio: number;
  description: string;
}

export interface SettlementDefinition {
  id: string;
  worldStructureGroupId: string;
  name: string;
  description: string;
  tier: SettlementTier;
  regionId: WorldRegionId;
  economyTags: string[];
  specialtyTags: string[];
  districts: SettlementDistrictDefinition[];
  facilities: SettlementFacilityDefinition[];
  innRates?: InnRateDefinition[];
}

export type { SettlementRuntimeState } from '../../../types';
