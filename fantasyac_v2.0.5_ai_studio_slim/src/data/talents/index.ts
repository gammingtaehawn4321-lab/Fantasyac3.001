export type TalentType = 'BASIC' | 'SPECIAL';
export type TalentTreeCategory = 'COMMON' | 'WARRIOR' | 'ARCHER' | 'ROGUE' | 'CLERIC' | 'MAGE' | 'DANCER';

export interface TalentNode {
  id: string;
  name: string;
  description: string;
  treeCategory: TalentTreeCategory;
  type: TalentType;
  cost: number;
  maxRank: number;
  requiredLevel?: number;
  prerequisites?: string[];
  statModifiers?: Record<string, number>; // per rank
  effectId?: string;
  position: {
    x: number; // 0 ~ 4 (column in tree grid)
    y: number; // 0 ~ 4 (tier/row in tree grid)
  };
  iconName?: string;
}

export const TALENT_NODES: Record<string, TalentNode> = {
  // ==========================================
  // [공용 재능 트리]
  // ==========================================
  common_robust_body: {
    id: 'common_robust_body',
    name: '강인한 육체',
    description: '기초 체력을 강화하여 랭크당 최대 HP가 +10 및 물리 방어력이 +2 증가합니다.',
    treeCategory: 'COMMON',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 1,
    position: { x: 1, y: 0 },
    statModifiers: {
      maxHp: 10,
      physicalDefense: 2,
    },
    iconName: 'Heart',
  },
  common_mana_expansion: {
    id: 'common_mana_expansion',
    name: '마력 확장',
    description: '정신을 단련하여 랭크당 최대 MP가 +8 및 마법 공격력이 +2 증가합니다.',
    treeCategory: 'COMMON',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 1,
    position: { x: 3, y: 0 },
    statModifiers: {
      maxMp: 8,
      magicAttack: 2,
    },
    iconName: 'Zap',
  },
  common_swift_foot: {
    id: 'common_swift_foot',
    name: '민첩한 몸놀림',
    description: '반사 신경을 발달시켜 랭크당 행동 속도가 +2 및 회피율이 +2% 증가합니다.',
    treeCategory: 'COMMON',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 2,
    prerequisites: ['common_robust_body'],
    position: { x: 0, y: 1 },
    statModifiers: {
      actionSpeed: 2,
      evasion: 2,
    },
    iconName: 'Wind',
  },
  common_keen_eye: {
    id: 'common_keen_eye',
    name: '예리한 안목',
    description: '적의 빈틈을 포착하여 랭크당 치명타 확률이 +2% 및 명중률이 +3 증가합니다.',
    treeCategory: 'COMMON',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 2,
    prerequisites: ['common_mana_expansion'],
    position: { x: 4, y: 1 },
    statModifiers: {
      criticalChance: 2,
      accuracy: 3,
    },
    iconName: 'Eye',
  },
  common_crisis_adrenaline: {
    id: 'common_crisis_adrenaline',
    name: '위기 돌파 (특수)',
    description: '자신의 체력이 35% 이하로 떨어지면 공격력과 방어력이 25% 상승하고 치명타율이 15% 증가합니다.',
    treeCategory: 'COMMON',
    type: 'SPECIAL',
    cost: 2,
    maxRank: 1,
    requiredLevel: 4,
    prerequisites: ['common_swift_foot', 'common_keen_eye'],
    effectId: 'TALENT_CRISIS_ADRENALINE',
    position: { x: 2, y: 2 },
    iconName: 'Flame',
  },

  // ==========================================
  // [전사 전직 트리]
  // ==========================================
  warrior_iron_skin: {
    id: 'warrior_iron_skin',
    name: '강철 피부',
    description: '피부를 무쇠처럼 단단하게 단련하여 랭크당 물리 방어력이 +4, 최대 HP가 +15 증가합니다.',
    treeCategory: 'WARRIOR',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 1, y: 0 },
    statModifiers: {
      physicalDefense: 4,
      maxHp: 15,
    },
    iconName: 'Shield',
  },
  warrior_heavy_muscle: {
    id: 'warrior_heavy_muscle',
    name: '거인의 괴력',
    description: '근육을 극도로 단련하여 랭크당 물리 공격력이 +5 증가합니다.',
    treeCategory: 'WARRIOR',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 3, y: 0 },
    statModifiers: {
      physicalAttack: 5,
    },
    iconName: 'Dumbbell',
  },
  warrior_retaliation: {
    id: 'warrior_retaliation',
    name: '방어 반격 (특수)',
    description: '전투 중 [방어 태세]를 취한 상태에서 적의 공격을 받으면 자동으로 즉각 반격하여 80%의 물리 피해를 돌려줍니다.',
    treeCategory: 'WARRIOR',
    type: 'SPECIAL',
    cost: 2,
    maxRank: 1,
    requiredLevel: 6,
    prerequisites: ['warrior_iron_skin'],
    effectId: 'TALENT_WARRIOR_COUNTER',
    position: { x: 1, y: 1 },
    iconName: 'RotateCw',
  },
  warrior_unyielding_stand: {
    id: 'warrior_unyielding_stand',
    name: '불사신의 의지 (특수)',
    description: '전투 중 치명적인 피해를 받아 사망할 위기에 처했을 때 체력 1로 1회 생존하며 1턴간 모든 피해를 무효화합니다.',
    treeCategory: 'WARRIOR',
    type: 'SPECIAL',
    cost: 3,
    maxRank: 1,
    requiredLevel: 10,
    prerequisites: ['warrior_retaliation', 'warrior_heavy_muscle'],
    effectId: 'TALENT_UNYIELDING_STAND',
    position: { x: 2, y: 2 },
    iconName: 'Sparkles',
  },

  // ==========================================
  // [궁수 전직 트리]
  // ==========================================
  archer_eagle_sight: {
    id: 'archer_eagle_sight',
    name: '매의 시선',
    description: '적의 미세한 틈을 놓치지 않고 랭크당 명중률 +5, 치명타 확률 +3%가 증가합니다.',
    treeCategory: 'ARCHER',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 1, y: 0 },
    statModifiers: {
      accuracy: 5,
      criticalChance: 3,
    },
    iconName: 'Eye',
  },
  archer_wind_walker: {
    id: 'archer_wind_walker',
    name: '바람걸음',
    description: '바람을 타듯 가볍게 움직여 랭크당 행동 속도 +3, 회피율 +3%가 증가합니다.',
    treeCategory: 'ARCHER',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 3, y: 0 },
    statModifiers: {
      actionSpeed: 3,
      evasion: 3,
    },
    iconName: 'Wind',
  },
  archer_headhunter: {
    id: 'archer_headhunter',
    name: '약점 사냥꾼 (특수)',
    description: '적에게 치명타를 적중시키면 대상에게 2턴간 [출혈] 효과를 부여하고 자신의 행동 게이지를 25% 회복합니다.',
    treeCategory: 'ARCHER',
    type: 'SPECIAL',
    cost: 2,
    maxRank: 1,
    requiredLevel: 6,
    prerequisites: ['archer_eagle_sight'],
    effectId: 'TALENT_ARCHER_HEADHUNTER',
    position: { x: 1, y: 1 },
    iconName: 'Target',
  },
  archer_arrow_frenzy: {
    id: 'archer_arrow_frenzy',
    name: '연사 극의 (특수)',
    description: '적을 처치하거나 치명타 발생 시 50% 확률로 이번 턴 즉시 추가 사격을 발동합니다.',
    treeCategory: 'ARCHER',
    type: 'SPECIAL',
    cost: 3,
    maxRank: 1,
    requiredLevel: 10,
    prerequisites: ['archer_headhunter', 'archer_wind_walker'],
    effectId: 'TALENT_ARROW_FRENZY',
    position: { x: 2, y: 2 },
    iconName: 'Zap',
  },

  // ==========================================
  // [도적 전직 트리]
  // ==========================================
  rogue_stealth_step: {
    id: 'rogue_stealth_step',
    name: '발소리 죽이기',
    description: '기척을 숨겨 랭크당 회피율 +4%, 행동 속도 +3이 증가합니다.',
    treeCategory: 'ROGUE',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 1, y: 0 },
    statModifiers: {
      evasion: 4,
      actionSpeed: 3,
    },
    iconName: 'Footprints',
  },
  rogue_venom_blade: {
    id: 'rogue_venom_blade',
    name: '독칼 연마',
    description: '칼날에 맹독을 발라 랭크당 물리 공격력 +4, 치명타 피해 배율 +0.1이 증가합니다.',
    treeCategory: 'ROGUE',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 3, y: 0 },
    statModifiers: {
      physicalAttack: 4,
      criticalDamage: 0.1,
    },
    iconName: 'Skull',
  },
  rogue_evasion_counter: {
    id: 'rogue_evasion_counter',
    name: '회피의 기회 (특수)',
    description: '적의 공격을 회피하는 데 성공하면 다음 공격의 치명타 확률이 100%로 고정됩니다.',
    treeCategory: 'ROGUE',
    type: 'SPECIAL',
    cost: 2,
    maxRank: 1,
    requiredLevel: 6,
    prerequisites: ['rogue_stealth_step'],
    effectId: 'TALENT_ROGUE_EVASION_CRIT',
    position: { x: 1, y: 1 },
    iconName: 'Zap',
  },
  rogue_soul_harvest: {
    id: 'rogue_soul_harvest',
    name: '영혼 강탈 (특수)',
    description: '적을 처치할 때마다 최대 마나의 30%를 즉시 회복하고 루피 획득량이 20% 증가합니다.',
    treeCategory: 'ROGUE',
    type: 'SPECIAL',
    cost: 3,
    maxRank: 1,
    requiredLevel: 10,
    prerequisites: ['rogue_evasion_counter', 'rogue_venom_blade'],
    effectId: 'TALENT_SOUL_HARVEST',
    position: { x: 2, y: 2 },
    iconName: 'Coins',
  },

  // ==========================================
  // [성직자 전직 트리]
  // ==========================================
  cleric_divine_faith: {
    id: 'cleric_divine_faith',
    name: '신앙의 가호',
    description: '기도를 올려 랭크당 마법 방어력 +4, 최대 정신력 +10이 증가합니다.',
    treeCategory: 'CLERIC',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 1, y: 0 },
    statModifiers: {
      magicDefense: 4,
      maxSanity: 10,
    },
    iconName: 'Sun',
  },
  cleric_holy_potency: {
    id: 'cleric_holy_potency',
    name: '성력 강화',
    description: '성스러운 기운을 모아 랭크당 마법 공격력 +4, 최대 MP +10이 증가합니다.',
    treeCategory: 'CLERIC',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 3, y: 0 },
    statModifiers: {
      magicAttack: 4,
      maxMp: 10,
    },
    iconName: 'Sparkles',
  },
  cleric_shield_of_healing: {
    id: 'cleric_shield_of_healing',
    name: '치유의 보호막 (특수)',
    description: '회복 스킬 사용 시 회복량의 50%만큼 대상에게 2턴간 지속되는 신성 보호막(Shield)을 생성합니다.',
    treeCategory: 'CLERIC',
    type: 'SPECIAL',
    cost: 2,
    maxRank: 1,
    requiredLevel: 6,
    prerequisites: ['cleric_divine_faith'],
    effectId: 'TALENT_HEAL_SHIELD',
    position: { x: 1, y: 1 },
    iconName: 'Shield',
  },
  cleric_resurrection_light: {
    id: 'cleric_resurrection_light',
    name: '부활의 성광 (특수)',
    description: '전투 중 아군이나 자신이 쓰러졌을 때 즉시 최대 HP의 40%로 기사회생하며 모든 상태이상을 정화합니다 (전투당 1회).',
    treeCategory: 'CLERIC',
    type: 'SPECIAL',
    cost: 3,
    maxRank: 1,
    requiredLevel: 10,
    prerequisites: ['cleric_shield_of_healing', 'cleric_holy_potency'],
    effectId: 'TALENT_RESURRECTION_LIGHT',
    position: { x: 2, y: 2 },
    iconName: 'Sun',
  },

  // ==========================================
  // [마법사 전직 트리]
  // ==========================================
  mage_arcane_amplification: {
    id: 'mage_arcane_amplification',
    name: '비전 증폭',
    description: '마나 회로를 개방하여 랭크당 마법 공격력 +5, 최대 MP +12가 증가합니다.',
    treeCategory: 'MAGE',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 1, y: 0 },
    statModifiers: {
      magicAttack: 5,
      maxMp: 12,
    },
    iconName: 'Zap',
  },
  mage_mana_circulation: {
    id: 'mage_mana_circulation',
    name: '마나 순환',
    description: '마력의 흐름을 정돈하여 랭크당 상태이상 적중 +4%, 최대 정신력 +8이 증가합니다.',
    treeCategory: 'MAGE',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 3, y: 0 },
    statModifiers: {
      statusHitRate: 4,
      maxSanity: 8,
    },
    iconName: 'RotateCw',
  },
  mage_spell_accelerator: {
    id: 'mage_spell_accelerator',
    name: '주문 가속 (특수)',
    description: '마법 공격 성공 시 35% 확률로 자신의 다음 턴 행동 속도가 25% 상승하고 MP를 10 회복합니다.',
    treeCategory: 'MAGE',
    type: 'SPECIAL',
    cost: 2,
    maxRank: 1,
    requiredLevel: 6,
    prerequisites: ['mage_arcane_amplification'],
    effectId: 'TALENT_SPELL_ACCELERATOR',
    position: { x: 1, y: 1 },
    iconName: 'Sparkles',
  },
  mage_destruction_mastery: {
    id: 'mage_destruction_mastery',
    name: '파멸의 마도학 (특수)',
    description: '모든 마법 스킬의 피해량이 25% 폭발적으로 증가하며 적의 마법 방어력을 20% 관통합니다.',
    treeCategory: 'MAGE',
    type: 'SPECIAL',
    cost: 3,
    maxRank: 1,
    requiredLevel: 10,
    prerequisites: ['mage_spell_accelerator', 'mage_mana_circulation'],
    effectId: 'TALENT_DESTRUCTION_MASTERY',
    position: { x: 2, y: 2 },
    iconName: 'Flame',
  },

  // ==========================================
  // [무희 전직 트리]
  // ==========================================
  dancer_nimble_acrobat: {
    id: 'dancer_nimble_acrobat',
    name: '유연한 도약',
    description: '깃털 같은 발놀림으로 랭크당 회피율 +4%, 행동 속도 +3이 증가합니다.',
    treeCategory: 'DANCER',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 1, y: 0 },
    statModifiers: {
      evasion: 4,
      actionSpeed: 3,
    },
    iconName: 'Wind',
  },
  dancer_alluring_aura: {
    id: 'dancer_alluring_aura',
    name: '매혹의 자태',
    description: '시선을 사로잡는 분위기를 풍겨 랭크당 상태이상 적중 +4%, 치명타 확률 +3%가 증가합니다.',
    treeCategory: 'DANCER',
    type: 'BASIC',
    cost: 1,
    maxRank: 3,
    requiredLevel: 3,
    position: { x: 3, y: 0 },
    statModifiers: {
      statusHitRate: 4,
      criticalChance: 3,
    },
    iconName: 'HeartHandshake',
  },
  dancer_chakram_flow: {
    id: 'dancer_chakram_flow',
    name: '차크람 곡예 (특수)',
    description: '쌍수 무기 착용 시 보조 무기의 피해 반영 효율이 100%로 상승하고 30% 확률로 추가 연격을 발동합니다.',
    treeCategory: 'DANCER',
    type: 'SPECIAL',
    cost: 2,
    maxRank: 1,
    requiredLevel: 6,
    prerequisites: ['dancer_nimble_acrobat'],
    effectId: 'TALENT_CHAKRAM_FLOW',
    position: { x: 1, y: 1 },
    iconName: 'Disc',
  },
  dancer_climax_carnival: {
    id: 'dancer_climax_carnival',
    name: '절정의 카니발 (특수)',
    description: '적에게 매혹이나 상태이상을 적중시킬 때마다 모든 아군의 공격력과 회피율이 3턴간 25% 폭발적으로 고양됩니다.',
    treeCategory: 'DANCER',
    type: 'SPECIAL',
    cost: 3,
    maxRank: 1,
    requiredLevel: 10,
    prerequisites: ['dancer_chakram_flow', 'dancer_alluring_aura'],
    effectId: 'TALENT_CLIMAX_CARNIVAL',
    position: { x: 2, y: 2 },
    iconName: 'Sparkles',
  },
};

export function getTalentsByCategory(category: TalentTreeCategory): TalentNode[] {
  return Object.values(TALENT_NODES).filter((t) => t.treeCategory === category);
}

export function getTalentNode(talentId: string): TalentNode | undefined {
  return TALENT_NODES[talentId];
}
