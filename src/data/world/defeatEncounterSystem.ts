import type { BattleState } from '../../combat/combatTypes';
import type { DefeatAftermathKind, DefeatAftermathState, PlayerState } from '../../types';
import { getRegionalMonsterDefinition } from './monsterData';
import { RESURRECTION_POTION_ID, RESURRECTION_POTION_NAME } from './monsterLootItems';

export interface DefeatAftermathEffect {
  hpRatio: number;
  sanityDelta: number;
  rupeeLossRatio: number;
  timeMinutes: number;
  loseRandomNonKeyItem: boolean;
}

const EFFECTS: Record<Exclude<DefeatAftermathKind, 'DEATH'>, DefeatAftermathEffect> = {
  SOLD_INTO_SLAVERY: { hpRatio: 0.22, sanityDelta: -12, rupeeLossRatio: 0.35, timeMinutes: 24 * 60, loseRandomNonKeyItem: true },
  MONSTER_LAIR: { hpRatio: 0.16, sanityDelta: -16, rupeeLossRatio: 0.05, timeMinutes: 10 * 60, loseRandomNonKeyItem: false },
  ABDUCTED: { hpRatio: 0.20, sanityDelta: -10, rupeeLossRatio: 0.20, timeMinutes: 14 * 60, loseRandomNonKeyItem: true },
  ROBBED_AND_ABANDONED: { hpRatio: 0.18, sanityDelta: -7, rupeeLossRatio: 0.30, timeMinutes: 7 * 60, loseRandomNonKeyItem: true },
  RESCUED: { hpRatio: 0.30, sanityDelta: 4, rupeeLossRatio: 0.08, timeMinutes: 5 * 60, loseRandomNonKeyItem: false },
};

const TITLES: Record<DefeatAftermathKind, string> = {
  SOLD_INTO_SLAVERY: '패배의 대가 · 팔려간 포로',
  MONSTER_LAIR: '패배의 대가 · 몬스터 소굴',
  ABDUCTED: '패배의 대가 · 납치',
  ROBBED_AND_ABANDONED: '패배의 대가 · 약탈 후 유기',
  RESCUED: '패배의 대가 · 뜻밖의 구조',
  DEATH: '패배의 끝 · 사망',
};

const DESCRIPTIONS: Record<DefeatAftermathKind, string> = {
  SOLD_INTO_SLAVERY: '의식을 잃은 사이 포로가 되어 거래망으로 넘겨졌다. 전투는 완전한 패배로 끝났고, 시간이 흐른 뒤 감시가 느슨해진 틈에 다시 행동할 기회를 얻었다.',
  MONSTER_LAIR: '쓰러진 몸이 몬스터의 소굴 깊숙한 곳으로 끌려갔다. 긴 시간이 지난 뒤 간신히 의식을 되찾았고, 부상을 안은 채 소굴에서 빠져나올 틈을 찾아냈다.',
  ABDUCTED: '패배 직후 정체를 알 수 없는 무리에게 납치되었다. 장시간 이동한 뒤 감시의 빈틈이 생겨 가까스로 다시 움직일 수 있게 되었다.',
  ROBBED_AND_ABANDONED: '적들은 가진 것을 일부 빼앗은 뒤 쓰러진 몸을 길가에 버렸다. 시간이 지나 정신을 차렸지만 전투를 계속할 상태는 아니었다.',
  RESCUED: '패배 후 방치된 사이 지나가던 여행자들이 발견해 응급처치를 해 주었다. 싸움은 졌지만 목숨만은 건졌다.',
  DEATH: '전투가 패배로 끝난 뒤에도 누구의 개입도 없었다. 상처를 버티지 못하고 결국 의식이 완전히 끊어졌다.',
};

export function hasResurrectionPotion(state: PlayerState): boolean {
  return (state.inventory || []).some((item) => item.quantity > 0 && (item.id === RESURRECTION_POTION_ID || item.name === RESURRECTION_POTION_NAME));
}

export function isDefeatSkippableBattle(battle?: BattleState | null): boolean {
  if (!battle) return true;
  return !battle.enemies.some((enemy) => enemy.tier === 'ELITE' || enemy.tier === 'BOSS' || enemy.traits?.includes('REGIONAL_BOSS'));
}

function weightedKindForBattle(battle: BattleState, roll: number): DefeatAftermathKind {
  const activeEnemy = battle.enemies.find((enemy) => enemy.hp > 0) || battle.enemies[0];
  const def = getRegionalMonsterDefinition(activeEnemy?.archetype);
  const category = def?.raceType;

  if (category === 'HUMANOID') {
    if (roll < 0.26) return 'SOLD_INTO_SLAVERY';
    if (roll < 0.48) return 'ABDUCTED';
    if (roll < 0.66) return 'ROBBED_AND_ABANDONED';
    if (roll < 0.76) return 'RESCUED';
    return 'DEATH';
  }

  if (category === 'ABERRANT') {
    if (roll < 0.34) return 'MONSTER_LAIR';
    if (roll < 0.52) return 'ABDUCTED';
    if (roll < 0.64) return 'ROBBED_AND_ABANDONED';
    if (roll < 0.70) return 'RESCUED';
    return 'DEATH';
  }

  if (roll < 0.20) return 'ABDUCTED';
  if (roll < 0.42) return 'ROBBED_AND_ABANDONED';
  if (roll < 0.50) return 'RESCUED';
  return 'DEATH';
}

export function rollDefeatAftermath(state: PlayerState, battle: BattleState, randomValue = Math.random()): DefeatAftermathState {
  const canSkipBattle = isDefeatSkippableBattle(battle);
  const blockedByEliteOrBoss = !canSkipBattle;
  const kind: DefeatAftermathKind = canSkipBattle ? weightedKindForBattle(battle, Math.max(0, Math.min(0.999999, randomValue))) : 'DEATH';
  const sourceEnemyIds = battle.enemies.map((enemy) => String(enemy.archetype || enemy.id));
  const sourceEnemyNames = battle.enemies.map((enemy) => enemy.name);
  return {
    id: `defeat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kind,
    title: TITLES[kind],
    description: kind === 'DEATH' && blockedByEliteOrBoss
      ? `${DESCRIPTIONS.DEATH} 이 전투는 엘리트 또는 보스급 적이 포함되어 있어 패배 후 전투 건너뛰기와 부활의 물약을 사용할 수 없다.`
      : DESCRIPTIONS[kind],
    sourceEnemyIds,
    sourceEnemyNames,
    canSkipBattle,
    blockedByEliteOrBoss,
    canUseResurrectionPotion: kind === 'DEATH' && canSkipBattle && hasResurrectionPotion(state),
    resolved: false,
  };
}

export function getDefeatAftermathEffect(kind: DefeatAftermathKind): DefeatAftermathEffect | undefined {
  return kind === 'DEATH' ? undefined : EFFECTS[kind];
}
