import type {
  BodyCompartmentId,
  BodyLoadStage,
  BodyPayloadChannel,
  BodyPayloadEntry,
  BodyPayloadKind,
} from '../types';
import {
  getBodyPayloadChannelDisplay,
  resolveBodyPayloadChannel,
} from './bodyPayloadUserDefinitions';
import { getMonsterSubtypeDisplayName } from './world/monsterPayloadEmission';

export interface BodyPayloadDisplayMeta {
  label: string;
  amountLabel: string;
  unit?: string;
}

/**
 * payloadKind는 기계적 동작 분류용이다.
 * 실제 사용자 표시명은 A/B/C 채널 정의를 우선한다.
 */
export const BODY_PAYLOAD_DISPLAY_META: Record<BodyPayloadKind, BodyPayloadDisplayMeta> = {
  STANDARD_FLUID: { label: '내용물', amountLabel: '내용물 양' },
  INSECTOID_SECRETION: { label: '분비물', amountLabel: '분비물 양' },
  URINE: { label: '외부 유입 액체', amountLabel: '외부 유입 액체 양' },
  EGG: { label: '알', amountLabel: '알 수', unit: '개' },
  PARASITE: { label: '기생체', amountLabel: '기생체 수', unit: '개' },
  OTHER: { label: '기타 내용물', amountLabel: '내용물 양' },
};

export const BODY_ILLUSTRATION_STAGES: Array<Exclude<BodyLoadStage, 'EMPTY'>> = [
  'TRACE',
  'LOW',
  'MEDIUM',
  'HIGH',
  'SATURATED',
];

export const BODY_ILLUSTRATION_CHANNELS: BodyPayloadChannel[] = ['A', 'B', 'C'];

export interface BodyIllustrationSlot {
  /** 내부 연결용. UI에는 표시하지 않는다. */
  slotId: string;
  imageSrc: string;
  imageAlt: string;
}

/**
 * 컴포넌트 1·2 전용 삽화 슬롯.
 * 2 compartments × 3 user payload channels × 5 stages = 정확히 30칸.
 * imageSrc는 사용자가 나중에 실제 자산을 연결할 때까지 빈 문자열로 유지한다.
 */
export const BODY_COMPONENT_ILLUSTRATION_SLOTS: Record<
  Extract<BodyCompartmentId, 'COMPARTMENT_1' | 'COMPARTMENT_2'>,
  Record<BodyPayloadChannel, Record<Exclude<BodyLoadStage, 'EMPTY'>, BodyIllustrationSlot>>
> = {
  COMPARTMENT_1: {
    A: {
      TRACE: { slotId: 'BODY_C1_A_TRACE', imageSrc: '', imageAlt: '' },
      LOW: { slotId: 'BODY_C1_A_LOW', imageSrc: '', imageAlt: '' },
      MEDIUM: { slotId: 'BODY_C1_A_MEDIUM', imageSrc: '', imageAlt: '' },
      HIGH: { slotId: 'BODY_C1_A_HIGH', imageSrc: '', imageAlt: '' },
      SATURATED: { slotId: 'BODY_C1_A_SATURATED', imageSrc: '', imageAlt: '' },
    },
    B: {
      TRACE: { slotId: 'BODY_C1_B_TRACE', imageSrc: '', imageAlt: '' },
      LOW: { slotId: 'BODY_C1_B_LOW', imageSrc: '', imageAlt: '' },
      MEDIUM: { slotId: 'BODY_C1_B_MEDIUM', imageSrc: '', imageAlt: '' },
      HIGH: { slotId: 'BODY_C1_B_HIGH', imageSrc: '', imageAlt: '' },
      SATURATED: { slotId: 'BODY_C1_B_SATURATED', imageSrc: '', imageAlt: '' },
    },
    C: {
      TRACE: { slotId: 'BODY_C1_C_TRACE', imageSrc: '', imageAlt: '' },
      LOW: { slotId: 'BODY_C1_C_LOW', imageSrc: '', imageAlt: '' },
      MEDIUM: { slotId: 'BODY_C1_C_MEDIUM', imageSrc: '', imageAlt: '' },
      HIGH: { slotId: 'BODY_C1_C_HIGH', imageSrc: '', imageAlt: '' },
      SATURATED: { slotId: 'BODY_C1_C_SATURATED', imageSrc: '', imageAlt: '' },
    },
  },
  COMPARTMENT_2: {
    A: {
      TRACE: { slotId: 'BODY_C2_A_TRACE', imageSrc: '', imageAlt: '' },
      LOW: { slotId: 'BODY_C2_A_LOW', imageSrc: '', imageAlt: '' },
      MEDIUM: { slotId: 'BODY_C2_A_MEDIUM', imageSrc: '', imageAlt: '' },
      HIGH: { slotId: 'BODY_C2_A_HIGH', imageSrc: '', imageAlt: '' },
      SATURATED: { slotId: 'BODY_C2_A_SATURATED', imageSrc: '', imageAlt: '' },
    },
    B: {
      TRACE: { slotId: 'BODY_C2_B_TRACE', imageSrc: '', imageAlt: '' },
      LOW: { slotId: 'BODY_C2_B_LOW', imageSrc: '', imageAlt: '' },
      MEDIUM: { slotId: 'BODY_C2_B_MEDIUM', imageSrc: '', imageAlt: '' },
      HIGH: { slotId: 'BODY_C2_B_HIGH', imageSrc: '', imageAlt: '' },
      SATURATED: { slotId: 'BODY_C2_B_SATURATED', imageSrc: '', imageAlt: '' },
    },
    C: {
      TRACE: { slotId: 'BODY_C2_C_TRACE', imageSrc: '', imageAlt: '' },
      LOW: { slotId: 'BODY_C2_C_LOW', imageSrc: '', imageAlt: '' },
      MEDIUM: { slotId: 'BODY_C2_C_MEDIUM', imageSrc: '', imageAlt: '' },
      HIGH: { slotId: 'BODY_C2_C_HIGH', imageSrc: '', imageAlt: '' },
      SATURATED: { slotId: 'BODY_C2_C_SATURATED', imageSrc: '', imageAlt: '' },
    },
  },
};

export function getDominantBodyPayloadChannel(
  entries: Array<{ payloadKind: BodyPayloadKind; payloadChannel?: BodyPayloadChannel; amount: number }>,
): BodyPayloadChannel {
  const totals: Record<BodyPayloadChannel, number> = { A: 0, B: 0, C: 0 };
  for (const entry of entries) {
    const channel = resolveBodyPayloadChannel(entry.payloadKind, entry.payloadChannel);
    totals[channel] += Math.max(0, Number(entry.amount) || 0);
  }
  return (Object.entries(totals) as Array<[BodyPayloadChannel, number]>)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'A';
}

export function getBodyIllustrationSlot(
  compartmentId: BodyCompartmentId,
  stage: BodyLoadStage,
  entries: Array<{ payloadKind: BodyPayloadKind; payloadChannel?: BodyPayloadChannel; amount: number }>,
): BodyIllustrationSlot | undefined {
  if (stage === 'EMPTY') return undefined;
  if (compartmentId !== 'COMPARTMENT_1' && compartmentId !== 'COMPARTMENT_2') return undefined;
  const channel = getDominantBodyPayloadChannel(entries);
  return BODY_COMPONENT_ILLUSTRATION_SLOTS[compartmentId][channel][stage];
}

export function countBodyIllustrationSlots(): number {
  let count = 0;
  for (const compartment of Object.values(BODY_COMPONENT_ILLUSTRATION_SLOTS)) {
    for (const channel of Object.values(compartment)) {
      count += Object.keys(channel).length;
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

export function getBodyPayloadChannelMeta(channel: BodyPayloadChannel) {
  return getBodyPayloadChannelDisplay(channel);
}
