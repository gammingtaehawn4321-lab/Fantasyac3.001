import type { MerchantDefinition, ShopTypeProfile } from './shopTypes';
import type { ShopType } from '../../../types';
import { SETTLEMENT_MERCHANT_DEFINITIONS } from '../settlements/settlementCatalog';

const item = (itemId: string, minQuantity: number, maxQuantity: number, limited = false) => ({
  kind: 'ITEM' as const,
  itemId,
  minQuantity,
  maxQuantity,
  limited,
});

const equipment = (itemId: string, minQuantity = 1, maxQuantity = 1, limited = true) => ({
  kind: 'EQUIPMENT' as const,
  itemId,
  minQuantity,
  maxQuantity,
  limited,
});

export const SHOP_TYPE_PROFILES: Record<ShopType, ShopTypeProfile> = {
  GENERAL_GOODS: {
    id: 'GENERAL_GOODS', name: '잡화점', description: '여행에 필요한 범용 소모품과 도구를 취급한다.',
    restockHours: 24, stockSize: 10, purchasePriceMultiplier: 1.0, playerSellMultiplier: 0.42,
    acceptedItemCategories: ['CONSUMABLE','TOOL','MATERIAL','MISC','MAP','DOCUMENT'],
    fixedStock: [item('potion_small_health',3,8), item('rope',1,3), item('torch',2,6), item('wild_herb',2,7)],
    randomStock: [
      { kind:'ITEM', slots:6, minQuantity:1, maxQuantity:5, itemCategories:['CONSUMABLE','TOOL','MATERIAL'], maxRarity:'RARE' },
    ],
  },
  WEAPON: {
    id:'WEAPON', name:'무기점', description:'근접·원거리·마법 무기를 전문적으로 취급한다.',
    restockHours:72, stockSize:9, purchasePriceMultiplier:1.06, playerSellMultiplier:0.55,
    acceptedEquipmentTypes:['WEAPON','OFFHAND'], fixedStock:[equipment('apprentice_sword'), equipment('silver_hunting_bow')],
    randomStock:[{kind:'EQUIPMENT',slots:7,minQuantity:1,maxQuantity:1,equipmentTypes:['WEAPON','OFFHAND'],maxRarity:'EPIC'}], defaultTraits:['EXPERT'],
  },
  ARMOR: {
    id:'ARMOR', name:'방어구점', description:'갑옷과 보호 장비를 전문적으로 취급한다.',
    restockHours:72, stockSize:9, purchasePriceMultiplier:1.05, playerSellMultiplier:0.55,
    acceptedEquipmentTypes:['ARMOR','OFFHAND'], fixedStock:[equipment('leather_cap_apprentice'),equipment('sturdy_traveler_pants')],
    randomStock:[{kind:'EQUIPMENT',slots:7,minQuantity:1,maxQuantity:1,equipmentTypes:['ARMOR','OFFHAND'],maxRarity:'EPIC'}], defaultTraits:['EXPERT'],
  },
  BLACKSMITH: {
    id:'BLACKSMITH', name:'대장간', description:'금속 장비와 제련 재료를 취급하며 강화·제작 서비스의 기반이 된다.',
    restockHours:72, stockSize:10, purchasePriceMultiplier:1.0, playerSellMultiplier:0.62,
    acceptedItemCategories:['MATERIAL'], acceptedEquipmentTypes:['WEAPON','ARMOR','OFFHAND'],
    fixedStock:[item('iron_ore',3,10),equipment('apprentice_sword'),equipment('knight_iron_shield')],
    randomStock:[{kind:'ITEM',slots:2,minQuantity:1,maxQuantity:5,itemCategories:['MATERIAL'],maxRarity:'RARE'},{kind:'EQUIPMENT',slots:5,minQuantity:1,maxQuantity:1,equipmentTypes:['WEAPON','ARMOR','OFFHAND'],maxRarity:'EPIC'}], defaultTraits:['EXPERT'], specialFlags:['SERVICE_ENHANCE','SERVICE_REPAIR','SERVICE_DISMANTLE'],
  },
  ALCHEMY: {
    id:'ALCHEMY', name:'연금술점', description:'회복약과 비약, 약초와 연금 재료를 판매한다.',
    restockHours:24, stockSize:12, purchasePriceMultiplier:1.04, playerSellMultiplier:0.50,
    acceptedItemCategories:['CONSUMABLE','MATERIAL'], fixedStock:[item('potion_small_health',4,10),item('potion_mana_draught',2,6),item('wild_herb',4,10),item('clear_dew',2,6)],
    randomStock:[{kind:'ITEM',slots:8,minQuantity:1,maxQuantity:5,itemCategories:['CONSUMABLE','MATERIAL'],maxRarity:'EPIC'}], defaultTraits:['EXPERT'],
  },
  MAGIC: {
    id:'MAGIC', name:'마법상점', description:'마도구·마법서·마력 재료와 마법 장비를 취급한다.',
    restockHours:72, stockSize:10, purchasePriceMultiplier:1.12, playerSellMultiplier:0.52,
    acceptedItemCategories:['BOOK','MATERIAL','DOCUMENT'], acceptedEquipmentTypes:['WEAPON','ACCESSORY'],
    fixedStock:[item('mana_crystal_shard',2,6),item('alchemist_notebook',1,2),equipment('apprentice_oak_staff')],
    randomStock:[{kind:'ITEM',slots:3,minQuantity:1,maxQuantity:3,itemCategories:['BOOK','MATERIAL','DOCUMENT'],minRarity:'UNCOMMON',maxRarity:'EPIC'},{kind:'EQUIPMENT',slots:4,minQuantity:1,maxQuantity:1,equipmentTypes:['WEAPON','ACCESSORY'],maxRarity:'EPIC'}], defaultTraits:['EXPERT'],
  },
  RUNE: {
    id:'RUNE', name:'룬 상점', description:'룬·공명 재료와 희귀 마력 소재를 취급하는 전문점.',
    restockHours:96, stockSize:8, purchasePriceMultiplier:1.16, playerSellMultiplier:0.55,
    acceptedItemCategories:['MATERIAL','VALUABLE'], fixedStock:[item('mana_crystal_shard',2,5),item('silver_ingot',1,3)],
    randomStock:[{kind:'ITEM',slots:6,minQuantity:1,maxQuantity:3,itemCategories:['MATERIAL','VALUABLE'],minRarity:'UNCOMMON',maxRarity:'LEGENDARY'}], defaultTraits:['EXPERT'], specialFlags:['RUNE_SPECIALIST'],
  },
  FOOD: {
    id:'FOOD', name:'식료품점', description:'식재료와 보존식, 여행 중 먹을 수 있는 물품을 판다.',
    restockHours:12, stockSize:10, purchasePriceMultiplier:0.94, playerSellMultiplier:0.45,
    acceptedItemCategories:['CONSUMABLE','MATERIAL'], fixedStock:[item('fresh_meat',3,10),item('plant_root',3,10),item('wild_herb',3,10),item('calm_herb_tea',2,6)],
    randomStock:[{kind:'ITEM',slots:6,minQuantity:2,maxQuantity:8,itemCategories:['CONSUMABLE','MATERIAL'],maxRarity:'UNCOMMON'}], defaultTraits:['GENEROUS'],
  },
  CLOTHING: {
    id:'CLOTHING', name:'의상점', description:'경량 장비·천옷·외형용 물품을 중심으로 취급한다.',
    restockHours:72, stockSize:8, purchasePriceMultiplier:1.08, playerSellMultiplier:0.48,
    acceptedEquipmentTypes:['ARMOR','ACCESSORY'], fixedStock:[equipment('silk_cowl_sage'),equipment('scout_leather_vest')],
    randomStock:[{kind:'EQUIPMENT',slots:6,minQuantity:1,maxQuantity:1,equipmentTypes:['ARMOR','ACCESSORY'],maxRarity:'EPIC'}],
  },
  MATERIAL: {
    id:'MATERIAL', name:'재료상', description:'제작과 생활기술에 사용하는 범용 재료를 대량으로 취급한다.',
    restockHours:24, stockSize:14, purchasePriceMultiplier:0.96, playerSellMultiplier:0.60,
    acceptedItemCategories:['MATERIAL'], fixedStock:[item('wood_timber',4,12),item('iron_ore',4,12),item('thread',3,10),item('wild_herb',3,10)],
    randomStock:[{kind:'ITEM',slots:10,minQuantity:2,maxQuantity:10,itemCategories:['MATERIAL'],maxRarity:'RARE'}],
  },
  HUNTER: {
    id:'HUNTER', name:'사냥꾼 상점', description:'활·경갑·추적 도구와 야수 소재를 전문 취급한다.',
    restockHours:48, stockSize:10, purchasePriceMultiplier:1.02, playerSellMultiplier:0.65,
    acceptedItemCategories:['TOOL','MATERIAL'], acceptedEquipmentTypes:['WEAPON','ARMOR'], acceptedEquipmentTags:['HUNTER'],
    fixedStock:[equipment('silver_hunting_bow'),item('rope',1,3),item('wolf_pelt',1,5)],
    randomStock:[{kind:'ITEM',slots:3,minQuantity:1,maxQuantity:4,itemCategories:['TOOL','MATERIAL'],maxRarity:'RARE'},{kind:'EQUIPMENT',slots:4,minQuantity:1,maxQuantity:1,equipmentTypes:['WEAPON','ARMOR'],maxRarity:'EPIC'}], defaultTraits:['EXPERT'],
  },
  ADVENTURER: {
    id:'ADVENTURER', name:'모험가 상점', description:'던전·탐험용 소모품과 장비를 골고루 판매한다.',
    restockHours:24, stockSize:14, purchasePriceMultiplier:1.05, playerSellMultiplier:0.48,
    acceptedItemCategories:['CONSUMABLE','TOOL','MAP','MATERIAL'], acceptedEquipmentTypes:['WEAPON','ARMOR','ACCESSORY','OFFHAND'],
    fixedStock:[item('potion_small_health',3,8),item('rope',2,5),item('torch',3,8),item('shovel',1,2),item('lockpick_set',1,2)],
    randomStock:[{kind:'ITEM',slots:5,minQuantity:1,maxQuantity:5,itemCategories:['CONSUMABLE','TOOL','MAP','MATERIAL'],maxRarity:'RARE'},{kind:'EQUIPMENT',slots:4,minQuantity:1,maxQuantity:1,maxRarity:'RARE'}],
  },
  CLERIC: {
    id:'CLERIC', name:'성직자 상점', description:'회복·정화 물품과 신성 계열 장비를 다룬다.',
    restockHours:48, stockSize:9, purchasePriceMultiplier:1.03, playerSellMultiplier:0.52,
    acceptedItemCategories:['CONSUMABLE','VALUABLE'], acceptedEquipmentTypes:['WEAPON','ACCESSORY'],
    fixedStock:[item('holy_silver_water',2,6),item('potion_small_health',3,8),equipment('holy_cane_purifier'),equipment('amulet_of_warding')],
    randomStock:[{kind:'ITEM',slots:3,minQuantity:1,maxQuantity:4,itemCategories:['CONSUMABLE','VALUABLE'],maxRarity:'EPIC'},{kind:'EQUIPMENT',slots:2,minQuantity:1,maxQuantity:1,equipmentTypes:['WEAPON','ACCESSORY'],maxRarity:'EPIC'}],
  },
  MAGITECH: {
    id:'MAGITECH', name:'마도공학점', description:'규칙변형 장비와 마도 장치, 희귀 마력 소재를 취급한다.',
    restockHours:120, stockSize:8, purchasePriceMultiplier:1.22, playerSellMultiplier:0.60,
    acceptedItemCategories:['TOOL','MATERIAL'], acceptedEquipmentTypes:['WEAPON','ACCESSORY','OFFHAND'],
    fixedStock:[item('mana_crystal_shard',1,4),item('silver_ingot',1,3)],
    randomStock:[{kind:'EQUIPMENT',slots:5,minQuantity:1,maxQuantity:1,equipmentTypes:['WEAPON','ACCESSORY','OFFHAND'],minRarity:'RARE',maxRarity:'LEGENDARY'},{kind:'ITEM',slots:2,minQuantity:1,maxQuantity:2,itemCategories:['TOOL','MATERIAL'],minRarity:'UNCOMMON',maxRarity:'EPIC'}], defaultTraits:['EXPERT'],
  },
  JEWELER: {
    id:'JEWELER', name:'보석상', description:'장신구와 보석·귀금속을 높은 가격에 거래한다.',
    restockHours:96, stockSize:8, purchasePriceMultiplier:1.18, playerSellMultiplier:0.68,
    acceptedItemCategories:['VALUABLE','MATERIAL','GIFT'], acceptedEquipmentTypes:['ACCESSORY'],
    fixedStock:[item('silver_ingot',1,4),equipment('ring_of_vitality')],
    randomStock:[{kind:'EQUIPMENT',slots:5,minQuantity:1,maxQuantity:1,equipmentTypes:['ACCESSORY'],maxRarity:'LEGENDARY'},{kind:'ITEM',slots:2,minQuantity:1,maxQuantity:3,itemCategories:['VALUABLE','GIFT','MATERIAL'],minRarity:'UNCOMMON',maxRarity:'EPIC'}], defaultTraits:['EXPERT'],
  },
  HERBALIST: {
    id:'HERBALIST', name:'약초상', description:'야생 약초·뿌리·식물성 연금 재료를 저렴하게 판다.',
    restockHours:12, stockSize:10, purchasePriceMultiplier:0.90, playerSellMultiplier:0.65,
    acceptedItemCategories:['MATERIAL','CONSUMABLE'], fixedStock:[item('wild_herb',5,14),item('plant_root',4,12),item('clear_dew',2,6)],
    randomStock:[{kind:'ITEM',slots:7,minQuantity:2,maxQuantity:10,itemCategories:['MATERIAL','CONSUMABLE'],maxRarity:'RARE'}], defaultTraits:['GENEROUS'],
  },
  MINERAL: {
    id:'MINERAL', name:'광물상', description:'광석·금속·결정 등 제련과 강화 재료를 거래한다.',
    restockHours:48, stockSize:10, purchasePriceMultiplier:0.94, playerSellMultiplier:0.68,
    acceptedItemCategories:['MATERIAL'], fixedStock:[item('iron_ore',5,14),item('silver_ingot',1,5),item('stone_rock',5,15),item('mana_crystal_shard',1,4)],
    randomStock:[{kind:'ITEM',slots:6,minQuantity:1,maxQuantity:8,itemCategories:['MATERIAL'],maxRarity:'EPIC'}], defaultTraits:['EXPERT'],
  },
  PET_SUPPLY: {
    id:'PET_SUPPLY', name:'펫 용품점', description:'펫 먹이와 관리·길들이기 보조용품을 취급하는 전문점.',
    restockHours:24, stockSize:9, purchasePriceMultiplier:1.0, playerSellMultiplier:0.45,
    acceptedItemCategories:['CONSUMABLE','MATERIAL','TOOL'], fixedStock:[item('fresh_meat',4,12),item('plant_root',3,10)],
    randomStock:[{kind:'ITEM',slots:7,minQuantity:1,maxQuantity:6,itemCategories:['CONSUMABLE','MATERIAL','TOOL'],maxRarity:'RARE'}], specialFlags:['PET_SUPPLY'],
  },
  WANDERING: {
    id:'WANDERING', name:'떠돌이 상인', description:'지역을 떠돌며 매번 다른 물건을 소량 들고 다닌다.',
    restockHours:24, stockSize:12, purchasePriceMultiplier:1.05, playerSellMultiplier:0.48,
    acceptedItemCategories:['CONSUMABLE','TOOL','MATERIAL','BOOK','MAP','VALUABLE','GIFT','MISC'], acceptedEquipmentTypes:['WEAPON','ARMOR','ACCESSORY','OFFHAND'],
    fixedStock:[], randomStock:[{kind:'ITEM',slots:7,minQuantity:1,maxQuantity:4,maxRarity:'EPIC',allowDungeonRewards:true},{kind:'EQUIPMENT',slots:5,minQuantity:1,maxQuantity:1,maxRarity:'EPIC'}], defaultTraits:['ECCENTRIC'], specialFlags:['MOBILE_MERCHANT'],
  },
  BLACK_MARKET: {
    id:'BLACK_MARKET', name:'암시장', description:'일반 상점에서는 보기 어려운 희귀품과 특수 장비를 취급한다.',
    restockHours:24, stockSize:10, purchasePriceMultiplier:1.35, playerSellMultiplier:0.62,
    acceptedItemCategories:['TOOL','MATERIAL','VALUABLE','MISC','DOCUMENT'], acceptedEquipmentTypes:['WEAPON','ARMOR','ACCESSORY','OFFHAND'],
    fixedStock:[], randomStock:[{kind:'ITEM',slots:4,minQuantity:1,maxQuantity:3,minRarity:'UNCOMMON',maxRarity:'LEGENDARY',allowDungeonRewards:true},{kind:'EQUIPMENT',slots:6,minQuantity:1,maxQuantity:1,minRarity:'RARE',maxRarity:'LEGENDARY'}], defaultTraits:['CAUTIOUS','GREEDY'], specialFlags:['NIGHT_ONLY','HIDDEN'],
  },
  FENCE: {
    id:'FENCE', name:'장물아비', description:'일반 상점이 꺼리는 잡다한 물품을 폭넓게 사들이는 매입 전문상.',
    restockHours:48, stockSize:7, purchasePriceMultiplier:1.12, playerSellMultiplier:0.55,
    acceptedItemCategories:['TOOL','MATERIAL','VALUABLE','MISC','DOCUMENT','GIFT'], acceptedEquipmentTypes:['WEAPON','ARMOR','ACCESSORY','OFFHAND'],
    fixedStock:[], randomStock:[{kind:'ITEM',slots:4,minQuantity:1,maxQuantity:3,maxRarity:'RARE'},{kind:'EQUIPMENT',slots:3,minQuantity:1,maxQuantity:1,maxRarity:'RARE'}], defaultTraits:['CAUTIOUS'], specialFlags:['BUY_BROAD'],
  },
  COLLECTOR: {
    id:'COLLECTOR', name:'수집가', description:'특정 희귀품과 기록물, 장식품을 높은 값에 사들이는 상인.',
    restockHours:120, stockSize:6, purchasePriceMultiplier:1.24, playerSellMultiplier:0.85,
    acceptedItemCategories:['VALUABLE','GIFT','BOOK','DOCUMENT','MAP','MATERIAL'], fixedStock:[],
    randomStock:[{kind:'ITEM',slots:6,minQuantity:1,maxQuantity:2,minRarity:'UNCOMMON',maxRarity:'LEGENDARY',allowDungeonRewards:true}], defaultTraits:['COLLECTOR'], specialFlags:['ROTATING_DEMAND'],
  },
  JUNK: {
    id:'JUNK', name:'고물상', description:'값싼 중고품과 잡동사니 사이에 뜻밖의 물건이 섞여 있다.',
    restockHours:24, stockSize:14, purchasePriceMultiplier:0.68, playerSellMultiplier:0.30,
    acceptedItemCategories:['TOOL','MATERIAL','MISC','DOCUMENT'], acceptedEquipmentTypes:['WEAPON','ARMOR','ACCESSORY','OFFHAND'],
    fixedStock:[item('rope',1,3),item('torch',1,5)], randomStock:[{kind:'ITEM',slots:8,minQuantity:1,maxQuantity:5,maxRarity:'RARE'},{kind:'EQUIPMENT',slots:6,minQuantity:1,maxQuantity:1,maxRarity:'EPIC'}], defaultTraits:['ECCENTRIC'], specialFlags:['JUNK_RARE_ROLL'],
  },
  SECRET: {
    id:'SECRET', name:'비밀상점', description:'특정 조건을 만족한 자에게만 모습을 드러내는 고급 상점.',
    restockHours:168, stockSize:7, purchasePriceMultiplier:1.28, playerSellMultiplier:0.70,
    acceptedItemCategories:['VALUABLE','MATERIAL','BOOK','DOCUMENT'], acceptedEquipmentTypes:['WEAPON','ARMOR','ACCESSORY','OFFHAND'],
    fixedStock:[], randomStock:[{kind:'ITEM',slots:2,minQuantity:1,maxQuantity:2,minRarity:'RARE',maxRarity:'LEGENDARY',allowDungeonRewards:true},{kind:'EQUIPMENT',slots:5,minQuantity:1,maxQuantity:1,minRarity:'EPIC',maxRarity:'LEGENDARY'}], defaultTraits:['EXPERT'], specialFlags:['HIDDEN','CONDITION_LOCKED'],
  },
  AUCTION: {
    id:'AUCTION', name:'경매장', description:'희귀 장비와 고가품을 제한 수량으로 내놓는 대도시 상업시설.',
    restockHours:24, stockSize:8, purchasePriceMultiplier:1.45, playerSellMultiplier:0.72,
    acceptedItemCategories:['VALUABLE','GIFT','BOOK','DOCUMENT','MAP'], acceptedEquipmentTypes:['WEAPON','ARMOR','ACCESSORY','OFFHAND'],
    fixedStock:[], randomStock:[{kind:'ITEM',slots:3,minQuantity:1,maxQuantity:1,minRarity:'RARE',maxRarity:'LEGENDARY',allowDungeonRewards:true},{kind:'EQUIPMENT',slots:5,minQuantity:1,maxQuantity:1,minRarity:'RARE',maxRarity:'LEGENDARY'}], specialFlags:['AUCTION_PREVIEW'],
  },
  SPECIALTY: {
    id:'SPECIALTY', name:'특산품점', description:'해당 지역에서 생산되는 물품과 지역 전용 재료를 집중 판매한다.',
    restockHours:24, stockSize:12, purchasePriceMultiplier:0.88, playerSellMultiplier:0.58,
    acceptedItemCategories:['MATERIAL','CONSUMABLE','VALUABLE','GIFT'], fixedStock:[],
    randomStock:[{kind:'ITEM',slots:12,minQuantity:2,maxQuantity:9,itemCategories:['MATERIAL','CONSUMABLE','VALUABLE','GIFT'],maxRarity:'EPIC'}], specialFlags:['REGION_SPECIALTY'],
  },
};

/**
 * 4.0.2 엔진 자체 테스트와 4.0.3 정착지 연결에서 재사용할 기본 상인 원형.
 * 실제 마을/도시에서는 이 정의를 복제해 이름/가격/특성을 덮어쓴다.
 */
export const BASE_MERCHANT_DEFINITIONS: Record<string, MerchantDefinition> = Object.fromEntries(
  Object.values(SHOP_TYPE_PROFILES).map((profile) => [
    `base_${profile.id.toLowerCase()}`,
    {
      id: `base_${profile.id.toLowerCase()}`,
      name: `기본 ${profile.name}`,
      shopType: profile.id,
      traits: profile.defaultTraits,
      specialFlags: profile.specialFlags,
    } satisfies MerchantDefinition,
  ])
);

export const MERCHANT_DEFINITIONS: Record<string, MerchantDefinition> = {
  ...BASE_MERCHANT_DEFINITIONS,
  ...SETTLEMENT_MERCHANT_DEFINITIONS,
};

export function getShopTypeProfile(shopType: ShopType): ShopTypeProfile {
  return SHOP_TYPE_PROFILES[shopType];
}

export function getMerchantDefinition(merchantId: string): MerchantDefinition | undefined {
  return MERCHANT_DEFINITIONS[merchantId];
}
