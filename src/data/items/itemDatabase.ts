import { ItemDefinition } from '../../types';
import { MONSTER_LOOT_ITEM_DATABASE } from '../world/monsterLootItems';
import { LIFE_MATERIAL_ITEM_DATABASE, TRAVEL_TOOL_ITEM_DATABASE } from './lifeMaterialSystem';
import { POTION_DATABASE } from '../potions/potionDatabase';
import { DUNGEON_REWARD_ITEM_DATABASE } from './dungeonRewardItems';
import { TECHNOLOGY_MATERIAL_ITEM_DATABASE } from './technologyMaterialItems';

export const ITEM_DATABASE: Record<string, ItemDefinition> = {
  ...MONSTER_LOOT_ITEM_DATABASE,
  ...DUNGEON_REWARD_ITEM_DATABASE,
  ...TECHNOLOGY_MATERIAL_ITEM_DATABASE,
  ...LIFE_MATERIAL_ITEM_DATABASE,
  ...TRAVEL_TOOL_ITEM_DATABASE,
  sky_navigation_map: { id:'sky_navigation_map', name:'하늘 지도', category:'MAP', description:'스크로제 하늘층의 부유지와 알려진 항로를 기록한 지도.', usageHint:'하늘층 항법 도구 판정과 세계지도 탐색에 사용됩니다.', flavorText:'세 명의 항법 상인 중 지도 상인이 취급한다.', usable:false, consumedOnUse:false, uses:['SPECIAL'], weight:0.2, bulk:1, size:'SMALL', rarity:'RARE' },
  sky_navigation_compass: { id:'sky_navigation_compass', name:'하늘 나침반', category:'TOOL', description:'고도와 바람의 흔들림 속에서도 하늘 방위를 잡는 특수 나침반.', flavorText:'세 명의 항법 상인 중 나침반 상인이 취급한다.', usable:false, consumedOnUse:false, uses:['SPECIAL'], weight:0.3, bulk:1, size:'SMALL', rarity:'RARE' },
  sky_navigation_telescope: { id:'sky_navigation_telescope', name:'하늘 망원경', category:'TOOL', description:'구름 너머의 부유지와 항로 표식을 관측하는 망원경.', flavorText:'세 명의 항법 상인 중 망원경 상인이 취급한다.', usable:false, consumedOnUse:false, uses:['SPECIAL'], weight:0.8, bulk:2, size:'MEDIUM', rarity:'RARE' },
  celestial_navigation_map: { id:'celestial_navigation_map', name:'천공 지도', category:'MAP', description:'천공층의 에도와, 이동도시 아벨라와 주요 기류를 기록한 희귀 지도.', usageHint:'천공층 항법 도구 판정과 세계지도 탐색에 사용됩니다.', usable:false, consumedOnUse:false, uses:['SPECIAL'], weight:0.2, bulk:1, size:'SMALL', rarity:'EPIC' },
  celestial_navigation_compass: { id:'celestial_navigation_compass', name:'천공 나침반', category:'TOOL', description:'천공층의 변덕스러운 방향과 고도를 읽는 항법구.', usable:false, consumedOnUse:false, uses:['SPECIAL'], weight:0.3, bulk:1, size:'SMALL', rarity:'EPIC' },
  celestial_navigation_telescope: { id:'celestial_navigation_telescope', name:'천공 망원경', category:'TOOL', description:'천공의 구름과 폭풍 너머 이동하는 섬과 도시를 찾는 장거리 망원경.', usable:false, consumedOnUse:false, uses:['SPECIAL'], weight:0.9, bulk:2, size:'MEDIUM', rarity:'EPIC' },
  celestial_flight_permit: { id:'celestial_flight_permit', name:'구형 천공 비행 허가증', category:'KEY', description:'구 시스템의 천공 비행 허가증. 2.0부터 천공 이동의 핵심 수단은 플레이어가 직접 제작·운용하는 비행정이며, 이 허가증은 레거시/퀘스트 증표로만 남습니다.', usable:false, consumedOnUse:false, uses:['SPECIAL'], weight:0.01, bulk:0, size:'TINY', rarity:'EPIC' },

  // ==========================================
  // 1. 도구 및 특수 용도 아이템 (Tools & Adventure Gear)
  // ==========================================
  rope: {
    id: 'rope',
    name: '튼튼한 삼베 밧줄',
    category: 'TOOL',
    description: '질긴 삼베 섬유를 촘촘히 엮어 만든 긴 밧줄. 험준한 절벽을 오르내리거나 무거운 짐을 결속할 때 사용된다.',
    flavorText: '거친 마 섬유에서는 흙먼지와 바닷바람에 그을린 마른 풀 냄새가 밴 채 팽팽한 탄성을 유지하고 있다.',
    usable: true,
    consumedOnUse: false,
    uses: ['CLIMB_CLIFF', 'CRAFT', 'SPECIAL'],
    weight: 1.5,
    bulk: 2,
    size: 'MEDIUM',
    rarity: 'COMMON',
    toolEffect: {
      statBonus: { agility: 1 },
    },
    useEffect: {
      message: '밧줄을 단단히 고정하여 험한 지형을 극복할 수 있는 채비를 갖췄습니다.',
    },
  },
  shovel: {
    id: 'shovel',
    name: '야전 삽',
    category: 'TOOL',
    description: '단단하게 담금질된 강철 날과 단풍나무 자루로 이루어진 휴대용 삽. 매장된 궤짝이나 유적의 토사를 파헤치는 데 쓰인다.',
    flavorText: '쇠날 구석구석에 묻은 긁힌 자국들은 수많은 유적지의 자갈과 진흙을 헤집어 온 세월을 증명한다.',
    usable: true,
    consumedOnUse: false,
    uses: ['EXCAVATE', 'SPECIAL'],
    weight: 2.0,
    bulk: 3,
    size: 'MEDIUM',
    rarity: 'COMMON',
    toolEffect: {
      statBonus: { strength: 1 },
    },
    useEffect: {
      message: '삽으로 단단한 지면을 파헤쳐 묻힌 잔해와 흔적을 조사합니다.',
    },
  },
  torch: {
    id: 'torch',
    name: '기름 먹인 횃불',
    category: 'TOOL',
    description: '수지와 정제유를 듬뿍 적신 횃불. 칠흑 같은 동굴과 야간 행군 시 주변 시야를 밝히고 온기를 제공한다.',
    flavorText: '불을 당기면 짙은 타르 타는 내음과 함께 어둠을 찢는 주황빛 불꽃이 타닥거리며 피어오른다.',
    usable: true,
    consumedOnUse: true,
    uses: ['LIGHT_AREA', 'SPECIAL'],
    weight: 0.5,
    bulk: 1,
    size: 'SMALL',
    rarity: 'COMMON',
    useEffect: {
      hpDelta: 0,
      sanityDelta: 5,
      buffName: '횃불의 온기',
      message: '횃불에 불을 붙여 주변의 짙은 어둠을 몰아내고 온기를 얻었습니다.',
    },
  },
  lockpick_set: {
    id: 'lockpick_set',
    name: '도적의 만능 락픽 세트',
    category: 'TOOL',
    description: '정밀하게 연마된 고탄소강 핀과 텐션 렌치로 구성된 도구 세트. 복잡한 기계식 자물쇠의 내부 핀을 조작해 해제할 수 있다.',
    flavorText: '가죽 파우치 안에는 손가락 끝의 미세한 감각만으로 굳게 닫힌 빗장을 열어젖히던 뒷골목 기술자의 손때가 묻어 있다.',
    usable: true,
    consumedOnUse: false,
    uses: ['UNLOCK_LOCK', 'SPECIAL'],
    weight: 0.2,
    bulk: 1,
    size: 'TINY',
    rarity: 'UNCOMMON',
    toolEffect: {
      unlockBonus: 3,
    },
    useEffect: {
      message: '락픽 핀을 정렬하여 잠금장치의 핀을 조심스럽게 맞춥니다.',
    },
  },

  // ==========================================
  // 2. 열쇠 (Keys & Seals)
  // ==========================================
  rusty_iron_key: {
    id: 'rusty_iron_key',
    name: '녹슨 철제 열쇠',
    category: 'KEY',
    description: '오랜 세월 풍화되어 표면에 붉은 녹이 슨 투박한 철 열쇠. 오래된 감옥 문이나 지하 묘지의 빗장에 맞물린다.',
    flavorText: '손잡이 부분의 홈은 수없이 거친 손길을 거쳐 닳아 있으며 차가운 쇠비린내가 감돈다.',
    usable: true,
    consumedOnUse: true,
    uses: ['UNLOCK_LOCK'],
    weight: 0.1,
    bulk: 1,
    size: 'TINY',
    rarity: 'COMMON',
    keyForLockId: 'crypt_iron_gate',
    isReusableKey: false,
  },
  bandit_chest_key: {
    id: 'bandit_chest_key',
    name: '도적단의 황동 열쇠',
    category: 'KEY',
    description: '도적단 간부들이 전리품 상자를 잠그기 위해 제작한 두툼한 황동 열쇠. 은신처 깊숙한 곳의 보물 궤짝을 연다.',
    flavorText: '황동 표면에는 난잡한 숫자가 새겨져 있어 약탈품을 분배하던 도적들의 탐욕을 짐작게 한다.',
    usable: true,
    consumedOnUse: true,
    uses: ['UNLOCK_LOCK'],
    weight: 0.1,
    bulk: 1,
    size: 'TINY',
    rarity: 'UNCOMMON',
    keyForLockId: 'bandit_strongbox',
    isReusableKey: false,
  },
  arcane_tower_crystal_key: {
    id: 'arcane_tower_crystal_key',
    name: '마법탑의 공명 수정구',
    category: 'KEY',
    description: '내부에 마력 회로가 각인된 푸른색 마나 결정구. 봉인된 고탑의 마법 장벽과 공명하여 결계를 무력화한다.',
    flavorText: '손바닥 위에 올려놓으면 미세한 고주파 진동과 함께 피부를 간지럽히는 비전 에너지가 맥동한다.',
    usable: true,
    consumedOnUse: false,
    uses: ['UNLOCK_LOCK'],
    weight: 0.3,
    bulk: 1,
    size: 'SMALL',
    rarity: 'RARE',
    keyForLockId: 'arcane_tower_barrier',
    isReusableKey: true,
  },
  ancient_sanctuary_seal: {
    id: 'ancient_sanctuary_seal',
    name: '고대 성역의 은빛 인장',
    category: 'KEY',
    description: '사제단의 신성 문양이 정밀하게 주조된 은제 부적. 성역 심층부의 거대한 석조 문을 개방하는 열쇠로 기능한다.',
    flavorText: '수백 년의 세월이 흘렀음에도 은빛 표면에는 티끌 하나 묻지 않은 성결한 온기가 머물러 있다.',
    usable: true,
    consumedOnUse: false,
    uses: ['UNLOCK_LOCK'],
    weight: 0.2,
    bulk: 1,
    size: 'SMALL',
    rarity: 'EPIC',
    keyForLockId: 'sanctuary_deep_vault',
    isReusableKey: true,
  },

  // ==========================================
  // 3. 서적 및 기록물 (Books & Documents)
  // ==========================================
  tome_of_swordsmanship: {
    id: 'tome_of_swordsmanship',
    name: '기사단의 검술 교본',
    category: 'BOOK',
    description: '왕립 기사단의 정예 검사들이 익히던 기본자세와 보법, 연속 참격의 요결이 삽화와 함께 수록된 가죽 장정 서적.',
    flavorText: '양피지 모퉁이가 닳도록 넘겨진 흔적과 칼자루를 쥔 손잡이의 압력으로 패인 자국들이 남아 있다.',
    usable: true,
    consumedOnUse: false,
    uses: ['READ'],
    weight: 0.8,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
    bookKnowledge: {
      exp: 150,
      statBonus: { stat: 'strength', value: 1 },
      loreText: '칼끝의 무게중심과 발끝의 축을 일치시키는 고전 검술의 정수를 체득했습니다.',
    },
  },
  alchemist_notebook: {
    id: 'alchemist_notebook',
    name: '떠돌이 연금술사의 비망록',
    category: 'BOOK',
    description: '야생 약초의 추출법과 상급 마나 시약의 정제 비결이 깨알 같은 필체로 정리된 연구 수첩.',
    flavorText: '페이지 사이사이에 말린 약초 잎사귀와 다양한 시약에 얼룩진 화학 약품 냄새가 밴 채 보존되어 있다.',
    usable: true,
    consumedOnUse: false,
    uses: ['READ'],
    weight: 0.5,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
    bookKnowledge: {
      exp: 120,
      statBonus: { stat: 'intelligence', value: 1 },
      recipeUnlockId: 'potion_mana_greater',
      loreText: '약초의 즙을 끓일 때 은가루를 미량 첨가하여 마나 손실을 막는 비법을 깨달았습니다.',
    },
  },
  ancient_ruins_rubbing: {
    id: 'ancient_ruins_rubbing',
    name: '고대 비문의 탁본',
    category: 'DOCUMENT',
    description: '고대 유적 석벽에 음각된 상형문자와 별자리 마법진을 먹물로 정성스럽게 베껴낸 질긴 닥종이 탁본.',
    flavorText: '시간의 풍화를 견뎌낸 비문의 탁본에는 잊혀진 신화 시대의 단편적인 기록이 묵직하게 담겨 있다.',
    usable: true,
    consumedOnUse: false,
    uses: ['READ'],
    weight: 0.1,
    bulk: 1,
    size: 'TINY',
    rarity: 'RARE',
    bookKnowledge: {
      exp: 200,
      statBonus: { stat: 'spirit', value: 1 },
      loreText: '수천 년 전 대륙을 뒤흔들었던 파멸의 군세와 성소의 봉인 의식을 해독했습니다.',
    },
  },

  // ==========================================
  // 4. 선물 및 호감도 아이템 (Gifts & Valuables)
  // ==========================================
  rose_perfume: {
    id: 'rose_perfume',
    name: '매혹의 장미 향수',
    category: 'GIFT',
    description: '새벽녘에 채취한 붉은 장미 꽃잎을 증류하여 빚어낸 유리병 향수. 우아하고 관능적인 잔향을 남겨 호감을 사기에 좋다.',
    flavorText: '마개를 살짝 열기만 해도 방 안 가득 피어나는 생화의 달콤한 향기가 마음을 차분히 녹여준다.',
    usable: true,
    consumedOnUse: true,
    uses: ['GIFT', 'SPECIAL'],
    weight: 0.2,
    bulk: 1,
    size: 'TINY',
    rarity: 'UNCOMMON',
    giftValue: {
      preferredCharacters: ['sylvia_shadow_dancer', 'elena_swordmaster'],
      baseTrustGain: 20,
    },
    useEffect: {
      desireDelta: 10,
      lewdnessDelta: 1,
      message: '향수를 가볍게 뿌리자 관능적인 장미 향이 감돌며 마음이 들뜹니다.',
    },
  },
  dwarven_whiskey: {
    id: 'dwarven_whiskey',
    name: '드워프산 독주',
    category: 'GIFT',
    description: '드워프 양조 장인이 오크통에서 수십 년간 숙성시킨 독한 위스키. 강렬한 풍미와 높은 도수로 활력을 북돋운다.',
    flavorText: '목을 타고 넘어가는 순간 화염이 번지는 듯 강렬한 열기와 묵직한 맥아의 여운이 전신을 감싼다.',
    usable: true,
    consumedOnUse: true,
    uses: ['GIFT', 'HEAL'],
    weight: 1.0,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
    giftValue: {
      preferredCharacters: ['vargas_ironmonger'],
      baseTrustGain: 25,
    },
    useEffect: {
      hpDelta: 20,
      sanityDelta: 15,
      message: '독주 한 모금을 삼키자 뱃속이 뜨거워지며 활력이 솟구칩니다.',
    },
  },
  silver_locket: {
    id: 'silver_locket',
    name: '정교한 은빛 로켓 목걸이',
    category: 'VALUABLE',
    description: '열고 닫을 수 있는 세밀한 은제 로켓 펜던트. 초상화를 보관할 수 있는 홈이 파여 있으며 귀족 가문의 문양이 새겨져 있다.',
    flavorText: '경첩 부분은 부드럽게 맞물리며 은 표면에는 누군가를 향한 오랜 그리움이 서려 있는 듯하다.',
    usable: true,
    consumedOnUse: true,
    uses: ['GIFT'],
    weight: 0.1,
    bulk: 1,
    size: 'TINY',
    rarity: 'RARE',
    giftValue: {
      preferredCharacters: ['elena_swordmaster', 'kaelen_archmage'],
      baseTrustGain: 30,
    },
  },

  // ==========================================
  // 5. 소비형 포션 & 연금약 (Consumables)
  // ==========================================
  potion_small_health: {
    id: 'potion_small_health',
    name: '작은 회복약',
    category: 'CONSUMABLE',
    description: '붉은 약초 즙과 정제수를 배합하여 조제한 기본 회복 물약. 경미한 외상과 찰과상을 아물게 하여 체력을 35 회복한다.',
    flavorText: '씁쓸하면서도 달착지근한 약초의 맛이 혀끝을 자극하며 상처 부위의 통증을 서서히 가라앉힌다.',
    usable: true,
    consumedOnUse: true,
    uses: ['HEAL'],
    weight: 0.3,
    bulk: 1,
    size: 'SMALL',
    rarity: 'COMMON',
    useEffect: {
      hpDelta: 35,
      message: '회복약을 마시자 온몸의 상처가 아물며 체력이 35 회복되었습니다.',
    },
  },
  potion_lesser_health: {
    id: 'potion_lesser_health',
    name: '하급 회복약',
    category: 'CONSUMABLE',
    description: '야생 약초를 간이 증류하여 만든 초급 치유약. 가벼운 피로와 긁힌 상처를 치료하여 체력을 25 회복한다.',
    flavorText: '순수한 풀잎 냄새가 나며 급박한 모험길에서 가볍게 마시기 좋다.',
    usable: true,
    consumedOnUse: true,
    uses: ['HEAL'],
    weight: 0.25,
    bulk: 1,
    size: 'SMALL',
    rarity: 'COMMON',
    useEffect: {
      hpDelta: 25,
      message: '하급 회복약을 마셔 피로와 통증이 누그러졌습니다. (체력 +25)',
    },
  },
  potion_greater_health: {
    id: 'potion_greater_health',
    name: '상급 붉은 회복약',
    category: 'CONSUMABLE',
    description: '고농축 생명초와 마수의 정기를 추출해 증류한 붉은 영약. 깊은 자상과 타박상을 빠르게 치유하여 체력을 90 회복한다.',
    flavorText: '유리병 속 붉은 액체는 마치 살아있는 심장처럼 맑고 짙은 붉은빛을 발하며 체온을 따뜻하게 끌어올린다.',
    usable: true,
    consumedOnUse: true,
    uses: ['HEAL'],
    weight: 0.4,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
    useEffect: {
      hpDelta: 90,
      message: '상급 회복약의 온기가 전신으로 퍼지며 깊은 상처가 봉합되었습니다. (체력 +90)',
    },
  },
  potion_mana_draught: {
    id: 'potion_mana_draught',
    name: '맑은 정신의 마나 물약',
    category: 'CONSUMABLE',
    description: '청색 마나석 가루와 심신 안정 허브를 융합한 비약. 소진된 마나를 50 채우고 정신력을 20 회복시킨다.',
    flavorText: '목을 적시는 순간 머릿속이 박하향처럼 시원해지며 흩어졌던 마력의 집중력이 또렷해진다.',
    usable: true,
    consumedOnUse: true,
    uses: ['MANA_RESTORE', 'SANITY_RESTORE'],
    weight: 0.3,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
    useEffect: {
      mpDelta: 50,
      sanityDelta: 20,
      message: '마나 물약의 서늘한 기운이 뇌리에 퍼지며 마나와 정신력이 회복되었습니다.',
    },
  },
  potion_concentrated_mana: {
    id: 'potion_concentrated_mana',
    name: '농축 마나 물약',
    category: 'CONSUMABLE',
    description: '순수 마나 결정을 정밀하게 액화시킨 상급 마나 물약. 소진된 마나를 90 회복시킨다.',
    flavorText: '푸른 액체 내부에서 잔잔한 스파크가 튀며 주문 영창으로 메말랐던 마력 회로를 급속히 충전한다.',
    usable: true,
    consumedOnUse: true,
    uses: ['MANA_RESTORE'],
    weight: 0.35,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
    useEffect: {
      mpDelta: 90,
      message: '농축된 비전 마력이 혈관을 타고 번지며 마나가 90 회복되었습니다.',
    },
  },
  calm_herb_tea: {
    id: 'calm_herb_tea',
    name: '맑은 정신의 허브차',
    category: 'CONSUMABLE',
    description: '심신을 이완시키는 말린 약초와 마른 나뭇가지를 우려낸 온화한 차. 흐트러진 정신력을 30 안정시킨다.',
    flavorText: '찻잔에서 피어오르는 은은한 김을 들이마시면 거친 전장의 불안감이 한결 누그러진다.',
    usable: true,
    consumedOnUse: true,
    uses: ['SANITY_RESTORE'],
    weight: 0.2,
    bulk: 1,
    size: 'SMALL',
    rarity: 'COMMON',
    useEffect: {
      sanityDelta: 30,
      message: '따뜻한 허브차를 마시자 짙은 피로와 긴장이 가라앉았습니다. (정신력 +30)',
    },
  },
  holy_silver_water: {
    id: 'holy_silver_water',
    name: '성스러운 은빛 성수',
    category: 'CONSUMABLE',
    description: '순은 주괴와 축복받은 아침 이슬을 신성 의식으로 결합한 성수. 부정한 기운을 정화하고 체력과 정신력을 동시에 보존한다.',
    flavorText: '성스러운 유리병 속 은빛 물결은 어둠 속에서도 은은한 달빛처럼 맑게 흔들린다.',
    usable: true,
    consumedOnUse: true,
    uses: ['HEAL', 'SANITY_RESTORE'],
    weight: 0.3,
    bulk: 1,
    size: 'SMALL',
    rarity: 'RARE',
    useEffect: {
      hpDelta: 60,
      sanityDelta: 40,
      message: '은빛 성수가 온몸에 성결한 빛을 퍼뜨려 상처와 불안을 씻어냈습니다.',
    },
  },
  obsidian_elixir: {
    id: 'obsidian_elixir',
    name: '흑요석 활력제',
    category: 'CONSUMABLE',
    description: '농축된 고기 육즙과 강장 식물 뿌리를 뭉근히 달여낸 활력 드링크. 체력을 40 회복하고 최대 근육 반응을 끌어올린다.',
    flavorText: '걸쭉하고 진한 흑갈색 액체가 혈관을 타고 흐르며 지친 근육에 폭발적인 활력을 불어넣는다.',
    usable: true,
    consumedOnUse: true,
    uses: ['HEAL'],
    weight: 0.4,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
    useEffect: {
      hpDelta: 40,
      sanityDelta: 10,
      message: '흑요석 활력제를 마시자 전신에 굵은 맥박과 함께 활기가 솟구쳤습니다.',
    },
  },
  miracle_elixir: {
    id: 'miracle_elixir',
    name: '기적의 엘릭서',
    category: 'CONSUMABLE',
    description: '연금술의 궁극에 달한 만병통치약. 체력, 마나, 정신력을 모두 최대로 회복시킨다.',
    flavorText: '황금빛으로 요동치는 액체는 마시는 이의 모든 고통과 쇠약을 흔적도 없이 씻어낸다.',
    usable: true,
    consumedOnUse: true,
    uses: ['HEAL', 'MANA_RESTORE', 'SANITY_RESTORE'],
    weight: 0.5,
    bulk: 1,
    size: 'SMALL',
    rarity: 'LEGENDARY',
    useEffect: {
      hpDelta: 9999,
      mpDelta: 9999,
      sanityDelta: 9999,
      message: '엘릭서의 기적적인 광채가 온몸을 감싸며 모든 활력과 마나가 완벽하게 회복되었습니다!',
    },
  },

  // ==========================================
  // 6. 기본 채집/제작 재료 (Materials)
  // ==========================================
  wood_branch: {
    id: 'wood_branch',
    name: '나뭇가지',
    category: 'MATERIAL',
    description: '숲이나 수풀에서 주워 모은 마른 나뭇가지. 야영지 모닥불의 땔감이나 간이 부목, 초급 도구의 뼈대로 쓰인다.',
    flavorText: '바짝 말라 있어 불씨를 갖다 대면 쉽게 타오르며 손으로 쪼개기 수월하다.',
    usable: false,
    weight: 0.5,
    bulk: 1,
    size: 'SMALL',
    rarity: 'COMMON',
  },
  wood_timber: {
    id: 'wood_timber',
    name: '목재',
    category: 'MATERIAL',
    description: '단단한 통나무를 대패질하여 다듬은 건축 및 제작용 각재. 가구, 방패 손잡이, 활대 등의 기초 재료로 활용된다.',
    flavorText: '단단한 나이테가 촘촘히 박혀 있어 뒤틀림이 적고 목공 장인의 손길을 거치기 알맞다.',
    usable: false,
    weight: 1.5,
    bulk: 2,
    size: 'MEDIUM',
    rarity: 'COMMON',
  },
  stone_rock: {
    id: 'stone_rock',
    name: '돌',
    category: 'MATERIAL',
    description: '모난 곳 없이 묵직하고 단단한 자연석. 모닥불 화덕을 쌓거나 간단한 석기 및 망치의 머리로 사용된다.',
    flavorText: '지하 깊은 암반에서 굴러 나온 잿빛 돌멩이로 표면이 거칠고 단단하다.',
    usable: false,
    weight: 1.0,
    bulk: 1,
    size: 'SMALL',
    rarity: 'COMMON',
  },
  iron_ore: {
    id: 'iron_ore',
    name: '철광석',
    category: 'MATERIAL',
    description: '철 성분이 풍부하게 함유된 무거운 흑회색 원석. 제련로에서 녹여 강철 무기와 방어구 주괴를 만든다.',
    flavorText: '암석 표면에 붉고 짙은 쇳빛 줄기가 박혀 있어 두드릴 때 둔탁하고 묵직한 쇠소리가 난다.',
    usable: false,
    weight: 2.0,
    bulk: 2,
    size: 'MEDIUM',
    rarity: 'COMMON',
  },
  silver_ingot: {
    id: 'silver_ingot',
    name: '순은 주괴',
    category: 'MATERIAL',
    description: '불순물을 완전히 제거하고 직사각형으로 굳혀낸 고순도 은괴. 정밀 장신구 세공과 대마법 무구 제작에 필수적이다.',
    flavorText: '빛을 받으면 우아하고 차가운 백은의 광택을 뿜어내며 주조 장인의 직인이 선명히 박혀 있다.',
    usable: false,
    weight: 1.2,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
  },
  thread: {
    id: 'thread',
    name: '실',
    category: 'MATERIAL',
    description: '식물 섬유와 동물 털을 곱게 꼬아 만든 질긴 실타래. 천 옷과 가죽 장비의 봉제 및 상처 봉합에 쓰인다.',
    flavorText: '얇지만 쉽게 끊어지지 않도록 왁스 코팅이 되어 있어 팽팽한 매듭을 짓기에 적합하다.',
    usable: false,
    weight: 0.1,
    bulk: 1,
    size: 'TINY',
    rarity: 'COMMON',
  },
  clear_dew: {
    id: 'clear_dew',
    name: '맑은 이슬',
    category: 'MATERIAL',
    description: '새벽녘 청정한 숲의 잎사귀에서 채취한 순수한 아침 이슬. 연금술 조제 시 시약의 순도를 높이는 용매로 쓰인다.',
    flavorText: '유리병 속 이슬방울은 티끌 하나 없이 투명하여 햇빛을 영롱하게 굴절시킨다.',
    usable: false,
    weight: 0.1,
    bulk: 1,
    size: 'TINY',
    rarity: 'COMMON',
  },
  fresh_meat: {
    id: 'fresh_meat',
    name: '신선한 고기',
    category: 'MATERIAL',
    description: '사냥한 야생동물에게서 얻은 단백질이 풍부한 생육. 야영지 조리대에서 요리하거나 보존식으로 가공된다.',
    flavorText: '육질이 탄력 있고 선홍빛을 띠고 있어 구워내면 구수한 풍미를 풍긴다.',
    usable: false,
    weight: 0.8,
    bulk: 1,
    size: 'SMALL',
    rarity: 'COMMON',
  },
  plant_root: {
    id: 'plant_root',
    name: '식물 뿌리',
    category: 'MATERIAL',
    description: '땅속 깊은 영양분을 빨아들여 자란 굵은 약용 뿌리. 강장제 제조 및 요리의 깊은 맛을 내는 식재료로 사용된다.',
    flavorText: '흙내음이 짙게 배어 있으며 껍질 안쪽은 단단하고 쌉싸름한 즙을 머금고 있다.',
    usable: false,
    weight: 0.3,
    bulk: 1,
    size: 'TINY',
    rarity: 'COMMON',
  },
  abyss_essence: {
    id: 'abyss_essence',
    name: '심연의 정수',
    category: 'MATERIAL',
    description: '심연의 틈새에서 스며 나온 농축된 암흑 마력의 결정체. 최고급 마도구와 그림자 장비의 핵심 촉매다.',
    flavorText: '빛조차 삼켜버릴 듯 칠흑 같은 암흑이 내부에서 소용돌이치며 주변 공기를 차갑게 얼어붙게 만든다.',
    usable: false,
    weight: 0.5,
    bulk: 1,
    size: 'SMALL',
    rarity: 'RARE',
  },
  wild_herb: {
    id: 'wild_herb',
    name: '약초',
    category: 'MATERIAL',
    description: '들판과 숲 그늘에서 자생하는 푸른 약초 잎. 으깨어 상처에 덧대거나 끓여서 생약으로 섭취할 수 있다.',
    flavorText: '쌉싸름하고 풋풋한 향이 코끝을 스치며 미약한 생명력의 온기가 손끝에 전해진다.',
    usable: true,
    consumedOnUse: true,
    uses: ['HEAL'],
    weight: 0.1,
    bulk: 1,
    size: 'TINY',
    rarity: 'COMMON',
    useEffect: {
      hpDelta: 15,
      message: '약초를 씹어 즙을 삼키자 미열과 피로가 약간 가라앉았습니다. (체력 +15)',
    },
  },
  wolf_pelt: {
    id: 'wolf_pelt',
    name: '질긴 늑대 가죽',
    category: 'MATERIAL',
    description: '혹한의 숲을 누비던 늑대에게서 벗겨낸 두꺼운 모피. 무두질을 거쳐 가죽 갑옷, 방한 덧옷, 배낭의 원단으로 가공된다.',
    flavorText: '거친 털 사이에는 야생의 비바람과 마른 흙냄새가 희미하게 남아 있어 뛰어난 보온성을 자랑한다.',
    usable: false,
    weight: 1.5,
    bulk: 2,
    size: 'MEDIUM',
    rarity: 'COMMON',
  },
  mana_crystal_shard: {
    id: 'mana_crystal_shard',
    name: '빛나는 마나석 파편',
    category: 'MATERIAL',
    description: '지맥의 마력이 응축되어 결정화된 푸른빛 광석 조각. 마법 장비 강화나 비전 스크롤 제작에 활용된다.',
    flavorText: '어두운 곳에서 푸르스름한 형광을 뿜어내며 가까이 다가가면 털끝이 곤두서는 전기적 자극이 느껴진다.',
    usable: false,
    weight: 0.5,
    bulk: 1,
    size: 'SMALL',
    rarity: 'UNCOMMON',
  },
};

function potionToItemDefinition(potion: (typeof POTION_DATABASE)[string]): ItemDefinition {
  const effect = potion.gameplayEffect || {};
  const uses: ItemDefinition['uses'] = [];
  if ((effect.hpDelta || 0) > 0 || (effect.hpPercent || 0) > 0 || effect.resurrectRatio) uses.push('HEAL');
  if ((effect.mpDelta || 0) > 0) uses.push('MANA_RESTORE');
  if ((effect.sanityDelta || 0) > 0) uses.push('SANITY_RESTORE');
  if (effect.statBonus || effect.cleanseDebuffs || effect.detoxPoison || effect.cureDisease || effect.healBleeding || effect.durationMinutes || effect.durationTurns) uses.push('BUFF');
  return {
    id: potion.id,
    name: potion.name,
    category: 'CONSUMABLE',
    description: potion.description,
    flavorText: potion.drinkingPresentation,
    usable: true,
    consumedOnUse: true,
    uses: uses.length ? Array.from(new Set(uses)) : ['SPECIAL'],
    rarity: potion.rarity,
    usageHint: `사용처: ${potion.categoryLabel} · ${potion.usableContext === 'COMBAT_ONLY' ? '전투 중 사용' : potion.usableContext === 'NON_COMBAT_ONLY' ? '비전투 중 사용' : '전투/비전투 사용'}${potion.restrictions ? ` · ${potion.restrictions}` : ''}`,
    useEffect: {
      hpDelta: effect.hpDelta,
      mpDelta: effect.mpDelta,
      sanityDelta: effect.sanityDelta,
      buffName: effect.buffName,
      message: potion.effectLogText,
    },
  };
}

function getPotionDefinitionAsItem(itemIdOrName: string): ItemDefinition | undefined {
  const direct = POTION_DATABASE[itemIdOrName];
  if (direct) return potionToItemDefinition(direct);
  const lowered = itemIdOrName.trim().toLowerCase();
  const byName = Object.values(POTION_DATABASE).find((potion) => potion.name.trim().toLowerCase() === lowered);
  return byName ? potionToItemDefinition(byName) : undefined;
}

/**
 * itemId 또는 아이템 이름으로 ItemDefinition을 안전하게 조회합니다.
 */
export function getItemDefinition(itemIdOrName?: string): ItemDefinition | undefined {
  if (!itemIdOrName) return undefined;
  const cleanKey = itemIdOrName.trim();

  // 연금술 포션/비약은 별도 DB를 사용하지만 인벤토리/UI에서는 일반 ItemDefinition처럼 조회한다.
  const potionItem = getPotionDefinitionAsItem(cleanKey);
  if (potionItem) return potionItem;

  // 1. ID 직접 일치
  if (ITEM_DATABASE[cleanKey]) {
    return ITEM_DATABASE[cleanKey];
  }

  // 2. 이름 일치
  const byName = Object.values(ITEM_DATABASE).find(
    (item) => item.name.trim() === cleanKey || item.name.trim().toLowerCase() === cleanKey.toLowerCase()
  );
  if (byName) return byName;

  // 3. 부분 이름 일치 (예: '밧줄' -> '튼튼한 삼베 밧줄')
  const partial = Object.values(ITEM_DATABASE).find((item) =>
    item.name.includes(cleanKey) || cleanKey.includes(item.name)
  );
  return partial;
}

/**
 * 인벤토리 아이템을 ItemDefinition과 매핑하여 풍부한 메타데이터를 보강합니다.
 */
export interface InferredItemMetadata {
  category: ItemDefinition['category'];
  description: string;
  usageHint: string;
  usable: boolean;
}

/**
 * Gemini/퀘스트 보상으로 동적으로 생성된 아이템도 UI에서 정체와 용도를 잃지 않게 하는 공통 추론기.
 * 정식 ItemDefinition이 있으면 언제나 그 정의가 우선한다.
 */
export function inferItemMetadata(itemIdOrName?: string, explicitDescription?: string): InferredItemMetadata {
  const raw = String(itemIdOrName || '').trim();
  const name = raw.toLowerCase();
  const def = getItemDefinition(raw);
  if (def) {
    return {
      category: def.category,
      description: explicitDescription || def.description || `${def.name}에 관한 물품입니다.`,
      usageHint: def.usageHint || inferUsageHint(def.name, def.category, def.uses),
      usable: def.usable,
    };
  }

  let category: ItemDefinition['category'] = 'MISC';
  if (/퀘스트|의뢰서|단서|증표|징표|문장|계약서|허가증|임무/.test(raw)) category = 'QUEST';
  else if (/보물지도|지도|해도|항로도/.test(raw)) category = 'MAP';
  else if (/열쇠|인장|패스|통행증|허가증/.test(raw)) category = 'KEY';
  else if (/책|서적|일지|고서|마도서|비전서|문서|양피지/.test(raw)) category = 'DOCUMENT';
  else if (/약|포션|영약|엘릭서|허브차|성수|음식|빵|고기/.test(raw)) category = 'CONSUMABLE';
  else if (/밧줄|삽|횃불|곡괭이|낚싯대|나침반|망원경|도구/.test(raw)) category = 'TOOL';
  else if (/광석|주괴|원석|가죽|목재|약초|뼈|결정|파편|정수|재료/.test(raw)) category = 'MATERIAL';
  else if (/검|도끼|창|방패|갑옷|투구|신발|장갑|망토|반지|목걸이|지팡이|활/.test(raw)) category = 'EQUIPMENT';
  else if (/보석|유물|골동품|귀중품|은장도/.test(raw)) category = 'VALUABLE';

  const label: Record<ItemDefinition['category'], string> = {
    CONSUMABLE:'소모품', MATERIAL:'제작/채집 재료', EQUIPMENT:'장비', KEY:'잠금·통행용 중요 물품', QUEST:'퀘스트 중요 물품', MAP:'탐험 지도', TOOL:'탐험 도구', BOOK:'서적', DOCUMENT:'문서/기록', GIFT:'선물', VALUABLE:'귀중품', MISC:'모험 물품'
  };
  const desc = explicitDescription?.trim() || `${raw || '이 물품'}은(는) 모험 중 획득한 ${label[category]}입니다. 세부 용도는 아래 사용처 안내를 따릅니다.`;
  const inferredUsable = ['CONSUMABLE', 'MAP', 'TOOL', 'BOOK', 'DOCUMENT', 'GIFT'].includes(String(category));
  return { category, description: desc, usageHint: inferUsageHint(raw, category), usable: inferredUsable };
}

export function inferUsageHint(name: string, category: ItemDefinition['category'], uses?: ItemDefinition['uses']): string {
  if (uses?.length) {
    const useLabels: Record<string,string> = { HEAL:'체력 회복', MANA_RESTORE:'마나 회복', SANITY_RESTORE:'정신력 회복', CLIMB_CLIFF:'절벽/험지 이동', EXCAVATE:'발굴', LIGHT_AREA:'어두운 지역 탐색', READ:'읽기', GIFT:'주요 인물에게 선물', UNLOCK_LOCK:'잠금 해제', BUFF:'일시 효과', CRAFT:'제작', SPECIAL:'특수 인카운터/탐험' };
    return `사용처: ${uses.map(u=>useLabels[u] || u).join(' · ')}`;
  }
  switch (category) {
    case 'QUEST': return '사용처: 관련 퀘스트의 조건·제출·진행 판정에 사용됩니다. 함부로 버리지 않는 것이 좋습니다.';
    case 'MAP': return '사용처: 읽으면 현재 주변의 세계지도 탐색 정보를 넓히며, 보물/항로 관련 인카운터의 단서로 사용됩니다.';
    case 'KEY': return '사용처: 대응하는 문·상자·봉인·통행 조건의 잠금 해제에 사용됩니다.';
    case 'MATERIAL': return '사용처: 제작, 강화, 생활 직업 또는 관련 의뢰 재료로 사용됩니다.';
    case 'EQUIPMENT': return '사용처: 장비 또는 가방 슬롯에 장착하여 능력/적재 효과를 적용합니다.';
    case 'CONSUMABLE': return '사용처: 인벤토리에서 사용하여 회복·버프 등 해당 아이템 효과를 발동합니다.';
    case 'TOOL': return '사용처: 탐험·채집·이동·특수 인카운터의 도구 판정에 사용됩니다.';
    case 'BOOK': case 'DOCUMENT': return '사용처: 읽어서 지식·단서·퀘스트 진행 정보를 확인하는 데 사용됩니다.';
    case 'GIFT': return '사용처: 만난 주요 인물에게 선물하여 관계 변화에 활용할 수 있습니다.';
    case 'VALUABLE': return '사용처: 판매, 거래 또는 특정 의뢰/수집 조건에 활용할 수 있는 귀중품입니다.';
    default: return `사용처: ${name || '이 물품'}과 관련된 인카운터·거래·퀘스트에서 소지 여부가 참조됩니다.`;
  }
}

export function enrichInventoryItem(item: {
  name: string; quantity: number; id?: string; description?: string; flavorText?: string; illustrationUrl?: string; equipmentId?: string; bagId?: string;
}): {
  id: string; name: string; quantity: number; category: ItemDefinition['category']; description: string; usageHint: string; flavorText?: string; illustrationUrl?: string; usable: boolean; itemDef?: ItemDefinition;
} {
  const def = getItemDefinition(item.id || item.name);
  const inferred = inferItemMetadata(item.id || item.name, item.description);
  return {
    id: def ? def.id : item.id || item.name,
    name: item.name,
    quantity: item.quantity,
    category: def?.category || inferred.category,
    description: item.description || def?.description || inferred.description,
    usageHint: def?.usageHint || inferred.usageHint,
    flavorText: item.flavorText || def?.flavorText,
    illustrationUrl: item.illustrationUrl || def?.illustrationUrl,
    usable: def?.usable ?? inferred.usable,
    itemDef: def,
  };
}
