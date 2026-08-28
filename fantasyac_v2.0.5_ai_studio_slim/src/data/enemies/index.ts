import { BattleActor } from '../../combat/combatTypes';
import { BATTLE_START_COST, BASE_COST_REGEN, BASE_MAX_COST, CombatDerivedStats } from '../combatConfig';

export type EnemyTier = 'WEAK' | 'NORMAL' | 'ELITE' | 'BOSS';

export interface EnemyTemplate {
  id: string;
  name: string;
  archetype: 'BEAST' | 'HUMANOID' | 'UNDEAD' | 'MONSTER' | 'GOLEM';
  baseHp: number;
  baseMp: number;
  baseStats: CombatDerivedStats;
  skills: string[];
  traits: string[];
  expReward: number;
  rupeeReward: number;
  portraitUrl?: string;
  flavorQuote?: string;
}

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = {
  wild_wolf: {
    id: 'wild_wolf',
    name: '어둠의 숲 흑랑',
    archetype: 'BEAST',
    baseHp: 45,
    baseMp: 10,
    baseStats: {
      physicalAttack: 12,
      magicAttack: 4,
      physicalDefense: 5,
      magicDefense: 3,
      accuracy: 98,
      evasion: 14,
      criticalChance: 12,
      criticalDamage: 1.5,
      actionSpeed: 16,
    },
    skills: ['basic_attack', 'beast_feral_claws'],
    traits: ['야수의 기민함', '무리 사냥'],
    expReward: 35,
    rupeeReward: 25,
    flavorQuote: '으르렁거리며 날카로운 송곳니를 드러낸다.',
  },

  goblin_scout: {
    id: 'goblin_scout',
    name: '고블린 척후병',
    archetype: 'HUMANOID',
    baseHp: 38,
    baseMp: 12,
    baseStats: {
      physicalAttack: 10,
      magicAttack: 5,
      physicalDefense: 4,
      magicDefense: 4,
      accuracy: 95,
      evasion: 16,
      criticalChance: 10,
      criticalDamage: 1.4,
      actionSpeed: 18,
    },
    skills: ['basic_attack', 'throw_sand'],
    traits: ['교활함', '비열한 눈빛'],
    expReward: 30,
    rupeeReward: 35,
    flavorQuote: '키득거리며 녹슨 단검을 쥐고 다가온다.',
  },

  bandit_swordsman: {
    id: 'bandit_swordsman',
    name: '황야의 무법자 산적',
    archetype: 'HUMANOID',
    baseHp: 65,
    baseMp: 15,
    baseStats: {
      physicalAttack: 16,
      magicAttack: 4,
      physicalDefense: 8,
      magicDefense: 5,
      accuracy: 100,
      evasion: 8,
      criticalChance: 10,
      criticalDamage: 1.5,
      actionSpeed: 14,
    },
    skills: ['basic_attack', 'warrior_heavy_strike', 'defend_stance'],
    traits: ['거친 완력', '약탈자'],
    expReward: 55,
    rupeeReward: 60,
    flavorQuote: '가진 걸 다 내놓으면 목숨만은 살려주지!',
  },

  corrupt_guard: {
    id: 'corrupt_guard',
    name: '타락한 도시 경비병',
    archetype: 'HUMANOID',
    baseHp: 75,
    baseMp: 20,
    baseStats: {
      physicalAttack: 18,
      magicAttack: 6,
      physicalDefense: 12,
      magicDefense: 7,
      accuracy: 102,
      evasion: 6,
      criticalChance: 8,
      criticalDamage: 1.5,
      actionSpeed: 12,
    },
    skills: ['basic_attack', 'warrior_shield_bash', 'defend_stance'],
    traits: ['철제 흉갑', '권력 남용'],
    expReward: 70,
    rupeeReward: 80,
    flavorQuote: '반항하는 놈은 여기서 베어 넘겨도 아무도 모른다.',
  },

  ruin_golem: {
    id: 'ruin_golem',
    name: '고대 유적의 수호 골렘',
    archetype: 'GOLEM',
    baseHp: 130,
    baseMp: 10,
    baseStats: {
      physicalAttack: 24,
      magicAttack: 8,
      physicalDefense: 22,
      magicDefense: 15,
      accuracy: 92,
      evasion: 2,
      criticalChance: 6,
      criticalDamage: 1.6,
      actionSpeed: 9,
    },
    skills: ['basic_attack', 'warrior_heavy_strike', 'warrior_iron_wall'],
    traits: ['바위 피부', '통증 면역'],
    expReward: 120,
    rupeeReward: 150,
    flavorQuote: '육중한 석재 관절이 삐걱거리며 붉은 안광을 번뜩인다.',
  },
};

/**
 * 안전한 적 BattleActor 생성 (서버 검증 및 레벨 스케일링 적용)
 */
export function createEnemyActor(
  templateKey: string = 'wild_wolf',
  level: number = 1,
  tier: EnemyTier = 'NORMAL',
  customName?: string
): BattleActor {
  const template = ENEMY_TEMPLATES[templateKey] || ENEMY_TEMPLATES.wild_wolf;
  const safeLvl = Math.max(1, Math.min(99, Math.floor(level)));

  // 티어별 배율
  const tierMultipliers: Record<EnemyTier, { hp: number; atk: number; def: number; exp: number }> = {
    WEAK: { hp: 0.75, atk: 0.8, def: 0.8, exp: 0.7 },
    NORMAL: { hp: 1.0, atk: 1.0, def: 1.0, exp: 1.0 },
    ELITE: { hp: 1.6, atk: 1.3, def: 1.3, exp: 2.0 },
    BOSS: { hp: 2.8, atk: 1.6, def: 1.5, exp: 4.0 },
  };

  const tMod = tierMultipliers[tier] || tierMultipliers.NORMAL;
  const lvlGrowth = safeLvl - 1;

  const maxHp = Math.round((template.baseHp + lvlGrowth * 14) * tMod.hp);
  const maxMp = Math.round(template.baseMp + lvlGrowth * 5);

  const stats: CombatDerivedStats = {
    physicalAttack: Math.round((template.baseStats.physicalAttack + lvlGrowth * 2.5) * tMod.atk),
    magicAttack: Math.round((template.baseStats.magicAttack + lvlGrowth * 2.2) * tMod.atk),
    physicalDefense: Math.round((template.baseStats.physicalDefense + lvlGrowth * 1.8) * tMod.def),
    magicDefense: Math.round((template.baseStats.magicDefense + lvlGrowth * 1.6) * tMod.def),
    accuracy: Math.min(150, Math.round(template.baseStats.accuracy + lvlGrowth * 0.5)),
    evasion: Math.min(50, Math.round(template.baseStats.evasion + lvlGrowth * 0.3)),
    criticalChance: Math.min(50, Math.round(template.baseStats.criticalChance + lvlGrowth * 0.4)),
    criticalDamage: template.baseStats.criticalDamage,
    actionSpeed: Math.round(template.baseStats.actionSpeed + lvlGrowth * 0.6),
    physicalPenetration: template.baseStats.physicalPenetration ?? 0,
    magicPenetration: template.baseStats.magicPenetration ?? 0,
    elementalPenetration: template.baseStats.elementalPenetration ?? 0,
    maxCost: template.baseStats.maxCost ?? 30,
    costRegen: template.baseStats.costRegen ?? 5,
  };

  return {
    id: `enemy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: customName || template.name,
    level: safeLvl,
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    cost: 10,
    maxCost: stats.maxCost ?? 30,
    costRegen: stats.costRegen ?? 5,
    actionGauge: 0,
    stableTieBreaker: 0,
    skillCooldowns: {},
    stagger: 0,
    maxStagger: Math.max(30, Math.floor(maxHp * 0.35)),
    isStaggered: false,
    stats,
    skills: [...template.skills],
    traits: [...template.traits],
    statusEffects: [],
    isPlayer: false,
    archetype: template.archetype,
    portraitUrl: template.portraitUrl,
  };
}
