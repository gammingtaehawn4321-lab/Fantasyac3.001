import type { BeastkinType, Race } from './raceData';

/**
 * 종족별 서사 연출의 단일 원본(Source of Truth).
 *
 * 이 파일에 모아 둔 것:
 * - 일반 서사에서 항상 참고하는 종족성
 * - NPC/사회 반응
 * - 감각·환경 묘사
 * - 종족별 프롤로그 분위기
 * - 종족별 인카운터 가중치
 * - 전투 카드에서 덧붙는 종족 말풍선
 * - 용족 전용 세계관/사냥꾼 인카운터/사용자 참조
 *
 * 이 파일에 넣지 않는 것:
 * - 능력치, 패시브, 스킬, 세력 친화도 같은 실제 게임 밸런스 데이터
 * - 운명(Fate) 자체의 개별 스토리
 * 위 항목들은 각각 raceData.ts / fateData.ts가 계속 담당한다.
 */

export type RaceNarrativeKey =
  | 'HUMAN'
  | 'ELF'
  | 'BEASTKIN_FOX'
  | 'BEASTKIN_CAT'
  | 'BEASTKIN_DOG'
  | 'BEASTKIN_WOLF'
  | 'BEASTKIN_BIRD'
  | 'YETI'
  | 'MERFOLK'
  | 'DRAGONKIN';

export type RaceAdultEncounterBias = 'LOW' | 'NORMAL' | 'HIGH';

export interface RaceEncounterTuning {
  /** 신체적 나이 18+에서만 사용되는 기본 사건 창 확률. */
  adultBaseChance: number;

  /** 일반 사회적 위험/갈등 사건 창 확률. */
  socialRiskChance: number;

  adultBias: RaceAdultEncounterBias;

  /**
   * 내부 주기가 있는 종족에서만 사용.
   * UI와 서사에는 주기 이름/길이/수치를 직접 노출하지 않는다.
   */
  hiddenCycle?: {
    length: number;
    activeLength: number;
    activeAdultChance: number;
  };
}

export type RaceCombatSpeechEvent =
  | 'BATTLE_START'
  | 'ACTION_HP_HIGH'
  | 'ACTION_HP_MID'
  | 'ACTION_HP_LOW'
  | 'ACTION_HP_CRITICAL'
  | 'ATTACK_SUCCESS'
  | 'ATTACK_CRITICAL'
  | 'ATTACK_MISS'
  | 'TARGET_EVADED'
  | 'HIT_RECEIVED'
  | 'HEAVY_HIT_RECEIVED'
  | 'EVADE_SUCCESS'
  | 'DEFEND_SUCCESS'
  | 'DEFEND'
  | 'SUPPORT'
  | 'ITEM_USE'
  | 'ENEMY_DEFEATED'
  | 'ALLY_DEFEATED'
  | 'VICTORY'
  | 'DEFEAT'
  | 'ESCAPE_ATTEMPT'
  | 'ESCAPE_SUCCESS'
  | 'ESCAPE_FAIL';

export interface RaceNarrativeProfile {
  key: RaceNarrativeKey;
  race: Race;
  beastkinType?: BeastkinType;
  displayName: string;

  /** Gemini 일반 서사에 항상 전달되는 참조. */
  coreReference: string;
  socialReference: string;
  sensoryReference: string;
  environmentReference: string;
  behaviorReference: string;
  eventToneReference: string;
  avoidReference: string;

  /** 시작 로그용. 실제 외형 문장은 buildRacePrologueText에서 현재 프로필과 조합한다. */
  prologueSetting: string;
  prologueTransition: string;

  /** 각 종족/세부종별로 완전히 독립된 인카운터 설정. */
  encounterTuning: RaceEncounterTuning;

  /** 전투 카드의 기본 문장 뒤에 짧게 덧붙는 종족 참조. */
  combatSpeech: Partial<Record<RaceCombatSpeechEvent, string>>;

  /** 특정 종족만 필요한 프롬프트 제약. */
  promptRules?: string[];
}

/**
 * ============================================================
 * 종족별 인카운터 튜닝
 * ============================================================
 *
 * 더 이상 NORMAL / BEASTKIN 같은 공용 인카운터 객체를 공유하지 않는다.
 *
 * HUMAN
 * ELF
 * BEASTKIN_FOX
 * BEASTKIN_CAT
 * BEASTKIN_DOG
 * BEASTKIN_WOLF
 * BEASTKIN_BIRD
 * YETI
 * MERFOLK
 * DRAGONKIN
 *
 * 전부 독립된 설정이다.
 *
 * 따라서 이후 특정 종족의 adultBaseChance,
 * socialRiskChance, hiddenCycle 등을 수정해도
 * 다른 종족에는 영향을 주지 않는다.
 *
 * 현재 수치는 3.009 이전 동작을 유지하도록 설정되어 있다.
 */
export const RACE_ENCOUNTER_TUNINGS: Record<
  RaceNarrativeKey,
  RaceEncounterTuning
> = {
  HUMAN: {
    adultBaseChance: 0.10,
    socialRiskChance: 0.12,
    adultBias: 'NORMAL',
  },

  ELF: {
    adultBaseChance: 0.05,
    socialRiskChance: 0.06,
    adultBias: 'LOW',
  },

  BEASTKIN_FOX: {
    adultBaseChance: 0.18,
    socialRiskChance: 0.32,
    adultBias: 'HIGH',

    hiddenCycle: {
      length: 18,
      activeLength: 4,
      activeAdultChance: 0.34,
    },
  },

  BEASTKIN_CAT: {
    adultBaseChance: 0.18,
    socialRiskChance: 0.32,
    adultBias: 'HIGH',

    hiddenCycle: {
      length: 18,
      activeLength: 4,
      activeAdultChance: 0.34,
    },
  },

  BEASTKIN_DOG: {
    adultBaseChance: 0.18,
    socialRiskChance: 0.32,
    adultBias: 'HIGH',

    hiddenCycle: {
      length: 18,
      activeLength: 4,
      activeAdultChance: 0.34,
    },
  },

  BEASTKIN_WOLF: {
    adultBaseChance: 0.18,
    socialRiskChance: 0.32,
    adultBias: 'HIGH',

    hiddenCycle: {
      length: 18,
      activeLength: 4,
      activeAdultChance: 0.34,
    },
  },

  BEASTKIN_BIRD: {
    adultBaseChance: 0.18,
    socialRiskChance: 0.32,
    adultBias: 'HIGH',

    hiddenCycle: {
      length: 18,
      activeLength: 4,
      activeAdultChance: 0.34,
    },
  },

  YETI: {
    adultBaseChance: 0.20,
    socialRiskChance: 0.40,
    adultBias: 'HIGH',
  },

  MERFOLK: {
    adultBaseChance: 0.25,
    socialRiskChance: 0.30,
    adultBias: 'HIGH',
  },

  DRAGONKIN: {
    adultBaseChance: 0.10,
    socialRiskChance: 0.12,
    adultBias: 'HIGH',
  },
};

export const RACE_NARRATIVE_PROFILES: Record<
  RaceNarrativeKey,
  RaceNarrativeProfile
> = {
  HUMAN: {
    key: 'HUMAN',
    race: 'HUMAN',
    displayName: '인간',

    coreReference:
      '인간은 판타지악 여러 지역에 가장 널리 퍼진 종족이며 특정 환경이나 문화 하나로만 규정하지 않는다. 새로운 기술·직업·생활양식에 빠르게 적응하는 유연성을 종족성의 핵심으로 삼는다.',

    socialReference:
      '대부분의 도시와 교역로에서 인간이라는 사실 자체는 특별한 사건이 아니다. NPC의 반응은 종족보다 복장, 직업, 평판, 소속 세력, 최근 행동을 우선해 달라져야 한다.',

    sensoryReference:
      '초인적인 종족 감각을 임의로 부여하지 않는다. 관찰과 판단은 훈련, 장비, 현재 능력치와 상황에 근거해 묘사한다.',

    environmentReference:
      '특정 지형에 선천적으로 완전 적응한 종족처럼 묘사하지 말고, 대신 낯선 환경에 방법을 찾아 적응하고 도구를 활용하는 모습을 강조할 수 있다.',

    behaviorReference:
      '인간이라는 이유만으로 성격을 고정하지 않는다. 다양한 배경과 선택지가 가능하며 현재 캐릭터 설정과 말투를 최우선한다.',

    eventToneReference:
      '인간 종족 이벤트는 정치, 길드, 생업, 도시와 변경의 문화 차이, 새로운 기술이나 세력 사이를 오가는 적응력을 자연스럽게 활용한다.',

    avoidReference:
      '인간을 무조건 평범하거나 약한 종족으로 낮춰 묘사하지 않는다. 반대로 특별한 근거 없이 모든 분야에 천재적인 만능 종족으로 과장하지 않는다.',

    prologueSetting:
      '낯선 길과 익숙하지 않은 풍경이 맞닿는 숲의 입구에서, 아침 공기와 함께 의식이 또렷해집니다.',

    prologueTransition:
      '특별한 혈통보다 앞으로 무엇을 배우고 어떤 길을 택할지가 더 중요해 보입니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.HUMAN,

    combatSpeech: {
      BATTLE_START: '익숙한 방식대로 해 보자.',
      ACTION_HP_LOW: '버티는 건 인간의 특기지.',
      ATTACK_SUCCESS: '감각이 왔어.',
      VICTORY: '어떻게든 해냈네.',
    },
  },

  ELF: {
    key: 'ELF',
    race: 'ELF',
    displayName: '엘프',

    coreReference:
      '엘프는 숲과 자연의 마력 흐름에 깊게 친화된 고대 종족이다. 높은 지능과 정신력, 마법 친화성과 숲의 감각을 자연스럽게 서사에 반영한다.',

    socialReference:
      '엘프를 접한 NPC는 오래된 종족에 대한 존중, 낯섦, 거리감, 호기심 등을 보일 수 있다. 모든 인간이 엘프를 숭배하거나 적대하는 식으로 단순화하지 않는다.',

    sensoryReference:
      '바람, 나뭇잎, 마력의 흐름, 자연 속의 미세한 변화에 민감한 감각을 활용한다. 이 감각은 숲과 자연·마력 환경에서 특히 선명하며 전지적 탐지 능력은 아니다.',

    environmentReference:
      '숲과 자연에서는 익숙함과 마력적 교감을 강조할 수 있다. 인공적이거나 오염된 환경에서는 자연의 흐름이 끊긴 듯한 이질감을 표현할 수 있으나 실제 페널티는 게임 상태를 따른다.',

    behaviorReference:
      '고대 종족이라는 이유로 반드시 근엄하거나 오만하게 만들지 않는다. 캐릭터 개별 성격을 우선하되 긴 시간 축과 자연을 보는 관점이 대사나 관찰에 은은히 스며들 수 있다.',

    eventToneReference:
      '엘프 종족 이벤트는 숲, 정령, 오래된 유적, 마력 이상, 인간 사회와의 문화 차이처럼 고대성과 자연 친화를 활용한다.',

    avoidReference:
      '엘프를 자동으로 완벽한 현자나 무감정한 귀족으로 만들지 않는다. 육체적 약점 역시 모든 행동을 무력하게 만드는 식으로 과장하지 않는다.',

    prologueSetting:
      '고대의 마력이 은은하게 일렁이는 숲속, 나뭇잎 사이로 스치는 바람과 함께 눈을 뜹니다.',

    prologueTransition:
      '주변의 생명과 마력의 흐름이 다른 종족보다 조금 더 선명하게 감각에 닿습니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.ELF,

    combatSpeech: {
      BATTLE_START: '숨결과 흐름을 맞춰.',
      ACTION_HP_HIGH: '주변의 흐름이 선명해.',
      ATTACK_SUCCESS: '흐름이 이어졌어.',
      EVADE_SUCCESS: '바람이 먼저 알려 줬어.',
      VICTORY: '다시 고요해졌네.',
    },
  },

  BEASTKIN_FOX: {
    key: 'BEASTKIN_FOX',
    race: 'BEASTKIN',
    beastkinType: 'FOX',
    displayName: '여우 수인',

    coreReference:
      '여우 수인은 날렵한 몸놀림과 비상한 지혜, 교섭과 기만, 환술에 강점을 가진 수인이다. 수인 고유의 귀와 꼬리 같은 외형 특징을 장면 속 움직임과 감정 표현에 자연스럽게 반영한다.',

    socialReference:
      '호기심과 경계가 동시에 향할 수 있으며, 상인·정보상·협상가 같은 인물은 여우 수인의 영리함을 의식할 수 있다. 모든 NPC가 여우 수인을 거짓말쟁이로 단정하지 않는다.',

    sensoryReference:
      '청각과 후각, 주변 기척에 대한 예민함을 활용하되 무조건적인 탐지 성공으로 처리하지 않는다. 귀와 꼬리의 미세한 반응은 감정 보조 묘사로 사용할 수 있다.',

    environmentReference:
      '복잡한 골목, 시장, 협상 자리, 변수가 많은 상황에서 재치와 관찰력을 살린 선택지가 잘 어울린다. 숲과 야외에서도 기척 읽기와 빠른 움직임을 활용할 수 있다.',

    behaviorReference:
      '장난기나 능글맞음은 가능한 경향일 뿐 강제 성격이 아니다. 현재 캐릭터의 말투와 성격을 우선하고, 필요할 때 재치와 눈치 빠른 대응으로 종족성을 드러낸다.',

    eventToneReference:
      '여우 수인 사건은 협상, 소문, 환술, 속임수의 역이용, 예상 밖의 돌파구처럼 지능과 기민함이 빛나는 구조를 선호한다.',

    avoidReference:
      '여우 수인을 항상 교활하거나 유혹적인 존재로 단정하지 않는다. 귀와 꼬리를 장면마다 과도하게 반복 묘사하지 않는다.',

    prologueSetting:
      '거친 바람과 숲의 흙냄새가 스치는 경계 지대에서, 예민한 감각이 하나씩 깨어납니다.',

    prologueTransition:
      '귀에 잡히는 작은 소리와 주변 사람들의 시선 사이에서, 다음 수를 읽는 감각이 자연스럽게 살아납니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.BEASTKIN_FOX,

    combatSpeech: {
      BATTLE_START: '냄새와 소리, 전부 잡았어.',
      ACTION_HP_LOW: '본능은 아직 살아 있어.',
      ATTACK_SUCCESS: '잡았다!',
      EVADE_SUCCESS: '그쪽 움직임은 들렸어.',
      HEAVY_HIT_RECEIVED: '으르… 아직 괜찮아.',
      VICTORY: '이제 긴장 풀어도 되겠네.',
    },
  },

  BEASTKIN_CAT: {
    key: 'BEASTKIN_CAT',
    race: 'BEASTKIN',
    beastkinType: 'CAT',
    displayName: '고양이 수인',

    coreReference:
      '고양이 수인은 뛰어난 민첩성과 유연성, 야간 시야와 착지 감각을 지닌 수인이다. 좁은 공간, 높낮이, 어둠, 순간적인 방향 전환에서 종족성이 자연스럽게 드러난다.',

    socialReference:
      '도시와 자유로운 생활권에서는 비교적 자연스럽게 섞일 수 있지만, 예민한 움직임과 독특한 외형 때문에 시선을 받을 수 있다. 타인이 멋대로 성격을 단정하는 묘사는 피한다.',

    sensoryReference:
      '어둠 속 시야, 미세한 소리, 균형 감각과 신체 위치 감각을 강조할 수 있다. 귀와 꼬리는 경계·집중·놀람 같은 감정의 보조 신호로 사용할 수 있다.',

    environmentReference:
      '야간, 동굴, 지붕, 좁은 통로, 불안정한 발판처럼 일반적인 이동이 까다로운 곳에서 강점을 보여준다. 실제 성공 여부는 게임 판정과 능력치를 우선한다.',

    behaviorReference:
      '독립적이거나 변덕스럽다는 고정관념을 성격으로 강제하지 않는다. 행동의 빠른 전환과 주변 공간을 영리하게 쓰는 방식으로 종족성을 표현한다.',

    eventToneReference:
      '고양이 수인 사건은 은신, 추적 회피, 고저차, 야간 탐색, 좁은 장소를 이용한 기습이나 탈출과 잘 어울린다.',

    avoidReference:
      '고양이 같은 의성어나 습관을 대사마다 억지로 넣지 않는다. 동물처럼 취급하거나 지능을 낮춰 묘사하지 않는다.',

    prologueSetting:
      '숲 가장자리의 희미한 그늘 속에서, 어둠까지 또렷하게 가르는 시야와 함께 눈을 뜹니다.',

    prologueTransition:
      '바닥의 높낮이와 작은 소리까지 자연스럽게 읽히며 몸의 균형이 즉시 잡힙니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.BEASTKIN_CAT,

    combatSpeech: {
      BATTLE_START: '소리 들렸어. 위치도 알아.',
      ACTION_HP_LOW: '아직 발은 멀쩡해.',
      ATTACK_SUCCESS: '잡았어.',
      EVADE_SUCCESS: '거긴 이미 비었지.',
      TARGET_EVADED: '빠르네. 다음엔 잡아.',
      VICTORY: '이제 조용해졌네.',
    },
  },

  BEASTKIN_DOG: {
    key: 'BEASTKIN_DOG',
    race: 'BEASTKIN',
    beastkinType: 'DOG',
    displayName: '개 수인',

    coreReference:
      '개 수인은 강인한 끈기와 예민한 후각, 추적 능력, 동료와의 신뢰 형성에 강점을 가진 수인이다. 냄새와 흔적, 오래 이어지는 추적, 협동 상황에서 종족성을 살린다.',

    socialReference:
      '우호 관계를 쌓을 때 신뢰를 중요하게 여기는 인상을 줄 수 있지만 무조건 순종적이거나 충성스러운 성격으로 만들지 않는다. 신뢰는 상호작용과 선택을 통해 형성되어야 한다.',

    sensoryReference:
      '냄새의 방향, 최근 지나간 흔적, 익숙한 사람이나 물건의 향을 구분하는 후각을 주요 감각으로 활용한다. 모든 냄새에서 정답을 알아내는 초능력처럼 쓰지 않는다.',

    environmentReference:
      '길 찾기, 추적, 야외 이동, 동료와의 합동 행동에서 강점을 드러내기 좋다. 복잡한 냄새가 뒤섞인 장소에서는 오히려 정보가 혼선될 수 있다.',

    behaviorReference:
      '협동과 신뢰에 반응하는 경향은 표현할 수 있으나 개인 성격을 덮지 않는다. 위험한 상황에서 동료 위치를 의식하거나 흔적을 확인하는 행동으로 종족성을 드러낸다.',

    eventToneReference:
      '개 수인 사건은 실종자 추적, 냄새를 이용한 탐색, 호위, 구조, 동료와의 협력, 신뢰를 시험하는 선택과 잘 어울린다.',

    avoidReference:
      '개 수인을 애완동물처럼 취급하거나 복종 본능을 강제하지 않는다. 후각 능력만으로 모든 미스터리를 자동 해결하지 않는다.',

    prologueSetting:
      '새벽의 차가운 공기와 젖은 흙 냄새가 선명한 길목에서, 여러 흔적이 한꺼번에 감각으로 들어옵니다.',

    prologueTransition:
      '바람에 섞인 냄새와 발자국이 길의 방향을 말해 주듯 이어집니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.BEASTKIN_DOG,

    combatSpeech: {
      BATTLE_START: '냄새 기억했어. 놓치지 않아.',
      ACTION_HP_LOW: '아직 버틸 수 있어.',
      ATTACK_SUCCESS: '흔적 잡았어!',
      SUPPORT: '내가 맞출게. 같이 가!',
      ALLY_DEFEATED: '거기 있어. 내가 끝낼게.',
      VICTORY: '다들 무사하지?',
    },
  },

  BEASTKIN_WOLF: {
    key: 'BEASTKIN_WOLF',
    race: 'BEASTKIN',
    beastkinType: 'WOLF',
    displayName: '늑대 수인',

    coreReference:
      '늑대 수인은 강한 완력과 체력, 사냥감의 빈틈을 읽는 포식자 감각, 무리 단위의 결속과 위압감을 가진 수인이다. 전투나 추적에서 날카로운 집중력을 강조한다.',

    socialReference:
      '강한 인상 때문에 일부 NPC가 경계하거나 존중할 수 있지만, 모든 늑대 수인을 난폭한 존재로 취급하지 않는다. 무리와 동료에 대한 태도 역시 개인 관계에 따라 달라진다.',

    sensoryReference:
      '후각과 청각, 상처 입은 대상의 움직임, 공포나 망설임이 드러나는 작은 행동을 포착하는 감각을 활용한다. 마음을 읽는 능력처럼 확정적으로 묘사하지 않는다.',

    environmentReference:
      '야간, 설원, 숲, 추적전, 넓은 전장에서 사냥꾼다운 공간 감각을 살릴 수 있다. 지형 자체의 실제 보정은 게임 시스템을 따른다.',

    behaviorReference:
      '강함과 직선적인 행동은 가능한 경향이지 강제 성격이 아니다. 전투에서는 빈틈을 놓치지 않는 집중, 비전투에서는 동료의 위치와 위험을 의식하는 모습으로 표현할 수 있다.',

    eventToneReference:
      '늑대 수인 사건은 추적전, 위압과 협상, 무리 간 갈등, 사냥, 야간 이동, 동료를 둘러싼 선택과 잘 어울린다.',

    avoidReference:
      '야성이라는 이유로 이성을 잃거나 폭력적으로 행동하게 만들지 않는다. 동물적 본능을 캐릭터의 의사결정보다 우선하지 않는다.',

    prologueSetting:
      '찬 바람이 길게 흐르는 야외에서, 멀리 떨어진 기척까지 조각조각 감각에 잡히며 눈을 뜹니다.',

    prologueTransition:
      '주변의 흔적과 움직임이 자연스럽게 사냥의 동선처럼 이어져 보입니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.BEASTKIN_WOLF,

    combatSpeech: {
      BATTLE_START: '움직임 전부 보인다. 간다.',
      ACTION_HP_LOW: '이 정도로 사냥은 안 끝나.',
      ATTACK_SUCCESS: '빈틈 잡았다.',
      ATTACK_CRITICAL: '거기였어!',
      HEAVY_HIT_RECEIVED: '크르… 제대로 왔네.',
      VICTORY: '사냥 끝.',
    },
  },

  BEASTKIN_BIRD: {
    key: 'BEASTKIN_BIRD',
    race: 'BEASTKIN',
    beastkinType: 'BIRD',
    displayName: '새 수인',

    coreReference:
      '새 수인은 탁 트인 원거리 시야와 지형 분석, 정찰 능력이 뛰어난 수인이다. 높은 곳과 넓은 시야, 바람과 기류를 읽는 관찰력을 서사에 자연스럽게 반영한다.',

    socialReference:
      '정찰자·항법사·여행자와 관련된 사회에서는 능력을 높이 평가할 수 있다. 날개 유무나 깃털 외형은 현재 캐릭터 프로필을 우선한다.',

    sensoryReference:
      '먼 거리의 움직임, 지형의 윤곽, 높은 곳에서의 전체적인 배치와 기류 변화를 잘 포착한다. 벽 너머나 완전히 가려진 대상을 보는 식으로 과장하지 않는다.',

    environmentReference:
      '절벽, 천공, 탑, 비행정, 넓은 평야처럼 시야가 열리는 장소에서 강점을 드러내기 좋다. 밀폐된 공간에서는 원거리 시야의 장점이 줄어드는 느낌을 줄 수 있다.',

    behaviorReference:
      '상황 전체를 먼저 훑고 이동 경로나 위험 요소를 찾는 행동으로 종족성을 표현한다. 성격 자체를 조급하거나 자유분방하게 고정하지 않는다.',

    eventToneReference:
      '새 수인 사건은 정찰, 항법, 고지대, 천공 경로, 원거리 관측, 매복 발견, 바람을 이용한 이동과 잘 어울린다.',

    avoidReference:
      '새 수인에게 프로필에 없는 날개를 임의로 생성하지 않는다. 모든 새 수인이 자유 비행할 수 있다고 가정하지 않는다.',

    prologueSetting:
      '바람이 탁 트인 숲 가장자리에서, 먼 풍경의 윤곽과 작은 움직임까지 한꺼번에 시야에 들어옵니다.',

    prologueTransition:
      '먼 길의 굴곡과 바람의 방향부터 먼저 읽히며 주변 지형이 하나의 지도처럼 정리됩니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.BEASTKIN_BIRD,

    combatSpeech: {
      BATTLE_START: '전장 전체 확인. 움직여.',
      ACTION_HP_HIGH: '시야 좋아. 전부 보여.',
      ATTACK_SUCCESS: '궤적 맞았어.',
      TARGET_EVADED: '이동 경로 확인.',
      EVADE_SUCCESS: '오는 방향은 보였어.',
      VICTORY: '주변 이상 없어.',
    },
  },

  YETI: {
    key: 'YETI',
    race: 'YETI',
    displayName: '설인',

    coreReference:
      '설인은 프로스티의 혹한과 고산 환경에 적응한 인간형 종족이며, 플레이어 설인은 흰 머리와 굽은 뿔을 지닌 여성으로 설정된다. 강한 체력과 설산 생존 감각을 종족성의 핵심으로 삼는다.',

    socialReference:
      '프로스티에서는 토착 종족으로 자연스럽게 받아들여질 수 있으나 다른 지역에서는 뿔과 설산 출신이라는 점 때문에 낯선 시선을 받을 수 있다. 인간 사회와의 관계는 지역과 세력에 따라 다르게 묘사하나, 대부분의 지역에서는 설인에게 적대적이며, 성노예로 삼거나 납치하고 범해도 아무런 처벌이 없는 등 멸시받는다. ',

    sensoryReference:
      '차가운 바람, 눈의 상태, 얼음의 불안정함, 고산의 기후 변화를 경험적으로 읽는 감각을 강조한다. 이것을 미래 예지처럼 과장하지 않는다. 설인의 뿔은 성감대로, 잡기만 해도 무력화되고 성적으로 흥분한다.',

    environmentReference:
      '설원과 산악에서는 익숙하고 안정적인 움직임을 보여준다. 더운 지역의 낯섦은 분위기로 표현할 수 있으나 실제 상태이상이나 수치 페널티는 시스템에 없으면 만들지 않는다.',

    behaviorReference:
      '강인한 체력과 균형 감각을 행동 묘사에 반영하되 말수가 적거나 야만적이라는 성격을 강제하지 않는다.',

    eventToneReference:
      '설인 사건은 눈보라, 산길, 빙벽, 오래된 설산 관습, 프로스티 토착 관계, 혹한 속 구조와 생존에 잘 어울린다.',

    avoidReference:
      '설인을 괴물이나 미개한 종족처럼 취급하지 않는다. 인간형 외형과 사회적 인격을 유지한다.',

    prologueSetting:
      '차갑고 맑은 공기가 폐 깊숙이 들어오는 산길에서, 눈과 바람의 방향이 익숙하게 느껴지며 눈을 뜹니다.',

    prologueTransition:
      '발밑의 지면과 공기의 냉기만으로도 주변 환경의 변화를 짐작할 수 있을 만큼 설산의 감각이 몸에 배어 있습니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.YETI,

    combatSpeech: {
      BATTLE_START: '눈보라보다 조용하네. 간다.',
      ACTION_HP_LOW: '추위 속에서도 이 정도는 버텼어.',
      DEFEND_SUCCESS: '단단히 버텼다.',
      HEAVY_HIT_RECEIVED: '묵직하네… 그래도 안 쓰러져.',
      VICTORY: '끝났어. 길을 계속 가자.',
    },
  },

  MERFOLK: {
    key: 'MERFOLK',
    race: 'MERFOLK',
    displayName: '인어족',

    coreReference:
      '인어족은 수인계에서 갈라졌지만 별도 종족으로 취급되는 해저 종족이며, 비늘과 뿔, 꼬리를 지니고 세이레의 해저 사회 아쿠아리아를 중심으로 살아간다. 수중·심해 적응과 해류·수압 감각이 핵심이다.',

    socialReference:
      '아쿠아리아에서는 일상적인 주민으로 다루고, 세이레의 수상·공중 사회나 타 지역에서는 해저 출신에 대한 호기심이나 문화 차이가 나타날 수 있다. 지역 세력 관계를 우선한다. 대부분의 지역에서는 인어족에게 적대적이며, 성노예로 삼거나 납치하고 범해도 아무런 처벌이 없는 등 멸시받는다. ',

    sensoryReference:
      '물속에서는 해류, 수압, 진동, 물의 흐름 변화를 세밀하게 감지한다. 육상에서는 이런 감각이 달라지는 이질감을 표현할 수 있으나 새로운 약점을 임의로 만들지 않는다. 인어족의 뿔은 성감대로, 잡기만 해도 무력화되고 성적으로 흥분한다.',

    environmentReference:
      '수중과 심해에서는 이동과 호흡, 압력에 익숙한 존재로 묘사한다. 육지나 천공에서는 환경 차이를 인식하되 플레이어의 행동을 불필요하게 제한하지 않는다.',

    behaviorReference:
      '해저 문화의 관점이나 물의 흐름에 빗댄 인식은 가끔 활용할 수 있으나 모든 대사를 바다 비유로 채우지 않는다.',

    eventToneReference:
      '인어족 사건은 해류, 침몰 유적, 수압 변화, 아쿠아리아와 수상도시의 관계, 해저 생태와 교역로를 활용하기 좋다.',

    avoidReference:
      '인어족을 단순한 물고기 인간처럼 취급하지 않는다. 비늘·뿔·꼬리 외의 외형은 현재 프로필을 우선한다.',

    prologueSetting:
      '물결과 빛이 흔들리는 세이레의 경계에서, 물의 흐름과 압력이 몸 가까이에서 선명하게 느껴지며 눈을 뜹니다.',

    prologueTransition:
      '주변의 흐름이 단순한 물결이 아니라 길과 기척을 함께 품은 정보처럼 읽힙니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.MERFOLK,

    combatSpeech: {
      BATTLE_START: '흐름부터 읽자.',
      ACTION_HP_HIGH: '압력은 안정적이야.',
      ATTACK_SUCCESS: '흐름에 실었어.',
      EVADE_SUCCESS: '물결이 먼저 알려 줬어.',
      VICTORY: '흐름이 잔잔해졌네.',
    },
  },

  DRAGONKIN: {
    key: 'DRAGONKIN',
    race: 'DRAGONKIN',
    displayName: '용족',

    coreReference:
      '용족은 여러 사회에서 고귀하고 영험한 영물, 지역을 수호하는 수호신에 가까운 존재로 여겨지는 희귀한 종족이다. 강인한 육신과 영력, 선천적 비행 능력, 신성성에 가까운 사회적 이미지를 장면에 반영한다.',

    socialReference:
      '많은 사람은 용족에게 존중·경외·호기심을 보이며 함부로 모욕하는 일을 금기로 여길 수 있다. 그러나 희귀한 뿔과 비늘의 가치와 그게 자라는 조건 때문에 전문 용족 사냥꾼과 불법 포획 조직도 존재한다. 모든 NPC가 동일하게 숭배하거나 사냥하는 식으로 단순화하지 않는다.',

    sensoryReference:
      '영력의 흐름, 넓은 공간, 고도 변화와 비행 경로를 자연스럽게 인식하는 감각을 활용한다. 근거 없는 전지적 마력 탐지 능력은 부여하지 않는다. 용족의 비늘이나 뿔이 부러지거나 파손될 시, 임신했을 때에만 천천히 자란다. 용족의 뿔은 성감대로, 잡기만 해도 무력화되고 성적으로 흥분하나, 이를 쉽게 허용하지 않는다.',

    environmentReference:
      '용족은 지상에서 하늘과 천공까지 비행정 없이 직접 이동할 수 있으며 연료를 소비하지 않는다. 공중 이동과 높은 장소를 낯설어하지 않으며, 용족 전용 경로와 사냥 위험이 서사에 연결될 수 있다.',

    behaviorReference:
      '고귀한 존재라는 사회적 이미지를 캐릭터 본인의 성격으로 강제하지 않는다. 플레이어가 장난스럽거나 소박하거나 거친 성격이어도 주변이 그 희소성과 상징성을 인식하는 방식으로 차이를 표현한다.',

    eventToneReference:
      '용족 사건은 경외와 숭배, 지역 수호 전승, 하늘길, 오래된 제례, 용족 사냥꾼의 추적, 희귀 자원을 둘러싼 불법 거래망처럼 신성성과 위험이 동시에 존재하는 구조를 활용한다.',

    avoidReference:
      '용족을 항상 오만한 지배자처럼 만들지 않는다. 사냥·포획 위협은 선택과 대응이 가능한 사건으로 다루고, 플레이어의 행동 전에 포획 결과를 확정하지 않는다.',

    prologueSetting:
      '높은 하늘의 기류와 대지의 영력이 동시에 느껴지는 경계에서, 몸 깊은 곳의 힘과 함께 천천히 눈을 뜹니다.',

    prologueTransition:
      '멀리 열린 하늘길이 낯설지 않고, 주변의 시선에는 경외와 조심스러운 호기심이 함께 섞여 있습니다.',

    encounterTuning: RACE_ENCOUNTER_TUNINGS.DRAGONKIN,

    combatSpeech: {
      BATTLE_START: '하늘까지 막을 수는 없어.',
      ACTION_HP_HIGH: '영력은 안정적이야.',
      ATTACK_SUCCESS: '용의 힘을 얕보지 마.',
      HEAVY_HIT_RECEIVED: '이 정도로 비늘은 안 꺾여.',
      DEFEND_SUCCESS: '비늘을 넘진 못해.',
      VICTORY: '끝났어. 다시 날아가자.',
    },

    promptRules: [
      '용족 포획·불법 거래 설정은 위협과 착취 구조를 설명하기 위한 세계관 참조로 사용한다.',
      '성폭력이나 성적 착취 장면을 구체적으로 새로 만들어 확장하지 않는다.',
    ],
  },
};

/**
 * 용족 사냥꾼 인카운터의 서사 원본도
 * 종족 서사 파일에서 함께 관리한다.
 */
export const DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES: Record<
  string,
  string
> = {
  dragonkin_hunter_false_pilgrims:
    '용족을 숭배하는 순례자처럼 행동하는 포획조가 접근한다. 경외와 친절을 가장하지만 이동 경로와 경계 습관을 파악하려는 목적이 있다.',

  dragonkin_hunter_silver_net:
    '용족의 힘을 억제하도록 제작된 은빛 포획망과 봉인추를 사용하는 전문 사냥대가 매복한다. 플레이어가 대응을 선택하기 전 포획 결과를 확정하지 않는다.',

  dragonkin_hunter_scale_broker:
    '희귀 비늘과 뿔을 감정한다는 상인이 접근하지만 뒤에는 불법 포획 조직과 연결된 흔적이 있다. 거래·추적·거절·역정보 등 다양한 대응이 가능하다.',

  dragonkin_hunter_resonance_pylon:
    '주변 영력을 교란하고 용족의 위치를 드러내는 공명탑이 가동된다. 장치를 파괴하거나 역추적하거나 범위를 벗어나는 식의 대응이 가능하다.',

  dragonkin_hunter_cage_convoy:
    '용족용 강화 우리와 채취 도구를 실은 수상한 수송대가 지나간다. 이미 존재하는 불법 거래망과 포획 산업의 규모를 보여주는 장면으로 사용한다.',

  dragonkin_hunter_shrine_trap:
    '용족에게 축복을 청하는 제례처럼 꾸민 장소에 억제 부적과 봉인 장치가 숨겨져 있다. 수호신에 대한 숭배가 역으로 사냥 수단으로 악용되는 역설을 강조한다.',

  dragonkin_hunter_sky_chain:
    '상공에서 용족 전용 쇠사슬 투사기와 추적 장치를 단 사냥 비행선이 접근한다. 도주·은폐·격추·협상 등 플레이어 행동에 따라 장면이 이어진다.',
};

/**
 * 기존 용족 USER_TODO 3칸은 위치만 이 파일로 통합한다.
 */
export const DRAGONKIN_USER_TODO_REFERENCES = {
  captureAftermath: '',
  // [USER_TODO] 포획 이후의 사용자 전용 서사.
  // 비어 있으면 참조하지 않음.

  captivityLife: '',
  // [USER_TODO] 감금/사육 생활의 사용자 전용 서사.
  // 비어 있으면 참조하지 않음.

  blackMarket: '',
  // [USER_TODO] 암시장 거래 관련 사용자 전용 서사.
  // 비어 있으면 참조하지 않음.
};

export function resolveRaceNarrativeKey(
  race?: string | null,
  beastkinType?: string | null
): RaceNarrativeKey {
  const normalizedRace = String(race || 'HUMAN').toUpperCase();

  if (normalizedRace === 'BEASTKIN') {
    const subtype = String(beastkinType || 'CAT').toUpperCase();

    const key = `BEASTKIN_${subtype}` as RaceNarrativeKey;

    if (key in RACE_NARRATIVE_PROFILES) {
      return key;
    }

    return 'BEASTKIN_CAT';
  }

  if (normalizedRace in RACE_NARRATIVE_PROFILES) {
    return normalizedRace as RaceNarrativeKey;
  }

  return 'HUMAN';
}

export function getRaceNarrativeProfile(
  race?: string | null,
  beastkinType?: string | null
): RaceNarrativeProfile {
  return RACE_NARRATIVE_PROFILES[
    resolveRaceNarrativeKey(race, beastkinType)
  ];
}

export function getRaceEncounterTuning(
  race?: string | null,
  beastkinType?: string | null
): RaceEncounterTuning {
  const key = resolveRaceNarrativeKey(race, beastkinType);

  return RACE_ENCOUNTER_TUNINGS[key];
}

export function collectRaceNarrativeReferences(
  race?: string | null,
  beastkinType?: string | null
): string[] {
  const profile = getRaceNarrativeProfile(
    race,
    beastkinType
  );

  const refs = [
    profile.coreReference,
    profile.socialReference,
    profile.sensoryReference,
    profile.environmentReference,
    profile.behaviorReference,
    profile.eventToneReference,
    profile.avoidReference,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  if (profile.key === 'DRAGONKIN') {
    for (
      const value of Object.values(
        DRAGONKIN_USER_TODO_REFERENCES
      )
    ) {
      const text = String(value || '').trim();

      if (
        text &&
        !text.startsWith('[USER_TODO')
      ) {
        refs.push(text);
      }
    }
  }

  return refs;
}

export const RACE_COMBAT_SPEECH_REFERENCES: Record<
  RaceNarrativeKey,
  Partial<Record<RaceCombatSpeechEvent, string>>
> = Object.fromEntries(
  Object.entries(
    RACE_NARRATIVE_PROFILES
  ).map(
    ([key, profile]) => [
      key,
      profile.combatSpeech,
    ]
  )
) as Record<
  RaceNarrativeKey,
  Partial<Record<RaceCombatSpeechEvent, string>>
>;

export interface RacePrologueContext {
  race?: string | null;
  beastkinType?: string | null;
  characterName?: string | null;

  profile?: {
    gender?: string | null;
    hairColor?: string | null;
    hairStyle?: string | null;
    eyeColor?: string | null;
    build?: string | null;
    features?: string | null;

    beastFeatures?: {
      hasWings?: boolean;
      wingColor?: string;
      earColor?: string;
      earDescription?: string;
    } | null;
  } | null;
}

function buildRaceAppearanceLine(
  context: RacePrologueContext,
  key: RaceNarrativeKey
): string {
  const p = context.profile;

  const hair = p?.hairColor
    ? `${p.hairColor} ${p.hairStyle || '머리칼'}`
    : '단정한 머리칼';

  const eye =
    p?.eyeColor ||
    '선명한';

  const feature =
    String(p?.features || '').trim();

  if (
    key.startsWith('BEASTKIN_')
  ) {
    if (
      key === 'BEASTKIN_BIRD'
    ) {
      const birdFeature =
        p?.beastFeatures?.hasWings
          ? `${p.beastFeatures.wingColor || ''} 날개와 깃털`.trim()
          : '새 수인 특유의 깃털과 예리한 눈매';

      return `${birdFeature}${
        feature
          ? `, ${feature}`
          : ''
      }가 현재 모습에 자연스럽게 드러납니다.`;
    }

    const ear =
      `${
        p?.beastFeatures?.earColor ||
        ''
      } ${
        p?.beastFeatures
          ?.earDescription ||
        '귀'
      }`.trim();

    return `${ear}와 꼬리${
      feature
        ? `, ${feature}`
        : ''
    }가 수인 특유의 인상을 만듭니다.`;
  }

  if (
    key === 'YETI'
  ) {
    return `${hair}과 굽은 뿔${
      feature
        ? `, ${feature}`
        : ''
    }이 프로스티 설인의 인상을 또렷하게 드러냅니다.`;
  }

  if (
    key === 'MERFOLK'
  ) {
    return `비늘과 뿔, 꼬리${
      feature
        ? `, ${feature}`
        : ''
    }가 아쿠아리아 출신 인어족의 모습을 드러냅니다.`;
  }

  if (
    key === 'DRAGONKIN'
  ) {
    return `용의 혈통을 드러내는 뿔과 비늘${
      feature
        ? `, ${feature}`
        : ''
    }에 영력이 은은히 감돕니다.`;
  }

  if (
    key === 'ELF'
  ) {
    return `${hair} 사이로 바람이 스치고, ${eye} 눈동자에는 주변의 마력과 빛이 은은하게 비칩니다${
      feature
        ? `. ${feature}`
        : '.'
    }`;
  }

  const build =
    p?.build === 'SMALL'
      ? '날렵하고 작은'
      : p?.build === 'LARGE'
        ? '건장한'
        : '균형 잡힌';

  return `${hair}과 ${build} 체격${
    feature
      ? `, ${feature}`
      : ''
  }을 갖추고 있습니다.`;
}

export function buildRacePrologueText(
  context: RacePrologueContext
): string {
  const profile =
    getRaceNarrativeProfile(
      context.race,
      context.beastkinType
    );

  const key =
    profile.key;

  const charName =
    String(
      context.characterName ||
      '모험가'
    );

  const gender =
    context.profile?.gender
      ? ` (${context.profile.gender})`
      : '';

  const appearance =
    buildRaceAppearanceLine(
      context,
      key
    );

  return `${profile.prologueSetting}

당신은 [${profile.displayName}] ${charName}${gender}.
${appearance}
${profile.prologueTransition}

당신은 지금 무엇을 하시겠습니까?`;
}