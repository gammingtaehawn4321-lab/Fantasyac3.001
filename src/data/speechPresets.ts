export interface SpeechStylePreset {
  id: string;
  name: string;
  description: string;
  tone: string;
  politeness: string;
  quirks: string[];
  exampleLines: string[];
}

export const SPEECH_STYLE_PRESETS: SpeechStylePreset[] = [
  {
    id: 'calm',
    name: '차분함',
    description: '차분하고 이성적이며 감정을 크게 드러내지 않고 명확하게 말한다.',
    tone: '차분하고 침착함',
    politeness: '상황에 따라 정중하거나 담담한 어조',
    quirks: ['위기 상황에서도 호흡을 가다듬고 말함', '생각을 먼저 정리한 뒤 간결하게 발언'],
    exampleLines: ['상황을 파악하는 게 우선이야.', '당황하지 마. 길은 분명히 있어.', '이 정도 변수는 예상 범위 내야.'],
  },
  {
    id: 'lively',
    name: '활발함',
    description: '에너지가 넘치고 밝고 적극적이며 호기심이 많다.',
    tone: '경쾌하고 생기 넘침',
    politeness: '친근한 반말 위주',
    quirks: ['흥미로운 것을 보면 목소리가 커짐', '도전적이거나 긍정적인 추임새를 자주 씀'],
    exampleLines: ['좋아, 어디 한번 가볼까!', '와, 저기 뭐가 있는 거지? 얼른 가보자!', '헤헤, 나한테 맡겨둬!'],
  },
  {
    id: 'blunt',
    name: '무뚝뚝함',
    description: '말수가 적고 핵심만 짧고 직설적으로 끊어서 말한다.',
    tone: '단호하고 무미건조함',
    politeness: '짧은 평어',
    quirks: ['불필요한 인사나 미사여구를 생략함', '말끝을 흐리지 않고 간결하게 끊음'],
    exampleLines: ['...비켜.', '용건만 말해.', '귀찮게 하지 마라.', '내가 처리하지.'],
  },
  {
    id: 'polite',
    name: '정중함',
    description: '예의 바르고 상대방을 존중하는 존댓말을 정갈하게 사용한다.',
    tone: '기품 있고 온화함',
    politeness: '존댓말/경어',
    quirks: ['상대방에게 정중하게 양해를 구함', '적에게도 최소한의 품위를 유지하려 함'],
    exampleLines: ['실례지만 길을 여쭈어도 되겠습니까?', '부디 다치지 않으셨기를 바랍니다.', '제가 도울 수 있는 일이 있다면 말씀해 주세요.'],
  },
  {
    id: 'playful',
    name: '장난스러움',
    description: '반말을 주로 사용하며 장난기가 많고 능글맞고 유쾌하게 상대를 대한다.',
    tone: '가볍고 도발적이며 능글맞음',
    politeness: '자유로운 반말',
    quirks: ['당황하면 살짝 말을 더듬거나 헛기침함', '싸울 때 상대를 툭툭 약 올림'],
    exampleLines: ['뭐야, 벌써 지친 거야?', '어라라? 생각보다 꽤 세게 나오시네?', '거기 누구야? 몰래 숨어있으면 모를 줄 알았어?'],
  },
  {
    id: 'rough',
    name: '거침',
    description: '거칠고 박력 있으며 호탕하고 야생적인 말투를 구사한다.',
    tone: '위압감 있고 거침없음',
    politeness: '거친 반말',
    quirks: ['화가 나면 으르렁거리듯 낮게 깔리는 어조', '직접 몸으로 부딪히는 표현을 즐김'],
    exampleLines: ['어설픈 짓거리 하면 가만 안 둔다.', '덤벼! 한 주먹거리도 안 되는 놈들이!', '흥, 시시해서 하품이 다 나오는군.'],
  },
  {
    id: 'cynical',
    name: '냉소적',
    description: '비꼬기를 잘하고 현실적이며 차갑고 회의적인 시각으로 말한다.',
    tone: '차가우며 비판적',
    politeness: '시니컬한 반말',
    quirks: ['한숨을 먼저 내쉬고 말을 얹음', '상대의 순진한 소리에 헛웃음을 침'],
    exampleLines: ['순진해 빠지긴. 세상이 그렇게 호락호락할 줄 알았어?', '하, 또 성가신 일에 휘말렸군.', '그 잘난 영웅 놀이는 딴 데 가서 하지 그래?'],
  },
];
