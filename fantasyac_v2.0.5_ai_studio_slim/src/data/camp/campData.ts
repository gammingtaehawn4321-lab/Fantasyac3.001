import { CampFacilityDefinition, CampFacilityType, CampProgress, ReadableBookDefinition } from './campTypes';

export const CAMP_SETUP_COST = [
  { itemName: '나뭇가지', quantity: 2 },
  { itemName: '돌', quantity: 1 },
];

export const INITIAL_CAMP_PROGRESS: CampProgress = {
  level: 1,
  facilities: [
    { facilityId: 'campfire', level: 1, isBuilt: true },
    { facilityId: 'tent', level: 1, isBuilt: true },
    { facilityId: 'bed', level: 0, isBuilt: false },
    { facilityId: 'storage', level: 1, isBuilt: true },
    { facilityId: 'workbench', level: 1, isBuilt: true },
    { facilityId: 'anvil', level: 0, isBuilt: false },
    { facilityId: 'leather_bench', level: 0, isBuilt: false },
    { facilityId: 'alchemy_bench', level: 0, isBuilt: false },
    { facilityId: 'cook_stove', level: 0, isBuilt: false },
    { facilityId: 'wood_bench', level: 0, isBuilt: false },
    { facilityId: 'tailor_bench', level: 0, isBuilt: false },
    { facilityId: 'training_dummy', level: 0, isBuilt: false },
    { facilityId: 'reading_corner', level: 0, isBuilt: false },
  ],
  unlockedActivities: ['SLEEP', 'TALK', 'CRAFT', 'STORAGE'],
  upgrades: [],
  storageItems: [],
};

export const CAMP_FACILITIES_DATABASE: Record<CampFacilityType, CampFacilityDefinition> = {
  campfire: {
    id: 'campfire',
    name: '모닥불',
    maxLevel: 3,
    iconSymbol: '🔥',
    description: '어둠과 추위를 몰아내고 야생 동물들의 접근을 막아주는 야영의 중심입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '나뭇가지', quantity: 2 }] },
      2: { ingredients: [{ itemName: '목재', quantity: 3 }, { itemName: '돌', quantity: 2 }] },
      3: { ingredients: [{ itemName: '목재', quantity: 6 }, { itemName: '빛나는 마나석 파편', quantity: 1 }] },
    },
    benefits: ['수면 시 체력 및 마나 회복량 +20%', '밤의 추위 피해 무효화'],
  },

  tent: {
    id: 'tent',
    name: '천막',
    maxLevel: 3,
    iconSymbol: '⛺',
    description: '비바람과 모래바람을 막아 숙면을 취할 수 있게 해주는 휴대용 가죽 텐트입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '질긴 늑대 가죽', quantity: 2 }, { itemName: '나뭇가지', quantity: 3 }] },
      2: { ingredients: [{ itemName: '질긴 늑대 가죽', quantity: 4 }, { itemName: '실', quantity: 3 }] },
      3: { ingredients: [{ itemName: '질긴 늑대 가죽', quantity: 8 }, { itemName: '순은 주괴', quantity: 1 }] },
    },
    benefits: ['수면 시 정신력 회복량 +30%', '악천후 환경 디버프 방지'],
  },

  bed: {
    id: 'bed',
    name: '안락한 깃털 침상',
    maxLevel: 2,
    iconSymbol: '🛏️',
    description: '푹신한 건초와 깃털을 채워넣어 몸의 피로를 순식간에 씻어내는 침상입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '실', quantity: 3 }, { itemName: '목재', quantity: 2 }] },
      2: { ingredients: [{ itemName: '실', quantity: 6 }, { itemName: '순은 주괴', quantity: 1 }] },
    },
    benefits: ['수면 시 모든 상태이상 완화', '체력 및 정신력 100% 완전 회복'],
  },

  storage: {
    id: 'storage',
    name: '야영지 물품 보관함',
    maxLevel: 3,
    iconSymbol: '📦',
    description: '모험 중 수집한 대량의 광물, 목재, 예비 장비 등을 안전하게 보관하는 대형 적재 궤짝입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '목재', quantity: 2 }, { itemName: '돌', quantity: 2 }] },
      2: { ingredients: [{ itemName: '목재', quantity: 6 }, { itemName: '철광석', quantity: 4 }] },
      3: { ingredients: [{ itemName: '목재', quantity: 12 }, { itemName: '순은 주괴', quantity: 2 }, { itemName: '철광석', quantity: 8 }] },
    },
    benefits: [
      '보관함 용량 증설 (Lv.1: 100kg → Lv.2: 250kg → Lv.3: 500kg)',
      '야영지 체류 시 보관함 재료로 즉시 레시피 제작 가능',
    ],
  },

  workbench: {
    id: 'workbench',
    name: '간이 작업대',
    maxLevel: 3,
    iconSymbol: '🧰',
    description: '기초적인 도구와 부품을 조립하고 수리할 수 있는 기본 작업대입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '목재', quantity: 2 }, { itemName: '돌', quantity: 2 }] },
      2: { ingredients: [{ itemName: '목재', quantity: 4 }, { itemName: '철광석', quantity: 2 }] },
      3: { ingredients: [{ itemName: '목재', quantity: 8 }, { itemName: '순은 주괴', quantity: 1 }] },
    },
    benefits: ['기초 제작 효율 상승', '장비 내구도 정비 가능'],
  },

  anvil: {
    id: 'anvil',
    name: '간이 대장간 & 모루',
    maxLevel: 3,
    iconSymbol: '🔨',
    associatedProfession: 'BLACKSMITH',
    description: '풀무와 모루를 갖추어 대장장이가 금속 무기와 판금 중갑을 제련할 수 있는 공간입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '철광석', quantity: 5 }, { itemName: '돌', quantity: 4 }] },
      2: { ingredients: [{ itemName: '철광석', quantity: 10 }, { itemName: '순은 주괴', quantity: 2 }] },
      3: { ingredients: [{ itemName: '철광석', quantity: 15 }, { itemName: '빛나는 마나석 파편', quantity: 2 }] },
    },
    benefits: ['대장장이 레시피 해금', '금속 장비 제작 품질 향상', '동료 대장장이 배치 가능'],
  },

  leather_bench: {
    id: 'leather_bench',
    name: '가죽 무두질 작업대',
    maxLevel: 3,
    iconSymbol: '👞',
    associatedProfession: 'LEATHERWORKER',
    description: '가죽을 무두질하고 재단하여 도적과 궁수를 위한 경갑 장비를 제작하는 시설입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '질긴 늑대 가죽', quantity: 4 }, { itemName: '목재', quantity: 3 }] },
      2: { ingredients: [{ itemName: '질긴 늑대 가죽', quantity: 8 }, { itemName: '실', quantity: 4 }] },
      3: { ingredients: [{ itemName: '질긴 늑대 가죽', quantity: 12 }, { itemName: '심연의 정수', quantity: 1 }] },
    },
    benefits: ['가죽 세공 레시피 해금', '경갑 제작 품질 향상'],
  },

  alchemy_bench: {
    id: 'alchemy_bench',
    name: '연금술 플라스크 작업대',
    maxLevel: 3,
    iconSymbol: '⚗️',
    associatedProfession: 'ALCHEMIST',
    description: '증류기와 비커를 갖추어 각종 포션, 마나 정제수, 마법 촉매를 합성하는 연구대입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '빛나는 마나석 파편', quantity: 2 }, { itemName: '맑은 이슬', quantity: 3 }] },
      2: { ingredients: [{ itemName: '빛나는 마나석 파편', quantity: 4 }, { itemName: '순은 주괴', quantity: 2 }] },
      3: { ingredients: [{ itemName: '심연의 정수', quantity: 2 }, { itemName: '영혼석 조각', quantity: 2 }] },
    },
    benefits: ['연금술 고급 포션 레시피 해금', '포션 제작 시 추가 획득 확률'],
  },

  cook_stove: {
    id: 'cook_stove',
    name: '야영 조리 솥 & 화덕',
    maxLevel: 3,
    iconSymbol: '🍲',
    associatedProfession: 'COOK',
    description: '모닥불 위에 튼튼한 솥을 걸어 영양가 높은 스튜와 향긋한 허브차를 조리합니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '돌', quantity: 4 }, { itemName: '철광석', quantity: 2 }] },
      2: { ingredients: [{ itemName: '철광석', quantity: 5 }, { itemName: '목재', quantity: 4 }] },
      3: { ingredients: [{ itemName: '순은 주괴', quantity: 2 }, { itemName: '철광석', quantity: 8 }] },
    },
    benefits: ['요리 레시피 해금', '야영 음식 섭취 시 다음 날 버프 부여'],
  },

  wood_bench: {
    id: 'wood_bench',
    name: '목공 세공 작업대',
    maxLevel: 3,
    iconSymbol: '🪓',
    associatedProfession: 'CARPENTER',
    description: '목재를 다듬어 활, 석궁, 마법 지팡이와 캠프의 각종 가구를 제작합니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '목재', quantity: 5 }, { itemName: '돌', quantity: 2 }] },
      2: { ingredients: [{ itemName: '목재', quantity: 10 }, { itemName: '철광석', quantity: 3 }] },
      3: { ingredients: [{ itemName: '목재', quantity: 15 }, { itemName: '순은 주괴', quantity: 2 }] },
    },
    benefits: ['목공 활/지팡이 레시피 해금', '캠프 시설 업그레이드 비용 15% 감소'],
  },

  tailor_bench: {
    id: 'tailor_bench',
    name: '재봉틀 & 비단 작업대',
    maxLevel: 3,
    iconSymbol: '🧵',
    associatedProfession: 'TAILOR',
    description: '마력 실을 직조하여 마법사 로브, 두건, 신기루 망토를 제작하는 정교한 재봉대입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '실', quantity: 5 }, { itemName: '목재', quantity: 3 }] },
      2: { ingredients: [{ itemName: '실', quantity: 10 }, { itemName: '빛나는 마나석 파편', quantity: 2 }] },
      3: { ingredients: [{ itemName: '실', quantity: 15 }, { itemName: '심연의 정수', quantity: 2 }] },
    },
    benefits: ['천옷 및 망토 레시피 해금', '천옷 제작 품질 향상'],
  },

  training_dummy: {
    id: 'training_dummy',
    name: '훈련용 짚단 허수아비',
    maxLevel: 2,
    iconSymbol: '🎯',
    description: '야영지 한쪽에 설치하여 무기 연격과 스킬을 실전처럼 단련할 수 있는 표적입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '목재', quantity: 4 }, { itemName: '질긴 늑대 가죽', quantity: 2 }] },
      2: { ingredients: [{ itemName: '목재', quantity: 8 }, { itemName: '철광석', quantity: 4 }] },
    },
    benefits: ['야영 중 [훈련] 활동 시 경험치 및 재능 포인트 획득량 증가'],
  },

  reading_corner: {
    id: 'reading_corner',
    name: '모닥불 옆 독서 공간',
    maxLevel: 2,
    iconSymbol: '📖',
    description: '은은한 등불 아래에서 고대 서적과 비전서를 읽으며 지식을 탐구하는 아늑한 자리입니다.',
    upgradeCosts: {
      1: { ingredients: [{ itemName: '목재', quantity: 3 }, { itemName: '실', quantity: 2 }] },
      2: { ingredients: [{ itemName: '목재', quantity: 6 }, { itemName: '빛나는 마나석 파편', quantity: 1 }] },
    },
    benefits: ['야영 중 [독서] 활동 개방', '서적 읽기 시 추가 지식 및 스킬 획득'],
  },
};

export const READABLE_BOOKS_DATABASE: Record<string, ReadableBookDefinition> = {
  '봉인된 양피지 두루마리': {
    itemId: '봉인된 양피지 두루마리',
    name: '봉인된 양피지 두루마리',
    lore: '고대 마법 제국의 기초 마력 순환 원리가 은밀한 문자로 기록된 양피지입니다. 읽으면 비전 마법에 대한 통찰을 얻습니다.',
    knowledgeReward: {
      exp: 60,
      professionExp: { professionId: 'ALCHEMIST', exp: 50 },
      statBonus: { stat: 'intelligence', value: 1 },
    },
  },
  '낡은 보물지도': {
    itemId: '낡은 보물지도',
    name: '낡은 보물지도',
    lore: '대륙의 숨겨진 유적지와 고대 광맥의 위치가 암호화된 기호로 그려진 지도입니다. 읽으면 탐험 감각이 날카로워집니다.',
    knowledgeReward: {
      exp: 50,
      statBonus: { stat: 'luck', value: 1 },
    },
  },
};
