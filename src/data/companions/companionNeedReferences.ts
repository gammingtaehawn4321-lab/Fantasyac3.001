export interface CompanionNeedReferenceEntry {
  title: string;
  baseReference: string;
  customReference: string;
}

export const COMPANION_NEED_REFERENCES: Record<string, CompanionNeedReferenceEntry> = {
  desire30: {
    title: '호감이 짙어지는 순간',
    baseReference: '해당 동료가 플레이어에게 평소보다 자주 시선을 두고 가까이 있으려는 기색을 보인다. 가벼운 호감과 긴장감을 중심으로 자연스럽게 연출하고 플레이어의 반응을 임의로 확정하지 않는다.',
    // USER_TODO: 사용자가 직접 작성했을 때만 Gemini 참고자료에 포함됩니다.
    customReference: '',
  },
  desire50: {
    title: '숨기기 어려운 호감',
    baseReference: '해당 동료가 플레이어에게 느끼는 끌림을 더 분명하게 드러낸다. 말투와 거리감, 망설임을 통해 감정을 표현하되 관계의 진전은 플레이어 선택에 맡긴다.',
    // USER_TODO: 사용자가 직접 작성했을 때만 Gemini 참고자료에 포함됩니다.
    customReference: '',
  },
  desire70: {
    title: '강해진 충동',
    baseReference: '해당 동료가 강한 끌림 때문에 평정심을 유지하기 어려워한다. 플레이어에게 가까워지고 싶다는 뜻을 직접 또는 간접적으로 표현할 수 있지만, 거절이나 거리 두기를 무시하지 않는다. 보조 동료가 지정되어 있다면 상황을 눈치채거나 말을 거는 정도로만 자연스럽게 합류시킬 수 있다.',
    // USER_TODO: 사용자가 직접 작성했을 때만 Gemini 참고자료에 포함됩니다.
    customReference: '',
  },
  desire100: {
    title: '한계에 닿은 마음',
    baseReference: '해당 동료가 더는 감정을 숨기기 어려운 상태다. 플레이어에게 자신의 마음이나 가까워지고 싶은 의사를 명확하게 밝히되, 상대의 동의 없는 행동을 확정하지 않는다. 플레이어가 거절하면 물러서거나 스스로 진정할 여지를 남긴다.',
    // USER_TODO: 사용자가 직접 작성했을 때만 Gemini 참고자료에 포함됩니다.
    customReference: '',
  },
  urination30: {
    title: '조금 신경 쓰이는 상태',
    baseReference: '해당 동료가 잠시 불편한 기색을 보이지만 아직 활동에는 큰 지장이 없다. 자세나 움직임의 작은 변화 정도로만 자연스럽게 표현한다.',
    // USER_TODO: 사용자가 직접 작성했을 때만 Gemini 참고자료에 포함됩니다.
    customReference: '',
  },
  urination50: {
    title: '휴식이 필요한 상태',
    baseReference: '해당 동료가 슬슬 쉬어 갈 장소를 찾거나 잠시 자리를 비울 필요를 느낀다. 이동 중이라면 휴식을 제안할 수 있다.',
    // USER_TODO: 사용자가 직접 작성했을 때만 Gemini 참고자료에 포함됩니다.
    customReference: '',
  },
  urination70: {
    title: '급해진 상태',
    baseReference: '해당 동료가 더 미루기 어려워져 플레이어에게 잠시 멈추거나 자리를 비우겠다고 말한다. 보조 동료가 지정되어 있다면 길을 봐 주거나 가볍게 반응하는 정도로만 함께 연출한다.',
    // USER_TODO: 사용자가 직접 작성했을 때만 Gemini 참고자료에 포함됩니다.
    customReference: '',
  },
  urination100: {
    title: '즉시 해소 필요',
    baseReference: '해당 동료가 더는 참지 않고 사생활이 확보되는 곳으로 자리를 옮겨 정상적으로 용변을 해결한다. 플레이어에게 불필요한 노출이나 강요가 발생하지 않도록 처리한 뒤 자연스럽게 일행에 복귀한다.',
    // USER_TODO: 사용자가 직접 작성했을 때만 Gemini 참고자료에 포함됩니다.
    customReference: '',
  },
};

export function getCompanionNeedReference(kind: 'DESIRE' | 'URINATION', threshold: number) {
  return COMPANION_NEED_REFERENCES[`${kind === 'DESIRE' ? 'desire' : 'urination'}${threshold}`];
}
