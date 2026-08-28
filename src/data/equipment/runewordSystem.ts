import type { CombatElement } from '../../combat/combatTypes';
import type { CombatDerivedStats } from '../combatConfig';
import type {
  EquipmentDefinition,
  EquipmentEnhancementMilestone,
  EquipmentEnhancementState,
  EquipmentEnhancementTable,
  RunewordType,
} from './equipmentTypes';

export const MAX_EQUIPMENT_ENHANCEMENT = 20;
export const EQUIPMENT_ENHANCEMENT_MILESTONES: EquipmentEnhancementMilestone[] = [5, 10, 15, 20];
export const RUNE_LEVEL_BY_MILESTONE: Record<EquipmentEnhancementMilestone, number> = { 5: 1, 10: 2, 15: 3, 20: 4 };
export const RUNE_THRESHOLDS = [5, 12, 24, 40] as const;

export interface RunewordDefinition {
  id: RunewordType;
  name: string;
  keyword: string;
  description: string;
  thresholds: Array<{ level: 5 | 12 | 24 | 40; name: string; description: string; traitId: string }>;
}

export const RUNEWORD_DEFINITIONS: Record<RunewordType, RunewordDefinition> = {
  VENOM: {
    id: 'VENOM', name: '독', keyword: '독', description: '상태이상과 누적 피해를 증폭하는 룬워드.',
    thresholds: [
      { level: 5, name: '독니', description: '상태이상 적중 +8, 독 공격의 안정성이 상승한다.', traitId: 'RUNE_VENOM_5' },
      { level: 12, name: '침식', description: '독을 부여할 때 독의 위력이 강화되고 추가 중첩을 얻는다.', traitId: 'RUNE_VENOM_12' },
      { level: 24, name: '사냥의 독맥', description: '중독된 적 공격 시 Action Delay가 감소한다.', traitId: 'RUNE_VENOM_24' },
      { level: 40, name: '만독개화', description: '독 누적이 임계에 도달하면 잔여 독을 폭발시키고 일부 중첩을 남긴다.', traitId: 'RUNE_VENOM_40' },
    ],
  },
  FLAME: {
    id: 'FLAME', name: '화염', keyword: '화염', description: '화상과 연쇄 폭발에 특화된 룬워드.',
    thresholds: [
      { level: 5, name: '불씨', description: '화염 피해 +8%.', traitId: 'RUNE_FLAME_5' },
      { level: 12, name: '착화', description: '화상 위력이 증가하고 지속시간이 보강된다.', traitId: 'RUNE_FLAME_12' },
      { level: 24, name: '화염 전이', description: '화상 대상 공격 시 주변 적에게 소규모 화염 피해가 번진다.', traitId: 'RUNE_FLAME_24' },
      { level: 40, name: '홍련심장', description: '매 행동의 첫 화염 스킬은 COST가 감소하고 화상 폭발을 유도한다.', traitId: 'RUNE_FLAME_40' },
    ],
  },
  RADIANCE: {
    id: 'RADIANCE', name: '광명', keyword: '광명', description: '치유·보호막·신성 공격을 연결하는 룬워드.',
    thresholds: [
      { level: 5, name: '미광', description: '신성 피해 +8%, 마법 방어가 상승한다.', traitId: 'RUNE_RADIANCE_5' },
      { level: 12, name: '축복 순환', description: '지원 스킬의 COST와 Action Delay가 감소한다.', traitId: 'RUNE_RADIANCE_12' },
      { level: 24, name: '넘치는 광휘', description: '초과 회복의 일부가 보호막으로 전환된다.', traitId: 'RUNE_RADIANCE_24' },
      { level: 40, name: '여명의 기적', description: '전투당 1회 치명적 피해를 HP 1로 견디고 보호막을 얻는다.', traitId: 'RUNE_RADIANCE_40' },
    ],
  },
  DARKNESS: {
    id: 'DARKNESS', name: '암흑', keyword: '암흑', description: '결손 HP와 처치 흐름을 공격 자원으로 바꾸는 룬워드.',
    thresholds: [
      { level: 5, name: '그늘', description: '암흑 피해 +8%.', traitId: 'RUNE_DARKNESS_5' },
      { level: 12, name: '결손 포식', description: 'HP가 낮은 적에게 주는 피해가 증가한다.', traitId: 'RUNE_DARKNESS_12' },
      { level: 24, name: '종말 회수', description: '적 처치 시 COST와 행동 게이지를 회수한다.', traitId: 'RUNE_DARKNESS_24' },
      { level: 40, name: '공허 계약', description: 'COST가 부족할 때 일부 HP를 대가로 스킬을 강행할 수 있다.', traitId: 'RUNE_DARKNESS_40' },
    ],
  },
  DRAGON: {
    id: 'DRAGON', name: '용', keyword: '용', description: '중량 행동·생존·격노를 하나의 루프로 묶는 룬워드.',
    thresholds: [
      { level: 5, name: '용린', description: '최대 HP와 강인함이 증가한다.', traitId: 'RUNE_DRAGON_5' },
      { level: 12, name: '용격', description: 'Action Delay가 큰 강공격의 피해가 증가한다.', traitId: 'RUNE_DRAGON_12' },
      { level: 24, name: '역린', description: '큰 피해를 받으면 용린 보호막과 COST를 얻는다.', traitId: 'RUNE_DRAGON_24' },
      { level: 40, name: '용혈각성', description: 'HP가 낮아지면 전투당 1회 공격·방어·속도가 크게 상승한다.', traitId: 'RUNE_DRAGON_40' },
    ],
  },
  FROST: {
    id: 'FROST', name: '빙결', keyword: '빙결', description: '냉기와 CTB 지연 제어를 극대화하는 룬워드.',
    thresholds: [
      { level: 5, name: '서리결', description: '냉기 피해 +8%.', traitId: 'RUNE_FROST_5' },
      { level: 12, name: '빙점 압력', description: '냉기 공격이 대상 행동 게이지를 추가로 뒤로 민다.', traitId: 'RUNE_FROST_12' },
      { level: 24, name: '균열 냉각', description: '둔화 대상 공격 시 치명타 확률이 상승한다.', traitId: 'RUNE_FROST_24' },
      { level: 40, name: '절대영도', description: '세 번째 냉기 공격마다 대상 Timeline을 크게 밀고 COST를 회복한다.', traitId: 'RUNE_FROST_40' },
    ],
  },
  TEMPEST: {
    id: 'TEMPEST', name: '폭풍', keyword: '폭풍', description: '속도·치명타·연쇄 행동을 강화하는 룬워드.',
    thresholds: [
      { level: 5, name: '순풍', description: '행동 속도가 증가한다.', traitId: 'RUNE_TEMPEST_5' },
      { level: 12, name: '낙뢰 가속', description: '행동당 첫 치명타가 행동 게이지를 당긴다.', traitId: 'RUNE_TEMPEST_12' },
      { level: 24, name: '전도', description: '번개 피해가 다른 적에게 연쇄된다.', traitId: 'RUNE_TEMPEST_24' },
      { level: 40, name: '폭풍안', description: '서로 다른 스킬 3개를 연속 사용하면 다음 행동을 크게 앞당긴다.', traitId: 'RUNE_TEMPEST_40' },
    ],
  },
  ASTRAL: {
    id: 'ASTRAL', name: '비전', keyword: '비전', description: 'COST·관통·속성 조합을 조율하는 룬워드.',
    thresholds: [
      { level: 5, name: '성식', description: '최대 COST와 비전 피해가 증가한다.', traitId: 'RUNE_ASTRAL_5' },
      { level: 12, name: '관측식', description: '속성 관통이 증가한다.', traitId: 'RUNE_ASTRAL_12' },
      { level: 24, name: '회귀식', description: '서로 다른 속성 3개를 사용하면 최근 스킬의 쿨다운을 줄인다.', traitId: 'RUNE_ASTRAL_24' },
      { level: 40, name: '대공식', description: '서로 다른 속성 3개 조합 후 다음 마법의 COST와 Action Delay가 크게 감소한다.', traitId: 'RUNE_ASTRAL_40' },
    ],
  },
};

export function createEmptyEquipmentEnhancementState(): EquipmentEnhancementState {
  return { level: 0, runeChoices: {} };
}

export function normalizeEquipmentEnhancementState(value?: Partial<EquipmentEnhancementState> | null): EquipmentEnhancementState {
  const level = Math.max(0, Math.min(MAX_EQUIPMENT_ENHANCEMENT, Math.floor(Number(value?.level ?? 0))));
  const runeChoices: EquipmentEnhancementState['runeChoices'] = {};
  for (const milestone of EQUIPMENT_ENHANCEMENT_MILESTONES) {
    const rune = value?.runeChoices?.[milestone];
    if (rune && RUNEWORD_DEFINITIONS[rune] && level >= milestone) runeChoices[milestone] = rune;
  }
  return { level, runeChoices };
}

export function getEquipmentEnhancementMultiplier(level: number): number {
  const lv = Math.max(0, Math.min(MAX_EQUIPMENT_ENHANCEMENT, Math.floor(level)));
  const milestoneBonus = (lv >= 5 ? 0.10 : 0) + (lv >= 10 ? 0.15 : 0) + (lv >= 15 ? 0.20 : 0) + (lv >= 20 ? 0.30 : 0);
  return Number((1 + lv * 0.04 + milestoneBonus).toFixed(3));
}

const PERCENT_LIKE_STATS = new Set(['criticalChance', 'criticalDamage', 'evasion']);
const RESOURCE_RATE_STATS = new Set(['maxCost', 'costRegen']);

export function getEnhancedEquipmentBaseStats(
  baseStats: EquipmentDefinition['baseStats'],
  level: number,
): EquipmentDefinition['baseStats'] {
  const multiplier = getEquipmentEnhancementMultiplier(level);
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(baseStats || {})) {
    if (typeof raw !== 'number') continue;
    const growthShare = PERCENT_LIKE_STATS.has(key) ? 0.35 : RESOURCE_RATE_STATS.has(key) ? 0.25 : 1;
    const localMultiplier = 1 + (multiplier - 1) * growthShare;
    const value = raw * localMultiplier;
    out[key] = key === 'criticalDamage' ? Number(value.toFixed(3)) : Math.round(value * 10) / 10;
  }
  return out as EquipmentDefinition['baseStats'];
}

export function getEquipmentEnhancementCost(def: EquipmentDefinition, currentLevel: number): number {
  const nextLevel = Math.max(1, Math.min(MAX_EQUIPMENT_ENHANCEMENT, Math.floor(currentLevel) + 1));
  const tier = Math.max(1, Math.min(12, def.tier ?? Math.ceil((def.requiredLevel ?? 1) / 5)));
  const gradeFactor = def.grade === 'LEGENDARY' || def.rarity === 'LEGENDARY' ? 2.0 : def.grade === 'ELITE' || def.rarity === 'EPIC' || def.rarity === 'RARE' ? 1.45 : 1;
  const milestoneFactor = [5, 10, 15, 20].includes(nextLevel) ? 1.75 : 1;
  return Math.max(100, Math.round((110 + tier * 65) * gradeFactor * Math.pow(1 + nextLevel * 0.18, 1.32) * milestoneFactor / 10) * 10);
}

export function enhanceEquipmentEntry(
  table: EquipmentEnhancementTable | undefined,
  equipmentId: string,
): EquipmentEnhancementTable {
  const out: EquipmentEnhancementTable = { ...(table || {}) };
  const current = normalizeEquipmentEnhancementState(out[equipmentId]);
  if (current.level >= MAX_EQUIPMENT_ENHANCEMENT) return out;
  out[equipmentId] = { ...current, level: current.level + 1 };
  return out;
}

export function socketRuneword(
  table: EquipmentEnhancementTable | undefined,
  equipmentId: string,
  milestone: EquipmentEnhancementMilestone,
  runeword: RunewordType,
): { table: EquipmentEnhancementTable; success: boolean; reason?: string } {
  const out: EquipmentEnhancementTable = { ...(table || {}) };
  const current = normalizeEquipmentEnhancementState(out[equipmentId]);
  if (!EQUIPMENT_ENHANCEMENT_MILESTONES.includes(milestone)) return { table: out, success: false, reason: '유효하지 않은 룬 슬롯입니다.' };
  if (current.level < milestone) return { table: out, success: false, reason: `+${milestone} 강화가 필요합니다.` };
  if (!RUNEWORD_DEFINITIONS[runeword]) return { table: out, success: false, reason: '존재하지 않는 룬워드입니다.' };
  if (current.runeChoices[milestone]) return { table: out, success: false, reason: '이미 각인된 룬 슬롯입니다.' };
  out[equipmentId] = { ...current, runeChoices: { ...current.runeChoices, [milestone]: runeword } };
  return { table: out, success: true };
}

export function getEquipmentRunewordContributions(state?: EquipmentEnhancementState | null): Partial<Record<RunewordType, number>> {
  const normalized = normalizeEquipmentEnhancementState(state);
  const out: Partial<Record<RunewordType, number>> = {};
  for (const milestone of EQUIPMENT_ENHANCEMENT_MILESTONES) {
    const rune = normalized.runeChoices[milestone];
    if (!rune) continue;
    out[rune] = (out[rune] || 0) + RUNE_LEVEL_BY_MILESTONE[milestone];
  }
  return out;
}

export interface ResolvedRunewordLoadout {
  keywordLevels: Record<RunewordType, number>;
  combatStatBonuses: Partial<CombatDerivedStats>;
  elementDamageBonuses: Partial<Record<CombatElement, number>>;
  elementResistances: Partial<Record<CombatElement, number>>;
  traits: string[];
  activeThresholds: Array<{ runeword: RunewordType; runewordName: string; level: number; name: string; description: string }>;
}

export function resolveRunewordLoadout(
  equippedIds: Array<string | null | undefined>,
  enhancements?: EquipmentEnhancementTable,
): ResolvedRunewordLoadout {
  const keywordLevels = Object.fromEntries(Object.keys(RUNEWORD_DEFINITIONS).map((key) => [key, 0])) as Record<RunewordType, number>;
  for (const id of equippedIds) {
    if (!id) continue;
    const contrib = getEquipmentRunewordContributions(enhancements?.[id]);
    for (const [word, value] of Object.entries(contrib)) keywordLevels[word as RunewordType] += Number(value || 0);
  }

  const combatStatBonuses: Partial<CombatDerivedStats> = {};
  const elementDamageBonuses: Partial<Record<CombatElement, number>> = {};
  const elementResistances: Partial<Record<CombatElement, number>> = {};
  const traits: string[] = [];
  const activeThresholds: ResolvedRunewordLoadout['activeThresholds'] = [];
  const addStat = (key: keyof CombatDerivedStats, value: number) => (combatStatBonuses as Record<string, number>)[key] = Number((Number((combatStatBonuses as Record<string, number>)[key] || 0) + value).toFixed(3));
  const addElement = (element: CombatElement, value: number) => elementDamageBonuses[element] = (elementDamageBonuses[element] || 0) + value;

  for (const [word, level] of Object.entries(keywordLevels) as Array<[RunewordType, number]>) {
    if (level <= 0) continue;
    // 룬 레벨 자체도 소량의 기초 방향성을 제공한다. 핵심 성능은 임계 능력에서 열린다.
    if (word === 'VENOM') addStat('statusHitRate', level * 0.45);
    if (word === 'FLAME') addElement('FIRE', level * 0.35);
    if (word === 'RADIANCE') { addElement('HOLY', level * 0.25); addStat('magicDefense', level * 0.35); }
    if (word === 'DARKNESS') addElement('DARK', level * 0.35);
    if (word === 'DRAGON') { addStat('maxHp', level * 3); addStat('tenacity', level * 0.45); }
    if (word === 'FROST') addElement('ICE', level * 0.35);
    if (word === 'TEMPEST') addStat('actionSpeed', level * 0.28);
    if (word === 'ASTRAL') { addElement('ARCANE', level * 0.2); addStat('elementalPenetration', level * 0.3); }

    for (const threshold of RUNEWORD_DEFINITIONS[word].thresholds) {
      if (level < threshold.level) continue;
      traits.push(threshold.traitId);
      activeThresholds.push({ runeword: word, runewordName: RUNEWORD_DEFINITIONS[word].name, level: threshold.level, name: threshold.name, description: threshold.description });
      if (word === 'VENOM' && threshold.level === 5) addStat('statusHitRate', 8);
      if (word === 'FLAME' && threshold.level === 5) addElement('FIRE', 8);
      if (word === 'RADIANCE' && threshold.level === 5) { addElement('HOLY', 8); addStat('magicDefense', 8); }
      if (word === 'DARKNESS' && threshold.level === 5) addElement('DARK', 8);
      if (word === 'DRAGON' && threshold.level === 5) { addStat('maxHp', 80); addStat('tenacity', 8); }
      if (word === 'FROST' && threshold.level === 5) addElement('ICE', 8);
      if (word === 'TEMPEST' && threshold.level === 5) addStat('actionSpeed', 7);
      if (word === 'ASTRAL' && threshold.level === 5) { addStat('maxCost', 3); addElement('ARCANE', 6); }
      if (word === 'ASTRAL' && threshold.level === 12) addStat('elementalPenetration', 10);
    }
  }

  return { keywordLevels, combatStatBonuses, elementDamageBonuses, elementResistances, traits: Array.from(new Set(traits)), activeThresholds };
}
