import type { BodyPayloadKind } from '../types';

export interface BodyPayloadKindUserDefinition {
  /** UI에 표시할 사용자 지정 이름. 비어 있으면 payloadKind별 기본 표시명을 사용한다. */
  displayName: string;
  /** UI에서 양을 표시할 때 사용할 명칭. 비어 있으면 payloadKind별 기본 문구를 사용한다. */
  amountLabel: string;
  /** UI에서 양 옆에 붙일 단위. 비어 있으면 payloadKind별 기본 단위를 사용한다. */
  unit: string;
  /** Gemini가 이 내용물의 사용자 설정을 이해할 때만 쓰는 참고 문자열. */
  geminiReference: string;
}

/**
 * 판타지악에서 실제로 추적하는 payload는 정확히 아래 5종이다.
 * A/B/C 같은 별도 표시 채널은 사용하지 않는다.
 */
export const BODY_PAYLOAD_KINDS: BodyPayloadKind[] = [
  'STANDARD_FLUID',
  'INSECTOID_SECRETION',
  'URINE',
  'EGG',
  'PARASITE',
];

/**
 * [USER_TODO]
 * 실제 5종 payload 각각의 표시명/단위/추가 의미를 직접 작성하는 곳.
 * geminiReference가 빈 문자열이면 프롬프트에 추가 사용자 정의를 넣지 않는다.
 */
export const BODY_PAYLOAD_USER_DEFINITIONS: Record<BodyPayloadKind, BodyPayloadKindUserDefinition> = {
  STANDARD_FLUID: {
    displayName: '정액',
    amountLabel: '정액',
    unit: 'ml',
    geminiReference: '곤충형을 제외한 다른 종족의 정액입니다.',
  },
  INSECTOID_SECRETION: {
    displayName: '곤충 정액',
    amountLabel: '곤충 정액',
    unit: 'ml',
    geminiReference: '곤충형 개체의 정액입니다. 강력한 최음 효과가 있으며, 더 꾸덕하고 초록색입니다. 플레이어의 배란을 촉진합니다.',
  },
  URINE: {
    displayName: '소변',
    amountLabel: '소변',
    unit: 'ml',
    geminiReference: '플레이어에게 강제로 주입된 소변입니다. 플레이어에게 자괴감을 불러일으킵니다.',
  },
  EGG: {
    displayName: '곤충 알',
    amountLabel: '곤충 알',
    unit: '개',
    geminiReference: '곤충에게 범해진 후 몸 속에 남은 알입니다. 곤충 정액과 반응하면 미세하게 진동하여 자극을 줍니다.',
  },
  PARASITE: {
    displayName: '기생체',
    amountLabel: '기생체',
    unit: '개',
    geminiReference: '곤충의 알이 내부에서 부화했습니다. 플레이어의 몸 속에서 끊임없이 움직이며 절정에 이르게 합니다.',
  },
};

const FALLBACK_META: Record<BodyPayloadKind, { label: string; amountLabel: string; unit: string }> = {
  STANDARD_FLUID: {
    label: '정액',
    amountLabel: '정액 양',
    unit: '',
  },
  INSECTOID_SECRETION: {
    label: '곤충 정액',
    amountLabel: '곤충 정액 양',
    unit: '',
  },
  URINE: {
    label: '소변',
    amountLabel: '소변 양',
    unit: '',
  },
  EGG: {
    label: '알',
    amountLabel: '알 수',
    unit: '개',
  },
  PARASITE: {
    label: '기생체',
    amountLabel: '기생체 수',
    unit: '개',
  },
};

export function getBodyPayloadKindDisplay(kind: BodyPayloadKind) {
  const user = BODY_PAYLOAD_USER_DEFINITIONS[kind];
  const fallback = FALLBACK_META[kind];
  const label = user.displayName.trim() || fallback.label;

  return {
    label,
    amountLabel: user.amountLabel.trim() || fallback.amountLabel || `${label} 양`,
    unit: user.unit.trim() || fallback.unit,
  };
}

export function collectBodyPayloadGeminiReferences(): Array<{
  kind: BodyPayloadKind;
  displayName: string;
  reference: string;
}> {
  return BODY_PAYLOAD_KINDS
    .map((kind) => ({
      kind,
      displayName: BODY_PAYLOAD_USER_DEFINITIONS[kind].displayName.trim(),
      reference: BODY_PAYLOAD_USER_DEFINITIONS[kind].geminiReference.trim(),
    }))
    .filter((entry) => entry.reference.length > 0);
}
