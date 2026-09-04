import { EquipmentDefinition } from './equipmentTypes';
import { GENERATED_EQUIPMENT_DATABASE } from './equipmentExpansionCatalog';
import { V1_EQUIPMENT_DATABASE } from './equipmentV1Catalog';
import { UNDERGROUND_MONSTER_EQUIPMENT_DATABASE } from './undergroundMonsterEquipment';
import { LIFE_TRAVEL_EQUIPMENT_DATABASE } from './lifeTravelEquipment';
import { EQUIPMENT_ILLUSTRATION_BY_NAME } from './equipmentIllustrations';

export const EQUIPMENT_DATABASE: Record<string, EquipmentDefinition> = {
  // ==========================================
  // 1. 주무기 (MAIN_HAND) / 양손 / 한손 / 쌍수 / 마법형
  // ==========================================
  apprentice_sword: {
    id: 'apprentice_sword',
    name: '수련생의 강철검',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'COMMON',
    requiredLevel: 1,
    weaponType: 'SWORD',
    weaponStyle: 'ONE_HANDED',
    recommendedClasses: ['WARRIOR', 'ROGUE'],
    baseStats: {
      physicalAttack: 8,
      accuracy: 5,
    },
    statModifiers: {
      strength: 1,
    },
    description: '손에 쥐기 편하게 질긴 가죽 끈이 손잡이에 감겨 있는 표준 강철 장검.',
    flavorText: '검신에는 초심자가 훈련용 목각 인형을 내리치며 남긴 미세한 칼자국들이 남아 있다.',
    equipDescription: '손에 쥐기 편하게 가죽 끈이 단단히 감겨 있는 튼튼한 강철 장검입니다.',
    combatDescription: '칼날이 허공을 가르며 날카로운 파열음을 냅니다.',
    sellPrice: 35,
  },

  zweihander_colossus: {
    id: 'zweihander_colossus',
    name: '거인의 츠바이헨더',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'RARE',
    requiredLevel: 10,
    weaponType: 'GREATSWORD',
    weaponStyle: 'TWO_HANDED',
    recommendedClasses: ['WARRIOR'],
    recommendedEvolutions: ['대검전사'],
    baseStats: {
      physicalAttack: 32,
      physicalPenetration: 12,
      tenacity: 15,
      actionSpeed: -4,
    },
    statModifiers: {
      strength: 5,
      vitality: 3,
    },
    specialEffectIds: ['heavy_stagger_boost'],
    description: '육중한 검신과 넓은 가드를 지닌 양손 대검. 적의 방패와 갑주를 강한 완력으로 부숴버린다.',
    flavorText: '고대 요새의 돌기둥을 베어낸 거한의 무용담이 검신 깊숙이 음각되어 있다.',
    equipDescription: '두 손으로 쥐어야만 온전히 휘두를 수 있는 묵직하고 거대한 대검입니다.',
    combatDescription: '육중한 대검이 적의 가드를 무너뜨리며 지면을 뒤흔듭니다.',
    sellPrice: 240,
  },

  silver_hunting_bow: {
    id: 'silver_hunting_bow',
    name: '은빛 사냥용 단궁',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'COMMON',
    requiredLevel: 1,
    weaponType: 'BOW',
    weaponStyle: 'ONE_HANDED',
    recommendedClasses: ['ARCHER'],
    baseStats: {
      physicalAttack: 7,
      accuracy: 8,
      criticalChance: 4,
    },
    statModifiers: {
      agility: 2,
    },
    description: '탄력이 뛰어난 물푸레나무와 은사를 엮어 제작한 사냥용 단궁.',
    flavorText: '숲속 수풀 사이를 스치는 산들바람처럼 소리 없이 화살을 날려 보낸다.',
    equipDescription: '탄력이 뛰어난 물푸레나무와 은사로 엮은 유연한 사냥용 활입니다.',
    combatDescription: '시위를 당기자 은빛 궤적을 그리며 화살이 매끄럽게 쏘아집니다.',
    sellPrice: 40,
  },

  sniper_longbow_eagle: {
    id: 'sniper_longbow_eagle',
    name: '독수리의 저격 장궁',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'RARE',
    requiredLevel: 10,
    weaponType: 'BOW',
    weaponStyle: 'TWO_HANDED',
    recommendedClasses: ['ARCHER'],
    recommendedEvolutions: ['스나이퍼'],
    baseStats: {
      physicalAttack: 26,
      accuracy: 20,
      criticalChance: 12,
      criticalDamage: 0.25,
      actionSpeed: -2,
    },
    statModifiers: {
      agility: 4,
      luck: 3,
    },
    description: '장거리 저격에 특화된 대형 장궁. 활시위의 강한 탄성으로 표적의 급소를 꿰뚫는다.',
    flavorText: '활대 끝에 새겨진 독수리 부리 문양은 천 리 밖의 먹잇감을 놓치지 않겠다는 결의를 담고 있다.',
    equipDescription: '먼 거리의 표적을 정확히 꿰뚫도록 긴 사거리를 가진 강력한 장궁입니다.',
    combatDescription: '바람을 찢는 화살이 적의 치명적인 급소를 정밀하게 타격합니다.',
    sellPrice: 230,
  },

  shadow_twin_daggers: {
    id: 'shadow_twin_daggers',
    name: '그림자 쌍단도',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    weaponType: 'DAGGER',
    weaponStyle: 'DUAL_WIELD',
    recommendedClasses: ['ROGUE'],
    recommendedEvolutions: ['듀얼블레이드'],
    baseStats: {
      physicalAttack: 14,
      evasion: 6,
      criticalChance: 8,
      actionSpeed: 5,
    },
    statModifiers: {
      agility: 3,
    },
    specialEffectIds: ['bleed_synergy'],
    description: '빛 반사를 억제하는 흑요 코팅이 된 쌍둥이 단검. 치명적인 연속 기습 공격에 최적화되어 있다.',
    flavorText: '어둠 속을 소리 없이 배회하던 그림자 길드 자객들의 손때가 묻어 있다.',
    equipDescription: '암살자가 양손에 나누어 쥐고 연속 타격을 가하기에 최적화된 쌍둥이 단검입니다.',
    combatDescription: '보이지 않는 궤적으로 찰나의 순간 두 번의 치명적인 참격을 가합니다.',
    effectDescription: '[혈흔 추적] 출혈 상태의 적에게 주는 피해가 15% 증가합니다.',
    sellPrice: 110,
  },

  apprentice_oak_staff: {
    id: 'apprentice_oak_staff',
    name: '견습 마법사의 참나무 지팡이',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'COMMON',
    requiredLevel: 1,
    weaponType: 'STAFF',
    weaponStyle: 'MAGIC',
    recommendedClasses: ['MAGE', 'CLERIC'],
    baseStats: {
      magicAttack: 12,
      maxMp: 20,
    },
    statModifiers: {
      intelligence: 2,
    },
    magicWeapon: {
      spellCapacity: 2,
      availableSpellIds: ['mage_firebolt', 'mage_magic_missile'],
      magicTags: ['ELEMENTAL', 'ARCANE'],
      spellPowerMultiplier: 1.1,
    },
    description: '마력을 머금은 맑은 청색 보석이 꼭대기에 박혀 있는 정제된 참나무 지팡이.',
    flavorText: '보석 내부에서 희미한 마력 회로가 맥동하며 마법학 초심자의 서툰 주문을 보조해 준다.',
    equipDescription: '마력을 머금은 맑은 청색 보석이 꼭대기에 박혀 있는 참나무 지팡이입니다.',
    combatDescription: '지팡이 끝에서 푸른 마력의 파동이 응집되며 마법 화살이 뿜어집니다.',
    sellPrice: 45,
  },

  arcane_dual_orbs: {
    id: 'arcane_dual_orbs',
    name: '비전 쌍성구 (Twin Star Orbs)',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'RARE',
    requiredLevel: 10,
    weaponType: 'MAGIC_ORB',
    weaponStyle: 'MAGIC',
    recommendedClasses: ['MAGE'],
    recommendedEvolutions: ['아케인 메이지'],
    baseStats: {
      magicAttack: 28,
      statusHitRate: 15,
      maxMp: 45,
    },
    statModifiers: {
      intelligence: 5,
      spirit: 3,
    },
    magicWeapon: {
      spellCapacity: 4,
      availableSpellIds: ['mage_firebolt', 'mage_arcane_burst', 'mage_chain_lightning'],
      magicTags: ['ARCANE', 'CELESTIAL'],
      spellPowerMultiplier: 1.35,
      exclusiveSpellIds: ['mage_starlight_singularity'],
    },
    description: '두 개의 천구가 마법사의 주위를 부유하며 마나를 증폭하는 신비로운 비전 마도구.',
    flavorText: '하늘의 별자리와 공명하듯 은은한 성운 빛을 흩뿌리며 회전한다.',
    equipDescription: '두 개의 천구(天球)가 마법사의 주변을 부유하며 공명하는 신비로운 마도구입니다.',
    combatDescription: '쌍성구가 회전하며 별빛의 마력 소용돌이를 방출해 적들을 휩씁니다.',
    sellPrice: 280,
  },

  holy_cane_purifier: {
    id: 'holy_cane_purifier',
    name: '정화자의 홀리 케인',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    weaponType: 'CANE',
    weaponStyle: 'MAGIC',
    recommendedClasses: ['CLERIC'],
    recommendedEvolutions: ['사제', '힐러'],
    baseStats: {
      magicAttack: 16,
      magicDefense: 8,
      maxMp: 30,
      maxSanity: 20,
    },
    statModifiers: {
      spirit: 4,
    },
    magicWeapon: {
      spellCapacity: 3,
      availableSpellIds: ['cleric_divine_heal', 'cleric_holy_smite', 'cleric_purification'],
      magicTags: ['HOLY', 'RESTORATION'],
      spellPowerMultiplier: 1.2,
    },
    description: '신성한 축복이 각인된 은빛 지팡이. 악을 정화하고 상처를 치유하는 백마법을 증폭한다.',
    flavorText: '손잡이를 쥐면 사제 서약의 서늘하고 맑은 기운이 가슴속 깊이 전해진다.',
    equipDescription: '신성한 축복이 각인된 은빛 케인으로, 잡는 것만으로도 정신이 맑아집니다.',
    combatDescription: '성스러운 빛줄기가 케인 끝에서 퍼져 나와 상처를 치유하고 악을 정화합니다.',
    sellPrice: 120,
  },

  apprentice_chakram: {
    id: 'apprentice_chakram',
    name: '수련생의 은빛 차크람',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'COMMON',
    requiredLevel: 1,
    weaponType: 'CHAKRAM',
    weaponStyle: 'DUAL_WIELD',
    recommendedClasses: ['DANCER'],
    baseStats: {
      physicalAttack: 10,
      evasion: 4,
      actionSpeed: 3,
    },
    statModifiers: {
      agility: 2,
      luck: 1,
    },
    description: '가장자리가 날카롭게 벼려진 원형 비도. 회전력을 이용해 적을 베고 되돌아온다.',
    flavorText: '무희의 춤사위처럼 우아한 원형을 그리며 은빛 잔상을 남긴다.',
    equipDescription: '가장자리가 날카롭게 벼려진 원형 비도로, 춤추듯 던지고 회수하기에 적합합니다.',
    combatDescription: '은빛 원형 궤적을 그리며 회전하는 차크람이 허공을 가릅니다.',
    sellPrice: 40,
  },

  dancer_lunar_chakram: {
    id: 'dancer_lunar_chakram',
    name: '달빛의 비전 차크람',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'RARE',
    requiredLevel: 8,
    weaponType: 'CHAKRAM',
    weaponStyle: 'DUAL_WIELD',
    recommendedClasses: ['DANCER'],
    baseStats: {
      physicalAttack: 22,
      magicAttack: 10,
      evasion: 8,
      actionSpeed: 6,
      criticalChance: 8,
    },
    statModifiers: {
      agility: 4,
      luck: 3,
    },
    specialEffectIds: ['bleed_synergy'],
    description: '달빛의 정기가 깃든 고위 무희의 쌍수 차크람. 날카로운 냉기를 머금고 있다.',
    flavorText: '달이 차오르는 밤이면 차크람의 테두리가 서늘한 백은색으로 푸르게 빛난다.',
    equipDescription: '차갑게 빛나는 은빛 달의 정기가 깃든 정교한 쌍수 차크람입니다.',
    combatDescription: '달빛 잔상을 남기며 날아든 차크람이 적의 사지를 연속으로 베어 넘깁니다.',
    effectDescription: '[혈흔 추적] 출혈 상태의 적에게 주는 피해가 15% 증가합니다.',
    sellPrice: 210,
  },

  succubus_thought_prism: {
    id: 'succubus_thought_prism',
    name: '음마의 사념 수정구',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'EPIC',
    requiredLevel: 15,
    weaponType: 'THOUGHT',
    weaponStyle: 'MAGIC',
    recommendedClasses: ['DANCER'],
    recommendedEvolutions: ['서큐버스'],
    baseStats: {
      magicAttack: 36,
      statusHitRate: 20,
      maxMp: 50,
      maxSanity: 30,
    },
    statModifiers: {
      intelligence: 6,
      luck: 4,
    },
    specialEffectIds: ['vampirism_15'],
    magicWeapon: {
      spellCapacity: 4,
      availableSpellIds: ['succubus_seduction', 'succubus_soul_drain', 'succubus_mind_blast'],
      magicTags: ['PSYCHIC', 'DARK'],
      spellPowerMultiplier: 1.35,
    },
    description: '타락한 매혹의 마력이 농축된 붉은 사념 수정체. 적의 정신을 혼미하게 뒤흔든다.',
    flavorText: '수정 깊은 곳을 들여다보면 붉은 안개 속에서 은밀한 속삭임이 귓가를 맴돈다.',
    equipDescription: '손에 쥐면 맥박치며 붉은 사념의 안개를 뿜어내는 마성의 크리스탈입니다.',
    combatDescription: '수정구에서 뿜어져 나온 매혹의 사념 파동이 적의 정신을 붕괴시킵니다.',
    effectDescription: '[흡혈] 공격 피해량의 15%만큼 자신의 체력을 회복합니다.',
    sellPrice: 480,
  },

  execution_twin_blades: {
    id: 'execution_twin_blades',
    name: '참수의 쌍수 처형도',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'EPIC',
    requiredLevel: 15,
    weaponType: 'EXECUTION_BLADE',
    weaponStyle: 'DUAL_WIELD',
    recommendedClasses: ['DANCER'],
    recommendedEvolutions: ['검무희'],
    baseStats: {
      physicalAttack: 38,
      criticalChance: 15,
      criticalDamage: 0.35,
      actionSpeed: 8,
      physicalPenetration: 15,
    },
    statModifiers: {
      agility: 6,
      luck: 4,
    },
    specialEffectIds: ['bleed_synergy'],
    description: '단 한 번의 회전으로 급소를 절단하도록 곡선으로 벼려진 처형용 쌍검.',
    flavorText: '칼날에는 결코 지워지지 않는 짙은 핏자국과 냉혹한 단죄의 서약이 깃들어 있다.',
    equipDescription: '오직 단 한 번의 회전으로 적의 숨통을 끊도록 완벽한 곡선으로 벼려진 처형도입니다.',
    combatDescription: '섬뜩한 붉은 궤적이 교차하며 적의 급소를 무자비하게 절단합니다.',
    effectDescription: '[혈흔 추적] 출혈 상태의 적에게 주는 피해가 15% 증가합니다.',
    sellPrice: 460,
  },

  dancer_silk_fan: {
    id: 'dancer_silk_fan',
    name: '화려한 공작 깃털 부채',
    slot: 'MAIN_HAND',
    equipmentType: 'WEAPON',
    rarity: 'EPIC',
    requiredLevel: 15,
    weaponType: 'FAN',
    weaponStyle: 'DUAL_WIELD',
    recommendedClasses: ['DANCER'],
    recommendedEvolutions: ['댄서'],
    baseStats: {
      physicalAttack: 20,
      magicAttack: 20,
      evasion: 14,
      actionSpeed: 10,
      statusHitRate: 16,
    },
    statModifiers: {
      agility: 5,
      spirit: 4,
      luck: 4,
    },
    specialEffectIds: ['mirage_evasion'],
    description: '공작 깃털과 마력 비단을 엮어 제작한 전투 부채. 바람을 일으켜 적의 공격을 비껴낸다.',
    flavorText: '부채를 펼칠 때마다 은은한 향기와 함께 형형색색의 잔상이 흩날린다.',
    equipDescription: '신비로운 공작 깃털과 비단으로 짜여 우아한 춤사위를 극대화해 주는 부채입니다.',
    combatDescription: '부채를 활짝 펼치자 바람의 장막과 잔상이 흩날리며 적의 공격을 완벽히 흘려냅니다.',
    effectDescription: '[신기루] 회피율이 10% 증가하고, 회피 성공 시 다음 행동의 속도가 상승합니다.',
    sellPrice: 450,
  },

  // ==========================================
  // 2. 보조 장비 (OFF_HAND)
  // ==========================================
  knight_iron_shield: {
    id: 'knight_iron_shield',
    name: '기사의 철제 원형 방패',
    slot: 'OFF_HAND',
    equipmentType: 'OFFHAND',
    rarity: 'COMMON',
    requiredLevel: 1,
    weaponType: 'SHIELD',
    weaponStyle: 'ONE_HANDED',
    recommendedClasses: ['WARRIOR'],
    baseStats: {
      physicalDefense: 8,
      tenacity: 10,
      evasion: -2,
    },
    statModifiers: {
      vitality: 2,
    },
    description: '두꺼운 무쇠를 두드려 만든 원형 방패. 맹렬한 참격과 화살 세례를 튕겨낸다.',
    flavorText: '방패 전면에는 수많은 전장의 창칼을 받아낸 흠집들이 영광의 훈장처럼 박혀 있다.',
    equipDescription: '단단한 무쇠로 벼려진 방패로 적의 칼날과 화살을 튕겨내기에 적합합니다.',
    combatDescription: '방패를 굳게 들어 올려 날아드는 적의 공격을 완벽히 막아냅니다.',
    sellPrice: 40,
  },

  amulet_of_warding: {
    id: 'amulet_of_warding',
    name: '수호의 손등 아뮬렛',
    slot: 'OFF_HAND',
    equipmentType: 'OFFHAND',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    weaponType: 'AMULET',
    weaponStyle: 'ONE_HANDED',
    recommendedClasses: ['CLERIC', 'MAGE'],
    baseStats: {
      magicDefense: 10,
      statusResistance: 12,
      maxSanity: 15,
    },
    statModifiers: {
      spirit: 2,
    },
    description: '손목에 착용하는 마법 방어 아뮬렛. 물리 및 마법적 충격을 흡수하는 역장을 형성한다.',
    flavorText: '아뮬렛 중앙의 보석은 수호 마법사의 온기가 아직 가시지 않은 듯 미온을 품고 있다.',
    equipDescription: '손에 쥐거나 손목에 묶어 사용하는 마법 수호 아뮬렛입니다 (목걸이와 별개).',
    combatDescription: '아뮬렛이 은은하게 발광하며 착용자를 감싸는 보호 역장을 형성합니다.',
    sellPrice: 85,
  },

  // ==========================================
  // 3. 방어구: 투구, 상의, 하의, 신발, 장갑
  // ==========================================
  leather_cap_apprentice: {
    id: 'leather_cap_apprentice',
    name: '모험가의 가죽 모자',
    slot: 'HEAD',
    equipmentType: 'ARMOR',
    armorType: 'LIGHT',
    rarity: 'COMMON',
    requiredLevel: 1,
    recommendedClasses: ['ROGUE', 'ARCHER'],
    baseStats: {
      physicalDefense: 3,
      evasion: 2,
    },
    description: '질긴 야수 가죽으로 제작된 경량 모자. 시야를 가리지 않고 머리를 보호한다.',
    flavorText: '챙 부분은 햇빛과 빗방울을 막기에 적당하며 모험가의 손때가 가득하다.',
    equipDescription: '시야를 가리지 않고 머리를 가볍게 보호하는 유연한 가죽 모자입니다.',
    sellPrice: 20,
  },

  heavy_iron_helm: {
    id: 'heavy_iron_helm',
    name: '중장 철제 투구',
    slot: 'HEAD',
    equipmentType: 'ARMOR',
    armorType: 'HEAVY',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    recommendedClasses: ['WARRIOR'],
    baseStats: {
      physicalDefense: 8,
      tenacity: 6,
      actionSpeed: -1,
    },
    statModifiers: {
      vitality: 1,
    },
    description: '안면과 목덜미까지 두꺼운 철판으로 감싸는 중후한 기사용 투구.',
    flavorText: '투구 안쪽에는 충격을 완화하는 가죽 패드가 덧대어져 있으며 쇠비린내가 감돈다.',
    equipDescription: '머리 전체와 목을 튼튼하게 감싸는 중후한 철제 투구입니다.',
    sellPrice: 60,
  },

  silk_cowl_sage: {
    id: 'silk_cowl_sage',
    name: '현자의 실크 두건',
    slot: 'HEAD',
    equipmentType: 'ARMOR',
    armorType: 'CLOTH',
    rarity: 'COMMON',
    requiredLevel: 1,
    recommendedClasses: ['MAGE', 'CLERIC', 'DANCER'],
    baseStats: {
      magicDefense: 5,
      maxMp: 15,
    },
    statModifiers: {
      intelligence: 1,
    },
    description: '마력 전도율이 높은 고급 비단으로 짠 두건. 주문 영창 시 정신 집중을 돕는다.',
    flavorText: '부드러운 천 결에는 도서관의 마른 책 냄새와 고요한 명상의 정취가 배어 있다.',
    equipDescription: '부드러운 마력 실크로 짜여 정신 집중을 돕는 두건입니다.',
    sellPrice: 25,
  },

  heavy_plate_cuirass: {
    id: 'heavy_plate_cuirass',
    name: '강철 판금 흉갑',
    slot: 'CHEST',
    equipmentType: 'ARMOR',
    armorType: 'HEAVY',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    recommendedClasses: ['WARRIOR'],
    baseStats: {
      physicalDefense: 16,
      tenacity: 12,
      actionSpeed: -2,
    },
    statModifiers: {
      vitality: 3,
      strength: 1,
    },
    description: '가슴과 등을 빈틈없이 방호하는 단단한 강철 판금 갑옷.',
    flavorText: '제국 대장간의 거대한 해머로 수없이 담금질되어 화살조차 미끄러지듯 튕겨낸다.',
    equipDescription: '가슴과 등을 빈틈없이 막아주는 묵직한 강철 판금 흉갑입니다.',
    sellPrice: 110,
  },

  scout_leather_vest: {
    id: 'scout_leather_vest',
    name: '정찰병의 질긴 가죽 조끼',
    slot: 'CHEST',
    equipmentType: 'ARMOR',
    armorType: 'LIGHT',
    rarity: 'COMMON',
    requiredLevel: 1,
    recommendedClasses: ['ROGUE', 'ARCHER'],
    baseStats: {
      physicalDefense: 7,
      evasion: 4,
      actionSpeed: 1,
    },
    statModifiers: {
      agility: 2,
    },
    description: '늑대 가죽을 덧대어 만든 유연한 조끼. 몸놀림을 방해하지 않고 급소를 보호한다.',
    flavorText: '소음 없이 움직일 수 있도록 이음매마다 밀랍을 먹인 질긴 실로 봉제되어 있다.',
    equipDescription: '야생 늑대의 질긴 가죽으로 만들어 활동성이 뛰어난 조끼입니다.',
    sellPrice: 45,
  },

  mage_mystic_robe: {
    id: 'mage_mystic_robe',
    name: '비전 마법사의 신비 로브',
    slot: 'CHEST',
    equipmentType: 'ARMOR',
    armorType: 'CLOTH',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    recommendedClasses: ['MAGE', 'CLERIC', 'DANCER'],
    baseStats: {
      magicDefense: 14,
      magicAttack: 6,
      maxMp: 30,
      maxSanity: 15,
    },
    statModifiers: {
      intelligence: 3,
      spirit: 2,
    },
    description: '마력의 순환을 원활하게 돕는 룬 문양이 수놓인 비전 마법사용 예복.',
    flavorText: '로브 자락이 스칠 때마다 미세한 마력 불꽃이 일며 착용자의 마나를 보호한다.',
    equipDescription: '마력의 흐름을 정돈해 주는 은은한 자주빛 문양이 수놓인 고급 로브입니다.',
    sellPrice: 90,
  },

  sturdy_traveler_pants: {
    id: 'sturdy_traveler_pants',
    name: '튼튼한 방랑자의 바지',
    slot: 'LEGS',
    equipmentType: 'ARMOR',
    armorType: 'LIGHT',
    rarity: 'COMMON',
    requiredLevel: 1,
    baseStats: {
      physicalDefense: 4,
      evasion: 2,
    },
    description: '거친 관목과 암벽 지대를 헤쳐나갈 수 있도록 질긴 삼베와 덧가죽으로 보강한 바지.',
    flavorText: '무릎 부위에는 험로를 기어오르며 남은 흙먼지와 풀물이 자연스럽게 배어 있다.',
    equipDescription: '험준한 지형에서도 쉽게 찢어지지 않도록 무릎에 덧천을 댄 방랑자의 바지입니다.',
    sellPrice: 25,
  },

  reinforced_plate_greaves: {
    id: 'reinforced_plate_greaves',
    name: '강화 판금 각반',
    slot: 'LEGS',
    equipmentType: 'ARMOR',
    armorType: 'HEAVY',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    recommendedClasses: ['WARRIOR'],
    baseStats: {
      physicalDefense: 10,
      tenacity: 8,
    },
    statModifiers: {
      vitality: 2,
    },
    description: '정강이와 무릎을 둔탁한 타격으로부터 방어하는 강철 판금 다리 갑옷.',
    flavorText: '묵직한 무게감만큼이나 전선에서 흔들림 없는 안정적인 하체 지지를 보장한다.',
    equipDescription: '정강이와 무릎을 빈틈없이 감싸는 육중한 강철 각반입니다.',
    sellPrice: 70,
  },

  swift_leather_boots: {
    id: 'swift_leather_boots',
    name: '신속의 가죽 장화',
    slot: 'BOOTS',
    equipmentType: 'ARMOR',
    armorType: 'LIGHT',
    rarity: 'COMMON',
    requiredLevel: 1,
    baseStats: {
      physicalDefense: 3,
      actionSpeed: 3,
      evasion: 3,
    },
    statModifiers: {
      agility: 1,
    },
    description: '부드러운 사슴 가죽으로 밑창을 마감하여 발소리를 줄이고 빠른 기동을 돕는 장화.',
    flavorText: '발목을 부드럽게 감싸주어 장거리 행군과 기습 도주에 탁월한 착용감을 제공한다.',
    equipDescription: '발목을 편안하게 감싸며 민첩한 발걸음을 돕는 가죽 장화입니다.',
    sellPrice: 30,
  },

  brawler_combat_gloves: {
    id: 'brawler_combat_gloves',
    name: '격투가의 전투 장갑',
    slot: 'GLOVES',
    equipmentType: 'ARMOR',
    armorType: 'LIGHT',
    rarity: 'COMMON',
    requiredLevel: 1,
    baseStats: {
      physicalAttack: 2,
      physicalDefense: 3,
      accuracy: 4,
    },
    description: '손등과 너클 부위에 쇠징을 덧댄 가죽 장갑. 주먹 타격력을 높이고 손을 보호한다.',
    flavorText: '손바닥 부위는 미끄럼 방지 처리가 되어 있어 무기를 쥐거나 적의 멱살을 잡기에 좋다.',
    equipDescription: '너클 부위에 쇠징을 박아 타격력과 악력을 높인 전투 장갑입니다.',
    sellPrice: 25,
  },

  // ==========================================
  // 4. 장신구 6슬롯 (반지1, 반지2, 목걸이, 팔찌, 귀걸이, 망토)
  // ==========================================
  ring_of_vitality: {
    id: 'ring_of_vitality',
    name: '활력의 루비 반지',
    slot: 'RING_1',
    equipmentType: 'ACCESSORY',
    rarity: 'COMMON',
    requiredLevel: 1,
    baseStats: {
      maxHp: 25,
    },
    statModifiers: {
      vitality: 2,
    },
    description: '맑은 루비가 세공된 금빛 반지. 착용자의 심장에 따뜻한 활력과 생명력을 북돋운다.',
    flavorText: '보석 안쪽을 비추면 마치 살아있는 피의 방울처럼 붉은 빛이 일렁인다.',
    equipDescription: '붉은 루비가 세공되어 심장에 따스한 맥박을 불어넣는 반지입니다.',
    sellPrice: 50,
  },

  ring_of_vampirism: {
    id: 'ring_of_vampirism',
    name: '흡혈귀의 피빛 인장 반지',
    slot: 'RING_2',
    equipmentType: 'ACCESSORY',
    rarity: 'RARE',
    requiredLevel: 8,
    baseStats: {
      physicalAttack: 4,
      magicAttack: 4,
      criticalChance: 5,
    },
    specialEffectIds: ['vampirism_15'],
    description: '적을 공격할 때마다 생명력을 흡수하는 음산한 흑철 반지.',
    flavorText: '반지를 끼면 손가락 끝이 차갑게 식으며 타인의 고통과 혈기를 갈망하게 된다.',
    equipDescription: '손가락에 끼우면 서늘한 기운이 돌며 피의 갈증을 일깨웁니다.',
    combatDescription: '적을 타격할 때마다 붉은 혈기가 흡수되어 자신의 상처를 치유합니다.',
    effectDescription: '[흡혈] 공격 피해량의 15%만큼 자신의 체력을 회복합니다.',
    sellPrice: 220,
  },

  phoenix_rebirth_necklace: {
    id: 'phoenix_rebirth_necklace',
    name: '불사조의 깃털 목걸이',
    slot: 'NECKLACE',
    equipmentType: 'ACCESSORY',
    rarity: 'EPIC',
    requiredLevel: 10,
    baseStats: {
      maxHp: 40,
      maxSanity: 30,
      statusResistance: 15,
    },
    statModifiers: {
      spirit: 3,
      luck: 3,
    },
    specialEffectIds: ['revive_once'],
    description: '치명적인 위기에 처했을 때 죽음의 문턱에서 기적적으로 부활시키는 신화의 목걸이.',
    flavorText: '금빛 깃털 팬던트는 손을 대면 심장 박동처럼 따스한 화염의 온도를 내뿜는다.',
    equipDescription: '불꽃의 온기가 깃든 불사조의 깃털이 정교하게 세공된 목걸이입니다.',
    combatDescription: '치명적인 피해를 입는 순간, 황금빛 불꽃이 타오르며 죽음의 문턱에서 되살아납니다!',
    effectDescription: '[불사] 전투 중 HP가 0에 도달할 때 1회에 한해 최대 체력의 40%로 즉시 부활합니다.',
    sellPrice: 500,
  },

  bracelet_of_clarity: {
    id: 'bracelet_of_clarity',
    name: '명경지수의 은팔찌',
    slot: 'BRACELET',
    equipmentType: 'ACCESSORY',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    baseStats: {
      magicDefense: 6,
      maxMp: 25,
      maxSanity: 20,
    },
    statModifiers: {
      spirit: 2,
    },
    description: '잡념과 공포를 씻어내어 정신을 맑게 유지해 주는 순은 세공 팔찌.',
    flavorText: '팔찌 안쪽에 새겨진 고대 명상 구절이 착용자의 동요를 차분히 잠재워준다.',
    equipDescription: '맑은 은빛으로 빛나며 잡념을 없애고 정신을 맑게 유지해 줍니다.',
    sellPrice: 75,
  },

  earring_of_tempest: {
    id: 'earring_of_tempest',
    name: '폭풍 바람의 귀걸이',
    slot: 'EARRING',
    equipmentType: 'ACCESSORY',
    rarity: 'UNCOMMON',
    requiredLevel: 5,
    baseStats: {
      actionSpeed: 4,
      evasion: 5,
      criticalChance: 3,
    },
    statModifiers: {
      agility: 2,
    },
    description: '미세한 공기의 흐름과 바람 소리를 증폭하여 기습을 본능적으로 감지하게 돕는 귀걸이.',
    flavorText: '귓가에서 항상 청량한 솔바람 소리가 맴돌며 기민한 감각을 일깨운다.',
    equipDescription: '귓가에 스치는 바람의 소리를 증폭시켜 위험을 본능적으로 감지하게 합니다.',
    sellPrice: 80,
  },

  cloak_of_shadow_dancer: {
    id: 'cloak_of_shadow_dancer',
    name: '그림자 무희의 신기루 망토',
    slot: 'CLOAK',
    equipmentType: 'ACCESSORY',
    rarity: 'RARE',
    requiredLevel: 8,
    baseStats: {
      physicalDefense: 6,
      magicDefense: 6,
      evasion: 10,
      actionSpeed: 3,
    },
    statModifiers: {
      agility: 3,
      luck: 2,
    },
    specialEffectIds: ['mirage_evasion'],
    description: '착용자의 실루엣을 신기루처럼 흐리게 만들어 적의 공격을 비껴내는 마력 망토.',
    flavorText: '망토 자락은 어두운 밤안개처럼 흩날리며 착용자의 위치를 환영 속으로 감춘다.',
    equipDescription: '망토가 어깨를 덮는 순간 천 끝이 살아있는 그림자처럼 흔들립니다.',
    combatDescription: '망토가 크게 펼쳐지며 신기루 같은 잔상을 남겨 적의 공격을 비껴냅니다.',
    effectDescription: '[신기루] 회피율이 10% 증가하고, 회피 성공 시 다음 턴 행동 속도가 상승합니다.',
    sellPrice: 210,
  },
  ...GENERATED_EQUIPMENT_DATABASE,
  ...V1_EQUIPMENT_DATABASE,
  ...UNDERGROUND_MONSTER_EQUIPMENT_DATABASE,
  ...LIFE_TRAVEL_EQUIPMENT_DATABASE,
};


// Equipment System 2.0 legacy normalization. Existing equipment remains save-compatible while
// gaining grade/tier/quality/acquisition metadata used by the new crafting and UI layers.
for (const equipment of Object.values(EQUIPMENT_DATABASE)) {
  equipment.grade ??= equipment.rarity === 'LEGENDARY' ? 'LEGENDARY' : (equipment.rarity === 'RARE' || equipment.rarity === 'EPIC') ? 'ELITE' : 'NORMAL';
  equipment.tier ??= Math.min(12, Math.max(1, Math.ceil((equipment.requiredLevel ?? 1) / 5)));
  equipment.quality ??= 'NORMAL';
  equipment.affixes ??= [];
  equipment.uniqueEffects ??= [];
  equipment.acquisition ??= { methods: ['LOOT'] };
  equipment.illustrationUrl ??= EQUIPMENT_ILLUSTRATION_BY_NAME[equipment.name];
}

// 무희 전용 장비의 대부분(결정론적으로 약 5/6)에 성인 상태 연동 기믹을 부여한다.
// 실제 BattleActor 적용은 physicalAge >= 18인 플레이어에게만 허용된다.
const DANCER_ADULT_TRAITS = [
  { id: 'DANCER_ADULT_CORRUPTION_FLOW', text: '성인 전용 · 현재 타락도가 높을수록 공격력과 행동 속도가 상승한다.' },
  { id: 'DANCER_ADULT_FLUID_RESONANCE', text: '성인 전용 · 세 구획의 fluid 합계가 임계치를 넘을 때 COST/속도/치명타가 상승하고 일부 무희 스킬이 변형된다.' },
  { id: 'DANCER_ADULT_PREGNANCY_TEMPO', text: '성인 전용 · 임신 상태에서는 최대 HP·방어력·행동 속도가 상승한다.' },
  { id: 'DANCER_ADULT_DESIRE_RHYTHM', text: '성인 전용 · 현재 성욕이 높을수록 COST 회복과 치명타 보너스를 얻는다.' },
  { id: 'DANCER_ADULT_LEWDNESS_PERFORMANCE', text: '성인 전용 · 현재 음란도에 비례해 상태이상 적중과 회피가 상승한다.' },
] as const;
for (const equipment of Object.values(EQUIPMENT_DATABASE)) {
  if (!equipment.recommendedClasses?.includes('DANCER')) continue;
  const hash = [...equipment.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const bucket = hash % 6;
  if (bucket === 5) continue; // 약 1/6은 일반 무희 장비로 남겨 빌드 강제성을 낮춘다.
  const adult = DANCER_ADULT_TRAITS[bucket];
  equipment.specialEffectIds = Array.from(new Set([...(equipment.specialEffectIds || []), adult.id]));
  if (!equipment.effectDescription?.includes('성인 전용')) {
    equipment.effectDescription = [equipment.effectDescription, adult.text].filter(Boolean).join(' / ');
  }
  equipment.tags = Array.from(new Set([...(equipment.tags || []), 'DANCER_ADULT_LINK']));
}

// Provisional monster-theme links. Future monster definitions can adopt these IDs without changing equipment code.
const provisionalSets: Record<string, { setId: string; sourceMonsterId: string }> = {
  zweihander_colossus: { setId: 'iron_colossus', sourceMonsterId: 'prosti_avalanche_colossus' },
  heavy_plate_cuirass: { setId: 'iron_colossus', sourceMonsterId: 'prosti_avalanche_colossus' },
  shadow_twin_daggers: { setId: 'venom_stalker', sourceMonsterId: 'forezin_venom_mantis' },
  swift_leather_boots: { setId: 'storm_hide', sourceMonsterId: 'scroze_thunder_raptor' },
  scout_leather_vest: { setId: 'storm_hide', sourceMonsterId: 'scroze_thunder_raptor' },
  mage_mystic_robe: { setId: 'astral_weave', sourceMonsterId: 'scroze_nebula_ray' },
  shadow_mirage_cloak: { setId: 'astral_weave', sourceMonsterId: 'scroze_nebula_ray' },
};
for (const [id, meta] of Object.entries(provisionalSets)) if (EQUIPMENT_DATABASE[id]) Object.assign(EQUIPMENT_DATABASE[id], meta);

export function getEquipmentDefinition(idOrName?: string | null): EquipmentDefinition | undefined {
  if (!idOrName) return undefined;
  const clean = idOrName.trim();
  if (EQUIPMENT_DATABASE[clean]) return EQUIPMENT_DATABASE[clean];
  return Object.values(EQUIPMENT_DATABASE).find((eq) => eq.name === clean);
}
