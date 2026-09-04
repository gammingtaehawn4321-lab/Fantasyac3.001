import type { PetSpeciesId } from '../../types';
import { PET_USER_REFERENCES } from '../../user_content/petReferences';
import type { PetUserEventSlots } from './petEventReferenceTypes';

export type { PetUserEventSlots } from './petEventReferenceTypes';

/**
 * 펫 연출 문자열은 이 본체 파일에 두지 않는다.
 * 실제 사용자 작성 내용은 src/user_content/petReferences.ts 에서만 관리한다.
 */
export function getPetUserEventSlots(speciesId: PetSpeciesId): PetUserEventSlots {
  return PET_USER_REFERENCES[speciesId];
}

/** 비어 있거나 기본 플레이스홀더인 사용자 참조는 사용하지 않는다. */
export function isUsablePetUserReference(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  return Boolean(text) && !text.startsWith('TODO_USER') && text !== 'USER_TODO';
}

export type PetReferencePhase = 'REQUEST' | 'ACCEPTED' | 'REFUSED' | 'REFUSAL_LIMIT';
export type PetReferenceNeed = 'DESIRE' | 'BATHROOM';

/** 해당 펫 종족의 길들이기 참조 풀. */
export function getPetTameReferencePool(speciesId: PetSpeciesId): string[] {
  return getPetUserEventSlots(speciesId).tameReferences.filter(isUsablePetUserReference);
}

/**
 * 특정 펫 종족 + 욕구 + 이벤트 단계에 해당하는 참조 풀만 반환한다.
 * 다른 종족의 참조 풀은 절대로 섞지 않는다.
 */
export function getPetUserReferencePool(
  speciesId: PetSpeciesId,
  need: PetReferenceNeed,
  phase: PetReferencePhase,
): string[] {
  const slots = getPetUserEventSlots(speciesId);
  let pool: readonly string[];

  if (need === 'DESIRE') {
    if (phase === 'REQUEST') pool = slots.desireRequestReferences;
    else if (phase === 'ACCEPTED') pool = slots.desireAcceptedReferences;
    else if (phase === 'REFUSED') pool = slots.desireRefusedReferences;
    else pool = slots.desireForcedRequestReferences;
  } else {
    if (phase === 'REQUEST') pool = slots.bathroomRequestReferences;
    else if (phase === 'ACCEPTED') pool = slots.bathroomAcceptedReferences;
    else if (phase === 'REFUSED') pool = slots.bathroomRefusedReferences;
    else pool = slots.bathroomForcedRequestReferences;
  }

  return pool.filter(isUsablePetUserReference);
}

/** 해당 종의 비어 있지 않은 영입 인카운터 참조만 반환한다. 빈 풀은 '미발생'을 뜻한다. */
export function getPetAcquisitionEncounterPool(speciesId: PetSpeciesId): string[] {
  return getPetUserEventSlots(speciesId).acquisitionEncounterReferences.filter(isUsablePetUserReference);
}

export function canTriggerPetAcquisitionEncounter(speciesId: PetSpeciesId): boolean {
  return getPetAcquisitionEncounterPool(speciesId).length > 0;
}

export function rollPetAcquisitionEncounterReference(speciesId: PetSpeciesId, randomValue = Math.random()): string | null {
  const pool = getPetAcquisitionEncounterPool(speciesId);
  if (!pool.length) return null;
  const roll = Math.max(0, Math.min(0.999999, Number(randomValue) || 0));
  return pool[Math.floor(roll * pool.length)] || null;
}

export function getPetSpeciesWithActiveAcquisitionEncounters(): PetSpeciesId[] {
  return (Object.keys(PET_USER_REFERENCES) as PetSpeciesId[]).filter(canTriggerPetAcquisitionEncounter);
}
