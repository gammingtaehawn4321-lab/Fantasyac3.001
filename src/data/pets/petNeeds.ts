import type { CompanionData, CompanionNeedCue, PetRequestState, PlayerState } from '../../types';
import { COMPANION_NEED_THRESHOLDS, COMPANION_DESIRE_GAIN_PER_STORY_LOG, COMPANION_URINATION_GAIN_PER_MINUTE, type CompanionNeedThreshold } from '../companions/companionNeeds';
import { getPetSpeciesDefinition } from './petDatabase';
import { normalizePetState } from './petState';
import { PET_GRADE_DESIRE_MULTIPLIER, PET_GRADE_WILDNESS_MULTIPLIER, getForcedRequestWildnessGain, getPetMetabolismMultiplier } from './petGrowth';

function clamp100(n: number): number { return Math.round(Math.max(0, Math.min(100, n)) * 100) / 100; }

function nextCrossedThreshold(previous: number, current: number, history: number[]): CompanionNeedThreshold | undefined {
  // 정상적인 상승에서는 새로 통과한 임계치를 우선한다.
  for (const threshold of COMPANION_NEED_THRESHOLDS) {
    if (previous < threshold && current >= threshold && !history.includes(threshold)) return threshold;
  }
  // 요청이 반복 거절 한계 등으로 닫힌 뒤 욕구 수치가 이미 높은 상태일 수 있다.
  // 이 경우 다음 진행 틱에서 아직 처리하지 않은 가장 낮은 임계치를 재개해
  // 50/70/100 요청이 영구적으로 건너뛰어지는 것을 막는다.
  for (const threshold of COMPANION_NEED_THRESHOLDS) {
    if (current >= threshold && !history.includes(threshold)) return threshold;
  }
  return undefined;
}

function makePetCue(state: PlayerState, pet: CompanionData, kind: 'DESIRE' | 'BATHROOM', threshold: CompanionNeedThreshold, requestId: string, phase: CompanionNeedCue['phase'] = 'REQUEST'): CompanionNeedCue {
  return {
    id: `pet_need_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    companionId: pet.id,
    companionName: pet.name,
    entityKind: 'PET',
    kind,
    threshold,
    requestId,
    phase,
    createdAtDialogue: Math.max(0, Number(state.dialogueCount || 0)),
  };
}

function requestForNeed(state: PlayerState, pet: CompanionData, kind: 'DESIRE' | 'BATHROOM', previous: number, current: number): { pet: CompanionData; cue?: CompanionNeedCue } {
  const ps = normalizePetState(pet.petState);
  if (!ps) return { pet };
  if (ps.requestState.activeNeed) return { pet: { ...pet, petState: ps } };

  const history = kind === 'DESIRE' ? [...ps.needs.desireTriggeredThresholds] : [...ps.needs.bathroomTriggeredThresholds];
  const threshold = nextCrossedThreshold(previous, current, history);
  if (!threshold) return { pet: { ...pet, petState: ps } };

  history.push(threshold);
  const requestId = `pet_request_${pet.id}_${kind.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const requestState: PetRequestState = {
    activeNeed: kind,
    threshold,
    refusalCount: Math.max(0, Number(ps.requestState.refusalCount || 0)),
    createdAtDialogue: Math.max(0, Number(state.dialogueCount || 0)),
    requestId,
  };
  const needs = kind === 'DESIRE'
    ? { ...ps.needs, desire: clamp100(current), desireTriggeredThresholds: history }
    : { ...ps.needs, bathroomUrge: clamp100(current), bathroomTriggeredThresholds: history };
  const nextPet = { ...pet, petState: { ...ps, needs, requestState } };
  return { pet: nextPet, cue: makePetCue(state, nextPet, kind, threshold, requestId) };
}

function mutatePetNeed(state: PlayerState, pet: CompanionData, kind: 'DESIRE' | 'BATHROOM', delta: number): { pet: CompanionData; cue?: CompanionNeedCue } {
  const ps = normalizePetState(pet.petState);
  if (!ps) return { pet };
  const prev = kind === 'DESIRE' ? ps.needs.desire : ps.needs.bathroomUrge;
  const current = clamp100(prev + delta);
  if (kind === 'DESIRE') ps.needs.desire = current;
  else ps.needs.bathroomUrge = current;
  return requestForNeed(state, { ...pet, petState: ps }, kind, prev, current);
}

export function applyPetStoryNeedProgress(state: PlayerState): PlayerState {
  if (!(state.companions || []).some(c => c.kind === 'PET')) return state;
  const queue = [...(state.companionNeedQueue || [])];
  const companions = state.companions.map((c) => {
    if (c.kind !== 'PET' || !c.petState || state.equippedPetId !== c.id) return c;
    const def = getPetSpeciesDefinition(c.petState.speciesId);
    const ps = normalizePetState(c.petState)!;
    const desireMultiplier = PET_GRADE_DESIRE_MULTIPLIER[ps.growth.grade];
    const result = mutatePetNeed(state, c, 'DESIRE', COMPANION_DESIRE_GAIN_PER_STORY_LOG * def.desireGainMultiplier * desireMultiplier);
    if (result.pet.petState) {
      const growthWildness = 0.12 * PET_GRADE_WILDNESS_MULTIPLIER[ps.growth.grade] * (1 + Math.max(0, ps.growth.level - 1) * 0.015);
      result.pet.petState.wildness = clamp100(result.pet.petState.wildness + growthWildness);
    }
    if (result.cue) queue.push(result.cue);
    return result.pet;
  });
  return { ...state, companions, companionNeedQueue: queue };
}

export function applyPetNeedTimeProgress(state: PlayerState, elapsedMinutes: number): PlayerState {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  if (!minutes) return state;
  const queue = [...(state.companionNeedQueue || [])];
  const companions = state.companions.map((c) => {
    if (c.kind !== 'PET' || !c.petState || state.equippedPetId !== c.id) return c;
    const def = getPetSpeciesDefinition(c.petState.speciesId);
    const ps = normalizePetState(c.petState)!;
    const metabolismMultiplier = getPetMetabolismMultiplier(ps.growth.metabolismBoost);
    const result = mutatePetNeed(state, c, 'BATHROOM', minutes * COMPANION_URINATION_GAIN_PER_MINUTE * def.bathroomGainMultiplier * metabolismMultiplier);
    if (result.cue) queue.push(result.cue);
    return result.pet;
  });
  return { ...state, companions, companionNeedQueue: queue };
}

export function respondToPetNeedRequest(state: PlayerState, petId: string, response: 'ACCEPT' | 'REFUSE'): { nextState: PlayerState; message: string } {
  if (state.equippedPetId !== petId) return { nextState: state, message: '현재 장착 중인 펫의 요청에만 응답할 수 있습니다.' };
  let message = '처리할 펫 요청이 없습니다.';
  let emitted: CompanionNeedCue | undefined;
  const companions = state.companions.map((c) => {
    if (c.id !== petId || c.kind !== 'PET' || !c.petState) return c;
    const ps = normalizePetState(c.petState);
    if (!ps?.requestState.activeNeed || !ps.requestState.threshold || !ps.requestState.requestId) return c;
    const kind = ps.requestState.activeNeed;
    const threshold = ps.requestState.threshold;
    const requestId = ps.requestState.requestId;
    if (response === 'ACCEPT') {
      const needs = kind === 'DESIRE'
        ? { ...ps.needs, desire: 0, desireTriggeredThresholds: [] }
        : { ...ps.needs, bathroomUrge: 0, bathroomTriggeredThresholds: [] };
      emitted = makePetCue(state, c, kind, threshold, requestId, 'ACCEPTED');
      message = `🐾 [${c.name}]의 요청을 받아들였습니다.`;
      return { ...c, petState: { ...ps, needs, requestState: { refusalCount: 0 } } };
    }

    const refusals = Math.max(0, ps.requestState.refusalCount) + 1;
    const def = getPetSpeciesDefinition(ps.speciesId);
    const refusalLimit = Math.max(1, kind === 'DESIRE' ? def.refusalLimits.desire : def.refusalLimits.bathroom);
    const limitReached = refusals >= refusalLimit;
    emitted = makePetCue(state, c, kind, threshold, requestId, limitReached ? 'REFUSAL_LIMIT' : 'REFUSED');
    message = limitReached
      ? `🐾 [${c.name}]의 요청 거절이 한계에 도달했습니다. 사용자 정의 후속 이벤트가 대기합니다.`
      : `🐾 [${c.name}]의 요청을 거절했습니다. (${refusals}/${refusalLimit})`;
    // 거절 한계 후속 장면은 하나의 욕구 사이클의 종점으로 취급한다.
    // 실제 상태 커밋은 상호작용 로그 생성 성공 뒤 App 레이어에서 이루어지므로,
    // 여기서는 예정 결과만 만든다. 다음 임계 사이클이 30부터 다시 정상 시작되도록
    // 해당 욕구와 임계 기록, 거부 스택을 함께 초기화한다.
    if (limitReached) {
      const needs = kind === 'DESIRE'
        ? { ...ps.needs, desire: 0, desireTriggeredThresholds: [] }
        : { ...ps.needs, bathroomUrge: 0, bathroomTriggeredThresholds: [] };
      const forcedWildnessGain = getForcedRequestWildnessGain(ps.growth.grade);
      message += ` · 야생성 +${forcedWildnessGain}`;
      return { ...c, petState: { ...ps, wildness: clamp100(ps.wildness + forcedWildnessGain), needs, requestState: { refusalCount: 0 } } };
    }
    return { ...c, petState: { ...ps, requestState: { ...ps.requestState, refusalCount: refusals } } };
  });
  let queue = [...(state.companionNeedQueue || [])];
  if (emitted?.requestId) queue = queue.filter((cue) => cue.requestId !== emitted!.requestId);
  if (emitted) queue.push(emitted);
  return { nextState: { ...state, companions, companionNeedQueue: queue }, message };
}
