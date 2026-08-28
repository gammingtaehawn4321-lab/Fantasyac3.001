import { CombatElement, CombatMotionType } from './combatTypes';
import { SkillDefinition } from '../data/skills';

export type CombatMenuCategory = 'ATTACK' | 'DEFENSE';

const DEFENSIVE_EFFECTS = new Set([
  'EFFECT_DEFEND',
  'EFFECT_FIRST_AID',
  'EFFECT_DIVINE_HEAL',
  'EFFECT_IRON_WALL',
  'EFFECT_SACRED_SHIELD',
  'EFFECT_SMOKE_BOMB',
  'EFFECT_ALLURING_STEP',
  'EFFECT_CRESCENT_STEP',
  'EFFECT_CAPTIVATING_VEIL',
  'EFFECT_THIEF_ESCAPE_ROUTE',
  'EFFECT_MAGIC_KNIGHT_AEGIS',
  'EFFECT_HOLY_KNIGHT_GUARDIAN_FIELD',
  'EFFECT_HOLY_KNIGHT_OATH',
  'EFFECT_TOILET_SUPPORT_FOCUS',
  'EFFECT_TOILET_SUPPORT_OVERDRIVE',
  'EFFECT_TOILET_TOTAL_SUPPORT',
]);

const OFFENSIVE_BUFF_EFFECTS = new Set([
  'EFFECT_HUMAN_RESOLVE',
  'EFFECT_PASSION_DANCE',
  'EFFECT_FAN_WALTZ',
]);

/**
 * 하단 2단계 메뉴에서 스킬이 어느 카테고리에 나타날지 결정한다.
 * 공격 메뉴는 공격기 + 공격적 버프, 방어 메뉴는 방어/회복/회피/보호 스킬을 포함한다.
 * 복합 기술은 둘 다 표시될 수 있다.
 */
export function getSkillMenuCategories(skill: SkillDefinition): CombatMenuCategory[] {
  if (skill.type !== 'ACTIVE') return [];
  const categories = new Set<CombatMenuCategory>();

  if (skill.damageMultiplier != null || skill.targetType === 'ENEMY' || skill.targetType === 'ALL_ENEMIES') {
    categories.add('ATTACK');
  }
  if (OFFENSIVE_BUFF_EFFECTS.has(skill.effectId)) categories.add('ATTACK');

  if (
    DEFENSIVE_EFFECTS.has(skill.effectId) ||
    skill.targetType === 'ALLY' ||
    skill.targetType === 'COMPANION' ||
    skill.targetType === 'ALL_ALLIES' ||
    (skill.targetType === 'SELF' && skill.damageMultiplier == null && !OFFENSIVE_BUFF_EFFECTS.has(skill.effectId))
  ) {
    categories.add('DEFENSE');
  }

  if (categories.size === 0) categories.add('ATTACK');
  return [...categories];
}

export function getSkillMotionType(skill: SkillDefinition): CombatMotionType {
  if (skill.effectId === 'EFFECT_DEFEND' || DEFENSIVE_EFFECTS.has(skill.effectId) && skill.damageMultiplier == null) {
    return skill.effectId === 'EFFECT_DEFEND' ? 'DEFEND' : 'SUPPORT';
  }
  if (skill.damageMultiplier == null) return 'SUPPORT';

  const id = skill.id.toLowerCase();
  if (
    id.includes('archer_') ||
    id.includes('arrow') ||
    id.includes('shot') ||
    id.includes('chakram') ||
    skill.iconName?.toLowerCase().includes('bow')
  ) {
    return 'RANGED';
  }

  if (
    skill.scalingStat === 'magic' ||
    ['FIRE', 'ICE', 'LIGHTNING', 'HOLY', 'DARK', 'ARCANE', 'PSYCHIC', 'NATURE'].includes(skill.element || 'NEUTRAL') ||
    id.includes('mage_') ||
    id.includes('magic') ||
    id.includes('mana') ||
    id.includes('smite') ||
    id.includes('mind') ||
    id.includes('soul')
  ) {
    return 'MAGIC';
  }

  return 'MELEE';
}

export interface EffectVisualPreset {
  effectKey: string;
  variant: number;
  rotation: number;
  secondaryRotation: number;
  particleCount: number;
  particleSpread: number;
  color: string;
  softColor: string;
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getElementColors(element: CombatElement = 'NEUTRAL'): { color: string; softColor: string } {
  switch (element) {
    case 'FIRE': return { color: '#fb923c', softColor: 'rgba(251,146,60,.28)' };
    case 'ICE': return { color: '#67e8f9', softColor: 'rgba(103,232,249,.25)' };
    case 'LIGHTNING': return { color: '#fde047', softColor: 'rgba(253,224,71,.25)' };
    case 'HOLY': return { color: '#fef3c7', softColor: 'rgba(254,243,199,.3)' };
    case 'DARK': return { color: '#c084fc', softColor: 'rgba(192,132,252,.25)' };
    case 'ARCANE': return { color: '#818cf8', softColor: 'rgba(129,140,248,.25)' };
    case 'PSYCHIC': return { color: '#f472b6', softColor: 'rgba(244,114,182,.25)' };
    case 'POISON': return { color: '#86efac', softColor: 'rgba(134,239,172,.25)' };
    case 'NATURE': return { color: '#4ade80', softColor: 'rgba(74,222,128,.25)' };
    default: return { color: '#e7e5e4', softColor: 'rgba(231,229,228,.22)' };
  }
}

/**
 * PNG가 없어도 모든 스킬 effectId마다 서로 다른 결정적 시각 파라미터를 만든다.
 * 같은 속성은 색을 공유할 수 있지만 회전/입자수/형태 조합은 effectId별로 달라진다.
 */
export function getSkillEffectPreset(skill: SkillDefinition): EffectVisualPreset {
  const key = `${skill.effectId}:${skill.id}`;
  const h = hashString(key);
  const colors = getElementColors(skill.element || 'NEUTRAL');
  return {
    effectKey: skill.effectId,
    variant: h % 7,
    rotation: (h % 151) - 75,
    secondaryRotation: ((h >>> 7) % 181) - 90,
    particleCount: 3 + ((h >>> 11) % 6),
    particleSpread: 22 + ((h >>> 17) % 48),
    ...colors,
  };
}

export function formatSkillPower(skill: SkillDefinition): string {
  if (skill.damageMultiplier == null) return '효과형';
  return `${Math.round(skill.damageMultiplier * 100)}%`;
}

export function formatActionDelay(delay: number | undefined): string {
  const value = Math.max(0.1, delay ?? 1);
  if (value <= 0.8) return `빠름 ×${value.toFixed(2)}`;
  if (value >= 1.2) return `느림 ×${value.toFixed(2)}`;
  return `보통 ×${value.toFixed(2)}`;
}
