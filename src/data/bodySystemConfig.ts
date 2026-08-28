import type { BodyCompartmentId, BodyLoadStage, BodyPayloadKind } from '../types';

export const BODY_COMPARTMENT_CAPACITY: Record<BodyCompartmentId, number> = {
  COMPARTMENT_1: 100,
  COMPARTMENT_2: 100,
  COMPARTMENT_3: 80,
};

export const BODY_LOAD_THRESHOLDS: Array<{ stage: BodyLoadStage; minRatio: number }> = [
  { stage: 'SATURATED', minRatio: 0.85 },
  { stage: 'HIGH', minRatio: 0.60 },
  { stage: 'MEDIUM', minRatio: 0.30 },
  { stage: 'LOW', minRatio: 0.10 },
  { stage: 'TRACE', minRatio: 0.001 },
  { stage: 'EMPTY', minRatio: 0 },
];

// 100% 부하에서의 최대 기여치. 모든 payload 합산 후에도 전역 상한을 다시 적용한다.
export const BODY_PAYLOAD_EFFECTS: Record<BodyPayloadKind, {
  desire: number;
  lewdness: number;
  corruption: number;
  sensitivity: number;
}> = {
  STANDARD_FLUID: { desire: 7, lewdness: 0.8, corruption: 0.25, sensitivity: 0 },
  INSECTOID_SECRETION: { desire: 11, lewdness: 1.2, corruption: 0.8, sensitivity: 6 },
  URINE: { desire: 4, lewdness: 0.65, corruption: 0.35, sensitivity: 1 },
  EGG: { desire: 10, lewdness: 1.4, corruption: 0.75, sensitivity: 3 },
  PARASITE: { desire: 13, lewdness: 1.6, corruption: 1.1, sensitivity: 5 },
  OTHER: { desire: 4, lewdness: 0.4, corruption: 0.2, sensitivity: 0 },
};

export const BODY_DERIVED_EFFECT_CAPS = {
  desire: 25,
  lewdness: 3.5,
  corruption: 2,
  sensitivity: 12,
} as const;

export const BODY_COMPARTMENT_EFFECT_WEIGHTS: Record<BodyCompartmentId, {
  desire: number;
  lewdness: number;
  corruption: number;
  sensitivity: number;
}> = {
  COMPARTMENT_1: { desire: 1.0, lewdness: 1.0, corruption: 1.0, sensitivity: 1.0 },
  COMPARTMENT_2: { desire: 0.9, lewdness: 1.05, corruption: 1.05, sensitivity: 0.9 },
  COMPARTMENT_3: { desire: 0.65, lewdness: 0.75, corruption: 0.65, sensitivity: 0.6 },
};

export const BLADDER_CONFIG = {
  capacity: 100,
  productionPerMinute: 0.035,
  highUrgeThreshold: 75,
  fullThreshold: 98,
  reflexChanceByPartnerCategory: {
    HUMANOID: 0.30,
    ABERRANT: 0.70,
  },
} as const;

export const INSERTED_PARASITE_EMISSION_DEFAULT = {
  intervalMinutes: 60,
  amountPerInterval: 4,
  payloadKind: 'INSECTOID_SECRETION' as const,
};

export const BODY_STATUS_VISUALS = {
  COMPARTMENT_1: { label: '보지', imageSrc: '', imageAlt: '' },
  COMPARTMENT_2: { label: '항문', imageSrc: '', imageAlt: '' },
  COMPARTMENT_3: { label: '구강', imageSrc: '', imageAlt: '' },
} as const;

export const BLADDER_STATUS_VISUAL = {
  label: '소변 욕구',
  imageSrc: '',
  imageAlt: '',
} as const;
