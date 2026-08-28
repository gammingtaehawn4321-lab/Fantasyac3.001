import { ACTION_THRESHOLD, CTB_TIMELINE_PREVIEW_COUNT } from '../data/combatConfig';
import { BattleActor, BattleState, TimelineEntry } from './combatTypes';
import { ensureEquipmentRuntime } from './equipmentRuntime';

const EPSILON = 1e-9;

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getAllBattleActors(state: BattleState): BattleActor[] {
  return [state.player, ...state.companions, ...state.enemies];
}

export function getLivingBattleActors(state: BattleState): BattleActor[] {
  return getAllBattleActors(state).filter((actor) => actor.hp > 0);
}

/**
 * CTB용 최종 속도.
 * SPEED_UP/SLOW의 value는 퍼센트로 해석하고, 값이 없으면 20%를 사용한다.
 */
export function getEffectiveActionSpeed(actor: BattleActor, state?: BattleState): number {
  let percent = 0;

  for (const effect of actor.statusEffects || []) {
    if (effect.type === 'SPEED_UP') percent += effect.value ?? 20;
    if (effect.type === 'SLOW') percent -= effect.value ?? 20;
  }

  if (state?.battlefield.effectModifiers?.speedModifier) {
    percent += state.battlefield.effectModifiers.speedModifier;
  }

  return Math.max(1, (actor.stats.actionSpeed || 1) * (1 + percent / 100));
}

export function initializeCtbActors(state: BattleState): void {
  const seed = state.id || `battle_${Date.now()}`;
  getAllBattleActors(state).forEach((actor, index) => {
    ensureEquipmentRuntime(actor);
    if (!Number.isFinite(actor.actionGauge)) actor.actionGauge = 0;
    if (!Number.isFinite(actor.stableTieBreaker) || actor.stableTieBreaker <= 0) {
      actor.stableTieBreaker = hashString(`${seed}:${index}:${actor.id}`);
    }
    if (!actor.skillCooldowns) actor.skillCooldowns = {};
    if (!Number.isFinite(actor.maxCost)) actor.maxCost = actor.stats.maxCost ?? 30;
    if (!Number.isFinite(actor.costRegen)) actor.costRegen = actor.stats.costRegen ?? 5;
    if (!Number.isFinite(actor.cost)) actor.cost = Math.min(10, actor.maxCost);
    actor.cost = Math.max(0, Math.min(actor.maxCost, actor.cost));
  });
}

function compareReadyActors(a: BattleActor, b: BattleActor, state?: BattleState): number {
  const speedA = getEffectiveActionSpeed(a, state);
  const speedB = getEffectiveActionSpeed(b, state);
  if (Math.abs(speedA - speedB) > EPSILON) return speedB - speedA;

  const overflowA = a.actionGauge - ACTION_THRESHOLD;
  const overflowB = b.actionGauge - ACTION_THRESHOLD;
  if (Math.abs(overflowA - overflowB) > EPSILON) return overflowB - overflowA;

  // 매번 랜덤을 다시 굴리지 않는다. 전투 시작 때 정해진 값으로 끝까지 고정.
  return a.stableTieBreaker - b.stableTieBreaker;
}

/**
 * 전투 시간을 필요한 만큼만 전진시켜 다음 행동자를 1명 결정한다.
 * 애니메이션/입력 중에는 호출하지 않으므로 실시간 ATB가 아닌 순차 CTB다.
 */
export function advanceToNextActor(state: BattleState): BattleActor | undefined {
  initializeCtbActors(state);
  const actors = getLivingBattleActors(state);
  if (actors.length === 0) return undefined;

  let minTime = Number.POSITIVE_INFINITY;
  for (const actor of actors) {
    const speed = getEffectiveActionSpeed(actor, state);
    const remaining = Math.max(0, ACTION_THRESHOLD - actor.actionGauge);
    minTime = Math.min(minTime, remaining / speed);
  }

  if (!Number.isFinite(minTime)) return undefined;

  if (minTime > 0) {
    for (const actor of actors) {
      actor.actionGauge += getEffectiveActionSpeed(actor, state) * minTime;
    }
  }

  const ready = actors
    .filter((actor) => actor.actionGauge + EPSILON >= ACTION_THRESHOLD)
    .sort((a, b) => compareReadyActors(a, b, state));

  return ready[0];
}

/**
 * 행동 완료 후 Action Delay만큼 게이지를 소비한다.
 * 1.00 = 1000 소비, 0.75 = 750 소비(다음 행동이 빠름), 1.50 = 1500 소비(다음 행동이 늦음).
 */
export function applyActionDelay(actor: BattleActor, actionDelay: number = 1): void {
  const safeDelay = Math.max(0.1, actionDelay || 1);
  actor.actionGauge -= ACTION_THRESHOLD * safeDelay;
}

interface TimelineSimActor {
  id: string;
  name: string;
  gauge: number;
  speed: number;
  tie: number;
  isPlayer: boolean;
  isCompanion: boolean;
}

function chooseNextSimActor(actors: TimelineSimActor[]): { actor: TimelineSimActor; deltaTime: number } | undefined {
  if (actors.length === 0) return undefined;
  let minTime = Number.POSITIVE_INFINITY;
  for (const actor of actors) {
    minTime = Math.min(minTime, Math.max(0, ACTION_THRESHOLD - actor.gauge) / actor.speed);
  }
  for (const actor of actors) actor.gauge += actor.speed * minTime;

  const ready = actors
    .filter((actor) => actor.gauge + EPSILON >= ACTION_THRESHOLD)
    .sort((a, b) => {
      if (Math.abs(a.speed - b.speed) > EPSILON) return b.speed - a.speed;
      const overflowDiff = (b.gauge - ACTION_THRESHOLD) - (a.gauge - ACTION_THRESHOLD);
      if (Math.abs(overflowDiff) > EPSILON) return overflowDiff;
      return a.tie - b.tie;
    });

  return ready[0] ? { actor: ready[0], deltaTime: minTime } : undefined;
}

/**
 * 앞으로 N회의 행동을 예측한다. 동일 Actor가 여러 번 들어가는 것이 정상이다.
 * currentActorId가 있으면 맨 앞을 NOW로 포함한다.
 */
export function buildTimelinePreview(
  state: BattleState,
  count: number = CTB_TIMELINE_PREVIEW_COUNT,
  currentActionDelay?: number
): TimelineEntry[] {
  initializeCtbActors(state);
  const living = getLivingBattleActors(state);
  const simActors: TimelineSimActor[] = living.map((actor) => ({
    id: actor.id,
    name: actor.name,
    gauge: actor.actionGauge,
    speed: getEffectiveActionSpeed(actor, state),
    tie: actor.stableTieBreaker,
    isPlayer: actor.isPlayer,
    isCompanion: !!actor.isCompanion,
  }));

  const result: TimelineEntry[] = [];
  const occurrences = new Map<string, number>();
  let elapsed = 0;

  const current = state.currentActorId
    ? simActors.find((actor) => actor.id === state.currentActorId)
    : undefined;

  if (current && result.length < count) {
    const occurrence = (occurrences.get(current.id) || 0) + 1;
    occurrences.set(current.id, occurrence);
    result.push({
      actorId: current.id,
      actorName: current.name,
      occurrenceIndex: occurrence,
      predictedTime: 0,
      isPlayer: current.isPlayer,
      isCompanion: current.isCompanion,
    });
    current.gauge -= ACTION_THRESHOLD * Math.max(0.1, currentActionDelay ?? 1);
  }

  while (result.length < count && simActors.length > 0) {
    const next = chooseNextSimActor(simActors);
    if (!next) break;
    elapsed += next.deltaTime;
    const actor = next.actor;
    const occurrence = (occurrences.get(actor.id) || 0) + 1;
    occurrences.set(actor.id, occurrence);

    result.push({
      actorId: actor.id,
      actorName: actor.name,
      occurrenceIndex: occurrence,
      predictedTime: elapsed,
      isPlayer: actor.isPlayer,
      isCompanion: actor.isCompanion,
    });

    // 미래 행동은 스킬 선택을 알 수 없으므로 기본 지연 1.0으로 예측한다.
    actor.gauge -= ACTION_THRESHOLD;
  }

  return result;
}

/** UI에서 스킬 hover/선택 시 실제 상태를 변경하지 않고 Action Delay 결과만 미리 본다. */
export function previewTimelineAfterAction(
  state: BattleState,
  actorId: string,
  actionDelay: number,
  count: number = CTB_TIMELINE_PREVIEW_COUNT
): TimelineEntry[] {
  const previewState: BattleState = {
    ...state,
    currentActorId: actorId,
  };
  return buildTimelinePreview(previewState, count, actionDelay);
}

/**
 * 기존 호출부 호환용. 라운드 선공표가 아니라 CTB의 앞으로의 행동 ID를 반환한다.
 */
export function calculateTurnOrder(
  player: BattleActor,
  companions: BattleActor[],
  enemies: BattleActor[]
): string[] {
  const actors = [player, ...companions, ...enemies].filter((actor) => actor.hp > 0);
  const simActors: TimelineSimActor[] = actors.map((actor, index) => ({
    id: actor.id,
    name: actor.name,
    gauge: Number.isFinite(actor.actionGauge) ? actor.actionGauge : 0,
    speed: Math.max(1, actor.stats.actionSpeed || 1),
    tie: Number.isFinite(actor.stableTieBreaker) ? actor.stableTieBreaker : index,
    isPlayer: actor.isPlayer,
    isCompanion: !!actor.isCompanion,
  }));

  const ids: string[] = [];
  while (ids.length < CTB_TIMELINE_PREVIEW_COUNT && simActors.length > 0) {
    const next = chooseNextSimActor(simActors);
    if (!next) break;
    ids.push(next.actor.id);
    next.actor.gauge -= ACTION_THRESHOLD;
  }
  return ids;
}
