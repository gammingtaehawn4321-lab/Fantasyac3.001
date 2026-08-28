import { PlayerStats } from '../../types';
import { CombatDerivedStats } from '../combatConfig';

export type CombatClassType =
  | 'NONE'
  | 'WARRIOR'
  | 'ARCHER'
  | 'ROGUE'
  | 'CLERIC'
  | 'DANCER'
  | 'MAGE'
  | 'DRAGON_EMPEROR';

export interface ClassRequirement {
  type: 'LEVEL' | 'STAT' | 'TALENT' | 'STORY_FLAG';
  target: string;
  value: number | string;
  description: string;
}

export interface EvolutionPassiveDefinition {
  id: string;
  name: string;
  description: string;
  statBonuses?: Partial<CombatDerivedStats>;
  traitIds?: string[];
}

export interface ClassEvolutionDefinition {
  id: string;
  fromClassId: CombatClassType;
  toClassId: string;
  evolutionTier: number; // 2 = 1차 진화, 3 = 2차 진화
  evolutionName: string; // e.g. "대검전사", "아케인 메이지"
  weaponSpecialization: string; // e.g. "대검 (양손)", "쌍성구 (마법)"
  requiredLevel: number;
  requirements?: ClassRequirement[];
  description: string;
  statBonuses?: Partial<CombatDerivedStats>;
  /** 심화 전직 직후 자동으로 사용할 수 있는 전용 액티브. */
  grantedSkillIds?: string[];
  /** 심화 전직 자체가 항상 제공하는 고유 패시브. */
  passive?: EvolutionPassiveDefinition;
}

export interface CombatClassDefinition {
  id: CombatClassType;
  name: string;
  role: string;
  description: string;
  primaryStats: (keyof PlayerStats)[];
  statGrowthModifiers: Partial<CombatDerivedStats>;
  unlockLevel: number;
  initialSkillIds: string[];
  talentCategory: 'WARRIOR' | 'ARCHER' | 'ROGUE' | 'CLERIC' | 'DANCER' | 'MAGE' | 'DRAGON';
  color: string;
  badgeBorder: string;
  iconSymbol: string;
  recommendedArmor: 'LIGHT' | 'HEAVY' | 'CLOTH';
  evolutions: ClassEvolutionDefinition[];
}

export const COMBAT_CLASSES: Record<CombatClassType, CombatClassDefinition | null> = {
  NONE: null,

  WARRIOR: {
    id: 'WARRIOR',
    name: '전사',
    role: '근접 방어 및 물리 파괴',
    description: '강인한 육체와 중갑으로 전선을 사수하고 묵직한 무기로 적의 방어를 분쇄하는 불굴의 투사입니다.',
    primaryStats: ['vitality', 'strength'],
    statGrowthModifiers: {
      physicalAttack: 3,
      physicalDefense: 3,
    },
    unlockLevel: 5,
    initialSkillIds: ['warrior_heavy_strike', 'warrior_shield_bash'],
    talentCategory: 'WARRIOR',
    color: 'text-amber-400',
    badgeBorder: 'border-amber-500/50 bg-amber-950/30',
    iconSymbol: '⚔️',
    recommendedArmor: 'HEAVY',
    evolutions: [
      {
        id: 'evo_greatsword_warrior',
        fromClassId: 'WARRIOR',
        toClassId: 'GREATSWORD_WARRIOR',
        evolutionTier: 2,
        evolutionName: '대검전사',
        weaponSpecialization: '대검 (양손무기)',
        requiredLevel: 20,
        description: '거대한 대검으로 광범위한 적의 가드를 일격에 분쇄하고 전장을 제압합니다.',
        statBonuses: { physicalAttack: 12, physicalPenetration: 8, tenacity: 10 },

        grantedSkillIds: ['greatsword_ruin_cleave', 'greatsword_guard_breaker', 'greatsword_iron_stride'],
        passive: {
          id: 'passive_greatsword_overwhelming_weight',
          name: '압도적인 중량',
          description: '대검의 무게를 공격에 온전히 실어 강타와 방어 파괴 능력을 강화합니다.',
          statBonuses: { physicalAttack: 6, physicalPenetration: 5, tenacity: 5 },
          traitIds: ['EVOLUTION_GREATSWORD_WEIGHT'],
        },
      },
      {
        id: 'evo_spearman',
        fromClassId: 'WARRIOR',
        toClassId: 'SPEARMAN',
        evolutionTier: 2,
        evolutionName: '창술사',
        weaponSpecialization: '창 (양손무기)',
        requiredLevel: 20,
        description: '긴 리치를 활용하여 적의 접근을 원천 차단하고 급소를 정확히 관통합니다.',
        statBonuses: { physicalAttack: 10, accuracy: 12, physicalPenetration: 10 },

        grantedSkillIds: ['spearman_piercing_line', 'spearman_sweeping_arc', 'spearman_watchful_reach'],
        passive: {
          id: 'passive_spearman_controlled_distance',
          name: '간격 지배',
          description: '창의 사거리를 이용해 명중과 관통, 행동 속도를 안정적으로 끌어올립니다.',
          statBonuses: { accuracy: 6, physicalPenetration: 5, actionSpeed: 3 },
          traitIds: ['EVOLUTION_SPEARMAN_REACH'],
        },
      },
      {
        id: 'evo_swordsman',
        fromClassId: 'WARRIOR',
        toClassId: 'SWORDSMAN',
        evolutionTier: 2,
        evolutionName: '검술사',
        weaponSpecialization: '검 & 방패 (한손무기)',
        requiredLevel: 20,
        description: '완벽한 검술과 방패 방어로 적의 공세를 흘려내고 빈틈을 노려 반격합니다.',
        statBonuses: { physicalDefense: 10, physicalAttack: 8, tenacity: 8 },

        grantedSkillIds: ['swordsman_guard_slash', 'swordsman_counter_form', 'swordsman_unbroken_guard'],
        passive: {
          id: 'passive_swordsman_perfect_form',
          name: '정형의 검술',
          description: '공격과 방어의 균형을 유지해 방어와 강인함, 명중을 높입니다.',
          statBonuses: { physicalDefense: 6, tenacity: 5, accuracy: 4 },
          traitIds: ['EVOLUTION_SWORDSMAN_FORM'],
        },
      },
      {
        id: 'evo_dual_swordsman',
        fromClassId: 'WARRIOR',
        toClassId: 'DUAL_SWORDSMAN',
        evolutionTier: 2,
        evolutionName: '쌍검술사',
        weaponSpecialization: '쌍검 (쌍수무기)',
        requiredLevel: 20,
        description: '양손에 검을 쥐고 쉼 없이 몰아치는 연속 참격으로 적을 압도합니다.',
        statBonuses: { physicalAttack: 10, actionSpeed: 4, criticalChance: 6 },

        grantedSkillIds: ['dual_swords_crosscut', 'dual_swords_blade_storm', 'dual_swords_accelerando'],
        passive: {
          id: 'passive_dual_swords_chain',
          name: '쌍검 연쇄',
          description: '두 자루의 흐름을 끊지 않아 공격 속도와 치명타 능력을 강화합니다.',
          statBonuses: { actionSpeed: 5, criticalChance: 5, physicalAttack: 4 },
          traitIds: ['EVOLUTION_DUAL_SWORDS_CHAIN'],
        },
      },
    ],
  },

  ARCHER: {
    id: 'ARCHER',
    name: '궁수',
    role: '원거리 정밀 저격 및 기동전',
    description: '원거리에서 적의 급소를 꿰뚫고 탁월한 거리 조절과 기동성으로 전장을 장악하는 명사수입니다.',
    primaryStats: ['agility', 'luck'],
    statGrowthModifiers: {
      accuracy: 6,
      criticalChance: 4,
      actionSpeed: 3,
    },
    unlockLevel: 5,
    initialSkillIds: ['archer_precision_shot', 'archer_poison_arrow'],
    talentCategory: 'ARCHER',
    color: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/50 bg-emerald-950/30',
    iconSymbol: '🏹',
    recommendedArmor: 'LIGHT',
    evolutions: [
      {
        id: 'evo_battleshooter',
        fromClassId: 'ARCHER',
        toClassId: 'BATTLESHOOTER',
        evolutionTier: 2,
        evolutionName: '배틀슈터',
        weaponSpecialization: '석궁 (양손무기)',
        requiredLevel: 20,
        description: '중장거리에서 묵직한 볼트를 연속 발사하여 적의 중갑을 꿰뚫는 돌파형 사수입니다.',
        statBonuses: { physicalAttack: 12, physicalPenetration: 12, criticalChance: 6 },

        grantedSkillIds: ['battleshooter_armor_bolt', 'battleshooter_suppressive_volley', 'battleshooter_braced_aim'],
        passive: {
          id: 'passive_battleshooter_heavy_bolt',
          name: '중볼트 장전',
          description: '석궁의 반동을 제어해 공격력과 관통력을 높이고 흔들림을 억제합니다.',
          statBonuses: { physicalAttack: 5, physicalPenetration: 6, tenacity: 3 },
          traitIds: ['EVOLUTION_BATTLESHOOTER_HEAVY_BOLT'],
        },
      },
      {
        id: 'evo_sniper',
        fromClassId: 'ARCHER',
        toClassId: 'SNIPER',
        evolutionTier: 2,
        evolutionName: '스나이퍼',
        weaponSpecialization: '장궁 (양손무기)',
        requiredLevel: 20,
        description: '초장거리에서 숨을 죽인 채 적의 급소를 단 한 발로 저격하는 저격수입니다.',
        statBonuses: { accuracy: 20, criticalChance: 10, criticalDamage: 0.3 },

        grantedSkillIds: ['sniper_deadeye', 'sniper_breath_control', 'sniper_finishing_shot'],
        passive: {
          id: 'passive_sniper_stillness',
          name: '무풍의 조준',
          description: '움직임을 최소화할수록 명중과 치명타 위력이 극대화됩니다.',
          statBonuses: { accuracy: 8, criticalChance: 5, criticalDamage: 0.15 },
          traitIds: ['EVOLUTION_SNIPER_STILLNESS'],
        },
      },
      {
        id: 'evo_sylph',
        fromClassId: 'ARCHER',
        toClassId: 'SYLPH',
        evolutionTier: 2,
        evolutionName: '실프',
        weaponSpecialization: '윈드보우 (한손)',
        requiredLevel: 20,
        description: '바람 정령의 가호를 받아 고속 기동하며 폭풍 같은 화살비를 퍼붓습니다.',
        statBonuses: { actionSpeed: 8, evasion: 8, criticalChance: 5 },

        grantedSkillIds: ['sylph_gale_arrow', 'sylph_wind_rain', 'sylph_tailwind_step'],
        passive: {
          id: 'passive_sylph_windstep',
          name: '바람걸음',
          description: '바람의 흐름에 몸을 실어 행동 속도와 회피를 강화합니다.',
          statBonuses: { actionSpeed: 5, evasion: 5, criticalChance: 3 },
          traitIds: ['EVOLUTION_SYLPH_WINDSTEP'],
        },
      },
      {
        id: 'evo_master_archer',
        fromClassId: 'ARCHER',
        toClassId: 'MASTER_ARCHER',
        evolutionTier: 2,
        evolutionName: '아처',
        weaponSpecialization: '단궁 (한손)',
        requiredLevel: 20,
        description: '유연한 사격술로 근거리와 중거리를 오가며 다양한 특수 화살을 다룹니다.',
        statBonuses: { accuracy: 12, actionSpeed: 5, criticalChance: 6 },

        grantedSkillIds: ['master_archer_snap_shot', 'master_archer_trick_arrow', 'master_archer_mobile_barrage'],
        passive: {
          id: 'passive_master_archer_adaptability',
          name: '유연한 사격술',
          description: '거리와 상황에 맞춰 사격 자세를 바꾸며 명중과 속도를 높입니다.',
          statBonuses: { accuracy: 6, actionSpeed: 4, criticalChance: 3 },
          traitIds: ['EVOLUTION_MASTER_ARCHER_ADAPT'],
        },
      },
    ],
  },

  ROGUE: {
    id: 'ROGUE',
    name: '도적',
    role: '암습 및 치명적 상태이상',
    description: '그림자 속에 몸을 숨긴 채 적의 배후를 급습하고, 맹독과 출혈로 적을 고사시키는 은밀한 암살자입니다.',
    primaryStats: ['agility', 'strength'],
    statGrowthModifiers: {
      evasion: 5,
      criticalDamage: 0.15,
      actionSpeed: 4,
    },
    unlockLevel: 5,
    initialSkillIds: ['rogue_ambush', 'rogue_shadow_strike'],
    talentCategory: 'ROGUE',
    color: 'text-purple-400',
    badgeBorder: 'border-purple-500/50 bg-purple-950/30',
    iconSymbol: '🗡️',
    recommendedArmor: 'LIGHT',
    evolutions: [
      {
        id: 'evo_dual_blade',
        fromClassId: 'ROGUE',
        toClassId: 'DUAL_BLADE',
        evolutionTier: 2,
        evolutionName: '듀얼블레이드',
        weaponSpecialization: '블레이드 ×2 (쌍수)',
        requiredLevel: 20,
        description: '양손의 칼날에 각각 다른 독과 출혈을 묻혀 쉴 틈 없는 치명타를 가합니다.',
        statBonuses: { physicalAttack: 10, criticalChance: 10, actionSpeed: 6 },

        grantedSkillIds: ['dual_blade_twin_fang', 'dual_blade_blood_dance', 'dual_blade_afterimage'],
        passive: {
          id: 'passive_dual_blade_double_edge',
          name: '쌍날의 리듬',
          description: '연속 공격의 흐름을 유지해 치명타와 속도를 끌어올립니다.',
          statBonuses: { physicalAttack: 5, criticalChance: 6, actionSpeed: 4 },
          traitIds: ['EVOLUTION_DUAL_BLADE_RHYTHM'],
        },
      },
      {
        id: 'evo_assassin',
        fromClassId: 'ROGUE',
        toClassId: 'ASSASSIN',
        evolutionTier: 2,
        evolutionName: '암살자',
        weaponSpecialization: '암살 단도 (한손)',
        requiredLevel: 20,
        description: '그림자 은신과 기습에 특화되어 적이 반응하기도 전에 치명상을 입힙니다.',
        statBonuses: { criticalDamage: 0.4, evasion: 10, physicalPenetration: 10 },

        grantedSkillIds: ['assassin_silent_entry', 'assassin_vital_execution', 'assassin_smoke_exit'],
        passive: {
          id: 'passive_assassin_killing_intent',
          name: '살의 은폐',
          description: '기습의 순간까지 기척을 지워 치명타 피해와 관통, 회피를 강화합니다.',
          statBonuses: { criticalDamage: 0.2, physicalPenetration: 5, evasion: 5 },
          traitIds: ['EVOLUTION_ASSASSIN_INTENT'],
        },
      },
      {
        id: 'evo_thief',
        fromClassId: 'ROGUE',
        toClassId: 'THIEF',
        evolutionTier: 2,
        evolutionName: '씨프',
        weaponSpecialization: '도둑 단검 & 도구 주머니',
        requiredLevel: 20,
        description: '정면 암살보다 빠른 손놀림과 교란, 전투 자원 탈취에 특화된 기동형 도적입니다.',
        statBonuses: { evasion: 8, actionSpeed: 7, accuracy: 8, maxCost: 2 },
        grantedSkillIds: ['thief_quick_fingers', 'thief_loot_mark', 'thief_escape_route'],
        passive: {
          id: 'passive_thief_light_fingers',
          name: '눈보다 빠른 손',
          description: '전투의 빈틈을 재빨리 훔쳐 행동 자원을 확보합니다. 씨프 전용 기술의 전투 자원 운용이 크게 안정됩니다.',
          statBonuses: { actionSpeed: 4, evasion: 4, costRegen: 1 },
          traitIds: ['EVOLUTION_THIEF_LIGHT_FINGERS'],
        },
      },
    ],
  },

  CLERIC: {
    id: 'CLERIC',
    name: '성직자',
    role: '신성 치유 및 방어 지원',
    description: '신성한 빛의 권능으로 아군의 상처를 어루만지고, 수호 방벽과 정화로 위기를 극복하는 성스러운 사제입니다.',
    primaryStats: ['spirit', 'intelligence'],
    statGrowthModifiers: {
      magicAttack: 3,
      magicDefense: 4,
    },
    unlockLevel: 5,
    initialSkillIds: ['cleric_divine_heal', 'cleric_holy_smite'],
    talentCategory: 'CLERIC',
    color: 'text-sky-300',
    badgeBorder: 'border-sky-500/50 bg-sky-950/30',
    iconSymbol: '✨',
    recommendedArmor: 'CLOTH',
    evolutions: [
      {
        id: 'evo_priest',
        fromClassId: 'CLERIC',
        toClassId: 'PRIEST',
        evolutionTier: 2,
        evolutionName: '사제',
        weaponSpecialization: '홀리 케인 (마법형)',
        requiredLevel: 20,
        description: '강력한 신성 축복과 정화 의식으로 아군을 보호하고 악을 심판합니다.',
        statBonuses: { magicAttack: 10, magicDefense: 10, statusResistance: 15 },

        grantedSkillIds: ['priest_benediction', 'priest_purifying_light', 'priest_holy_sentence'],
        passive: {
          id: 'passive_priest_blessed_prayer',
          name: '축복의 기도',
          description: '기도가 안정되어 마법 공격과 마법 방어, 상태이상 저항이 강화됩니다.',
          statBonuses: { magicAttack: 5, magicDefense: 5, statusResistance: 6 },
          traitIds: ['EVOLUTION_PRIEST_PRAYER'],
        },
      },
      {
        id: 'evo_monk',
        fromClassId: 'CLERIC',
        toClassId: 'MONK',
        evolutionTier: 2,
        evolutionName: '수도사',
        weaponSpecialization: '너클 (근접 격투 마법형)',
        requiredLevel: 20,
        description: '신성력을 신체에 두르고 직접 적을 타격하는 근접 전투형 성직자입니다.',
        statBonuses: { physicalAttack: 10, physicalDefense: 8, tenacity: 10 },

        grantedSkillIds: ['monk_sacred_fist', 'monk_purifying_combo', 'monk_breathing_guard'],
        passive: {
          id: 'passive_monk_body_temple',
          name: '육신의 성전',
          description: '신성력을 몸에 순환시켜 물리 공격과 방어, 강인함을 강화합니다.',
          statBonuses: { physicalAttack: 5, physicalDefense: 5, tenacity: 6 },
          traitIds: ['EVOLUTION_MONK_BODY_TEMPLE'],
        },
      },
      {
        id: 'evo_healer',
        fromClassId: 'CLERIC',
        toClassId: 'HEALER',
        evolutionTier: 2,
        evolutionName: '힐러',
        weaponSpecialization: '성자의 스태프 (마법형)',
        requiredLevel: 20,
        description: '치유와 재생 마법의 정점에 도달하여 빈사의 아군도 즉시 소생시킵니다.',
        statBonuses: { magicDefense: 12, maxMp: 50, maxSanity: 30 },

        grantedSkillIds: ['healer_greater_heal', 'healer_group_prayer', 'healer_life_guard'],
        passive: {
          id: 'passive_healer_overflowing_grace',
          name: '넘치는 은총',
          description: '회복 마력이 넘쳐 마력량과 방어, 치유 운용 안정성이 증가합니다.',
          statBonuses: { magicAttack: 4, magicDefense: 6, maxMp: 30, maxSanity: 15 },
          traitIds: ['EVOLUTION_HEALER_GRACE'],
        },
      },
      {
        id: 'evo_holy_knight',
        fromClassId: 'CLERIC',
        toClassId: 'HOLY_KNIGHT',
        evolutionTier: 2,
        evolutionName: '홀리나이트',
        weaponSpecialization: '성검 & 성방패 (한손/방패)',
        requiredLevel: 20,
        description: '신성력을 갑주와 방패에 두르고 적의 시선을 끌어 아군 대신 공격을 받아내는 성기사입니다.',
        statBonuses: { physicalDefense: 12, magicDefense: 12, statusResistance: 12, tenacity: 10 },
        grantedSkillIds: ['holy_knight_judgment', 'holy_knight_guardian_field', 'holy_knight_oath'],
        passive: {
          id: 'passive_holy_knight_oathbound',
          name: '수호의 맹세',
          description: '전열에서 버틸수록 신성력이 안정됩니다. 방어와 상태이상 저항을 강화하고 홀리나이트의 수호 기술을 보조합니다.',
          statBonuses: { physicalDefense: 6, magicDefense: 6, statusResistance: 6, maxHp: 80 },
          traitIds: ['EVOLUTION_HOLY_KNIGHT_OATHBOUND'],
        },
      },
    ],
  },

  MAGE: {
    id: 'MAGE',
    name: '마법사',
    role: '비전 마법 및 광역 파괴',
    description: '원소와 비전 마력을 탐구하여 공간을 뒤흔드는 고위력 주문과 상태이상을 다루는 학자형 마도사입니다.',
    primaryStats: ['intelligence', 'spirit'],
    statGrowthModifiers: {
      magicAttack: 5,
      magicDefense: 3,
    },
    unlockLevel: 5,
    initialSkillIds: ['mage_firebolt', 'mage_arcane_burst'],
    talentCategory: 'MAGE',
    color: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/50 bg-indigo-950/30',
    iconSymbol: '🔮',
    recommendedArmor: 'CLOTH',
    evolutions: [
      {
        id: 'evo_arcane_mage',
        fromClassId: 'MAGE',
        toClassId: 'ARCANE_MAGE',
        evolutionTier: 2,
        evolutionName: '아케인 메이지',
        weaponSpecialization: '쌍성구 (비전 마법구)',
        requiredLevel: 20,
        description: '순수 비전 마력과 별빛을 다루며 다채롭고 연속적인 마법 폭격을 가합니다.',
        statBonuses: { magicAttack: 16, statusHitRate: 15, maxMp: 60 },

        grantedSkillIds: ['arcane_mage_star_lance', 'arcane_mage_mana_storm', 'arcane_mage_overflow'],
        passive: {
          id: 'passive_arcane_mage_pure_formula',
          name: '순수 비전식',
          description: '순수한 비전 공식을 다뤄 마법 공격과 상태 적중, 마나 한계를 높입니다.',
          statBonuses: { magicAttack: 7, statusHitRate: 6, maxMp: 25 },
          traitIds: ['EVOLUTION_ARCANE_FORMULA'],
        },
      },
      {
        id: 'evo_magic_knight',
        fromClassId: 'MAGE',
        toClassId: 'MAGIC_KNIGHT',
        evolutionTier: 2,
        evolutionName: '마법검사',
        weaponSpecialization: '마법검 & 아뮬렛 (마력검)',
        requiredLevel: 20,
        description: '주문 공식을 검술에 압축해 근거리에서 비전 마력을 폭발시키고 마력 방벽으로 반격 각을 만드는 전투 마도사입니다.',
        statBonuses: { magicAttack: 14, physicalAttack: 4, magicDefense: 8, magicPenetration: 10, maxCost: 3 },
        grantedSkillIds: ['magic_knight_spellblade', 'magic_knight_arcane_cleave', 'magic_knight_aegis'],
        passive: {
          id: 'passive_magic_knight_resonance',
          name: '마검 공명',
          description: '검에 흐르는 비전 회로와 자신의 마력 회로를 동기화합니다. 마법 공격과 비전 관통, 전투 자원 운용이 강화됩니다.',
          statBonuses: { magicAttack: 6, magicPenetration: 5, costRegen: 1 },
          traitIds: ['EVOLUTION_MAGIC_KNIGHT_RESONANCE'],
        },
      },
      {
        id: 'evo_wizard',
        fromClassId: 'MAGE',
        toClassId: 'WIZARD',
        evolutionTier: 2,
        evolutionName: '위자드',
        weaponSpecialization: '커스드 스태프 (저주 지팡이)',
        requiredLevel: 20,
        description: '심연의 저주와 파멸적인 원소 마법으로 적의 저항력을 붕괴시킵니다.',
        statBonuses: { magicAttack: 18, magicDefense: 8, magicPenetration: 8 },

        grantedSkillIds: ['wizard_curse_bolt', 'wizard_ruin_nova', 'wizard_dark_formula'],
        passive: {
          id: 'passive_wizard_forbidden_formula',
          name: '금단 공식',
          description: '저주와 파괴 주문의 효율을 높여 마법 공격과 관통을 강화합니다.',
          statBonuses: { magicAttack: 8, magicPenetration: 6, statusHitRate: 5 },
          traitIds: ['EVOLUTION_WIZARD_FORBIDDEN'],
        },
      },
      {
        id: 'evo_crow',
        fromClassId: 'MAGE',
        toClassId: 'CROW',
        evolutionTier: 2,
        evolutionName: '크로우',
        weaponSpecialization: '포이즌 코어 (독성 마도구)',
        requiredLevel: 20,
        description: '맹독과 오염, 지속 피해를 전장에 살포하여 적들을 서서히 고사시킵니다.',
        statBonuses: { statusHitRate: 25, magicAttack: 12, actionSpeed: 4 },

        grantedSkillIds: ['crow_venom_orb', 'crow_plague_cloud', 'crow_toxic_step'],
        passive: {
          id: 'passive_crow_venom_core',
          name: '독성 핵',
          description: '독과 오염을 다루는 정밀도가 높아져 상태 적중과 행동 속도가 증가합니다.',
          statBonuses: { statusHitRate: 10, magicAttack: 5, actionSpeed: 3 },
          traitIds: ['EVOLUTION_CROW_VENOM'],
        },
      },
    ],
  },

  DRAGON_EMPEROR: {
    id: 'DRAGON_EMPEROR',
    name: '용왕',
    role: '용족 전용 · 용숨결 · 용린 방벽 · 전장 위압',
    description: '용족만이 선택할 수 있는 기본 전투 직업입니다. 수호신의 혈통을 다루는 법을 익혀 용숨결과 용린, 왕의 위엄으로 공격과 수호를 동시에 수행합니다.',
    primaryStats: ['spirit', 'vitality', 'strength'],
    statGrowthModifiers: { physicalAttack: 3, magicAttack: 4, physicalDefense: 3, magicDefense: 4, statusResistance: 5 },
    unlockLevel: 5,
    initialSkillIds: ['dragon_emperor_sovereign_roar', 'dragon_emperor_ancestral_flame', 'dragon_emperor_scale_domain'],
    talentCategory: 'DRAGON',
    color: 'text-amber-200',
    badgeBorder: 'border-amber-300/60 bg-amber-950/30',
    iconSymbol: '🐉',
    recommendedArmor: 'HEAVY',
    evolutions: [
      {
        id: 'evo_inferno_wyrm', fromClassId: 'DRAGON_EMPEROR', toClassId: 'INFERNO_WYRM', evolutionTier: 2,
        evolutionName: '업화의 비룡', weaponSpecialization: '업화 · 공격 누적형', requiredLevel: 20,
        description: '공격을 거듭할수록 불꽃을 축적하고, 임계점에서 업화의 용제로 현현하여 전장을 불태웁니다.',
        statBonuses: { physicalAttack: 12, magicAttack: 16, criticalChance: 6, elementalPenetration: 8 },
        grantedSkillIds: ['inferno_wyrm_ember_fang','inferno_wyrm_blazing_wings','inferno_wyrm_furnace_heart'],
        passive: { id:'passive_inferno_wyrm_flame', name:'업화의 용맥', description:'공격 적중으로 『불꽃』을 축적합니다. 화염 공격은 더 많은 불꽃을 얻으며 100에 도달하면 『용제』로 현현합니다.', statBonuses:{physicalAttack:6,magicAttack:8}, traitIds:['EVOLUTION_DRAGON_INFERNO'] },
      },
      {
        id: 'evo_heavenly_water_serpent', fromClassId: 'DRAGON_EMPEROR', toClassId: 'HEAVENLY_WATER_SERPENT', evolutionTier: 2,
        evolutionName: '천수의 사룡', weaponSpecialization: '천수 · 생명/회복 누적형', requiredLevel: 20,
        description: '생명과 초목을 북돋는 천수를 다루며, 회복을 거듭해 생명력이 충만해지면 치유의 용제로 현현합니다.',
        statBonuses: { magicAttack: 14, magicDefense: 12, maxMp: 45, statusResistance: 10 },
        grantedSkillIds: ['water_serpent_vital_sprout','water_serpent_heavenly_rain','water_serpent_verdant_sanctuary'],
        passive: { id:'passive_water_serpent_tide', name:'천수의 순환', description:'회복 행동과 실제 회복량으로 『천수』를 축적합니다. 100에 도달하면 『용제』로 현현합니다.', statBonuses:{magicAttack:7,magicDefense:6,maxMp:25}, traitIds:['EVOLUTION_DRAGON_WATER'] },
      },
      {
        id: 'evo_thunder_celestial_dragon', fromClassId: 'DRAGON_EMPEROR', toClassId: 'THUNDER_CELESTIAL_DRAGON', evolutionTier: 2,
        evolutionName: '뇌명의 천룡', weaponSpecialization: '뇌명 · 추가 공격/치명타 누적형', requiredLevel: 20,
        description: '번개의 속도로 추가 공격을 이어가고 치명타를 터뜨려 뇌명을 축적한 뒤 천뢰의 용제로 현현합니다.',
        statBonuses: { physicalAttack: 10, magicAttack: 12, actionSpeed: 9, criticalChance: 12, criticalDamage: 0.2 },
        grantedSkillIds: ['thunder_dragon_flash_claw','thunder_dragon_chain_heaven','thunder_dragon_storm_crown'],
        passive: { id:'passive_thunder_dragon_echo', name:'천뢰의 잔향', description:'공격 적중 시 추가 번개 공격이 발생할 수 있고, 추가 공격과 치명타로 『뇌명』을 축적합니다. 100에 도달하면 『용제』로 현현합니다.', statBonuses:{actionSpeed:5,criticalChance:6,criticalDamage:0.1}, traitIds:['EVOLUTION_DRAGON_THUNDER'] },
      },
      {
        id: 'evo_frost_cold_dragon', fromClassId: 'DRAGON_EMPEROR', toClassId: 'FROST_COLD_DRAGON', evolutionTier: 2,
        evolutionName: '서리의 한룡', weaponSpecialization: '서리 · 피격/보호막 누적형', requiredLevel: 20,
        description: '피해를 견디고 보호막을 겹겹이 두르며 서리를 축적해, 난공불락의 한빙 용제로 현현합니다.',
        statBonuses: { physicalDefense: 15, magicDefense: 15, maxHp: 140, tenacity: 12 },
        grantedSkillIds: ['frost_dragon_glacial_fang','frost_dragon_rime_scale','frost_dragon_frozen_bastion'],
        passive: { id:'passive_frost_dragon_endure', name:'한룡의 축빙', description:'피격과 보호막 생성으로 『서리』를 축적합니다. 100에 도달하면 『용제』로 현현합니다.', statBonuses:{physicalDefense:8,magicDefense:8,tenacity:6}, traitIds:['EVOLUTION_DRAGON_FROST'] },
      },
    ],
  },

  DANCER: {
    id: 'DANCER',
    name: '무희',
    role: '전장 교란, 고속 회피 및 쌍수 차크람 연격 (여성 전용)',
    description: '매혹적인 춤사위와 쌍수 차크람의 궤적으로 적의 시야를 교란하고 찰나의 빈틈을 베어 넘기는 여성 전용 클래스입니다.',
    primaryStats: ['agility', 'luck'],
    statGrowthModifiers: {
      evasion: 7,
      actionSpeed: 5,
      criticalChance: 4,
    },
    unlockLevel: 5,
    initialSkillIds: ['dancer_chakram_slash', 'dancer_alluring_step'],
    talentCategory: 'DANCER',
    color: 'text-rose-400',
    badgeBorder: 'border-rose-500/50 bg-rose-950/30',
    iconSymbol: '💃',
    recommendedArmor: 'CLOTH',
    evolutions: [
      {
        id: 'evo_succubus',
        fromClassId: 'DANCER',
        toClassId: 'SUCCUBUS',
        evolutionTier: 2,
        evolutionName: '서큐버스',
        weaponSpecialization: '사념 (마법형)',
        requiredLevel: 20,
        description: '강력한 사념의 파동과 매혹, 정신 간섭 마법으로 적을 농락하고 생명력을 흡수합니다.',
        statBonuses: { magicAttack: 16, statusHitRate: 20, maxMp: 40, maxSanity: 25 },

        grantedSkillIds: ['succubus_seduction', 'succubus_soul_drain', 'succubus_mind_blast'],
        passive: {
          id: 'passive_succubus_mental_pressure',
          name: '사념 압력',
          description: '사념의 밀도를 높여 마법 공격과 상태이상 적중, 정신력을 강화합니다.',
          statBonuses: { magicAttack: 6, statusHitRate: 8, maxSanity: 15 },
          traitIds: ['EVOLUTION_SUCCUBUS_PRESSURE'],
        },
      },
      {
        id: 'evo_blade_dancer',
        fromClassId: 'DANCER',
        toClassId: 'BLADE_DANCER',
        evolutionTier: 2,
        evolutionName: '검무희',
        weaponSpecialization: '처형도 (쌍수)',
        requiredLevel: 20,
        description: '매혹과 교란으로 적의 급소를 노출시킨 뒤, 쌍수 처형도로 고속 연격을 퍼부어 단숨에 처형합니다.',
        statBonuses: { physicalAttack: 14, criticalChance: 12, actionSpeed: 8, physicalPenetration: 10 },

        grantedSkillIds: ['bladedancer_flurry', 'bladedancer_execution', 'bladedancer_crescent_step'],
        passive: {
          id: 'passive_blade_dancer_execution_rhythm',
          name: '처형의 박자',
          description: '춤과 참격의 박자를 맞춰 물리 공격, 치명타와 행동 속도를 강화합니다.',
          statBonuses: { physicalAttack: 6, criticalChance: 6, actionSpeed: 4 },
          traitIds: ['EVOLUTION_BLADE_DANCER_RHYTHM'],
        },
      },
      {
        id: 'evo_advanced_dancer',
        fromClassId: 'DANCER',
        toClassId: 'ADVANCED_DANCER',
        evolutionTier: 2,
        evolutionName: '댄서',
        weaponSpecialization: '부채 (쌍수)',
        requiredLevel: 20,
        description: '양손의 화려한 깃털 부채와 극에 달한 춤사위로 아군 전체를 고양시키고 적들을 매혹하여 전장을 완벽히 통제합니다.',
        statBonuses: { evasion: 15, actionSpeed: 10, statusHitRate: 15, statusResistance: 12 },

        grantedSkillIds: ['dancer_fan_waltz', 'dancer_passion_dance', 'dancer_captivating_veil'],
        passive: {
          id: 'passive_advanced_dancer_stage_control',
          name: '무대 장악',
          description: '전장의 흐름을 춤으로 통제해 회피와 행동 속도, 상태 적중을 강화합니다.',
          statBonuses: { evasion: 6, actionSpeed: 5, statusHitRate: 6 },
          traitIds: ['EVOLUTION_ADVANCED_DANCER_STAGE'],
        },
      },
      {
        id: 'evo_toilet',
        fromClassId: 'DANCER',
        toClassId: 'TOILET',
        evolutionTier: 2,
        evolutionName: '변기',
        weaponSpecialization: '',
        requiredLevel: 20,
        description: '',
        statBonuses: { actionSpeed: 6, maxCost: 5, costRegen: 1, statusResistance: 8 },
        grantedSkillIds: ['toilet_support_focus', 'toilet_support_overdrive', 'toilet_total_support'],
        passive: {
          id: 'passive_toilet_support_core',
          name: '지원 특화',
          description: '',
          statBonuses: { maxCost: 4, costRegen: 1, actionSpeed: 4 },
          traitIds: ['EVOLUTION_TOILET_SUPPORT_CORE'],
        },
      },
    ],
  },
};

/** 심화 전직 ID/이름/toClassId로 전체 계열에서 정의를 찾습니다. 구 세이브 호환에도 사용합니다. */
export function getClassEvolutionById(evolutionId?: string | null): ClassEvolutionDefinition | null {
  if (!evolutionId) return null;
  for (const cls of Object.values(COMBAT_CLASSES)) {
    const found = cls?.evolutions.find((e) => e.id === evolutionId || e.toClassId === evolutionId || e.evolutionName === evolutionId);
    if (found) return found;
  }
  return null;
}

/**
 * 무희 계열 전직 가능 여부 검사 (정확히 "여성" 성별만 허용)
 */
export function canChooseDancer(gender?: string | null): boolean {
  return (gender || '').trim() === '여성';
}

export function getCombatClass(classId?: string | null): CombatClassDefinition | null {
  if (!classId || classId === 'NONE') return null;
  return COMBAT_CLASSES[classId as CombatClassType] || null;
}

export function getAllCombatClasses(): CombatClassDefinition[] {
  return (Object.values(COMBAT_CLASSES).filter(Boolean) as CombatClassDefinition[]);
}

export const CLASS_EVOLUTIONS: Record<string, { currentTitle: string; evolvedTitle: string; requiredLevel: number; description: string; statBonuses: string }> = {
  WARRIOR: {
    currentTitle: '전사',
    evolvedTitle: '대검전사 / 창술사 / 검술사 / 쌍검술사',
    requiredLevel: 20,
    description: '육중한 양손 대검으로 적진을 분쇄하거나, 불굴의 방패로 파티를 결사 수호합니다.',
    statBonuses: '물리 공격력 +15, 강인함 +20, 물리 방어력 +12',
  },
  ARCHER: {
    currentTitle: '궁수',
    evolvedTitle: '배틀슈터 / 스나이퍼 / 실프 / 아처',
    requiredLevel: 20,
    description: '원거리 치명타와 급소 관통으로 적을 일격필살하거나 야생의 감각으로 덫과 연사를 퍼붓습니다.',
    statBonuses: '치명타율 +10%, 행동 속도 +8, 관통력 +15',
  },
  ROGUE: {
    currentTitle: '도적',
    evolvedTitle: '듀얼블레이드 / 암살자 / 씨프',
    requiredLevel: 20,
    description: '쌍수 연격과 암살, 약탈·교란형 씨프 중 하나로 특화하여 도적의 기동성을 극대화합니다.',
    statBonuses: '회피율 +12%, 치명타 피해 +50%, 행동 속도 +10',
  },
  CLERIC: {
    currentTitle: '성직자',
    evolvedTitle: '사제 / 수도사 / 힐러 / 홀리나이트',
    requiredLevel: 20,
    description: '신성 기적·광역 치유·근접 성력 전투 또는 홀리나이트의 전열 수호로 역할을 전문화합니다.',
    statBonuses: '마법 방어력 +15, 최대 정신력 +40, 치유력 +25%',
  },
  MAGE: {
    currentTitle: '마법사',
    evolvedTitle: '아케인 메이지 / 마법검사 / 위자드 / 크로우',
    requiredLevel: 20,
    description: '고위 비전·원소·독 마법 또는 마력검을 이용한 근접 마도전으로 마법사의 전투 공식을 전문화합니다.',
    statBonuses: '마법 공격력 +25, 최대 마나 +60, 속성 관통력 +15',
  },
  DRAGON_EMPEROR: {
    currentTitle: '용왕',
    evolvedTitle: '업화의 비룡 / 천수의 사룡 / 뇌명의 천룡 / 서리의 한룡',
    requiredLevel: 20,
    description: '용왕에서 네 갈래 용족 심화 전직으로 분화하며, 각자의 전용 자원 100 도달 시 공통 변신 『용제』로 현현한다.',
    statBonuses: '용제 현현 · 전능력 강화 · 피해 감소 · 종료 후 용맥 탈진',
  },
  DANCER: {
    currentTitle: '무희',
    evolvedTitle: '서큐버스 / 검무희 / 댄서 / 변기',
    requiredLevel: 20,
    description: '사념 마법(서큐버스), 처형도 쌍수 연격(검무희), 부채 광역 지원(댄서), 전용 지원 계열(변기)로 진화합니다.',
    statBonuses: '회피율 +15%, 상태이상 적중 +20%, 행동 속도 +10',
  },
};
