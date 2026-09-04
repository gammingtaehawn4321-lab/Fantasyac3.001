import type { CompanionData, CompanionNeedCue, CompanionNeedsState, PlayerState } from '../../types';
import { isAdultPhysicalAge } from '../../config/agePolicy';
import { BLADDER_CONFIG } from '../bodySystemConfig';

export const COMPANION_NEED_THRESHOLDS = [30, 50, 70, 100] as const;
export type CompanionNeedThreshold = typeof COMPANION_NEED_THRESHOLDS[number];

/**
 * 임계치 도달 시 실제 특수 인카운터가 발생할 확률.
 * 100은 반드시 발생한다. 30/50/70에서 발생하지 않은 경우 다음 단계까지 계속 누적된다.
 */
export const COMPANION_NEED_EVENT_CHANCE: Record<CompanionNeedThreshold, number> = {
  30: 0.25,
  50: 0.45,
  70: 0.70,
  100: 1,
};

/** 기본 증가량. 실제 증가는 동료 전투력 배율을 적용한다. */
export const COMPANION_DESIRE_GAIN_PER_STORY_LOG = 3;
export const COMPANION_URINATION_GAIN_PER_MINUTE = BLADDER_CONFIG.productionPerMinute;

/**
 * 강한 동료일수록 욕구가 더 빠르게 증가하도록 하는 전투력 배율.
 * UI에는 내부 계산식/영문 키를 노출하지 않는다.
 * - 레벨
 * - 현재 6능력치 총합
 * - 심화 전직 단계
 * 를 함께 사용하고 1.0~3.0배로 제한한다.
 */
export function calculateCompanionNeedGainMultiplier(companion: CompanionData): number {
  const stats = companion.stats || companion.baseStats;
  const statTotal = stats
    ? Number(stats.strength || 0)
      + Number(stats.vitality || 0)
      + Number(stats.agility || 0)
      + Number(stats.intelligence || 0)
      + Number(stats.spirit || 0)
      + Number(stats.luck || 0)
    : 0;

  const level = Math.max(1, Number(companion.level || 1));
  const evolutionTier = Math.max(1, Number(companion.classEvolutionTier || 1));

  const levelBonus = Math.min(1.25, Math.max(0, level - 1) * 0.025);
  const statBonus = Math.min(1.00, Math.max(0, statTotal - 36) * 0.0125);
  const evolutionBonus = Math.min(0.30, Math.max(0, evolutionTier - 1) * 0.15);

  return Math.max(1, Math.min(3, 1 + levelBonus + statBonus + evolutionBonus));
}

function roundNeedValue(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)) * 100) / 100;
}

export function createInitialCompanionNeeds(): CompanionNeedsState {
  return {
    desire: 0,
    urinationUrge: 0,
    desireTriggeredThresholds: [],
    urinationTriggeredThresholds: [],
  };
}

export function normalizeCompanionNeeds(value?: Partial<CompanionNeedsState> | null): CompanionNeedsState {
  const clamp = (n: unknown) => roundNeedValue(Number(n) || 0);
  const desire = clamp(value?.desire);
  const urinationUrge = clamp(value?.urinationUrge);
  const normalizeHistory = (raw: unknown, current: number) => Array.from(new Set(
    (Array.isArray(raw) ? raw : [])
      .map(Number)
      .filter((v): v is CompanionNeedThreshold => COMPANION_NEED_THRESHOLDS.includes(v as CompanionNeedThreshold) && v <= current)
  ));
  return {
    desire,
    urinationUrge,
    desireTriggeredThresholds: normalizeHistory(value?.desireTriggeredThresholds, desire),
    urinationTriggeredThresholds: normalizeHistory(value?.urinationTriggeredThresholds, urinationUrge),
  };
}

function pickSecondaryCompanionId(companions: CompanionData[], primaryId: string): string | undefined {
  const candidates = companions.filter((c) => c.id !== primaryId && c.isActivePartyMember && !c.isKnockedOut);
  if (!candidates.length) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)]?.id;
}

function makeCue(
  state: PlayerState,
  companion: CompanionData,
  kind: 'DESIRE' | 'URINATION',
  threshold: CompanionNeedThreshold,
): CompanionNeedCue {
  return {
    id: `companion_need_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    companionId: companion.id,
    companionName: companion.name,
    kind,
    threshold,
    secondaryCompanionId: threshold >= 70 ? pickSecondaryCompanionId(state.companions || [], companion.id) : undefined,
    createdAtDialogue: Math.max(0, Number(state.dialogueCount || 0)),
  };
}

function shouldTriggerNeedEncounter(threshold: CompanionNeedThreshold): boolean {
  if (threshold >= 100) return true;
  return Math.random() < COMPANION_NEED_EVENT_CHANCE[threshold];
}

function processOneNeed(
  state: PlayerState,
  companion: CompanionData,
  kind: 'DESIRE' | 'URINATION',
  previousValue: number,
  currentValue: number,
  previousHistory: number[],
): { value: number; history: number[]; cues: CompanionNeedCue[] } {
  const history = [...previousHistory].filter((v) => v <= currentValue);
  const cues: CompanionNeedCue[] = [];

  for (const threshold of COMPANION_NEED_THRESHOLDS) {
    if (previousValue >= threshold || currentValue < threshold || history.includes(threshold)) continue;

    // 해당 단계에서 한 번만 판정한다. 실패하면 다음 임계치까지 계속 누적된다.
    history.push(threshold);

    if (shouldTriggerNeedEncounter(threshold)) {
      cues.push(makeCue(state, companion, kind, threshold));

      // 실제 이벤트가 발생한 순간 욕구를 완전히 해소한다.
      // 임계 기록도 초기화하여 다음 누적 사이클에서 같은 단계가 다시 발생할 수 있다.
      return { value: 0, history: [], cues };
    }
  }

  return {
    value: roundNeedValue(currentValue),
    history: history.filter((v) => v <= currentValue),
    cues,
  };
}

function processThresholds(
  state: PlayerState,
  companion: CompanionData,
  previous: CompanionNeedsState,
  current: CompanionNeedsState,
): { needs: CompanionNeedsState; cues: CompanionNeedCue[] } {
  const desire = processOneNeed(
    state,
    companion,
    'DESIRE',
    previous.desire,
    current.desire,
    current.desireTriggeredThresholds,
  );

  const urination = processOneNeed(
    state,
    companion,
    'URINATION',
    previous.urinationUrge,
    current.urinationUrge,
    current.urinationTriggeredThresholds,
  );

  return {
    needs: {
      desire: desire.value,
      urinationUrge: urination.value,
      desireTriggeredThresholds: desire.history,
      urinationTriggeredThresholds: urination.history,
    },
    cues: [...desire.cues, ...urination.cues],
  };
}

function applyNeedsMutation(
  state: PlayerState,
  companion: CompanionData,
  mutate: (needs: CompanionNeedsState) => CompanionNeedsState,
): { companion: CompanionData; cues: CompanionNeedCue[] } {
  const previous = normalizeCompanionNeeds(companion.needs);
  const rawCurrent = normalizeCompanionNeeds(mutate(previous));
  const processed = processThresholds(state, companion, previous, rawCurrent);
  return { companion: { ...companion, needs: processed.needs }, cues: processed.cues };
}

export function applyCompanionStoryNeedProgress(state: PlayerState): PlayerState {
  // 플레이어가 성인 상태가 아닐 경우 플레이어를 향한 성욕 이벤트는 생성하지 않는다.
  const playerAdult = isAdultPhysicalAge(state.profile?.physicalAge);
  if (!playerAdult || !(state.companions || []).length) return state;

  const queue = [...(state.companionNeedQueue || [])];
  const companions = state.companions.map((companion) => {
    if (companion.kind === 'PET') return companion;
    const gainMultiplier = calculateCompanionNeedGainMultiplier(companion);
    const desireGain = COMPANION_DESIRE_GAIN_PER_STORY_LOG * gainMultiplier;
    const result = applyNeedsMutation(state, companion, (needs) => ({
      ...needs,
      desire: roundNeedValue(needs.desire + desireGain),
    }));
    queue.push(...result.cues);
    return result.companion;
  });

  return { ...state, companions, companionNeedQueue: queue };
}

export function applyCompanionNeedTimeProgress(state: PlayerState, elapsedMinutes: number): PlayerState {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  if (!minutes || !(state.companions || []).length) return state;

  const queue = [...(state.companionNeedQueue || [])];
  const companions = state.companions.map((companion) => {
    if (companion.kind === 'PET') return companion;
    const gainMultiplier = calculateCompanionNeedGainMultiplier(companion);
    const urinationGain = minutes * COMPANION_URINATION_GAIN_PER_MINUTE * gainMultiplier;
    const result = applyNeedsMutation(state, companion, (needs) => ({
      ...needs,
      urinationUrge: roundNeedValue(needs.urinationUrge + urinationGain),
    }));
    queue.push(...result.cues);
    return result.companion;
  });

  return { ...state, companions, companionNeedQueue: queue };
}

export function applyCompanionNeedChanges(
  state: PlayerState,
  changes: Array<{ companionId: string; desireDelta?: number; urinationDelta?: number; relieveUrination?: boolean }>,
): PlayerState {
  if (!Array.isArray(changes) || !changes.length) return state;
  let next = state;
  for (const change of changes) {
    if (!change?.companionId) continue;
    const queue = [...(next.companionNeedQueue || [])];
    const companions = next.companions.map((companion) => {
      if (companion.id !== change.companionId || companion.kind === 'PET') return companion;
      const result = applyNeedsMutation(next, companion, (needs) => ({
        ...needs,
        desire: roundNeedValue(needs.desire + (Number(change.desireDelta) || 0)),
        urinationUrge: change.relieveUrination
          ? 0
          : roundNeedValue(needs.urinationUrge + (Number(change.urinationDelta) || 0)),
        urinationTriggeredThresholds: change.relieveUrination ? [] : needs.urinationTriggeredThresholds,
      }));
      queue.push(...result.cues);
      next = { ...next, companionNeedQueue: queue };
      return result.companion;
    });
    next = { ...next, companions, companionNeedQueue: queue };
  }
  return next;
}
