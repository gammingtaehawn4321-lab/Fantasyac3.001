/**
 * 독립 ParasiteState용 성인 서사 참고 슬롯.
 * 부화 후 기생체는 원래 구획 payload/용량 계산에서 빠지고 이 상태만 참조한다.
 * TODO(보류): 공통 성장/삽입형/내부형/기원별 서사 Reference는 추후 재작업 시 사용자가 직접 작성한다.
 */
export const PARASITE_NARRATIVE_REFERENCES = {
  hatched: '',
  juvenile: '',
  mature: '',
  insertedApplied: '',
  insertedProgress: '',
  insertedMatured: '',
  internalApplied: '',
  internalMigrated: '',
  internalProgress: '',
  internalMatured: '',
  removed: '',
} as const;

export const MATURE_PARASITE_ADULT_REFERENCES = {
  anyMatureParasite: '',
  insertedMaturePresent: '',
  internalMaturePresent: '',
  vaginalOriginPresent: '',
  analOriginPresent: '',
  insectoidOriginPresent: '',
  tentacleOriginPresent: '',
  multipleMatureParasites: '',
} as const;

export const MATURE_PARASITE_EFFECT_REFERENCES = {
  desireEffect: '',
  sensitivityEffect: '',
  corruptionEffect: '',
  secretionEffect: '',
  movementEffect: '',
  reproductionEffect: '',
} as const;

export const PARASITE_ROUTE_NARRATIVE_REFERENCES = {
  VAGINAL: {
    general: '',
    inserted: '',
    internal: '',
    mature: '',
  },
  ANAL: {
    general: '',
    inserted: '',
    internal: '',
    mature: '',
  },
} as const;

export const PARASITE_ORIGIN_NARRATIVE_REFERENCES = {
  INSECTOID: {
    general: '',
    juvenile: '',
    mature: '',
  },
  TENTACLE: {
    general: '',
    juvenile: '',
    mature: '',
  },
} as const;
