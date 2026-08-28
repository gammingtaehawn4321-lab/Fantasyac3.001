import type { ItemDefinition, PlayerState, WorldRegionId } from '../../types';

export type LifeMaterialUseTag =
  | 'COOKING' | 'ALCHEMY' | 'TAILORING' | 'LEATHERWORK' | 'CARPENTRY' | 'BLACKSMITH'
  | 'AIRSHIP_HULL' | 'AIRSHIP_ENGINE' | 'AIRSHIP_FUEL' | 'AIRSHIP_NAVIGATION'
  | 'CAMP' | 'WAYSTATION' | 'EQUIPMENT_CRAFT' | 'ENHANCEMENT_FUTURE' | 'VALUABLE' | 'QUEST';

export interface LifeMaterialMeta {
  itemId: string;
  useTags: LifeMaterialUseTag[];
  sourceRegions: WorldRegionId[];
  sourceTerrainTags: string[];
  notes: string;
}

type Row = [string,string,number,number,ItemDefinition['rarity'],WorldRegionId[],string[],LifeMaterialUseTag[],string];
const R: Row[] = [
  ['oak_log','참나무 원목',2.4,3,'COMMON',['GRANDIA','FOREZIN'],['FOREST','PLAINS'],['CARPENTRY','AIRSHIP_HULL','CAMP'],'구조재와 선체 골격'],
  ['ironwood_log','철심목 원목',3.2,4,'UNCOMMON',['FOREZIN'],['FOREST'],['CARPENTRY','AIRSHIP_HULL','EQUIPMENT_CRAFT'],'단단한 고급 목재'],
  ['river_reed','강갈대',0.2,1,'COMMON',['FOREZIN','SEIRE'],['RIVER','COAST'],['TAILORING','CAMP'],'끈·돗자리·바구니'],
  ['flax_bundle','아마 섬유 다발',0.3,1,'COMMON',['GRANDIA'],['PLAINS'],['TAILORING','AIRSHIP_HULL'],'천·돛 원단'],
  ['sky_hemp','하늘삼 섬유',0.2,1,'RARE',['SCROZE'],['FLOATING_LAND'],['TAILORING','AIRSHIP_HULL'],'경량 고강도 천'],
  ['resin_lump','수지 덩어리',0.4,1,'COMMON',['FOREZIN'],['FOREST'],['CARPENTRY','AIRSHIP_HULL','CAMP'],'접착·방수'],
  ['amber_resin','호박 수지',0.3,1,'UNCOMMON',['FOREZIN'],['FOREST'],['ALCHEMY','AIRSHIP_HULL'],'고급 방수·마력 접착'],
  ['charcoal_sack','숯 자루',1.0,2,'COMMON',['GRANDIA','FOREZIN','SANTIMAC'],['FOREST','HILL'],['BLACKSMITH','CAMP'],'제련·야영 연료'],
  ['hardwood_board','경목 판재',1.8,2,'COMMON',['GRANDIA','FOREZIN'],['URBAN','FOREST'],['CARPENTRY','AIRSHIP_HULL'],'가공 판재'],
  ['bamboo_cane','강죽 대',0.6,2,'COMMON',['FOREZIN','SEIRE'],['RIVER','COAST'],['CARPENTRY','EQUIPMENT_CRAFT'],'장대·활·도구'],

  ['copper_ore','동광석',1.6,2,'COMMON',['GRANDIA','SANTIMAC'],['HILL','CAVE'],['BLACKSMITH','AIRSHIP_ENGINE'],'배선·합금'],
  ['tin_ore','주석광석',1.5,2,'COMMON',['SANTIMAC'],['HILL','CAVE'],['BLACKSMITH'],'청동 합금'],
  ['coal_chunk','석탄',1.3,2,'COMMON',['GRANDIA','SANTIMAC'],['CAVE','TUNNEL'],['BLACKSMITH','AIRSHIP_FUEL'],'고열 연료'],
  ['mithril_sand','미스릴 사금',0.5,1,'RARE',['PROSTI','SCROZE'],['CRYSTAL_CAVE','FLOATING_LAND'],['BLACKSMITH','AIRSHIP_ENGINE','EQUIPMENT_CRAFT'],'고급 합금'],
  ['sky_iron_ore','천철광',1.4,2,'RARE',['SCROZE'],['FLOATING_LAND'],['BLACKSMITH','AIRSHIP_ENGINE','AIRSHIP_HULL'],'부유선 핵심 금속'],
  ['frost_silver_ore','빙은광',1.3,2,'RARE',['PROSTI'],['CRYSTAL_CAVE','SNOW'],['BLACKSMITH','ALCHEMY'],'냉기 전도 금속'],
  ['obsidian_shard','흑요석 조각',0.7,1,'UNCOMMON',['SANTIMAC'],['HILL','CHASM'],['BLACKSMITH','EQUIPMENT_CRAFT'],'날붙이·장식'],
  ['quartz_cluster','수정 군집',0.8,1,'UNCOMMON',['GRANDIA','PROSTI'],['CRYSTAL_CAVE'],['ALCHEMY','AIRSHIP_NAVIGATION'],'마력 공진'],
  ['aether_crystal','에테르 결정',0.5,1,'RARE',['SCROZE'],['CLOUD','FLOATING_LAND'],['AIRSHIP_FUEL','AIRSHIP_ENGINE','ALCHEMY'],'비행정 연료 핵심'],
  ['storm_crystal','폭풍 결정',0.6,1,'EPIC',['SCROZE'],['STORM'],['AIRSHIP_ENGINE','AIRSHIP_FUEL'],'고출력 추진 핵'],
  ['deep_crystal','심층 결정',0.8,1,'RARE',['GRANDIA','FOREZIN','SEIRE','SANTIMAC','PROSTI'],['CRYSTAL_CAVE'],['ENHANCEMENT_FUTURE','EQUIPMENT_CRAFT'],'심층 강화 재료'],
  ['sulfur_chunk','유황 덩어리',0.9,1,'UNCOMMON',['SANTIMAC'],['MAGMA_RIFT','CAVE'],['ALCHEMY','BLACKSMITH'],'화약·연금 촉매'],
  ['saltpeter','초석',0.7,1,'UNCOMMON',['GRANDIA','SANTIMAC'],['CAVE','HILL'],['ALCHEMY','AIRSHIP_FUEL'],'추진제 재료'],
  ['magnetite','자철석',1.0,1,'UNCOMMON',['PROSTI','SANTIMAC'],['MOUNTAIN','CAVE'],['AIRSHIP_NAVIGATION','BLACKSMITH'],'나침반·항법'],

  ['river_fish','민물고기',0.6,1,'COMMON',['FOREZIN'],['RIVER'],['COOKING'],'기본 식재료'],
  ['silver_trout','은빛 송어',0.7,1,'UNCOMMON',['FOREZIN','PROSTI'],['RIVER','UNDERGROUND_RIVER'],['COOKING','ALCHEMY'],'고급 요리'],
  ['sea_fish','바다생선',0.8,1,'COMMON',['SEIRE'],['SEA','COAST'],['COOKING'],'해산물'],
  ['deep_tuna','심해 참치',1.6,2,'UNCOMMON',['SEIRE'],['DEEP_SEA'],['COOKING'],'고급 해산물'],
  ['shellfish_basket','조개 바구니',0.8,1,'COMMON',['SEIRE'],['COAST'],['COOKING','ALCHEMY'],'식재료·석회'],
  ['coral_fragment','산호 조각',0.5,1,'UNCOMMON',['SEIRE'],['UNDERWATER','DEEP_SEA'],['ALCHEMY','EQUIPMENT_CRAFT','VALUABLE'],'장식·연금'],
  ['sea_salt','해염',0.3,1,'COMMON',['SEIRE'],['COAST'],['COOKING','ALCHEMY'],'조리·보존'],
  ['kelp_bundle','해초 다발',0.4,1,'COMMON',['SEIRE'],['UNDERWATER'],['COOKING','ALCHEMY'],'식재료·약재'],
  ['pearl','진주',0.1,1,'RARE',['SEIRE'],['UNDERWATER','DEEP_SEA'],['VALUABLE','EQUIPMENT_CRAFT'],'귀중품·장신구'],
  ['abyss_pearl','심연진주',0.1,1,'EPIC',['SEIRE'],['DEEP_SEA'],['VALUABLE','ALCHEMY','EQUIPMENT_CRAFT'],'희귀 심해 보석'],

  ['red_berry','붉은 열매',0.1,1,'COMMON',['GRANDIA','FOREZIN'],['FOREST','PLAINS'],['COOKING','ALCHEMY'],'식량·약'],
  ['blue_berry','푸른 열매',0.1,1,'COMMON',['FOREZIN','PROSTI'],['FOREST','SNOW'],['COOKING','ALCHEMY'],'식량·약'],
  ['forest_mushroom','숲버섯',0.2,1,'COMMON',['FOREZIN'],['FOREST'],['COOKING','ALCHEMY'],'조리·연금'],
  ['cave_mushroom','동굴버섯',0.2,1,'COMMON',['GRANDIA','FOREZIN','SANTIMAC','PROSTI'],['CAVE','FUNGAL_CAVE'],['COOKING','ALCHEMY'],'지하 식량'],
  ['glowcap','발광버섯',0.2,1,'UNCOMMON',['FOREZIN','PROSTI'],['FUNGAL_CAVE'],['ALCHEMY','AIRSHIP_NAVIGATION'],'발광 시약'],
  ['medicinal_leaf','치유잎',0.1,1,'COMMON',['GRANDIA','FOREZIN'],['PLAINS','FOREST'],['ALCHEMY'],'회복약'],
  ['bitter_root','쓴뿌리',0.3,1,'COMMON',['GRANDIA','FOREZIN'],['PLAINS','FOREST'],['COOKING','ALCHEMY'],'강장제'],
  ['moonflower','월광화',0.1,1,'RARE',['FOREZIN','SCROZE'],['FOREST','SHRINE'],['ALCHEMY','QUEST'],'희귀 약초'],
  ['snow_lotus','설련화',0.1,1,'RARE',['PROSTI'],['SNOW','MOUNTAIN'],['ALCHEMY','VALUABLE'],'고산 약재'],
  ['desert_sage','사막 세이지',0.1,1,'UNCOMMON',['SANTIMAC'],['HILL','PLAINS'],['ALCHEMY','COOKING'],'향신료·해독'],
  ['cloud_blossom','구름꽃',0.1,1,'RARE',['SCROZE'],['FLOATING_LAND'],['ALCHEMY','AIRSHIP_FUEL'],'에테르 친화 약초'],

  ['raw_hide','생가죽',1.1,2,'COMMON',['GRANDIA','FOREZIN','SANTIMAC','PROSTI'],['PLAINS','FOREST','SNOW'],['LEATHERWORK','EQUIPMENT_CRAFT'],'가죽 원재료'],
  ['thick_fur','두꺼운 모피',1.4,2,'COMMON',['PROSTI'],['SNOW','MOUNTAIN'],['LEATHERWORK','TAILORING'],'방한 장비'],
  ['fine_fur','고운 모피',0.8,1,'UNCOMMON',['GRANDIA','FOREZIN'],['FOREST'],['TAILORING','VALUABLE'],'고급 의복'],
  ['beast_tendon','마수 힘줄',0.2,1,'UNCOMMON',['GRANDIA','FOREZIN','SANTIMAC'],['PLAINS','FOREST','HILL'],['EQUIPMENT_CRAFT','AIRSHIP_HULL'],'활시위·결속'],
  ['bone_piece','단단한 뼈',0.5,1,'COMMON',['GRANDIA','FOREZIN','SANTIMAC','PROSTI'],['PLAINS','FOREST','CAVE'],['EQUIPMENT_CRAFT','CARPENTRY'],'도구·장식'],
  ['horn_piece','뿔 조각',0.4,1,'UNCOMMON',['GRANDIA','PROSTI'],['PLAINS','SNOW'],['EQUIPMENT_CRAFT','ALCHEMY'],'장비·약재'],
  ['feather_bundle','깃털 다발',0.1,1,'COMMON',['GRANDIA','SCROZE'],['PLAINS','SKY'],['TAILORING','AIRSHIP_NAVIGATION'],'화살·장식'],
  ['skyfeather','천공깃',0.1,1,'RARE',['SCROZE'],['CELESTIAL'],['AIRSHIP_NAVIGATION','EQUIPMENT_CRAFT'],'고급 항법 깃'],
  ['insect_chitin','곤충 갑각',0.7,1,'COMMON',['GRANDIA','FOREZIN','SEIRE','SANTIMAC','PROSTI'],['CAVE','DEEP_UNDERGROUND'],['EQUIPMENT_CRAFT','LEATHERWORK'],'경량 갑주'],
  ['royal_chitin','왕갑각',0.9,1,'RARE',['GRANDIA','FOREZIN','SEIRE','SANTIMAC','PROSTI'],['DEEP_UNDERGROUND'],['EQUIPMENT_CRAFT','ENHANCEMENT_FUTURE'],'엘리트 곤충 재료'],
  ['silk_cocoon','동굴 명주고치',0.3,1,'UNCOMMON',['FOREZIN','PROSTI'],['FUNGAL_CAVE','CAVE'],['TAILORING','AIRSHIP_HULL'],'고강도 섬유'],
  ['tentacle_fiber','촉수 섬유',0.5,1,'UNCOMMON',['GRANDIA','FOREZIN','SEIRE','SANTIMAC','PROSTI'],['CAVE','UNDERGROUND_RIVER'],['ALCHEMY','EQUIPMENT_CRAFT'],'탄성 재료'],

  ['wheat_sack','밀 자루',1.2,2,'COMMON',['GRANDIA'],['PLAINS'],['COOKING','WAYSTATION'],'빵·여행식'],
  ['barley_sack','보리 자루',1.2,2,'COMMON',['GRANDIA','SANTIMAC'],['PLAINS'],['COOKING','WAYSTATION'],'죽·사료'],
  ['potato_sack','감자 자루',1.5,2,'COMMON',['PROSTI','GRANDIA'],['SNOW','PLAINS'],['COOKING','WAYSTATION'],'보존 식량'],
  ['dried_meat','말린 고기',0.5,1,'COMMON',['GRANDIA','SANTIMAC','PROSTI'],['URBAN','PLAINS'],['COOKING','WAYSTATION'],'여행식'],
  ['cheese_wheel','숙성 치즈',0.8,1,'UNCOMMON',['GRANDIA'],['URBAN','PLAINS'],['COOKING','WAYSTATION'],'보존 식량'],
  ['honey_jar','야생꿀',0.4,1,'UNCOMMON',['FOREZIN'],['FOREST'],['COOKING','ALCHEMY'],'요리·회복'],
  ['spice_mix','향신료 꾸러미',0.2,1,'UNCOMMON',['SANTIMAC'],['URBAN','HILL'],['COOKING','VALUABLE'],'요리·교역'],
  ['clean_water','정제수',0.7,1,'COMMON',['GRANDIA','FOREZIN','PROSTI'],['RIVER','URBAN'],['COOKING','ALCHEMY','WAYSTATION'],'식수'],

  ['linen_cloth','아마천',0.4,1,'COMMON',['GRANDIA'],['URBAN'],['TAILORING','AIRSHIP_HULL'],'의복·돛'],
  ['canvas_roll','두꺼운 캔버스',1.0,2,'UNCOMMON',['GRANDIA','FOREZIN'],['URBAN'],['TAILORING','AIRSHIP_HULL','CAMP'],'천막·비행정 외피'],
  ['leather_strip','무두질 가죽끈',0.2,1,'COMMON',['GRANDIA','FOREZIN','SANTIMAC'],['URBAN'],['LEATHERWORK','AIRSHIP_HULL','CAMP'],'결속재'],
  ['wax_block','밀랍 덩어리',0.3,1,'COMMON',['FOREZIN','GRANDIA'],['FOREST','URBAN'],['CARPENTRY','ALCHEMY','AIRSHIP_HULL'],'방수·봉인'],
  ['pitch_barrel','역청 통',3.0,4,'UNCOMMON',['GRANDIA','SANTIMAC'],['URBAN','HILL'],['AIRSHIP_HULL','CARPENTRY'],'선체 방수'],
  ['glass_sheet','유리판',1.2,2,'UNCOMMON',['SANTIMAC'],['URBAN','HILL'],['AIRSHIP_NAVIGATION','CARPENTRY'],'창·계기판'],
  ['bronze_gear','청동 기어',0.8,1,'UNCOMMON',['GRANDIA','SANTIMAC'],['URBAN'],['AIRSHIP_ENGINE','AIRSHIP_NAVIGATION'],'기관 부품'],
  ['steel_bolt','강철 볼트',0.3,1,'COMMON',['GRANDIA','SANTIMAC'],['URBAN'],['AIRSHIP_HULL','AIRSHIP_ENGINE'],'조립 부품'],
  ['pressure_valve','압력 밸브',0.7,1,'RARE',['GRANDIA','SCROZE'],['URBAN','FLOATING_LAND'],['AIRSHIP_ENGINE'],'기관 제어'],
  ['aether_condenser','에테르 응축기',1.8,2,'EPIC',['SCROZE'],['FLOATING_LAND','CELESTIAL'],['AIRSHIP_ENGINE','AIRSHIP_FUEL'],'고급 기관 핵'],
  ['navigation_lens','항법 수정렌즈',0.4,1,'RARE',['SCROZE','PROSTI'],['FLOATING_LAND','CRYSTAL_CAVE'],['AIRSHIP_NAVIGATION'],'항법 장치'],
  ['wind_rune_plate','풍향 룬판',0.5,1,'RARE',['SCROZE'],['SHRINE','FLOATING_LAND'],['AIRSHIP_NAVIGATION','AIRSHIP_ENGINE'],'기류 감지'],
  ['aether_fuel_cell','에테르 연료전지',0.8,1,'RARE',['SCROZE'],['FLOATING_LAND'],['AIRSHIP_FUEL'],'비행정 표준 연료'],
  ['storm_fuel_cell','폭풍 연료전지',0.8,1,'EPIC',['SCROZE'],['STORM','CELESTIAL'],['AIRSHIP_FUEL'],'고밀도 연료'],

  ['ruby_rough','루비 원석',0.2,1,'RARE',['SANTIMAC'],['CAVE','DEEP_UNDERGROUND'],['VALUABLE','EQUIPMENT_CRAFT'],'보석·거래'],
  ['sapphire_rough','사파이어 원석',0.2,1,'RARE',['SEIRE','PROSTI'],['CRYSTAL_CAVE','DEEP_UNDERGROUND'],['VALUABLE','EQUIPMENT_CRAFT'],'보석·거래'],
  ['emerald_rough','에메랄드 원석',0.2,1,'RARE',['FOREZIN'],['CAVE','DEEP_UNDERGROUND'],['VALUABLE','EQUIPMENT_CRAFT'],'보석·거래'],
  ['topaz_rough','토파즈 원석',0.2,1,'UNCOMMON',['GRANDIA','SANTIMAC'],['CAVE'],['VALUABLE','EQUIPMENT_CRAFT'],'보석·거래'],
  ['amethyst_rough','자수정 원석',0.2,1,'UNCOMMON',['PROSTI','GRANDIA'],['CRYSTAL_CAVE'],['VALUABLE','ALCHEMY'],'보석·연금'],
  ['opal_rough','오팔 원석',0.2,1,'RARE',['SEIRE'],['DEEP_SEA','CAVE'],['VALUABLE','EQUIPMENT_CRAFT'],'보석·거래'],
  ['diamond_rough','다이아몬드 원석',0.2,1,'EPIC',['PROSTI','SANTIMAC'],['DEEP_UNDERGROUND'],['VALUABLE','ENHANCEMENT_FUTURE'],'최상급 보석'],
  ['starstone','성석',0.3,1,'EPIC',['SCROZE'],['CELESTIAL'],['VALUABLE','AIRSHIP_NAVIGATION','EQUIPMENT_CRAFT'],'천공 희귀 광물'],
];

export const LIFE_MATERIAL_META: Record<string, LifeMaterialMeta> = Object.fromEntries(R.map((x)=>[x[0],{
  itemId:x[0], useTags:x[7], sourceRegions:x[5], sourceTerrainTags:x[6], notes:x[8],
}]));

export const LIFE_MATERIAL_ITEM_DATABASE: Record<string,ItemDefinition> = Object.fromEntries(R.map((x)=>[x[0],{
  id:x[0], name:x[1], category:'MATERIAL', description:`생활·제작 재료. 주요 사용처: ${x[7].join(', ')}.`, flavorText:x[8], usable:false,
  weight:x[2],bulk:x[3],size:x[3]>=4?'BULKY':x[3]>=3?'LARGE':x[3]>=2?'MEDIUM':x[2]<=.2?'TINY':'SMALL',rarity:x[4],
}])) as Record<string,ItemDefinition>;

export const TRAVEL_TOOL_ITEM_DATABASE: Record<string,ItemDefinition> = {
  field_ration_pack:{id:'field_ration_pack',name:'장거리 여행식 꾸러미',category:'TOOL',description:'지상에서 한 번에 이동 가능한 최대 거리를 +2 Hex 늘린다.',usable:false,consumedOnUse:false,uses:['SPECIAL'],weight:1.2,bulk:2,size:'MEDIUM',rarity:'COMMON'},
  trail_compass:{id:'trail_compass',name:'행군용 지형 나침반',category:'TOOL',description:'지상 최대 이동거리 +2 Hex.',usable:false,consumedOnUse:false,uses:['SPECIAL'],weight:.3,bulk:1,size:'SMALL',rarity:'UNCOMMON'},
  expedition_kit:{id:'expedition_kit',name:'원정대 야전도구 세트',category:'TOOL',description:'지상 최대 이동거리 +3 Hex.',usable:false,consumedOnUse:false,uses:['SPECIAL'],weight:2.8,bulk:4,size:'LARGE',rarity:'RARE'},
  wayfarer_tent:{id:'wayfarer_tent',name:'경량 여행 천막',category:'TOOL',description:'지상 최대 이동거리 +1 Hex. 장거리 야영용.',usable:false,consumedOnUse:false,uses:['SPECIAL'],weight:1.7,bulk:3,size:'MEDIUM',rarity:'UNCOMMON'},
};

const hasItem=(state:PlayerState,id:string)=>state.inventory.some((x)=>x.id===id&&x.quantity>0);
export function getLifeMaterialUseText(itemId:string):string {const m=LIFE_MATERIAL_META[itemId];return m?`${m.useTags.join(' / ')} · ${m.notes}`:'생활 재료 메타데이터 없음';}
export function hasTravelTool(state:PlayerState,id:string){return hasItem(state,id);}
