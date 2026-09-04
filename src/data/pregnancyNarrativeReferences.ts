/**
 * 임신은 알/산란/부화와 별도의 상태 시스템이다.
 * 모든 연출 참고 문자열은 사용자가 직접 채우기 전까지 비워 둔다.
 */
export const PREGNANCY_NARRATIVE_REFERENCES = {
  conception: '',
  EARLY: '',
  MID: '',
  LATE: '',
  READY: '',
  stageChangedEarlyToMid: '',
  stageChangedMidToLate: '',
  stageChangedLateToReady: '',
  birthReady: '',
  birthStarted: '',
  birthCompleted: '',
} as const;

export const PREGNANCY_PERSISTENT_REFERENCES = {
  anyPregnancy: '',
  earlyPersistent: '',
  midPersistent: '',
  latePersistent: '',
  readyPersistent: '',
} as const;

export const PREGNANCY_CONDITION_REFERENCES = {
  withHighFluidLoad: '',
  withEggsPresent: '',
  withMatureParasitePresent: '',
  withInsertedParasitePresent: '',
  withInternalParasitePresent: '',
} as const;
