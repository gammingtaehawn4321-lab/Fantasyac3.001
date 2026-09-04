import type {
  BodyCompartmentId,
  BodyLoadStage,
  BodyPayloadEntry,
  BodyPayloadKind,
} from '../types';
import {
  BODY_PAYLOAD_KINDS,
  getBodyPayloadKindDisplay,
} from './bodyPayloadUserDefinitions';
import { getMonsterSubtypeDisplayName } from './world/monsterPayloadEmission';

export interface BodyPayloadDisplayMeta {
  label: string;
  amountLabel: string;
  unit?: string;
}

/**
 * 실제 5종 payload의 UI 표시 메타.
 * 사용자 정의가 비어 있으면 종류별 기본 표시명을 사용한다.
 */
export const BODY_PAYLOAD_DISPLAY_META: Record<BodyPayloadKind, BodyPayloadDisplayMeta> =
  Object.fromEntries(
    BODY_PAYLOAD_KINDS.map((kind) => [kind, getBodyPayloadKindDisplay(kind)]),
  ) as Record<BodyPayloadKind, BodyPayloadDisplayMeta>;

export const BODY_ILLUSTRATION_STAGES: Array<Exclude<BodyLoadStage, 'EMPTY'>> = [
  'TRACE',
  'LOW',
  'MEDIUM',
  'HIGH',
  'SATURATED',
];

export const BODY_ILLUSTRATION_PAYLOAD_KINDS: BodyPayloadKind[] = [...BODY_PAYLOAD_KINDS];

export interface BodyIllustrationSlot {
  /** 내부 연결용. UI에는 표시하지 않는다. */
  slotId: string;
  imageSrc: string;
  imageAlt: string;
}

type IllustrationStageMap = Record<Exclude<BodyLoadStage, 'EMPTY'>, BodyIllustrationSlot>;
type IllustrationPayloadMap = Record<BodyPayloadKind, IllustrationStageMap>;

const createStageSlots = (
  compartmentShortId: 'C1' | 'C2',
  payloadKind: BodyPayloadKind,
): IllustrationStageMap => ({
  TRACE: { slotId: `BODY_${compartmentShortId}_${payloadKind}_TRACE`, imageSrc: '', imageAlt: '' },
  LOW: { slotId: `BODY_${compartmentShortId}_${payloadKind}_LOW`, imageSrc: '', imageAlt: '' },
  MEDIUM: { slotId: `BODY_${compartmentShortId}_${payloadKind}_MEDIUM`, imageSrc: '', imageAlt: '' },
  HIGH: { slotId: `BODY_${compartmentShortId}_${payloadKind}_HIGH`, imageSrc: '', imageAlt: '' },
  SATURATED: { slotId: `BODY_${compartmentShortId}_${payloadKind}_SATURATED`, imageSrc: '', imageAlt: '' },
});

const createPayloadSlots = (compartmentShortId: 'C1' | 'C2'): IllustrationPayloadMap =>
  Object.fromEntries(
    BODY_ILLUSTRATION_PAYLOAD_KINDS.map((kind) => [kind, createStageSlots(compartmentShortId, kind)]),
  ) as IllustrationPayloadMap;

/**
 * 컴포넌트 1·2 전용 삽화 슬롯.
 * 2 compartments × 5 payload kinds × 5 stages = 정확히 50칸.
 */
export const BODY_COMPONENT_ILLUSTRATION_SLOTS: Record<
  Extract<BodyCompartmentId, 'COMPARTMENT_1' | 'COMPARTMENT_2'>,
  IllustrationPayloadMap
> = {
  COMPARTMENT_1: createPayloadSlots('C1'),
  COMPARTMENT_2: createPayloadSlots('C2'),
};

export function getDominantBodyPayloadKind(
  entries: Array<{ payloadKind: BodyPayloadKind; amount: number }>,
): BodyPayloadKind {
  const totals = Object.fromEntries(
    BODY_PAYLOAD_KINDS.map((kind) => [kind, 0]),
  ) as Record<BodyPayloadKind, number>;

  for (const entry of entries) {
    if (!(entry.payloadKind in totals)) continue;
    totals[entry.payloadKind] += Math.max(0, Number(entry.amount) || 0);
  }

  return (Object.entries(totals) as Array<[BodyPayloadKind, number]>)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'STANDARD_FLUID';
}

export function getBodyIllustrationSlot(
  compartmentId: BodyCompartmentId,
  stage: BodyLoadStage,
  entries: Array<{ payloadKind: BodyPayloadKind; amount: number }>,
): BodyIllustrationSlot | undefined {
  if (stage === 'EMPTY') return undefined;
  if (compartmentId !== 'COMPARTMENT_1' && compartmentId !== 'COMPARTMENT_2') return undefined;

  const kind = getDominantBodyPayloadKind(entries);
  return BODY_COMPONENT_ILLUSTRATION_SLOTS[compartmentId][kind][stage];
}

export function countBodyIllustrationSlots(): number {
  let count = 0;
  for (const compartment of Object.values(BODY_COMPONENT_ILLUSTRATION_SLOTS)) {
    for (const kind of Object.values(compartment)) {
      count += Object.keys(kind).length;
    }
  }
  return count;
}

export function getBodyPayloadSourceDisplayName(entry: BodyPayloadEntry): string {
  if (entry.sourceType === 'CHARACTER') {
    return entry.sourceName?.trim() || '이름 없는 인물';
  }
  if (entry.sourceSpeciesName?.trim()) return entry.sourceSpeciesName.trim();
  if (entry.sourceSpeciesId?.trim()) {
    const speciesLabel = getMonsterSubtypeDisplayName(entry.sourceSpeciesId);
    if (speciesLabel !== '종족 미상') return speciesLabel;
  }
  if (entry.sourceName?.trim()) return entry.sourceName.trim();
  return '출처 미상';
}

export function getBodyPayloadKindMeta(kind: BodyPayloadKind) {
  return getBodyPayloadKindDisplay(kind);
}
