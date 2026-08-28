import { ProfessionDefinition, ProfessionType, RecipeDefinition } from './professionTypes';
import { LIFE_RECIPE_DATABASE } from './lifeRecipeExpansion';

const BASE_RECIPE_DATABASE: Record<string, RecipeDefinition> = {
  // ==========================================
  // 대장장이 (BLACKSMITH) 레시피
  // ==========================================
  craft_iron_sword: {
    id: 'craft_iron_sword',
    name: '수련생의 강철검 제련',
    professionId: 'BLACKSMITH',
    requiredLevel: 1,
    tier: 1, grade: 'NORMAL', craftingCategory: 'WEAPON',
    requiredFacilityId: 'anvil',
    description: '철광석을 두드려 단단한 강철 도신을 가진 장검을 제작합니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '철광석', quantity: 3 },
      { itemName: '목재', quantity: 1 },
    ],
    output: {
      itemName: '수련생의 강철검',
      baseQuantity: 1,
      equipmentId: 'apprentice_sword',
    },
    expReward: 35,
    baseSuccessRate: 95,
  },

  craft_iron_shield: {
    id: 'craft_iron_shield',
    name: '철제 원형 방패 제작',
    professionId: 'BLACKSMITH',
    requiredLevel: 1,
    requiredFacilityId: 'anvil',
    description: '무쇠판을 둥글게 가공하고 가죽 손잡이를 달아 방패를 완성합니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '철광석', quantity: 4 },
      { itemName: '질긴 늑대 가죽', quantity: 1 },
    ],
    output: {
      itemName: '기사의 철제 원형 방패',
      baseQuantity: 1,
      equipmentId: 'knight_iron_shield',
    },
    expReward: 40,
    baseSuccessRate: 90,
  },

  craft_heavy_plate: {
    id: 'craft_heavy_plate',
    name: '강철 판금 흉갑 벼림',
    professionId: 'BLACKSMITH',
    requiredLevel: 3,
    tier: 2, grade: 'NORMAL', craftingCategory: 'ARMOR',
    professionRequirements: [{ professionId: 'BLACKSMITH', minimumLevel: 3 }, { professionId: 'LEATHERWORKER', minimumLevel: 2 }],
    requiredFacilityId: 'anvil',
    description: '단조한 강철 판을 겹쳐 충격을 흡수하는 중갑 흉갑을 만듭니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '순은 주괴', quantity: 1 },
      { itemName: '철광석', quantity: 6 },
      { itemName: '질긴 늑대 가죽', quantity: 2 },
    ],
    output: {
      itemName: '강철 판금 흉갑',
      baseQuantity: 1,
      equipmentId: 'heavy_plate_cuirass',
    },
    expReward: 80,
    baseSuccessRate: 85,
  },

  // ==========================================
  // 가죽 세공인 (LEATHERWORKER) 레시피
  // ==========================================
  craft_leather_vest: {
    id: 'craft_leather_vest',
    name: '정찰병의 가죽 조끼 가공',
    professionId: 'LEATHERWORKER',
    requiredLevel: 1,
    tier: 1, grade: 'NORMAL', craftingCategory: 'ARMOR',
    requiredFacilityId: 'leather_bench',
    description: '야생 마수의 질긴 가죽을 덧대어 가볍고 튼튼한 조끼를 제작합니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '질긴 늑대 가죽', quantity: 3 },
      { itemName: '실', quantity: 2 },
    ],
    output: {
      itemName: '정찰병의 질긴 가죽 조끼',
      baseQuantity: 1,
      equipmentId: 'scout_leather_vest',
    },
    expReward: 35,
    baseSuccessRate: 95,
  },

  craft_leather_boots: {
    id: 'craft_leather_boots',
    name: '신속의 가죽 장화 제작',
    professionId: 'LEATHERWORKER',
    requiredLevel: 1,
    requiredFacilityId: 'leather_bench',
    description: '발목을 편안하게 감싸며 민첩한 움직임을 보장하는 장화를 만듭니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '질긴 늑대 가죽', quantity: 2 },
      { itemName: '실', quantity: 1 },
    ],
    output: {
      itemName: '신속의 가죽 장화',
      baseQuantity: 1,
      equipmentId: 'swift_leather_boots',
    },
    expReward: 30,
    baseSuccessRate: 95,
  },

  // ==========================================
  // 연금술사 (ALCHEMIST) 레시피
  // ==========================================
  craft_healing_potion: {
    id: 'craft_healing_potion',
    name: '하급 회복약 연금 조제',
    professionId: 'ALCHEMIST',
    requiredLevel: 1,
    tier: 1, grade: 'NORMAL', craftingCategory: 'POTION',
    requiredFacilityId: 'alchemy_bench',
    description: '생명초와 맑은 물을 증류하여 상처를 빠르게 아물게 하는 물약을 조제합니다.',
    category: 'CONSUMABLE',
    ingredients: [
      { itemName: '약초', quantity: 2 },
      { itemName: '맑은 이슬', quantity: 1 },
    ],
    output: {
      itemName: '하급 회복약',
      baseQuantity: 2,
    },
    expReward: 25,
    baseSuccessRate: 95,
  },

  craft_mana_potion: {
    id: 'craft_mana_potion',
    name: '농축 마나 물약 추출',
    professionId: 'ALCHEMIST',
    requiredLevel: 2,
    requiredFacilityId: 'alchemy_bench',
    description: '마나석 파편의 순수한 정수를 정제하여 고갈된 마력을 채우는 영약을 만듭니다.',
    category: 'CONSUMABLE',
    ingredients: [
      { itemName: '빛나는 마나석 파편', quantity: 1 },
      { itemName: '맑은 이슬', quantity: 2 },
    ],
    output: {
      itemName: '농축 마나 물약',
      baseQuantity: 2,
    },
    expReward: 40,
    baseSuccessRate: 90,
  },

  craft_holy_water: {
    id: 'craft_holy_water',
    name: '성스러운 은빛 성수 축성',
    professionId: 'ALCHEMIST',
    requiredLevel: 3,
    requiredFacilityId: 'alchemy_bench',
    description: '순은 주괴의 가루와 성유를 융합해 혼탁한 정신력을 씻어내는 성수를 제조합니다.',
    category: 'CONSUMABLE',
    ingredients: [
      { itemName: '순은 주괴', quantity: 1 },
      { itemName: '맑은 이슬', quantity: 2 },
    ],
    output: {
      itemName: '성스러운 은빛 성수',
      baseQuantity: 1,
    },
    expReward: 60,
    baseSuccessRate: 85,
  },

  // ==========================================
  // 요리사 (COOK) 레시피
  // ==========================================
  craft_herb_tea: {
    id: 'craft_herb_tea',
    name: '맑은 정신의 허브차 달이기',
    professionId: 'COOK',
    requiredLevel: 1,
    requiredFacilityId: 'cook_stove',
    description: '피로를 풀어주고 정신력을 맑게 진정시키는 향긋한 따뜻한 차를 우려냅니다.',
    category: 'CONSUMABLE',
    ingredients: [
      { itemName: '약초', quantity: 2 },
      { itemName: '나뭇가지', quantity: 1 },
    ],
    output: {
      itemName: '맑은 정신의 허브차',
      baseQuantity: 2,
    },
    expReward: 20,
    baseSuccessRate: 100,
  },

  craft_hearty_stew: {
    id: 'craft_hearty_stew',
    name: '모닥불 야영 고기 스튜',
    professionId: 'COOK',
    requiredLevel: 2,
    requiredFacilityId: 'cook_stove',
    description: '야생 고기와 뿌리 채소를 푹 끓여내어 체력과 활력을 크게 복원시키는 스튜입니다.',
    category: 'CONSUMABLE',
    ingredients: [
      { itemName: '신선한 고기', quantity: 2 },
      { itemName: '식물 뿌리', quantity: 2 },
      { itemName: '나뭇가지', quantity: 2 },
    ],
    output: {
      itemName: '흑요석 활력제',
      baseQuantity: 1,
    },
    expReward: 35,
    baseSuccessRate: 95,
  },

  // ==========================================
  // 목수 (CARPENTER) 레시피
  // ==========================================
  craft_hunting_bow: {
    id: 'craft_hunting_bow',
    name: '은빛 사냥용 단궁 목공',
    professionId: 'CARPENTER',
    requiredLevel: 1,
    requiredFacilityId: 'wood_bench',
    description: '탄성 있는 물푸레나무를 정교하게 깎아 사냥용 활을 깎아냅니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '목재', quantity: 3 },
      { itemName: '실', quantity: 2 },
    ],
    output: {
      itemName: '은빛 사냥용 단궁',
      baseQuantity: 1,
      equipmentId: 'silver_hunting_bow',
    },
    expReward: 35,
    baseSuccessRate: 95,
  },

  craft_oak_staff: {
    id: 'craft_oak_staff',
    name: '견습 마법사의 참나무 지팡이',
    professionId: 'CARPENTER',
    requiredLevel: 1,
    requiredFacilityId: 'wood_bench',
    description: '단단한 참나무를 다듬고 마나석 조각을 결합하여 마법 지팡이를 완성합니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '목재', quantity: 3 },
      { itemName: '빛나는 마나석 파편', quantity: 1 },
    ],
    output: {
      itemName: '견습 마법사의 참나무 지팡이',
      baseQuantity: 1,
      equipmentId: 'apprentice_oak_staff',
    },
    expReward: 40,
    baseSuccessRate: 90,
  },

  // ==========================================
  // 재봉사 (TAILOR) 레시피
  // ==========================================
  craft_mystic_robe: {
    id: 'craft_mystic_robe',
    name: '비전 마법사의 신비 로브 봉제',
    professionId: 'TAILOR',
    requiredLevel: 2,
    requiredFacilityId: 'tailor_bench',
    description: '마력 실을 촘촘히 엮어 마법 방어와 정신 집중을 돕는 로브를 짓습니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '실', quantity: 4 },
      { itemName: '빛나는 마나석 파편', quantity: 1 },
    ],
    output: {
      itemName: '비전 마법사의 신비 로브',
      baseQuantity: 1,
      equipmentId: 'mage_mystic_robe',
    },
    expReward: 45,
    baseSuccessRate: 90,
  },

  craft_shadow_cloak: {
    id: 'craft_shadow_cloak',
    name: '그림자 무희의 신기루 망토',
    professionId: 'TAILOR',
    requiredLevel: 4,
    requiredFacilityId: 'tailor_bench',
    description: '심연의 정수와 은사를 교차 직조하여 착용자의 형체를 흐리는 망토를 만듭니다.',
    category: 'EQUIPMENT',
    ingredients: [
      { itemName: '심연의 정수', quantity: 1 },
      { itemName: '실', quantity: 6 },
      { itemName: '순은 주괴', quantity: 1 },
    ],
    output: {
      itemName: '그림자 무희의 신기루 망토',
      baseQuantity: 1,
      equipmentId: 'cloak_of_shadow_dancer',
    },
    expReward: 100,
    baseSuccessRate: 80,
  },
};

export const RECIPE_DATABASE: Record<string, RecipeDefinition> = { ...BASE_RECIPE_DATABASE, ...LIFE_RECIPE_DATABASE };

export const PROFESSIONS_DATABASE: Record<ProfessionType, ProfessionDefinition> = {
  BLACKSMITH: {
    id: 'BLACKSMITH',
    name: '대장장이',
    role: '금속 무기, 방패, 중갑 판금 제작 및 수리',
    description: '풀무불과 모루 위에서 강철을 두드려 전사들의 검과 흉갑, 방패를 벼려내는 장인입니다.',
    iconSymbol: '🔨',
    associatedFacility: 'anvil',
    primaryStatBonus: '근력, 체력',
    recipes: [
      RECIPE_DATABASE['craft_iron_sword'],
      RECIPE_DATABASE['craft_iron_shield'],
      RECIPE_DATABASE['craft_heavy_plate'],
    ],
  },

  LEATHERWORKER: {
    id: 'LEATHERWORKER',
    name: '가죽 세공인',
    role: '경갑, 가죽 장화, 암살자 복식 가공',
    description: '야생 마수와 맹수의 가죽을 무두질하여 민첩한 도적과 궁수를 위한 질긴 경갑을 제작합니다.',
    iconSymbol: '👞',
    associatedFacility: 'leather_bench',
    primaryStatBonus: '민첩',
    recipes: [
      RECIPE_DATABASE['craft_leather_vest'],
      RECIPE_DATABASE['craft_leather_boots'],
    ],
  },

  ALCHEMIST: {
    id: 'ALCHEMIST',
    name: '연금술사',
    role: '회복 포션, 마나 정제수, 마법 촉매 조제',
    description: '약초와 마나석, 영혼의 정수를 배합하여 치명상을 치유하고 마력을 복원하는 물약을 연구합니다.',
    iconSymbol: '⚗️',
    associatedFacility: 'alchemy_bench',
    primaryStatBonus: '지능, 행운',
    recipes: [
      RECIPE_DATABASE['craft_healing_potion'],
      RECIPE_DATABASE['craft_mana_potion'],
      RECIPE_DATABASE['craft_holy_water'],
    ],
  },

  COOK: {
    id: 'COOK',
    name: '요리사',
    role: '정신력 안정 허브차, 원기 회복 스튜, 야영 음식',
    description: '야영지에서 향긋한 허브차와 영양가 높은 음식을 조리하여 파티원의 사기와 체력을 북돋웁니다.',
    iconSymbol: '🍲',
    associatedFacility: 'cook_stove',
    primaryStatBonus: '정신, 행운',
    recipes: [
      RECIPE_DATABASE['craft_herb_tea'],
      RECIPE_DATABASE['craft_hearty_stew'],
    ],
  },

  CARPENTER: {
    id: 'CARPENTER',
    name: '목수',
    role: '활, 지팡이, 야영 시설 및 목재 장비 제작',
    description: '질 좋은 목재를 깎고 다듬어 사냥용 활과 마법 지팡이, 야영지의 견고한 시설을 건설합니다.',
    iconSymbol: '🪓',
    associatedFacility: 'wood_bench',
    primaryStatBonus: '근력, 민첩',
    recipes: [
      RECIPE_DATABASE['craft_hunting_bow'],
      RECIPE_DATABASE['craft_oak_staff'],
    ],
  },

  TAILOR: {
    id: 'TAILOR',
    name: '재봉사',
    role: '천옷 로브, 마법 망토, 수호의 의복 봉제',
    description: '마력이 깃든 실과 은사로 마법사 로브와 신기루 망토를 수놓아 착용자에게 강력한 가호를 줍니다.',
    iconSymbol: '🧵',
    associatedFacility: 'tailor_bench',
    primaryStatBonus: '지능, 정신',
    recipes: [
      RECIPE_DATABASE['craft_mystic_robe'],
      RECIPE_DATABASE['craft_shadow_cloak'],
    ],
  },
};
