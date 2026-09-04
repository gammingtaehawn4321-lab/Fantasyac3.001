/**
 * 펫 사용자 연출 참조 슬롯의 구조 정의.
 * 실제 사용자 작성 문구는 src/user_content/petReferences.ts 에만 둔다.
 */
export interface PetUserEventSlots {
  /** 펫 영입 특수 인카운터 사용자 작성 참조. 2칸 모두 비어 있으면 해당 종의 영입 인카운터는 발생하지 않는다. */
  acquisitionEncounterReferences: [string, string];

  /** 길들이기 본문 로그용 사용자 작성 참조. */
  tameReferences: [string, string, string];

  /** 종별 욕구 요청용 사용자 작성 참조 슬롯. */
  desireRequestReferences: [string, string, string, string, string, string];
  bathroomRequestReferences: [string, string, string, string, string, string];

  /** 종별 요청 수락 반응용 사용자 작성 참조 슬롯. */
  desireAcceptedReferences: [string, string, string];
  bathroomAcceptedReferences: [string, string, string];

  /** 종별 요청 거부 반응용 사용자 작성 참조 슬롯. */
  desireRefusedReferences: [string, string, string];
  bathroomRefusedReferences: [string, string, string];

  /** 종별 반복 거부 한계 후속 요청용 사용자 작성 참조 슬롯. */
  desireForcedRequestReferences: [string, string, string];
  bathroomForcedRequestReferences: [string, string, string];
}
