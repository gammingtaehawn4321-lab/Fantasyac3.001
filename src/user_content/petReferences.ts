import type { PetSpeciesId } from '../types';
import type { PetUserEventSlots } from '../data/pets/petEventReferenceTypes';

/**
 * ═══════════════════════════════════════════════════════════════
 * 판타지악 3.3 — 펫 사용자 전용 연출 참조 파일
 * ═══════════════════════════════════════════════════════════════
 *
 * 이 파일은 사용자가 직접 작성하는 전용 파일이다.
 * 본체 엔진에는 펫 연출 문구를 넣지 않고, 여기의 작성된 문자열만 참조한다.
 *
 * 작성 규칙
 * - 필드명 / 배열 길이 / 종족 ID는 변경하지 않는다.
 * - 각 '' 안에 원하는 참조 문구를 작성한다.
 * - 빈 문자열, USER_TODO, TODO_USER... 로 시작하는 값은 자동으로 무시된다.
 * - acquisitionEncounterReferences 2칸이 모두 비어 있으면 해당 펫의 영입 인카운터는 발생하지 않는다.
 * - 한 종의 참조는 다른 종과 절대로 섞이지 않는다.
 */

export const PET_USER_REFERENCES: Record<PetSpeciesId, PetUserEventSlots> = {
  WOLF: {
    // 늑대 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 늑대 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 늑대 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 늑대 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 늑대 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 늑대 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 늑대 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 늑대 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 늑대 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 늑대 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },

  DOG: {
    // 개 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 개 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 개 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 개 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 개 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 개 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 개 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 개 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 개 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 개 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },

  SABER_TIGER: {
    // 검치호랑이 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 검치호랑이 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 검치호랑이 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 검치호랑이 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 검치호랑이 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 검치호랑이 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 검치호랑이 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 검치호랑이 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 검치호랑이 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 검치호랑이 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },

  BEAR: {
    // 곰 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 곰 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 곰 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 곰 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 곰 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 곰 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 곰 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 곰 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 곰 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 곰 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },

  BOAR: {
    // 멧돼지 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 멧돼지 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 멧돼지 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 멧돼지 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 멧돼지 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 멧돼지 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 멧돼지 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 멧돼지 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 멧돼지 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 멧돼지 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },

  CHAURUS: {
    // 챠루스 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 챠루스 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 챠루스 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 챠루스 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 챠루스 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 챠루스 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 챠루스 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 챠루스 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 챠루스 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 챠루스 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },

  CHAURUS_REAPER: {
    // 챠루스 리퍼 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 챠루스 리퍼 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 챠루스 리퍼 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 챠루스 리퍼 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 챠루스 리퍼 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 챠루스 리퍼 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 챠루스 리퍼 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 챠루스 리퍼 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 챠루스 리퍼 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 챠루스 리퍼 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },

  MOTH: {
    // 나방 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 나방 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 나방 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 나방 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 나방 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 나방 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 나방 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 나방 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 나방 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 나방 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },

  EUMYO_BUG: {
    // 음요충 영입 특수 인카운터 — 2칸
    acquisitionEncounterReferences: ['', ''],
    // 음요충 길들이기 — 3칸
    tameReferences: ['', '', ''],
    // 음요충 성욕 해소 요청 — 6칸
    desireRequestReferences: ['', '', '', '', '', ''],
    // 음요충 배설 욕구 해소 요청 — 6칸
    bathroomRequestReferences: ['', '', '', '', '', ''],
    // 음요충 성욕 요청 수락 — 3칸
    desireAcceptedReferences: ['', '', ''],
    // 음요충 배설 요청 수락 — 3칸
    bathroomAcceptedReferences: ['', '', ''],
    // 음요충 성욕 요청 거부 — 3칸
    desireRefusedReferences: ['', '', ''],
    // 음요충 배설 요청 거부 — 3칸
    bathroomRefusedReferences: ['', '', ''],
    // 음요충 성욕 반복 거부 한계 / 강제형 요구 — 3칸
    desireForcedRequestReferences: ['', '', ''],
    // 음요충 배설 반복 거부 한계 / 강제형 요구 — 3칸
    bathroomForcedRequestReferences: ['', '', ''],
  },
};
