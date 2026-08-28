import type { BodyPayloadChannel, BodyPayloadKind } from '../types';

export interface BodyPayloadChannelUserDefinition {
  /** UI에 표시할 이름. 비어 있으면 내부 A/B/C 대신 '미지정 내용물 n'으로 표시한다. */
  displayName: string;
  /** UI에서 양을 표시할 때 사용할 명칭. 예: 분비량, 축적량. 비어 있으면 '<표시명> 양'을 사용한다. */
  amountLabel: string;
  /** UI에서 양 옆에 붙일 단위. 예: ml, 개. 비어 있으면 단위를 붙이지 않는다. */
  unit: string;
  /** Gemini가 이 내용물이 무엇인지 이해할 때만 쓰는 사용자 작성 참고 문자열. */
  geminiReference: string;
}

/**
 * [USER_TODO]
 * 내용물 A/B/C의 실제 표시명과 의미를 사용자가 직접 작성하는 곳.
 * 빈 문자열은 Gemini 프롬프트에 포함되지 않는다.
 * 내부 채널 문자 A/B/C는 UI/narrative에 노출하지 않는다.
 */
export const BODY_PAYLOAD_CHANNEL_USER_DEFINITIONS: Record<BodyPayloadChannel, BodyPayloadChannelUserDefinition> = {
  A: { displayName: '', amountLabel: '', unit: '', geminiReference: '' },
  B: { displayName: '', amountLabel: '', unit: '', geminiReference: '' },
  C: { displayName: '', amountLabel: '', unit: '', geminiReference: '' },
};

/**
 * 구 세이브/기존 payloadKind가 채널을 명시하지 않았을 때만 쓰는 호환 매핑.
 * 기존의 '일반 물질 / 알 / 기생체' 3계열 구성을 A/B/C로 옮긴다.
 */
export const DEFAULT_BODY_PAYLOAD_CHANNEL_BY_KIND: Record<BodyPayloadKind, BodyPayloadChannel> = {
  STANDARD_FLUID: 'A',
  INSECTOID_SECRETION: 'A',
  URINE: 'A',
  OTHER: 'A',
  EGG: 'B',
  PARASITE: 'C',
};

export function resolveBodyPayloadChannel(
  payloadKind: BodyPayloadKind,
  explicitChannel?: BodyPayloadChannel | null,
): BodyPayloadChannel {
  return explicitChannel === 'A' || explicitChannel === 'B' || explicitChannel === 'C'
    ? explicitChannel
    : DEFAULT_BODY_PAYLOAD_CHANNEL_BY_KIND[payloadKind];
}

const FALLBACK_LABELS: Record<BodyPayloadChannel, string> = {
  A: '미지정 내용물 1',
  B: '미지정 내용물 2',
  C: '미지정 내용물 3',
};

export function getBodyPayloadChannelDisplay(channel: BodyPayloadChannel) {
  const user = BODY_PAYLOAD_CHANNEL_USER_DEFINITIONS[channel];
  const label = user.displayName.trim() || FALLBACK_LABELS[channel];
  return {
    label,
    amountLabel: user.amountLabel.trim() || `${label} 양`,
    unit: user.unit.trim(),
  };
}

export function collectBodyPayloadGeminiReferences(): Array<{ channel: BodyPayloadChannel; displayName: string; reference: string }> {
  return (['A', 'B', 'C'] as BodyPayloadChannel[])
    .map((channel) => ({
      channel,
      displayName: BODY_PAYLOAD_CHANNEL_USER_DEFINITIONS[channel].displayName.trim(),
      reference: BODY_PAYLOAD_CHANNEL_USER_DEFINITIONS[channel].geminiReference.trim(),
    }))
    .filter((entry) => entry.reference.length > 0);
}
