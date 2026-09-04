/**
 * 판타지악 전투 카드 말풍선 참조 원본.
 *
 * 중요:
 * - 실제 UI/전투 로직에는 문장을 직접 하드코딩하지 않는다.
 * - 전직/성별/세트/사용자 변형 말풍선은 이 파일에서 관리하며, 종족 말풍선 원본은 raceNarrativeReferences.ts에서 통합 관리한다.
 * - 여성 고성욕 변형과 무희 성인 변형, 무희 4세트 참조 문구는 사용자 작성 영역이라 의도적으로 빈 문자열이다.
 */

import { RACE_COMBAT_SPEECH_REFERENCES, type RaceNarrativeKey } from './raceNarrativeReferences';

export type CombatSpeechEvent =
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

export type SpeechGender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type SpeechRace = RaceNarrativeKey | 'MONSTER' | 'UNKNOWN';
export type SpeechCombatClass = 'NONE' | 'WARRIOR' | 'ARCHER' | 'ROGUE' | 'CLERIC' | 'DANCER' | 'MAGE';

export type SpeechReferenceBundle = Record<CombatSpeechEvent, string>;
export type PartialSpeechReferenceBundle = Partial<SpeechReferenceBundle>;

export const HIGH_DESIRE_SPEECH_THRESHOLD = 70;

export const GENERIC_SPEECH_REFERENCES: SpeechReferenceBundle = {
  BATTLE_START: '온다. 준비하자.',
  ACTION_HP_HIGH: '좋아, 아직 여유 있어.',
  ACTION_HP_MID: '호흡을 유지하자.',
  ACTION_HP_LOW: '조금 위험하지만, 아직 끝은 아니야.',
  ACTION_HP_CRITICAL: '한 번만 더 버티면 돼.',
  ATTACK_SUCCESS: '좋아, 들어갔어.',
  ATTACK_CRITICAL: '정확히 잡았다!',
  ATTACK_MISS: '빗나갔네. 다시 맞춘다.',
  TARGET_EVADED: '피했어? 다음엔 안 놓쳐.',
  HIT_RECEIVED: '큭… 괜찮아.',
  HEAVY_HIT_RECEIVED: '강하네… 이건 조심해야겠어.',
  EVADE_SUCCESS: '위험했네.',
  DEFEND_SUCCESS: '막아냈어.',
  DEFEND: '일단 받아낸다.',
  SUPPORT: '지금 보조할게.',
  ITEM_USE: '이걸 쓰자.',
  ENEMY_DEFEATED: '하나 정리.',
  ALLY_DEFEATED: '…아직 싸움은 안 끝났어.',
  VICTORY: '끝났네. 수고했어.',
  DEFEAT: '여기까지인가…',
  ESCAPE_ATTEMPT: '빠져나갈 길을 찾자.',
  ESCAPE_SUCCESS: '좋아, 벗어났다.',
  ESCAPE_FAIL: '막혔어. 다시 싸워야 해.',
};

/** 성별 + 전직을 함께 반영하는 1차 대사. 없는 이벤트는 GENERIC으로 폴백한다. */
export const CLASS_GENDER_SPEECH_REFERENCES: Record<SpeechCombatClass, Record<SpeechGender, PartialSpeechReferenceBundle>> = {
  NONE: {
    MALE: { BATTLE_START: '좋아. 침착하게 가자.', ATTACK_SUCCESS: '제대로 들어갔군.', HIT_RECEIVED: '이 정도는 버틴다.' },
    FEMALE: { BATTLE_START: '좋아, 침착하게 가자.', ATTACK_SUCCESS: '제대로 들어갔어.', HIT_RECEIVED: '이 정도는 버틸 수 있어.' },
    UNKNOWN: {},
  },
  WARRIOR: {
    MALE: {
      BATTLE_START: '정면은 내가 맡지.', ACTION_HP_HIGH: '전열은 멀쩡하다.', ACTION_HP_LOW: '갑옷이 버티는 동안 밀어붙인다.', ACTION_HP_CRITICAL: '서 있는 한 전선은 안 무너진다.',
      ATTACK_SUCCESS: '좋아, 그대로 밀어낸다!', ATTACK_CRITICAL: '전부 실었다!', ATTACK_MISS: '발을 다시 잡는다.', HIT_RECEIVED: '그 정도론 못 밀어낸다.', HEAVY_HIT_RECEIVED: '제법 묵직하군…!', DEFEND_SUCCESS: '받아냈다.', DEFEND: '내 뒤로.', VICTORY: '전열 유지. 끝났다.',
    },
    FEMALE: {
      BATTLE_START: '정면은 내가 맡을게.', ACTION_HP_HIGH: '전열은 아직 멀쩡해.', ACTION_HP_LOW: '갑옷이 버티는 동안 밀어붙여.', ACTION_HP_CRITICAL: '서 있는 동안은 안 무너져.',
      ATTACK_SUCCESS: '좋아, 그대로 밀어낸다!', ATTACK_CRITICAL: '이번 건 제대로야!', ATTACK_MISS: '발부터 다시 잡자.', HIT_RECEIVED: '그 정도론 안 밀려.', HEAVY_HIT_RECEIVED: '으윽… 제법 묵직하네.', DEFEND_SUCCESS: '막았어.', DEFEND: '내 뒤로 와.', VICTORY: '전열 유지. 끝났어.',
    },
    UNKNOWN: {},
  },
  ARCHER: {
    MALE: {
      BATTLE_START: '거리 확보. 시야부터 잡는다.', ACTION_HP_HIGH: '사선은 깨끗하다.', ACTION_HP_LOW: '거리만 유지하면 된다.', ACTION_HP_CRITICAL: '한 발이면 충분해.',
      ATTACK_SUCCESS: '명중.', ATTACK_CRITICAL: '급소 확인.', ATTACK_MISS: '바람을 잘못 읽었군.', TARGET_EVADED: '움직임 확인. 다음은 맞춘다.', HIT_RECEIVED: '거리부터 다시 벌린다.', EVADE_SUCCESS: '궤적이 보였어.', VICTORY: '사격 종료.',
    },
    FEMALE: {
      BATTLE_START: '거리 확보. 시야부터 잡을게.', ACTION_HP_HIGH: '사선은 깨끗해.', ACTION_HP_LOW: '거리만 유지하면 돼.', ACTION_HP_CRITICAL: '한 발이면 충분해.',
      ATTACK_SUCCESS: '명중.', ATTACK_CRITICAL: '급소, 잡았어.', ATTACK_MISS: '바람을 잘못 읽었네.', TARGET_EVADED: '움직임 확인. 다음엔 맞춰.', HIT_RECEIVED: '거리부터 다시 벌려야겠어.', EVADE_SUCCESS: '궤적이 보였어.', VICTORY: '사격 종료.',
    },
    UNKNOWN: {},
  },
  ROGUE: {
    MALE: {
      BATTLE_START: '눈 돌리는 순간 끝이야.', ACTION_HP_HIGH: '틈이 너무 잘 보이는데.', ACTION_HP_LOW: '맞기 전에 끝낸다.', ACTION_HP_CRITICAL: '다음 한 번은 절대 안 맞는다.',
      ATTACK_SUCCESS: '잡았어.', ATTACK_CRITICAL: '거기가 비었지.', ATTACK_MISS: '쳇, 눈치가 빠르네.', TARGET_EVADED: '재밌네. 더 빨라져 보라고.', HIT_RECEIVED: '…한 번 허용했군.', EVADE_SUCCESS: '너무 느려.', ENEMY_DEFEATED: '다음.', VICTORY: '흔적은 남기지 말자.',
    },
    FEMALE: {
      BATTLE_START: '눈 돌리는 순간 끝이야.', ACTION_HP_HIGH: '틈이 너무 잘 보이네.', ACTION_HP_LOW: '맞기 전에 끝내면 돼.', ACTION_HP_CRITICAL: '다음 한 번은 절대 안 맞아.',
      ATTACK_SUCCESS: '잡았어.', ATTACK_CRITICAL: '거기 비었지?', ATTACK_MISS: '칫, 눈치가 빠르네.', TARGET_EVADED: '재밌네. 더 빨라져 봐.', HIT_RECEIVED: '…한 번 허용했네.', EVADE_SUCCESS: '너무 느려.', ENEMY_DEFEATED: '다음.', VICTORY: '흔적 없이 끝.',
    },
    UNKNOWN: {},
  },
  CLERIC: {
    MALE: {
      BATTLE_START: '모두 무사히 돌아간다.', ACTION_HP_HIGH: '아직 지킬 힘은 충분해.', ACTION_HP_LOW: '쓰러질 때가 아니다.', ACTION_HP_CRITICAL: '마지막까지 손을 놓지 않겠다.',
      ATTACK_SUCCESS: '물러서라.', ATTACK_CRITICAL: '빛이 길을 열었다.', HIT_RECEIVED: '괜찮다. 다른 사람부터 봐.', DEFEND_SUCCESS: '방벽이 버텼다.', DEFEND: '여기는 내가 지킨다.', SUPPORT: '상처를 보여 줘.', ALLY_DEFEATED: '아직 늦지 않았다…!', VICTORY: '다들 무사한가?',
    },
    FEMALE: {
      BATTLE_START: '모두 무사히 돌아가자.', ACTION_HP_HIGH: '아직 지킬 힘은 충분해.', ACTION_HP_LOW: '지금 쓰러질 때가 아니야.', ACTION_HP_CRITICAL: '마지막까지 손을 놓지 않을게.',
      ATTACK_SUCCESS: '물러나.', ATTACK_CRITICAL: '빛이 길을 열었어.', HIT_RECEIVED: '괜찮아. 다른 사람부터 봐.', DEFEND_SUCCESS: '방벽이 버텼어.', DEFEND: '여기는 내가 지킬게.', SUPPORT: '상처를 보여 줘.', ALLY_DEFEATED: '아직 늦지 않았어…!', VICTORY: '다들 괜찮지?',
    },
    UNKNOWN: {},
  },
  DANCER: {
    MALE: {
      BATTLE_START: '박자 맞춰. 흐름을 가져오자.', ACTION_HP_HIGH: '좋아, 리듬이 살아 있어.', ACTION_HP_LOW: '흐트러져도 다시 이어.', ACTION_HP_CRITICAL: '끝 박자까진 내가 잡아.',
      ATTACK_SUCCESS: '박자 하나.', ATTACK_CRITICAL: '지금, 정확했어.', ATTACK_MISS: '박자가 살짝 비었네.', HIT_RECEIVED: '흐름을 끊진 못해.', EVADE_SUCCESS: '그 박자는 이미 읽었어.', SUPPORT: '호흡 맞춰!', VICTORY: '마지막 박자, 끝.',
    },
    FEMALE: {
      BATTLE_START: '박자 맞춰. 흐름을 가져오자.', ACTION_HP_HIGH: '좋아, 리듬이 살아 있어.', ACTION_HP_LOW: '흐트러져도 다시 이으면 돼.', ACTION_HP_CRITICAL: '끝 박자까진 내가 잡을게.',
      ATTACK_SUCCESS: '박자 하나.', ATTACK_CRITICAL: '지금, 정확했어.', ATTACK_MISS: '박자가 살짝 비었네.', HIT_RECEIVED: '이 정도론 흐름 안 끊겨.', EVADE_SUCCESS: '그 박자는 이미 읽었어.', SUPPORT: '호흡 맞춰!', VICTORY: '마지막 박자, 끝.',
    },
    UNKNOWN: {},
  },
  MAGE: {
    MALE: {
      BATTLE_START: '술식 전개. 변수부터 정리하지.', ACTION_HP_HIGH: '계산 범위 안이다.', ACTION_HP_LOW: '오차가 커졌군. 빠르게 끝낸다.', ACTION_HP_CRITICAL: '남은 마력으로 식을 완성한다.',
      ATTACK_SUCCESS: '식 성립.', ATTACK_CRITICAL: '완벽한 수렴이다.', ATTACK_MISS: '좌표 오차… 수정하지.', TARGET_EVADED: '관측값 갱신.', HIT_RECEIVED: '집중을 흔들 셈인가.', SUPPORT: '보조식 연결.', VICTORY: '계산 종료.',
    },
    FEMALE: {
      BATTLE_START: '술식 전개. 변수부터 정리하자.', ACTION_HP_HIGH: '계산 범위 안이야.', ACTION_HP_LOW: '오차가 커졌네. 빠르게 끝내자.', ACTION_HP_CRITICAL: '남은 마력으로 식을 완성해.',
      ATTACK_SUCCESS: '식 성립.', ATTACK_CRITICAL: '완벽하게 수렴했어.', ATTACK_MISS: '좌표 오차… 수정할게.', TARGET_EVADED: '관측값 갱신.', HIT_RECEIVED: '집중을 흔들 생각이야?', SUPPORT: '보조식 연결.', VICTORY: '계산 종료.',
    },
    UNKNOWN: {},
  },
};

/** 종족은 1차 문장 뒤에 짧게 덧붙는 참조 문구다. 실제 문구 원본은 raceNarrativeReferences.ts에서 관리한다. */
export const RACE_SPEECH_REFERENCES: Record<SpeechRace, PartialSpeechReferenceBundle> = {
  ...RACE_COMBAT_SPEECH_REFERENCES,
  MONSTER: {},
  UNKNOWN: {},
};

/**
 * 사용자 작성 영역 1: 여성 고성욕 변형.
 * effectiveDesire >= HIGH_DESIRE_SPEECH_THRESHOLD일 때 먼저 참조한다.
 * 빈 문자열은 자동으로 일반 대사로 폴백한다.
 */
export const FEMALE_HIGH_DESIRE_REFERENCES: SpeechReferenceBundle = {
  BATTLE_START: '', ACTION_HP_HIGH: '', ACTION_HP_MID: '', ACTION_HP_LOW: '', ACTION_HP_CRITICAL: '',
  ATTACK_SUCCESS: '', ATTACK_CRITICAL: '', ATTACK_MISS: '', TARGET_EVADED: '', HIT_RECEIVED: '', HEAVY_HIT_RECEIVED: '', EVADE_SUCCESS: '', DEFEND_SUCCESS: '',
  DEFEND: '', SUPPORT: '', ITEM_USE: '', ENEMY_DEFEATED: '', ALLY_DEFEATED: '', VICTORY: '', DEFEAT: '', ESCAPE_ATTEMPT: '', ESCAPE_SUCCESS: '', ESCAPE_FAIL: '',
};

/** 사용자 작성 영역 2: 무희의 고성욕/성인 상태 변형. 현재는 전부 비워 둔다. */
export const DANCER_ADULT_VARIANT_REFERENCES: SpeechReferenceBundle = {
  BATTLE_START: '', ACTION_HP_HIGH: '', ACTION_HP_MID: '', ACTION_HP_LOW: '', ACTION_HP_CRITICAL: '',
  ATTACK_SUCCESS: '', ATTACK_CRITICAL: '', ATTACK_MISS: '', TARGET_EVADED: '', HIT_RECEIVED: '', HEAVY_HIT_RECEIVED: '', EVADE_SUCCESS: '', DEFEND_SUCCESS: '',
  DEFEND: '', SUPPORT: '', ITEM_USE: '', ENEMY_DEFEATED: '', ALLY_DEFEATED: '', VICTORY: '', DEFEAT: '', ESCAPE_ATTEMPT: '', ESCAPE_SUCCESS: '', ESCAPE_FAIL: '',
};

export interface SetSpeechReferenceDefinition {
  id: string;
  name: string;
  traitPrefix: string;
  dancerUserEditable?: boolean;
  references: PartialSpeechReferenceBundle;
}

/** 세트 효과 활성 중 일반 대사를 덮어쓰는 참조. 2/3/4세트 중 하나라도 활성화되면 후보가 된다. */
export const SET_SPEECH_REFERENCES: SetSpeechReferenceDefinition[] = [
  { id: 'IRON_BASTION', name: '철벽수호대의 맹세', traitPrefix: 'SET_IRON_BASTION_', references: { BATTLE_START: '전열을 세운다. 내 뒤로.', DEFEND: '이 벽은 쉽게 안 무너진다.', DEFEND_SUCCESS: '철벽은 공격을 흘려낸다.', HIT_RECEIVED: '철벽은 아직 서 있다.', ATTACK_SUCCESS: '받아냈으면, 이제 밀어낸다.', VICTORY: '전열 이상 없음.' } },
  { id: 'EMBER_LEGION', name: '잿불군단의 전열', traitPrefix: 'SET_EMBER_LEGION_', references: { BATTLE_START: '불씨부터 살린다.', ATTACK_SUCCESS: '좋아, 잔불이 붙었어.', ATTACK_CRITICAL: '한꺼번에 태운다!', HIT_RECEIVED: '불씨는 안 꺼져.', VICTORY: '재만 남았네.' } },
  { id: 'ABYSS_JUGGERNAUT', name: '심연거병의 외피', traitPrefix: 'SET_ABYSS_JUGGERNAUT_', references: { BATTLE_START: '심연갑 전개.', HIT_RECEIVED: '외피가 받아냈다.', HEAVY_HIT_RECEIVED: '좋아… 심연이 반응한다.', ATTACK_SUCCESS: '받은 만큼 돌려주지.', VICTORY: '외피 회수.' } },
  { id: 'WORLDBREAKER', name: '천붕파쇄자의 유산', traitPrefix: 'SET_WORLDBREAKER_', references: { BATTLE_START: '부술 지점은 정해졌다.', ATTACK_SUCCESS: '금이 갔어.', ATTACK_CRITICAL: '여기서 무너져라!', ATTACK_MISS: '각도를 다시 잡는다.', VICTORY: '전부 부서졌군.' } },

  { id: 'GALE_TRACKER', name: '질풍추적자의 발자국', traitPrefix: 'SET_GALE_TRACKER_', references: { BATTLE_START: '발자국을 놓치지 마.', ATTACK_SUCCESS: '추적 계속.', ATTACK_CRITICAL: '도망갈 틈은 없어.', TARGET_EVADED: '좋아, 궤적은 남았어.', VICTORY: '추적 종료.' } },
  { id: 'MOON_HUNTER', name: '월하사냥꾼의 침묵', traitPrefix: 'SET_MOON_HUNTER_', references: { BATTLE_START: '첫 화살로 표식을 남긴다.', ATTACK_SUCCESS: '표식 확인.', ATTACK_CRITICAL: '달빛 아래선 숨을 수 없어.', ATTACK_MISS: '첫 발은 버렸어. 다음은 아니야.', VICTORY: '표적 제거.' } },
  { id: 'THUNDER_EAGLE', name: '뇌익독수리의 비상', traitPrefix: 'SET_THUNDER_EAGLE_', references: { BATTLE_START: '번개가 이어질 길을 잡아.', ATTACK_SUCCESS: '연쇄한다!', ATTACK_CRITICAL: '떨어져도 소용없어!', TARGET_EVADED: '번개는 다음 표적을 찾는다.', VICTORY: '낙뢰 종료.' } },
  { id: 'STARFALL', name: '별비명사수의 관측', traitPrefix: 'SET_STARFALL_', references: { BATTLE_START: '순서까지 전부 보인다.', ACTION_HP_HIGH: '늦게 오는 표적부터 지운다.', ATTACK_SUCCESS: '관측대로.', ATTACK_CRITICAL: '미래 위치까지 맞췄어.', TARGET_EVADED: '관측 오차 갱신.', VICTORY: '별자리 정리 완료.' } },

  { id: 'NIGHT_FOX', name: '밤여우의 잔영', traitPrefix: 'SET_NIGHT_FOX_', references: { BATTLE_START: '그림자 하나만 쫓아와 봐.', EVADE_SUCCESS: '잔영이었어.', ATTACK_SUCCESS: '이제 내 차례.', ATTACK_CRITICAL: '피한 다음이 제일 위험하지.', HIT_RECEIVED: '칫… 잔영이 늦었네.', VICTORY: '본체는 처음부터 여기 있었어.' } },
  { id: 'VENOM_REAPER', name: '독낫사냥꾼의 흔적', traitPrefix: 'SET_VENOM_REAPER_', references: { BATTLE_START: '상처 하나면 충분해.', ATTACK_SUCCESS: '낙인 하나.', ATTACK_CRITICAL: '독이 더 깊이 박혔어.', TARGET_EVADED: '괜찮아. 다음 상처면 돼.', VICTORY: '이제 독이 알아서 끝내겠지.' } },
  { id: 'BLOOD_MIRAGE', name: '혈무신기루의 장막', traitPrefix: 'SET_BLOOD_MIRAGE_', references: { BATTLE_START: '어디가 진짜인지 맞혀 봐.', EVADE_SUCCESS: '또 틀렸네.', ACTION_HP_HIGH: '신기루가 늘어난다.', HIT_RECEIVED: '이번엔 진짜를 찾았나 봐.', ATTACK_CRITICAL: '찾았을 땐 이미 늦었어.', VICTORY: '끝까지 못 찾았네.' } },
  { id: 'VOID_ASSASSIN', name: '공허암살자의 무흔', traitPrefix: 'SET_VOID_ASSASSIN_', references: { BATTLE_START: '흔적 없이 끝낸다.', ATTACK_CRITICAL: '하나.', ENEMY_DEFEATED: '기록할 것도 없네.', ATTACK_SUCCESS: '소리도 남기지 마.', HIT_RECEIVED: '…흔적이 생겼군.', VICTORY: '아무것도 남지 않았다.' } },

  { id: 'DAWN_PRIEST', name: '새벽사제의 기도', traitPrefix: 'SET_DAWN_PRIEST_', references: { BATTLE_START: '새벽까지 모두 데려간다.', SUPPORT: '상처는 내가 메울게.', HIT_RECEIVED: '괜찮아, 기도는 끊기지 않아.', ALLY_DEFEATED: '일어나. 아직 새벽은 안 왔어.', VICTORY: '기도가 닿았네.' } },
  { id: 'SAINT_WARDEN', name: '성역수호자의 서약', traitPrefix: 'SET_SAINT_WARDEN_', references: { BATTLE_START: '이 안은 성역이다.', DEFEND: '경계를 세운다.', SUPPORT: '성역 안으로.', HIT_RECEIVED: '경계는 유지된다.', VICTORY: '성역 해제.' } },
  { id: 'SERAPHIC_CHOIR', name: '천익성가대의 화음', traitPrefix: 'SET_SERAPHIC_CHOIR_', references: { BATTLE_START: '첫 음부터 맞추자.', SUPPORT: '다음 화음으로 이어.', ACTION_HP_HIGH: '호흡이 맞고 있어.', ALLY_DEFEATED: '화음을 끊지 마…!', VICTORY: '마지막 음까지 완성됐어.' } },
  { id: 'LAST_SANCTUARY', name: '최후성역의 빛', traitPrefix: 'SET_LAST_SANCTUARY_', references: { BATTLE_START: '누구도 여기서 잃지 않아.', SUPPORT: '끝까지 붙들어.', HEAVY_HIT_RECEIVED: '아직 마지막 기도는 남아 있어.', ALLY_DEFEATED: '안 돼… 여기서 끝내게 두진 않아.', VICTORY: '모두 돌아왔어.' } },

  // 사용자 작성 영역 3: 무희 세트 대사 참조 칸. 의도적으로 전부 빈 문자열.
  { id: 'SILK_MOON', name: '월견비단의 춤', traitPrefix: 'SET_SILK_MOON_', dancerUserEditable: true, references: { BATTLE_START: '', ACTION_HP_HIGH: '', ACTION_HP_MID: '', ACTION_HP_LOW: '', ACTION_HP_CRITICAL: '', ATTACK_SUCCESS: '', ATTACK_CRITICAL: '', ATTACK_MISS: '', TARGET_EVADED: '', HIT_RECEIVED: '', HEAVY_HIT_RECEIVED: '', EVADE_SUCCESS: '', DEFEND_SUCCESS: '', DEFEND: '', SUPPORT: '', ITEM_USE: '', ENEMY_DEFEATED: '', ALLY_DEFEATED: '', VICTORY: '', DEFEAT: '', ESCAPE_ATTEMPT: '', ESCAPE_SUCCESS: '', ESCAPE_FAIL: '' } },
  { id: 'PETAL_TEMPEST', name: '화람폭풍의 선율', traitPrefix: 'SET_PETAL_TEMPEST_', dancerUserEditable: true, references: { BATTLE_START: '', ACTION_HP_HIGH: '', ACTION_HP_MID: '', ACTION_HP_LOW: '', ACTION_HP_CRITICAL: '', ATTACK_SUCCESS: '', ATTACK_CRITICAL: '', ATTACK_MISS: '', TARGET_EVADED: '', HIT_RECEIVED: '', HEAVY_HIT_RECEIVED: '', EVADE_SUCCESS: '', DEFEND_SUCCESS: '', DEFEND: '', SUPPORT: '', ITEM_USE: '', ENEMY_DEFEATED: '', ALLY_DEFEATED: '', VICTORY: '', DEFEAT: '', ESCAPE_ATTEMPT: '', ESCAPE_SUCCESS: '', ESCAPE_FAIL: '' } },
  { id: 'MIRAGE_LOTUS', name: '신기루연화의 환무', traitPrefix: 'SET_MIRAGE_LOTUS_', dancerUserEditable: true, references: { BATTLE_START: '', ACTION_HP_HIGH: '', ACTION_HP_MID: '', ACTION_HP_LOW: '', ACTION_HP_CRITICAL: '', ATTACK_SUCCESS: '', ATTACK_CRITICAL: '', ATTACK_MISS: '', TARGET_EVADED: '', HIT_RECEIVED: '', HEAVY_HIT_RECEIVED: '', EVADE_SUCCESS: '', DEFEND_SUCCESS: '', DEFEND: '', SUPPORT: '', ITEM_USE: '', ENEMY_DEFEATED: '', ALLY_DEFEATED: '', VICTORY: '', DEFEAT: '', ESCAPE_ATTEMPT: '', ESCAPE_SUCCESS: '', ESCAPE_FAIL: '' } },
  { id: 'CELESTIAL_DANCE', name: '천상무도의 궤적', traitPrefix: 'SET_CELESTIAL_DANCE_', dancerUserEditable: true, references: { BATTLE_START: '', ACTION_HP_HIGH: '', ACTION_HP_MID: '', ACTION_HP_LOW: '', ACTION_HP_CRITICAL: '', ATTACK_SUCCESS: '', ATTACK_CRITICAL: '', ATTACK_MISS: '', TARGET_EVADED: '', HIT_RECEIVED: '', HEAVY_HIT_RECEIVED: '', EVADE_SUCCESS: '', DEFEND_SUCCESS: '', DEFEND: '', SUPPORT: '', ITEM_USE: '', ENEMY_DEFEATED: '', ALLY_DEFEATED: '', VICTORY: '', DEFEAT: '', ESCAPE_ATTEMPT: '', ESCAPE_SUCCESS: '', ESCAPE_FAIL: '' } },

  { id: 'RUNE_SCHOLAR', name: '룬학자의 해석', traitPrefix: 'SET_RUNE_SCHOLAR_', references: { BATTLE_START: '첫 속성을 기록한다.', ATTACK_SUCCESS: '해석 누적.', ATTACK_CRITICAL: '식이 더 선명해졌어.', ATTACK_MISS: '변수 하나가 틀렸군.', SUPPORT: '보조 룬 연결.', VICTORY: '해석 완료.' } },
  { id: 'FROST_ASTROLOGER', name: '빙점점성가의 관측', traitPrefix: 'SET_FROST_ASTROLOGER_', references: { BATTLE_START: '빙점부터 고정한다.', ATTACK_SUCCESS: '온도가 내려간다.', ATTACK_CRITICAL: '멈출 지점이 보였어.', TARGET_EVADED: '좌표를 다시 얼린다.', VICTORY: '빙점 안정.' } },
  { id: 'COMET_ARCHMAGE', name: '혜성대마도의 낙광', traitPrefix: 'SET_COMET_ARCHMAGE_', references: { BATTLE_START: '고도를 올린다.', ATTACK_SUCCESS: '더 높이.', ATTACK_CRITICAL: '낙하각 확보!', HIT_RECEIVED: '궤도는 안 흐트러져.', VICTORY: '혜성 낙하 종료.' } },
  { id: 'ORIGIN_WEAVER', name: '근원직조자의 공식', traitPrefix: 'SET_ORIGIN_WEAVER_', references: { BATTLE_START: '세 개의 식이면 충분해.', ATTACK_SUCCESS: '첫 항 기록.', ATTACK_CRITICAL: '공식이 완성되고 있어.', ATTACK_MISS: '순서를 다시 짠다.', SUPPORT: '보조항 삽입.', VICTORY: '증명 완료.' } },
];

export const ENEMY_SPEECH_REFERENCES: Record<'NORMAL' | 'ELITE' | 'BOSS', PartialSpeechReferenceBundle> = {
  NORMAL: { BATTLE_START: '크르르…!', ATTACK_SUCCESS: '그르륵!', HIT_RECEIVED: '캬악!', HEAVY_HIT_RECEIVED: '그아악!', EVADE_SUCCESS: '키익!', DEFEAT: '그르…' },
  ELITE: { BATTLE_START: '침입자를 제거한다.', ATTACK_SUCCESS: '도망칠 곳은 없다.', ATTACK_CRITICAL: '끝이다.', HIT_RECEIVED: '제법이군.', HEAVY_HIT_RECEIVED: '감히…!', VICTORY: '위협 제거.' },
  BOSS: { BATTLE_START: '여기까지 온 건 칭찬해 주지.', ACTION_HP_LOW: '이제야 조금 흥미롭군.', ATTACK_SUCCESS: '고작 이 정도인가?', ATTACK_CRITICAL: '무너져라.', HIT_RECEIVED: '…좋은 일격이다.', HEAVY_HIT_RECEIVED: '하, 드디어 제대로군!', VICTORY: '결국 결과는 같았다.' },
};
