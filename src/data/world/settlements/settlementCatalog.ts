import type { MerchantDefinition } from '../shops/shopTypes';
import type { MerchantTrait, ShopType, WorldRegionId } from '../../../types';
import type {
  InnRateDefinition,
  OpeningHours,
  SettlementDefinition,
  SettlementDistrictDefinition,
  SettlementFacilityDefinition,
  SettlementShopPlacement,
  SettlementTier,
} from './settlementTypes';

const DAY: OpeningHours = { open: 8, close: 20 };
const LONG: OpeningHours = { open: 7, close: 22 };
const NIGHT: OpeningHours = { open: 20, close: 4 };
const ALWAYS: OpeningHours = { open: 0, close: 24 };

const DEFAULT_INN_RATES: InnRateDefinition[] = [
  { id:'CHEAP', name:'공용 침상', price:35, minutes:360, recoveryRatio:0.55, description:'짧게 몸을 누이고 피로를 푼다.' },
  { id:'STANDARD', name:'일반 객실', price:80, minutes:480, recoveryRatio:0.82, description:'하룻밤에 가까운 충분한 휴식.' },
  { id:'PREMIUM', name:'상급 객실', price:180, minutes:540, recoveryRatio:1, description:'안전하고 편안한 객실. 체력을 완전히 회복한다.' },
];

interface ShopSpec {
  id: string;
  label: string;
  type: ShopType;
  merchant: string;
  district?: string;
  traits?: MerchantTrait[];
  hours?: OpeningHours;
  price?: number;
  sell?: number;
}

interface SettlementSpec {
  id: string;
  group: string;
  name: string;
  description: string;
  tier: SettlementTier;
  region: WorldRegionId;
  economy: string[];
  specialties: string[];
  shops: ShopSpec[];
  districts?: Array<{ id:string; name:string; description:string }>;
  extras?: Array<{ id:string; name:string; type:SettlementFacilityDefinition['type']; description:string; district?:string; hours?:OpeningHours; serviceFlags?:string[] }>;
  inn?: boolean;
}

const S = (id:string,label:string,type:ShopType,merchant:string,district?:string,traits?:MerchantTrait[],hours:OpeningHours=DAY,price?:number,sell?:number): ShopSpec =>
  ({ id,label,type,merchant,district,traits,hours,price,sell });

const SPECS: SettlementSpec[] = [
  {
    id:'THE_PELLESS', group:'THE_PELLESS', name:'더 펠리스', tier:'METROPOLIS', region:'GRANDIA',
    description:'그란디아 최대의 상업·행정 중심지. 중앙시장부터 전문 공방, 대형 경매장, 뒷골목까지 거대한 생활권을 이룬다.',
    economy:['LUXURY_MARKET','HIGH_DEMAND_EQUIPMENT'], specialties:['CAPITAL','AUCTION','MASTER_CRAFT'], inn:true,
    districts:[
      {id:'CENTER',name:'중앙광장',description:'여관과 잡화점, 게시판이 모인 여행자의 첫 거점.'},
      {id:'MARKET',name:'상업지구',description:'일반 상점과 중앙시장이 밀집한 번화가.'},
      {id:'CRAFT',name:'공방지구',description:'대장간·연금술·룬 공방이 모인 생산 중심지.'},
      {id:'GUILD',name:'길드지구',description:'모험가 길드와 경매장이 자리 잡은 구역.'},
      {id:'BACK',name:'뒷골목',description:'해가 지면 정식 시장과 다른 거래가 열린다.'},
    ],
    shops:[
      S('general','왕도 만물상','GENERAL_GOODS','마렐','CENTER',['GENEROUS'],LONG,.98),
      S('weapon','금사자 무기점','WEAPON','브람','MARKET',['EXPERT']),
      S('armor','철벽 방어구점','ARMOR','셀도','MARKET',['EXPERT']),
      S('clothing','벨벳 의상실','CLOTHING','리아나','MARKET',['ECCENTRIC']),
      S('blacksmith','왕도 제련소','BLACKSMITH','토르반','CRAFT',['EXPERT']),
      S('alchemy','청유리 연금술점','ALCHEMY','엘린','CRAFT',['EXPERT']),
      S('magic','아르카나 서고','MAGIC','세르마','CRAFT',['EXPERT']),
      S('rune','황금 룬 공방','RUNE','오르델','CRAFT',['EXPERT']),
      S('adventurer','탐험가 보급소','ADVENTURER','카엔','GUILD',['CAUTIOUS'],LONG),
      S('auction','펠리스 대경매장','AUCTION','경매관 아델','GUILD',['CAUTIOUS'],{open:10,close:18},1.18,1.1),
      S('black_market','검은 촛불 시장','BLACK_MARKET','네브','BACK',['GREEDY','ECCENTRIC'],NIGHT,1.16,.95),
    ],
    extras:[
      {id:'inn',name:'황금사슴 여관',type:'INN',description:'등급별 객실과 식사를 제공하는 대형 여관.',district:'CENTER',hours:ALWAYS},
      {id:'board',name:'왕도 의뢰 게시판',type:'NOTICE_BOARD',description:'지역 의뢰와 길드 공고가 붙어 있다.',district:'CENTER',hours:ALWAYS},
      {id:'market',name:'중앙시장',type:'MARKET',description:'시간대마다 노점과 소규모 상인이 교체되는 시장.',district:'MARKET',hours:LONG},
      {id:'guild',name:'모험가 길드 본부',type:'GUILD',description:'모험가 등록과 고급 의뢰를 담당한다.',district:'GUILD',hours:DAY},
      {id:'bank',name:'펠리스 금고',type:'BANK',description:'도시 금융·보관 시설.',district:'CENTER',hours:DAY},
    ],
  },
  {
    id:'REMUSIAN', group:'REMUSIAN', name:'레무시안', tier:'CITY', region:'SANTIMAC',
    description:'남부 교역로와 광물 운송이 만나는 무장 교역도시.', economy:['CHEAP_MATERIAL','HIGH_DEMAND_EQUIPMENT'], specialties:['METAL','HUNTER'], inn:true,
    districts:[{id:'MARKET',name:'교역가',description:'보급품과 무기상이 늘어선 큰길.'},{id:'FORGE',name:'제련가',description:'광물상과 대장간이 모인 공방권.'},{id:'GUILD',name:'모험가 거리',description:'사냥꾼과 탐험가가 드나드는 구역.'}],
    shops:[S('general','황토길 잡화점','GENERAL_GOODS','나심','MARKET'),S('weapon','사막칼날 무기점','WEAPON','하짐','MARKET',['EXPERT']),S('armor','적사 방어구점','ARMOR','두란','MARKET'),S('blacksmith','붉은 모루','BLACKSMITH','바르카','FORGE',['EXPERT'],DAY,.95,1.05),S('material','대상 재료상','MATERIAL','사힐','FORGE',['GENEROUS']),S('mineral','석양 광물상','MINERAL','다만','FORGE',['COLLECTOR']),S('hunter','모래매 사냥점','HUNTER','라슈','GUILD',['EXPERT']),S('adventurer','남로 보급소','ADVENTURER','네마','GUILD'),S('auction','레무시안 교역 경매소','AUCTION','마시르','MARKET',['CAUTIOUS'],{open:11,close:19})],
    extras:[{id:'inn',name:'대상인의 쉼터',type:'INN',description:'상단과 모험가가 함께 쓰는 큰 여관.',district:'MARKET',hours:ALWAYS},{id:'board',name:'남부 의뢰판',type:'NOTICE_BOARD',description:'호위·채집·토벌 의뢰가 많다.',district:'GUILD',hours:ALWAYS},{id:'market',name:'레무시안 대상시장',type:'MARKET',description:'광물과 원정 물자가 빠르게 순환하는 교역시장.',district:'MARKET',hours:LONG},{id:'guild',name:'남부 모험가 길드',type:'GUILD',description:'호위와 사냥 의뢰를 중개하는 길드 지부.',district:'GUILD',hours:DAY},{id:'bank',name:'대상 금고',type:'BANK',description:'상단 공용 예치·인출 창구.',district:'MARKET',hours:DAY}],
  },
  {
    id:'DESERT_ALTO', group:'DESERT_ALTO', name:'데저트 알토', tier:'CITY', region:'SANTIMAC',
    description:'폐쇄적인 고원도시. 보석과 마법 재료, 비밀 거래가 발달했다.', economy:['EXPENSIVE_FOOD','CHEAP_MAGIC','LUXURY_MARKET'], specialties:['MAGIC','JEWEL','SECRET'], inn:true,
    districts:[{id:'HIGH',name:'고원시장',description:'보석과 마법품이 거래되는 공개 시장.'},{id:'TEMPLE',name:'의식거리',description:'룬과 약초, 의식 재료를 다루는 거리.'},{id:'BACK',name:'밀거래 골목',description:'외부인에게 쉽게 모습을 드러내지 않는 거래권.'}],
    shops:[S('magic','신기루 마법상회','MAGIC','이르샤','HIGH',['EXPERT']),S('jewel','별모래 보석상','JEWELER','나디아','HIGH',['COLLECTOR']),S('rune','고원 룬각소','RUNE','아실','TEMPLE',['EXPERT']),S('herb','백야 약초상','HERBALIST','세라프','TEMPLE',['COLLECTOR']),S('collector','붉은 유리 수집관','COLLECTOR','파딘','HIGH',['COLLECTOR'],{open:10,close:18}),S('fence','침묵의 장물아비','FENCE','무명 상인','BACK',['GREEDY'],NIGHT),S('black','장막 암시장','BLACK_MARKET','제하르','BACK',['GREEDY','ECCENTRIC'],NIGHT),S('secret','문 없는 상점','SECRET','???','BACK',['ECCENTRIC'],{open:0,close:24},1.25,1.05)],
    extras:[{id:'inn',name:'하얀 천막 여관',type:'INN',description:'외부 상인도 묵을 수 있는 중립 숙소.',district:'HIGH',hours:ALWAYS},{id:'board',name:'고원 공고판',type:'NOTICE_BOARD',description:'상단과 의식 관련 의뢰가 붙는다.',district:'HIGH',hours:ALWAYS},{id:'market',name:'고원 교환시장',type:'MARKET',description:'보석·의식 재료·사막 산물이 교환되는 시장.',district:'HIGH',hours:DAY},{id:'bank',name:'고원 환전소',type:'BANK',description:'상단이 공동 운영하는 예치 창구.',district:'HIGH',hours:DAY}],
  },
  {
    id:'SKY_CITY', group:'SKY_CITY', name:'수상도시 스카이', tier:'METROPOLIS', region:'SEIRE',
    description:'수면과 공중 교통이 교차하는 거대한 항만도시.', economy:['REMOTE_MARKET','HIGH_DEMAND_MAGIC'], specialties:['PORT','MAGITECH','SPECIALTY'], inn:true,
    districts:[{id:'PORT',name:'부유항',description:'여행자와 선박이 모이는 입구.'},{id:'TECH',name:'마도공학 거리',description:'마도기계와 장신구 공방이 밀집.'},{id:'MARKET',name:'수상시장',description:'해산물과 특산품이 거래되는 시장.'}],
    shops:[S('general','구름닻 잡화점','GENERAL_GOODS','피오','PORT',undefined,LONG),S('magitech','청공 마도공학점','MAGITECH','테오','TECH',['EXPERT']),S('jewel','물빛 보석상','JEWELER','마린','TECH',['COLLECTOR']),S('clothing','바람결 의상점','CLOTHING','에일','MARKET'),S('food','파도 식료품점','FOOD','코나','MARKET',['GENEROUS'],LONG),S('specialty','스카이 특산품점','SPECIALTY','리브','MARKET',['ECCENTRIC']),S('wandering','떠돌이 선상상인','WANDERING','루프','PORT',['ECCENTRIC'],LONG)],
    extras:[{id:'inn',name:'푸른돛 여관',type:'INN',description:'항만이 내려다보이는 여행자 숙소.',district:'PORT',hours:ALWAYS},{id:'market',name:'수상 중앙시장',type:'MARKET',description:'아침과 저녁에 상품 구성이 크게 바뀐다.',district:'MARKET',hours:LONG},{id:'guild',name:'항로 모험가 길드',type:'GUILD',description:'공중·수상 항로 의뢰를 담당하는 길드 지부.',district:'PORT',hours:DAY},{id:'bank',name:'부유항 금고',type:'BANK',description:'항로 상인의 공동 예치 창구.',district:'PORT',hours:DAY}],
  },
  {
    id:'AQUARIA', group:'AQUARIA', name:'아쿠아리아', tier:'CITY', region:'SEIRE',
    description:'해저 거주권의 중심도시. 약품과 해양 재료, 성물 거래가 발달했다.', economy:['CHEAP_FOOD','CHEAP_MATERIAL','HIGH_DEMAND_MAGIC'], specialties:['AQUATIC','ALCHEMY'], inn:true,
    districts:[{id:'REEF',name:'산호시장',description:'식량과 해양 소재가 모이는 시장.'},{id:'SANCTUM',name:'성소거리',description:'성물과 연금술이 발달한 구역.'}],
    shops:[S('food','산호 식료품점','FOOD','모아','REEF',['GENEROUS'],LONG),S('material','심해 재료상','MATERIAL','델피','REEF'),S('specialty','아쿠아리아 특산품점','SPECIALTY','리오네','REEF'),S('alchemy','청해 연금술점','ALCHEMY','멜루','SANCTUM',['EXPERT']),S('cleric','해류 성물점','CLERIC','사제 이오','SANCTUM',['EXPERT']),S('jewel','진주 보석상','JEWELER','네리','REEF',['COLLECTOR'])],
    extras:[{id:'inn',name:'물방울 여관',type:'INN',description:'수중 종족과 방문객을 위한 숙소.',district:'REEF',hours:ALWAYS},{id:'board',name:'해저 의뢰판',type:'NOTICE_BOARD',description:'채집과 수중 호위 의뢰가 주를 이룬다.',district:'REEF',hours:ALWAYS},{id:'market',name:'산호 공동시장',type:'MARKET',description:'해양 식량과 재료가 순환하는 공동시장.',district:'REEF',hours:LONG},{id:'guild',name:'해저 탐사 길드',type:'GUILD',description:'수중 탐사와 호위 의뢰를 담당한다.',district:'SANCTUM',hours:DAY}],
  },
  {
    id:'FOREZIN_RIVER_VILLAGE', group:'FOREZIN_RIVER_VILLAGE', name:'포레진 강변 부락', tier:'VILLAGE', region:'FOREZIN', description:'강과 숲의 산물이 모이는 작은 부락.', economy:['CHEAP_FOOD','CHEAP_MATERIAL'], specialties:['HERB','HUNTER'], inn:true,
    shops:[S('general','강변 잡화점','GENERAL_GOODS','로아'),S('herb','이끼 약초상','HERBALIST','미르',undefined,['COLLECTOR']),S('hunter','숲길 사냥점','HUNTER','게른',undefined,['EXPERT']),S('pet','들짐승 펫 용품점','PET_SUPPLY','나나')],
    extras:[{id:'inn',name:'강물소리 여관',type:'INN',description:'작지만 따뜻한 숙소.',hours:ALWAYS},{id:'board',name:'부락 게시판',type:'NOTICE_BOARD',description:'채집과 야수 관련 의뢰가 붙는다.',hours:ALWAYS}],
  },
  { id:'FOREZIN_WEST_VILLAGE',group:'FOREZIN_WEST_VILLAGE',name:'포레진 서부 부락',tier:'VILLAGE',region:'FOREZIN',description:'침엽수림 서쪽의 목재 교역 부락.',economy:['CHEAP_MATERIAL'],specialties:['WOOD'],inn:true,shops:[S('general','서부 잡화점','GENERAL_GOODS','헤스'),S('material','목재 재료상','MATERIAL','토비'),S('blacksmith','숲모루 대장간','BLACKSMITH','에건',undefined,['EXPERT'])],extras:[{id:'inn',name:'통나무 여관',type:'INN',description:'벌목꾼이 자주 찾는 숙소.',hours:ALWAYS}] },
  { id:'FOREZIN_NORTH_VILLAGE',group:'FOREZIN_NORTH_VILLAGE',name:'포레진 북부 부락',tier:'HAMLET',region:'FOREZIN',description:'깊은 숲의 외딴 생활권.',economy:['REMOTE_MARKET'],specialties:['HERB'],inn:true,shops:[S('general','북숲 보급소','GENERAL_GOODS','아이노'),S('herb','북숲 약초상','HERBALIST','루메')],extras:[{id:'inn',name:'사슴뿔 쉼터',type:'INN',description:'간단한 침상만 제공한다.',hours:ALWAYS}] },
  { id:'FOREZIN_EAST_VILLAGE',group:'FOREZIN_EAST_VILLAGE',name:'포레진 동부 부락',tier:'VILLAGE',region:'FOREZIN',description:'강길과 동부 교역로가 만나는 마을.',economy:['CHEAP_FOOD'],specialties:['FOOD'],inn:true,shops:[S('food','동숲 식료품점','FOOD','베라',undefined,['GENEROUS'],LONG),S('general','동부 잡화점','GENERAL_GOODS','키안'),S('adventurer','숲끝 모험가점','ADVENTURER','란')],extras:[{id:'inn',name:'초록문 여관',type:'INN',description:'상인과 여행자가 머문다.',hours:ALWAYS}] },
  { id:'FOREZIN_RIDGE_VILLAGE',group:'FOREZIN_RIDGE_VILLAGE',name:'포레진 능선 부락',tier:'VILLAGE',region:'FOREZIN',description:'광맥과 숲이 맞닿은 능선 마을.',economy:['CHEAP_MATERIAL','HIGH_DEMAND_MATERIAL'],specialties:['ORE'],inn:true,shops:[S('mineral','능선 광물상','MINERAL','돌프',undefined,['COLLECTOR']),S('blacksmith','능선 대장간','BLACKSMITH','브론',undefined,['EXPERT']),S('material','능선 재료상','MATERIAL','세티')],extras:[{id:'inn',name:'광부의 등불',type:'INN',description:'광부와 여행자용 숙소.',hours:ALWAYS}] },
  { id:'PROSTI_VILLAGE',group:'PROSTI_VILLAGE',name:'설인·늑대 수인 공생 취락',tier:'VILLAGE',region:'PROSTI',description:'설원에서 살아가는 두 집단의 공생 취락.',economy:['EXPENSIVE_FOOD','CHEAP_EQUIPMENT'],specialties:['FUR','HUNTER'],inn:true,shops:[S('hunter','설원 사냥점','HUNTER','우르',undefined,['EXPERT']),S('clothing','모피 의상점','CLOTHING','하나'),S('food','설원 식량점','FOOD','도르'),S('general','눈길 잡화점','GENERAL_GOODS','모크')],extras:[{id:'inn',name:'큰화로 숙소',type:'INN',description:'커다란 공동 화로가 있는 숙소.',hours:ALWAYS}] },
  { id:'SKY_VILLAGE',group:'SKY_VILLAGE',name:'새 수인 부유 부락',tier:'VILLAGE',region:'SCROZE',description:'부유 대지에 자리 잡은 새 수인 중심 부락.',economy:['REMOTE_MARKET'],specialties:['SKY'],inn:true,shops:[S('general','깃털 잡화점','GENERAL_GOODS','피피'),S('specialty','부유섬 특산품점','SPECIALTY','로우'),S('food','하늘열매 가게','FOOD','미아')],extras:[{id:'inn',name:'구름둥지 숙소',type:'INN',description:'바람을 피할 수 있는 둥지형 숙소.',hours:ALWAYS}] },
  { id:'SKY_WEST_VILLAGE',group:'SKY_WEST_VILLAGE',name:'서풍 부유 부락',tier:'HAMLET',region:'SCROZE',description:'거센 서풍을 타는 작은 부유 부락.',economy:['REMOTE_MARKET'],specialties:['SKY'],inn:true,shops:[S('general','서풍 잡화점','GENERAL_GOODS','웨이'),S('junk','서풍 고물상','JUNK','구르',undefined,['ECCENTRIC'])],extras:[{id:'inn',name:'바람막이 쉼터',type:'INN',description:'최소한의 숙박 시설.',hours:ALWAYS}] },
  { id:'SKY_SOUTH_VILLAGE',group:'SKY_SOUTH_VILLAGE',name:'남운 부유 부락',tier:'VILLAGE',region:'SCROZE',description:'남쪽 구름길의 중계 부락.',economy:['REMOTE_MARKET'],specialties:['TRAVEL'],inn:true,shops:[S('adventurer','남운 보급소','ADVENTURER','아로'),S('wandering','구름길 떠돌이상','WANDERING','피크',undefined,['ECCENTRIC']),S('general','남운 잡화점','GENERAL_GOODS','레나')],extras:[{id:'inn',name:'남운 여관',type:'INN',description:'하늘길 여행자의 중간 숙소.',hours:ALWAYS}] },
  { id:'UG_VILLAGE_GRANDIA',group:'UG_VILLAGE_GRANDIA',name:'암석등 마을',tier:'VILLAGE',region:'GRANDIA',description:'그란디아 지하 동굴망의 생활 거점.',economy:['REMOTE_MARKET','CHEAP_MATERIAL'],specialties:['UNDERGROUND','ORE'],inn:true,shops:[S('general','암석등 잡화점','GENERAL_GOODS','코룸'),S('mineral','동굴 광물상','MINERAL','자크'),S('junk','암석 고물상','JUNK','베그',undefined,['ECCENTRIC'])],extras:[{id:'inn',name:'암석등 숙소',type:'INN',description:'광부들이 쓰는 지하 숙소.',hours:ALWAYS}] },
  { id:'UG_VILLAGE_FOREZIN',group:'UG_VILLAGE_FOREZIN',name:'뿌리샘 부락',tier:'VILLAGE',region:'FOREZIN',description:'거대한 뿌리 사이에 세워진 지하 부락.',economy:['CHEAP_MATERIAL'],specialties:['FUNGUS','HERB'],inn:true,shops:[S('herb','뿌리샘 약초상','HERBALIST','무이'),S('material','균사 재료상','MATERIAL','포라'),S('general','뿌리샘 잡화점','GENERAL_GOODS','네스')],extras:[{id:'inn',name:'뿌리방 숙소',type:'INN',description:'뿌리 공동을 개조한 숙소.',hours:ALWAYS}] },
  { id:'UG_VILLAGE_SEIRE',group:'UG_VILLAGE_SEIRE',name:'청해굴 마을',tier:'VILLAGE',region:'SEIRE',description:'지하 수맥 옆에 자리한 푸른 동굴 마을.',economy:['CHEAP_FOOD'],specialties:['AQUATIC','UNDERGROUND'],inn:true,shops:[S('food','청해굴 식료점','FOOD','미오'),S('alchemy','수맥 연금점','ALCHEMY','키르'),S('specialty','청해굴 특산품점','SPECIALTY','누아')],extras:[{id:'inn',name:'물빛 동굴숙소',type:'INN',description:'지하수맥 옆의 숙소.',hours:ALWAYS}] },
  { id:'UG_VILLAGE_SANTIMAC',group:'UG_VILLAGE_SANTIMAC',name:'석풍 마을',tier:'VILLAGE',region:'SANTIMAC',description:'건조한 지하풍이 부는 광물 마을.',economy:['CHEAP_MATERIAL'],specialties:['ORE'],inn:true,shops:[S('mineral','석풍 광물상','MINERAL','카심'),S('blacksmith','석풍 제련소','BLACKSMITH','라드',undefined,['EXPERT']),S('fence','굴길 장물상','FENCE','누크',undefined,['GREEDY'],NIGHT)],extras:[{id:'inn',name:'석풍 숙소',type:'INN',description:'두꺼운 돌벽의 지하 숙소.',hours:ALWAYS}] },
  { id:'UG_VILLAGE_PROSTI',group:'UG_VILLAGE_PROSTI',name:'빙등 취락',tier:'VILLAGE',region:'PROSTI',description:'얼음 결정의 빛으로 살아가는 지하 취락.',economy:['REMOTE_MARKET'],specialties:['CRYSTAL','COLD'],inn:true,shops:[S('jewel','빙등 보석상','JEWELER','이셀',undefined,['COLLECTOR']),S('magic','빙결 마법상점','MAGIC','브리',undefined,['EXPERT']),S('general','빙등 잡화점','GENERAL_GOODS','쿠오')],extras:[{id:'inn',name:'빙등 온실숙소',type:'INN',description:'지열을 이용한 따뜻한 숙소.',hours:ALWAYS}] },
];

function buildDefinition(spec: SettlementSpec): SettlementDefinition {
  const shopFacilities: SettlementFacilityDefinition[] = spec.shops.map((entry) => ({
    id: `${spec.id}:${entry.id}`,
    name: entry.label,
    type: 'SHOP',
    description: `${entry.merchant}이 운영하는 ${entry.label}.`,
    districtId: entry.district,
    openingHours: entry.hours || DAY,
    shop: {
      merchantId: `${spec.id.toLowerCase()}:${entry.id}`,
      merchantName: entry.merchant,
      shopType: entry.type,
      traits: entry.traits,
      priceModifier: entry.price,
      sellModifier: entry.sell,
      openingHours: entry.hours || DAY,
    },
  }));
  const extraFacilities: SettlementFacilityDefinition[] = (spec.extras || []).map((entry) => ({
    id: `${spec.id}:${entry.id}`,
    name: entry.name,
    type: entry.type,
    description: entry.description,
    districtId: entry.district,
    openingHours: entry.hours,
    serviceFlags: entry.serviceFlags,
  }));
  const facilities = [...shopFacilities, ...extraFacilities];
  const districtDefs: SettlementDistrictDefinition[] = (spec.districts || []).map((district) => ({
    ...district,
    facilityIds: facilities.filter((facility) => facility.districtId === district.id).map((facility) => facility.id),
  }));
  return {
    id: spec.id,
    worldStructureGroupId: spec.group,
    name: spec.name,
    description: spec.description,
    tier: spec.tier,
    regionId: spec.region,
    economyTags: spec.economy,
    specialtyTags: spec.specialties,
    districts: districtDefs,
    facilities,
    innRates: spec.inn ? DEFAULT_INN_RATES : undefined,
  };
}

export const SETTLEMENT_DEFINITIONS: Record<string, SettlementDefinition> = Object.fromEntries(
  SPECS.map((spec) => [spec.id, buildDefinition(spec)]),
);

export const SETTLEMENT_MERCHANT_DEFINITIONS: Record<string, MerchantDefinition> = Object.fromEntries(
  SPECS.flatMap((spec) => {
    const shopEntries = spec.shops.map((entry) => {
      const id = `${spec.id.toLowerCase()}:${entry.id}`;
      const placement: SettlementShopPlacement = {
        merchantId: id,
        merchantName: entry.merchant,
        shopType: entry.type,
        traits: entry.traits,
        priceModifier: entry.price,
        sellModifier: entry.sell,
        openingHours: entry.hours || DAY,
      };
      return [id, {
        id,
        name: placement.merchantName,
        shopType: placement.shopType,
        traits: placement.traits,
        priceModifier: placement.priceModifier,
        sellModifier: placement.sellModifier,
      } satisfies MerchantDefinition] as const;
    });

    // 4.0.4: MARKET 시설은 여러 노점을 한 상인회로 묶어 WANDERING 재고 엔진을 재사용한다.
    const marketEntries = (spec.extras || []).filter((entry) => entry.type === 'MARKET').map((entry) => {
      const id = `${spec.id.toLowerCase()}:market`;
      return [id, {
        id,
        name: `${spec.name} 시장 상인회`,
        shopType: 'WANDERING' as const,
        traits: ['GENEROUS','ECCENTRIC'] as MerchantTrait[],
        priceModifier: 0.94,
        sellModifier: 1.02,
        restockHours: 12,
        stockSizeModifier: 1.25,
        specialFlags: ['SETTLEMENT_MARKET'],
      } satisfies MerchantDefinition] as const;
    });
    return [...shopEntries, ...marketEntries];
  }),
);

export const SETTLEMENT_LIST = Object.values(SETTLEMENT_DEFINITIONS);
