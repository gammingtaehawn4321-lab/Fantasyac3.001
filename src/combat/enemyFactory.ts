import { BattleActor, EnemyTier } from './combatTypes';
import { BATTLE_START_COST, BASE_COST_REGEN, BASE_MAX_COST } from '../data/combatConfig';
import { createEquipmentRuntimeState } from './equipmentRuntime';

export function createEnemyActor(params: {
  id?: string;
  templateId?: string;
  name: string;
  level?: number;
  tier?: EnemyTier;
  hp?: number;
  mp?: number;
  skills?: string[];
  personality?: string;
  gender?: string;
  race?: string;
  combatClass?: string;
  elementResistances?: BattleActor['elementResistances'];
  traits?: string[];
}): BattleActor {
  const level = Math.max(1, params.level || 1);
  const tier = params.tier || 'NORMAL';
  const tierMultiplier = tier === 'BOSS' ? 3.0 : tier === 'ELITE' ? 1.8 : 1.0;

  const baseHp = params.hp || Math.round((40 + level * 25) * tierMultiplier);
  const baseMp = params.mp || Math.round((20 + level * 10) * tierMultiplier);

  const physicalAttack = Math.round((8 + level * 3.5) * tierMultiplier);
  const magicAttack = Math.round((6 + level * 3.0) * tierMultiplier);
  const physicalDefense = Math.round((4 + level * 1.8) * tierMultiplier);
  const magicDefense = Math.round((3 + level * 1.5) * tierMultiplier);
  const accuracy = Math.min(95, 80 + level * 1);
  const evasion = Math.min(30, 5 + Math.floor(level * 0.8));
  const speed = 8 + level * 1;
  const criticalChance = 5 + (tier === 'ELITE' || tier === 'BOSS' ? 5 : 0);

  const defaultSkills = ['basic_attack', 'defend_stance'];
  if (params.skills && params.skills.length > 0) {
    defaultSkills.push(...params.skills);
  }

  return {
    id: params.id || `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: params.name || '몬스터',
    level,
    hp: baseHp,
    maxHp: baseHp,
    mp: baseMp,
    maxMp: baseMp,
    cost: 10,
    maxCost: 30,
    costRegen: 5,
    actionGauge: 0,
    stableTieBreaker: 0,
    skillCooldowns: {},
    stagger: 0,
    maxStagger: Math.max(30, Math.floor(baseHp * 0.35)),
    isStaggered: false,
    tier,
    stats: {
      physicalAttack,
      magicAttack,
      physicalDefense,
      magicDefense,
      accuracy,
      evasion,
      actionSpeed: speed,
      criticalChance,
      criticalDamage: 1.5,
      physicalPenetration: Math.floor(level * 0.8),
      magicPenetration: 0,
      elementalPenetration: 0,
      maxCost: 30,
      costRegen: 5,
      statusHitRate: 0,
      statusResistance: Math.floor(level * 0.5),
      tenacity: Math.floor(level * 1.2),
    },
    baseStats: {
      strength: 5 + level,
      vitality: 5 + level,
      agility: 5 + level,
      intelligence: 5 + level,
      spirit: 5 + level,
      luck: 5,
    },
    skills: Array.from(new Set(defaultSkills)),
    traits: params.traits || [],
    archetype: params.templateId || params.personality || 'MONSTER',
    equipmentRuntime: createEquipmentRuntimeState(),
    statusEffects: [],
    elementResistances: params.elementResistances || {},
    aiProfile: {
      personality: (params.personality as any) || 'AGGRESSIVE',
      preferredSkills: defaultSkills,
    },
    speechProfile: {
      gender: params.gender || 'UNKNOWN',
      race: params.race || 'MONSTER',
      combatClass: params.combatClass || 'NONE',
    },
    isPlayer: false,
  };
}
