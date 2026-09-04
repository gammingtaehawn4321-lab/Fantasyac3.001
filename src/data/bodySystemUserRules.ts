/**
 * 이 파일의 문자열은 화면에 그대로 출력되는 문장이 아닙니다.
 * Gemini가 장면을 구조화된 상태 변화로 판정할 때 참고하는 사용자 규칙입니다.
 * 실제 표시명/구체적인 장면 조건은 사용자가 직접 작성하세요.
 */
export const BODY_SYSTEM_USER_RULES = {
  compartments: {
    COMPARTMENT_1: '보지(음부)에 사정당할 경우',
    COMPARTMENT_2: '애널(항문)에 사정당할 경우',
    COMPARTMENT_3: '구강(입)에 사정당할 경우',
  },

  // 어떤 장면에서 범용 반사 배출 판정을 실행할지 자연어로 작성.
  reflexTriggerRule: '한 성교 내에서 두 번 이상 절정하거나 사정할 경우, 또는 사정할 시 보통 확률로 발생, 일부 인카운터에서 플레이어를 변기로 취급하거나 여길시에도 발생',

  // 어떤 장면에서 payload가 추가/감소하는지 보조 규칙이 필요하면 작성.
  payloadChangeRule: '플레이어가 수컷 또는 남성 또는 기타 이형에 의하여 사정을 받거나 산란당할 때 추가시키고, 정액 배출이나 알이 부화해 나올 때 감소한다.',

  // 외부에서 유입되는 URINE payload가 발생했다고 판정할 장면 조건을 자연어로 작성.
  // 플레이어 자신의 bladderStatus와는 완전히 별개입니다.
  externalUrineTriggerRule: '플레이어가 변기처럼 쓰일 때, 소변을 받을 때, 외부에서 소변이 주입될 때, 플레이어가 질내방뇨, 장내방뇨 당할 때, 플레이어가 소변을 마실 때 증가한다.',

  // 임신 성립을 별도로 판정해야 하는 경우 사용할 사용자 규칙.
  pregnancyTriggerRule: '임신은 산란/부화와 별개다. COMPARTMENT_1의 임신 가능 정액량만 엔진이 판정하며 COMPARTMENT_2에서는 임신할 수 없다. COMPARTMENT_1 최대 용량의 80% 이상이 임신 가능 정액으로 채워지면 확정 임신하고, 그 미만은 현재 양에 비례한 확률 판정을 사용한다.',

  eggSystemRule: '알은 INSECTOID_EGG와 TENTACLE_EGG 두 종류뿐이다. 곤충형 알은 같은 구획의 INSECTOID_SECRETION과, 촉수형 알은 같은 구획의 STANDARD_FLUID와 반응한다. 알은 COMPARTMENT_1/2에서만 존재하며 부화하면 해당 구획 EGG 점유에서 제거되고 독립 ParasiteState로 전환된다.',

  parasiteSystemRule: '부화한 기생체는 기존 구획 payload/용량 계산에서 완전히 분리한다. 기원 경로는 VAGINAL/ANAL, 성장형은 INSERTED/INTERNAL의 두 축으로 독립 추적한다.',
} as const;
