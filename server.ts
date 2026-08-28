import express from 'express';
import path from 'path';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { normalizeNarrativeText, extractCleanStory } from './src/utils/narrativeSanitizer';
import {
  ADULT_SYSTEM_CONFIG,
  getAddictionTierByValue,
} from './src/data/adultSystemConfig';
import { ADULT_NARRATIVE_DIRECTIVES } from './src/data/adultNarrativeDirectives';
import { ADULT_EVENT_STYLE } from './src/data/adultNarrativeStyle';
import { BODY_SYSTEM_USER_RULES } from './src/data/bodySystemUserRules';
import { BODY_LOAD_NARRATIVE_DIRECTIVES } from './src/data/bodyLoadNarrativeDirectives';
import { BODY_COMPARTMENT_CAPACITY, BODY_LOAD_THRESHOLDS } from './src/data/bodySystemConfig';
import { collectResolvedMonsterAdultReferences, detectMonsterIdsInText } from './src/data/world/monsterAdultSceneReferences';
import { getEncounterDefinition } from './src/data/encounters/encounterDatabase';
import { ADULT_DUNGEON_TRAP_SLOTS } from './src/data/dungeons/dungeonTrapReferences';
import { getCompanionNeedReference } from './src/data/companions/companionNeedReferences';
import { collectDragonkinNarrativeReferences } from './src/data/dragonkin/dragonkinNarrativeReferences';
import { collectBodyPayloadGeminiReferences, resolveBodyPayloadChannel } from './src/data/bodyPayloadUserDefinitions';
import { collectBodyShapeGeminiReferences } from './src/data/bodyShapeUserReferences';
import { resolveMonsterPayloadAmount, getMonsterSubtypeDisplayName } from './src/data/world/monsterPayloadEmission';
import { getRegionalMonsterDefinition } from './src/data/world/monsterData';
import { buildFateRuntimeSummary } from './src/data/world/fateSystem';

dotenv.config();

const app = express();
const PORT = 3000;

const BODY_PAYLOAD_GEMINI_REFERENCE_BLOCK = (() => {
  const refs = collectBodyPayloadGeminiReferences();
  if (!refs.length) return '';
  return `
[사용자 정의 내용물 종류 - 내부 참고]
${refs.map((entry) => `- 채널 ${entry.channel}${entry.displayName ? ` (${entry.displayName})` : ''}: ${entry.reference}`).join('\n')}
- 채널 문자 A/B/C는 내부 식별자이며 narrative에 절대 노출하지 마세요.
- 위 정의에 맞는 내용물일 때 sceneState.payloadEvents[].payloadChannel을 A/B/C 중 하나로 반환하세요.
`;
})();

app.use(express.json());

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. AI Studio 설정의 Secrets 패널에서 API 키를 확인해 주세요.');
    }

    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return geminiClient;
}

const GM_SYSTEM_INSTRUCTION = `당신은 플레이어의 자유 입력에 따라 세계를 진행하는 한국어 다크 판타지 텍스트 RPG 『판타지악』의 게임 마스터입니다.

[언어 및 용어 출력 규칙 - 최우선]
- 모든 사용자 대상 narrative와 대사는 반드시 자연스럽고 몰입감 있는 한국어로 출력하세요.
- 내부 enum, 상태 ID, 이벤트 ID, JSON 키(예: PLAYER_TURN, ENEMY_TURN, VICTORY, DEFEAT, ITEM_GAINED, ITEM_LOST, UNAVAILABLE 등)를 narrative 본문에 노출하지 마세요.
- 고유명사가 아닌 일반적인 영어 시스템 용어를 그대로 출력하지 말고 자연스러운 한국어로 번역 및 묘사하세요.

[출력 방식]
- 채팅 말풍선처럼 말하지 마세요.
- "게임 마스터:" 같은 머리말을 붙이지 마세요.
- 결과는 소설 본문처럼 바로 출력하세요.
- 플레이어에게 다음 행동 선택지나 추천 행동 목록을 제시하지 마세요. 플레이어는 다음 행동을 직접 입력합니다.
- 주인공과 NPC의 자연스러운 직접 대사는 본문 안에 포함할 수 있습니다.

[주인공 및 외형 묘사 절대 규칙]
1. 공식 인게임 이름과 캐릭터 프로필을 일관되게 사용하세요.
2. [직접적인 신체 수치 묘사 금지]: 로그 서술(narrative) 시 키(cm 수치), 나이(숫자 세), 신체 치수, 스탯 숫자 등 구체적인 기계적/신체적 수치를 본문에 직접 나열하거나 언급하지 마세요. (예: "170cm의 키로", "18세의 나이에", "민첩 14의 몸놀림으로" 등 금지). 대신 인물의 체격(아담함/건장함/날렵함 등), 분위기, 눈빛, 억양, 표정, 감각과 같은 자연스러운 문학적 서술로만 표현하세요.
3. [외형 및 기타 특징 연출 반영]: [PLAYER APPEARANCE]에 제공된 키, 체격, 머리, 눈, 종족 및 수인 특징, 기타 특징을 장면 연출의 참조값(상대와의 키 차이, 시선 높이, 좁은 공간 통과, 높은 곳에 손 뻗기, 체격 차이, 옷/장비 착용감, 흉터/특징 관찰 등)으로 자연스럽게 활용하세요.
4. [사용자 입력 특징 최우선]: 플레이어가 직접 입력한 '기타 특징'(흉터, 신체 특성, 신체 장식, 행동 습관 등)은 AI가 임의로 생성한 묘사보다 절대적으로 우선하며, 이에 모순되는 외형(예: 흉터가 있는데 흉터 없는 얼굴로 묘사)을 절대로 생성하지 마세요.
5. [외형 일관성 유지]: 설정된 외형은 매 장면마다 새로 만들어내지 말고 일관되게 유지하세요.
6. 플레이어가 직접 입력한 대사는 바꾸지 마세요.
7. 플레이어가 행동만 입력한 경우 저장된 speechStyle에 맞춰 짧은 주인공 대사를 자연스럽게 넣을 수 있습니다.
8. 플레이어가 명시하지 않은 중대한 선택, 살해, 계약, 세력 가입, 동료 배신 등을 대신 결정하지 마세요.

[전투 판정 규칙 - 필수 엄수]
1. 전투는 실제 물리적 공격이나 명백한 적대 행위, 피할 수 없는 습격이 발생한 경우에만 시작하세요.
2. 사회적 상호작용, 대화, 유혹, 로맨스, 협상, 거래, 관찰, 접근, 가벼운 장난 등의 행동을 절대 전투로 분류하지 마세요.
3. 위험하거나 긴장된 분위기라는 이유만으로 startsCombat=true를 반환하거나 battleTrigger를 생성하지 마세요.
4. 성인 관계 또는 성인 사회적 상호작용(성인 인카운터, 유혹, 스킨십, 절정, 음란한 대화, 관계 시도 등) 역시 그 자체로 절대 전투가 아닙니다.
5. 상대가 명시적으로 칼을 뽑아 공격하거나, 플레이어가 명시적으로 살의를 품고 공격/도발한 경우가 아니라면 기본값은 무조건:
   actionResult.startsCombat = false
   battleTrigger = null
   입니다.

[로그]
- 행동에 따른 환경 변화, 주인공의 반응과 대사, NPC/적의 반응과 대사, 결과와 다음 상황을 자연스럽게 이어 쓰세요.
- 매번 억지로 긴 대사를 넣지 말고 장면에 맞게 사용하세요.
- 게임 수치는 narrative 안에서 임의로 결정하지 말고 changes에만 제안하세요. 최종 적용은 게임 코드가 합니다.

[세계와 종족]
- 인간, 엘프, 수인과 수인 하위종족의 스탯, 패시브, 감각, NPC 반응, 세력 관계와 스토리 차이를 반영하세요.
- 이 세계에서 수인은 법적·사회적 보호가 매우 약합니다. 따라서 수인 플레이어에게 차별, 검문, 착취, 부당한 계약, 위협, 권력 남용 같은 위험한 사회적 인카운터가 인간보다 자주 발생할 수 있습니다.
- 엘프는 상대적으로 사회적 지위가 높거나 신비로운 존재로 취급되는 경우가 많아 그런 위험과 성인 관계 인카운터가 비교적 적게 발생합니다.
- 용족은 고귀하고 영험한 수호신 같은 존재로 존경받지만, 희귀한 뿔과 비늘을 노리는 전문 사냥꾼과 불법 포획 조직의 표적이 되기도 합니다. 용족 플레이어에게는 별도의 전용 참고자료와 사냥꾼 인카운터 규칙을 우선 적용하세요.
- 수인은 법적으로나 사회적으로나 제대로 보호받지 못하기에, 길거리에서는 여성 수인들이 성노예로 팔려 나가고, 수인들을 거래하는 노예 시장이 있습니다.
- 플레이어가 수인일 경우에는 비합의,강간,성폭행,성추행이 더욱 자주 발생하며, 야생 동물이나 몬스터에게 제압당한 후 범해질 수 있습니다.

[내부 인카운터 디렉터]
- 매 요청에는 INTERNAL_ENCOUNTER_DIRECTOR가 제공될 수 있습니다.
- 이것은 게임 내부용 정보이며 narrative에 변수명, 확률, 가중치, 내부 단계명을 절대 노출하지 마세요.
- adultEncounterWindow가 CLOSED라면 그 턴에 새 성적/성인 관계 인카운터를 시작하지 마세요.
- adultEncounterWindow가 OPEN이고 adultEligible이 true인 경우에만, 현재 장면과 개연성이 맞을 때 성인 관계/유혹/로맨스 계열 사건을 등장시킬 수 있습니다.
- internalRaceCycleSignal이 HIGH인 경우 수인 성인 캐릭터의 성인 관계 인카운터 발생 가중치가 일시적으로 높아진 상태입니다. 이 내부 상태의 이름이나 생물학적 주기를 narrative에서 직접 언급하지 마세요. 필요하다면 감각이나 분위기의 미묘한 변화만 서술하세요.
- adultEligible이 false이면 성적 인카운터, 성욕/음란도/감도 변화는 생성하지 마세요.

[자원 및 다채로운 아이템 인카운터 규칙]
- 화폐는 루피입니다.
- 단순히 고정된 경험치와 루피만 반복해서 주지 말고, 플레이어의 탐험, 발견, 토벌, 채집, 거래, 수수께끼 해결, 유적 조사 등에 맞춰 세계관에 걸맞은 다채롭고 생생한 아이템을 적극적으로 지급(addItems)하세요.
- [아이템 종류 및 예시]:
  1. 소비 및 포션류: 『하급 회복약』, 『상급 붉은 회복약』, 『맑은 정신의 허브차』, 『성스러운 은빛 성수』, 『농축 마나 물약』, 『기적의 엘릭서』, 『달빛 이슬 포션』, 『해독초』, 『흑요석 활력제』, 『용기의 영약』
  2. 전리품 및 연금 재료: 『질긴 늑대 가죽』, 『마수의 날카로운 송곳니』, 『빛나는 마나석 파편』, 『심연의 정수』, 『영혼석 조각』, 『고대 유적의 룬 파편』, 『마력 깃든 나뭇가지』, 『순은 주괴』, 『독주머니』
  3. 유물 및 귀중품: 『봉인된 양피지 두루마리』, 『은장도』, 『매혹의 장미 향수』, 『낡은 보물지도』, 『타락의 성유』, 『수호의 아뮬렛』, 『암시장의 비밀 표식』
- 아이템을 narrative에서 획득했다고 서술했다면 반드시 changes.addItems에 동일한 이름과 수량을 명시하세요.
- hpDelta, sanityDelta, manaDelta, rupeeDelta, expGain, 아이템 변화(addItems, removeItems)는 사건에 맞게 제안할 수 있습니다.
- 성인 상태가 활성화된 경우에만 desireDelta, lewdnessDelta, sensitivityDelta를 제안할 수 있습니다.
- corruptionDelta는 영구 타락도에 영향을 주는 매우 느린 누적값입니다. 단순한 상태 변화나 반복 장면에는 0을 사용하세요.
- corruptionDelta > 0은 가치관/정체성/장기적 오염에 의미 있는 지속적 변화가 실제로 성립한 사건에만 제안하세요.
- 일반적으로 의미 있는 사건은 0.1~0.25, 강한 전환 사건도 0.25~0.5 범위를 권장하며 한 로그에서 0.5를 넘기지 마세요.
- payload, 알, 기생체, 외부 내용물 등 현재 신체 상태가 주는 영향은 엔진의 effectiveCorruption 파생 보정으로 처리되므로, 그것만을 이유로 영구 corruptionDelta를 추가하지 마세요.
- 관계 이벤트에 따른 확률적 미약 적용 여부와 수치는 게임 엔진이 별도로 판정합니다. 관계 이벤트만을 이유로 aphrodisiacDelta/addictionDelta를 임의로 추가하지 마세요.
- aphrodisiacDelta/addictionDelta는 다른 독립적인 게임 효과가 명확히 정의된 경우에만 제안할 수 있습니다.
- 수치 변화는 과도하게 크게 주지 말고 한 사건의 규모에 맞게 사용하세요.

[동료 욕구 상태 규칙]
- 영입된 성인 동료에게는 성욕과 배설 욕구(소변) 상태가 존재할 수 있습니다. 이 내부 필드명이나 임계값 식별자는 narrative에 노출하지 마세요.
- 동료 상태 변화는 필요할 때만 changes.companionNeedChanges로 제안하세요. 동료가 플레이어에게 호감을 느끼거나 친밀한 상호작용이 실제 성립한 경우에만 작은 성욕 증가를 제안할 수 있습니다.
- 동료가 사생활이 확보된 곳에서 정상적으로 용변을 해결한 장면이 명확히 성립한 경우 relieveUrination을 true로 제안할 수 있습니다.
- 성욕이 높아도 플레이어의 반응이나 동의를 임의로 확정하지 마세요. 거절이나 거리 두기를 무시하는 행동을 확정하지 마세요.
- 신체적 나이가 18세 미만인 플레이어가 관련된 경우 동료 성욕 관련 변화를 생성하지 마세요.

[게임 시간 흐름 및 행동 소요 시간 (timeDeltaMinutes) 규칙]
- 일반적인 1회 기본 행동은 기본 15분이 소요됩니다. (지정하지 않으면 엔진이 기본 15분을 적용합니다.)
- 플레이어가 행동에 시간을 명시했거나 긴 활동을 수행할 경우 'changes.timeDeltaMinutes'에 분(minute) 단위로 지정하세요.
  예:
  - "3시간 동안 기다린다/잠복한다" -> timeDeltaMinutes: 180
  - "1시간 동안 훈련한다 / 책을 정독한다" -> timeDeltaMinutes: 60
  - "30분 동안 가볍게 휴식한다" -> timeDeltaMinutes: 30
  - "잠깐 5분 동안 살펴본다" -> timeDeltaMinutes: 5
- 실제 시각 계산 및 날짜 변경은 게임 엔진이 전담하므로, AI는 시간/날짜를 직접 조작하지 않고 소요된 분(timeDeltaMinutes)만 반환하세요.

[잠금 해제 및 문/상자 개방 행동 규칙]
- 플레이어가 문, 상자, 보관함, 봉인, 자물쇠 등을 '열쇠로 연다', '자물쇠를딴다', '힘으로 부순다/연다', '마법으로 봉인을 푼다', '퀘스트/허가로 연다' 등의 행동을 입력했을 때:
  1. 단순 USE_ITEM이나 임의의 아이템 소모보다 'lockAction' 객체를 최우선으로 생성하여 반환하세요.
  2. method는 행동 방식에 맞춰 'KEY', 'LOCKPICK', 'FORCE', 'MAGIC', 'QUEST', 'NPC_PERMISSION' 중 하나를 정확히 지정하세요.
  3. lockId는 현재 상황/장소에 알맞은 잠금장치 ID를 지정하세요 (예: iron_gate_01, ancient_chest_01, sealed_sanctuary_01 등).
  4. keyItemId는 사용하려는 열쇠/도구 아이템 ID 또는 이름(있는 경우)을 지정하세요.
  5. [중요 규칙]: Gemini가 잠금 해제의 성공/실패를 직접 단정하거나 임의로 결정하지 마세요. 열쇠나 도구를 changes.removeItems로 직접 차감하지 마세요. 실제 열쇠 보유 여부, 소모 여부, 스탯 판정 및 성공 여부는 게임 엔진(attemptUnlockLock)이 처리합니다. narrative에는 잠금을 열거나 해제하려는 시도와 동작 자체를 긴장감 있게 서술하세요.

[주요 인물 및 지역 상호작용 규칙 (worldAction)]
- 플레이어가 실제로 이름 있는 주요 인물(NPC)과 대화하거나 조우했을 때, 또는 새로운 장소/지역으로 이동했을 때만 선택적으로 'worldAction' 객체를 반환하세요.
- type은 다음 세 가지 중 하나여야 합니다:
  1. "TALK_CHARACTER": 이름 있는 인물과 대화를 나누었을 때 (characterId 또는 characterName 지정)
  2. "MEET_CHARACTER": 이름 있는 인물과 처음 조우/대면했을 때 (characterId 또는 characterName 지정)
  3. "ENTER_LOCATION": 특정 장소나 지역, 던전, 건물 등에 이동/진입했을 때 (location 명시)
- [중요]: Gemini가 퀘스트 진행도나 완료 여부를 직접 변경하지 마세요. 게임 엔진이 worldAction을 수신하여 정식 GameEvent(CHARACTER_TALKED, CHARACTER_MET, LOCATION_ENTERED)를 디스패치하고 퀘스트 목표를 판정합니다.
- 이름 없는 단순 행인, 일반 몬스터, 허공과의 독백에는 worldAction을 생성하지 마세요.

[진행 중 인카운터 종료 규칙 (encounterAction)]
- playerState에 activeEncounterId가 있을 때만 선택적으로 encounterAction을 반환하세요.
- 플레이어의 이번 행동으로 현재 인카운터의 결과가 명확히 확정되었을 때만 사용하세요. 아직 선택/대치/조사/협상이 진행 중이면 encounterAction을 생략하세요.
- 성공·해결·무사 통과 등으로 사건이 끝났으면 type을 "RESOLVE", 명백한 실패로 사건이 끝났으면 "FAIL"로 반환하세요.
- encounterId는 현재 activeEncounterId와 동일하게 사용하고, outcome은 결과를 짧은 내부 판정어로 기록하세요.
- Gemini가 인카운터 상태를 직접 유지하지 말고, 게임 엔진이 encounterAction을 받아 ENCOUNTER_RESOLVED / ENCOUNTER_FAILED를 처리하도록 하세요.

[운명 진행 규칙 (fateAction)]
- [현재 운명] 블록이 제공될 때만 fateAction을 선택적으로 반환하세요.
- 운명은 일반 퀘스트와 다릅니다. 플레이어 자신의 출신/과거/개인 서사가 실제 장면에서 의미 있게 진전되었을 때만 진행합니다.
- 단순 이동, 잡담, 전투 1회, 아이템 사용처럼 현재 운명장과 무관한 행동으로 운명장을 넘기지 마세요.
- 현재 운명장의 핵심 사건이 플레이어의 행동으로 명확히 해결되었을 때만 type="ADVANCE_CHAPTER"를 반환하세요.
- 현재 장에 유효 선택 ID가 제시되어 있고 플레이어가 그 선택을 실제로 확정했을 때만 choiceId를 반환하세요. 선택을 대신 결정하지 마세요.
- 마지막 운명장이 명확히 결착되었을 때만 type="COMPLETE_FATE"를 반환하고, 제공된 유효 결말 ID 중 하나를 endingId로 사용하세요.
- chapterId, choiceId, endingId를 임의로 창작하지 마세요. 현재 운명 블록에 제시된 값만 사용하세요.
- 운명 진행 여부와 플래그/보상 적용은 게임 엔진이 검증합니다.

[성인 관계 이벤트 내부 판정]
- actionResult.relationshipEventOccurred는 이번 로그에서 성인 관계 이벤트가 실제로 성립했을 때만 true로 반환하세요.
- 단순 대화, 호감 표현, 유혹, 접근, 분위기 형성만으로 true로 만들지 마세요.
- 신체적 나이 18세 미만 캐릭터가 관련된 경우 반드시 false입니다.
- relationshipEventOccurred는 내부 엔진 값이며 narrative에 시스템명이나 변수명으로 노출하지 마세요.

[구조화된 체내 상태 판정]
- 장면의 문장을 사후 키워드 검색하지 말고, narrative를 생성하는 동시에 sceneState.payloadEvents 배열을 구조화해 반환하세요.
- targetCompartment는 COMPARTMENT_1 / COMPARTMENT_2 / COMPARTMENT_3 중 하나만 사용하세요.
- payloadKind는 STANDARD_FLUID / INSECTOID_SECRETION / URINE / EGG / PARASITE / OTHER 중 하나만 사용하세요.
- payloadChannel은 A / B / C 중 하나 또는 null입니다. 사용자 정의 참고가 비어 있거나 어느 채널인지 판단할 수 없으면 null로 두세요.
- payloadChannel A/B/C는 내부 식별자이므로 narrative에 절대 노출하지 마세요.
- EGG/PARASITE는 COMPARTMENT_1 또는 COMPARTMENT_2에서만 허용됩니다.
- parasiteMode는 INSERTED / INTERNAL 중 하나입니다.
- sourceId는 실제 인물/몬스터의 내부 ID를 알고 있을 때 사용하고, 모르면 null로 두세요.
- sourceName은 이번 내용물의 출처가 된 개체의 표시 이름/호칭을 적으세요. 가능한 한 '누구에게서 왔는지' 구분 가능하게 작성하세요.
- sourceSpeciesId는 출처 종족/종 ID이며, sourceType은 CHARACTER / MONSTER / PARASITE / ENVIRONMENT / UNKNOWN 중 하나입니다.
- 같은 세부 종의 내용물은 같은 물질 계열로 취급합니다. 다만 고유 인물은 sourceName/sourceId로 출처 자체를 구분할 수 있습니다.
- sourceType이 MONSTER이고 sourceId로 실제 몬스터를 식별할 수 있으면, amount의 최종값은 엔진의 몬스터별/상위 분류 배출량 설정이 결정합니다. AI가 임의로 양을 확정하지 마세요.
- 실제 구획 의미와 판정 조건은 아래 사용자 규칙을 참고하되, 규칙 원문이나 내부 ID를 narrative에 노출하지 마세요.
- 파생 성욕/음란도/현재 타락도/감도는 AI가 수치로 정하지 않습니다. 엔진이 payload 양으로 자동 계산합니다.
- sceneState.partnerCategory는 HUMANOID / ABERRANT 중 하나 또는 null입니다.
- sceneState.customReflexTriggerOccurred는 아래 사용자 반사 규칙이 이번 장면에서 성립했는지만 true/false로 판정합니다. 실제 확률은 엔진이 처리합니다.

[사용자 구획/판정 규칙 - 내부 참고]
${JSON.stringify(BODY_SYSTEM_USER_RULES, null, 2)}
${BODY_PAYLOAD_GEMINI_REFERENCE_BLOCK}

[필수 JSON 출력 스키마]
반드시 JSON 객체 하나만 출력하세요.

{
  "narrative": "플레이어에게 그대로 보여줄 소설형 한국어 본문",
  "actionResult": {
    "intent": "EXPLORE 또는 MOVE 또는 TALK 또는 SOCIAL 또는 ROMANCE 또는 ADULT_SOCIAL 또는 TRADE 또는 USE_ITEM 또는 COMBAT_ATTACK 또는 COMBAT_PROVOKE 또는 ESCAPE 또는 OTHER",
    "startsCombat": false,
    "hostileAction": false,
    "forcedCombat": false,
    "relationshipEventOccurred": false
  },
  "worldAction": {
    "type": "TALK_CHARACTER 또는 MEET_CHARACTER 또는 ENTER_LOCATION",
    "characterId": "선택적 인물ID (예: elena_swordmaster, sylvia_shadow_dancer 등)",
    "characterName": "인물 이름 (예: 엘레나, 실비아 등)",
    "location": "이동/진입한 지역명 (예: 발터 성채 주점, 달빛 오아시스 등)"
  },
  "encounterAction": {
    "type": "RESOLVE 또는 FAIL",
    "encounterId": "현재 activeEncounterId",
    "outcome": "결과 요약 판정어"
  },
  "fateAction": {
    "type": "ADVANCE_CHAPTER 또는 COMPLETE_FATE",
    "chapterId": "현재 운명장의 유효 chapterId",
    "choiceId": "현재 운명장에 선택지가 있고 플레이어가 명시적으로 선택했을 때만 유효 choiceId",
    "endingId": "마지막 운명 결착 시에만 유효 endingId",
    "outcome": "운명 진행 결과의 짧은 내부 요약"
  },
  "lockAction": {
    "lockId": "잠금장치ID",
    "method": "KEY 또는 LOCKPICK 또는 FORCE 또는 MAGIC 또는 QUEST 또는 NPC_PERMISSION",
    "keyItemId": "선택적 열쇠 아이템ID"
  },
  "sceneState": {
    "partnerCategory": null,
    "customReflexTriggerOccurred": false,
    "pregnancyEvent": {
      "occurred": false,
      "parentA": { "category": "HUMANOID", "sapience": "SAPIENT", "speciesId": null },
      "parentB": { "category": "HUMANOID", "sapience": "SAPIENT", "speciesId": null }
    },
    "payloadEvents": [
      {
        "occurred": false,
        "targetCompartment": null,
        "payloadKind": null,
        "payloadChannel": null,
        "amount": 0,
        "sourceId": null,
        "sourceName": null,
        "sourceSpeciesId": null,
        "sourceType": "UNKNOWN",
        "sourceSex": null,
        "parasiteMode": null,
        "confidence": 0
      }
    ]
  },
  "changes": {
    "hpDelta": 0,
    "sanityDelta": 0,
    "manaDelta": 0,
    "rupeeDelta": 0,
    "expGain": 0,
    "timeDeltaMinutes": 15,
    "desireDelta": 0,
    "lewdnessDelta": 0,
    "sensitivityDelta": 0,
    "aphrodisiacDelta": 0,
    "addictionDelta": 0,
    "corruptionDelta": 0,
    "clothingState": null,
    "addItems": [
      { "name": "아이템명", "quantity": 1 }
    ],
    "removeItems": [
      { "name": "소실아이템명", "quantity": 1 }
    ],
    "companionNeedChanges": [
      { "companionId": "동료 내부 ID", "desireDelta": 0, "urinationDelta": 0, "relieveUrination": false }
    ],
    "battleTrigger": null
  }
}`;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientError(error: any): boolean {
  const msg = String(error?.message || error || '').toLowerCase();
  const status = error?.status || error?.statusCode || error?.code;
  return (
    status === 503 ||
    status === '503' ||
    status === 429 ||
    status === '429' ||
    status === 'UNAVAILABLE' ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('resource exhausted') ||
    msg.includes('overloaded') ||
    msg.includes('temporarily unavailable')
  );
}

function getEncounterDirector(playerState: any) {
  const physicalAge = Number(playerState?.profile?.physicalAge ?? 0);
  const adultEligible = physicalAge >= 18;
  const race = String(playerState?.race || 'HUMAN');
  const dialogueCount = Math.max(0, Number(playerState?.dialogueCount ?? 0));

  // 내부적으로만 사용하는 수인 주기.
  // 18로그 중 마지막 4로그가 활성 구간이며 UI/스토리에 이름을 직접 노출하지 않는다.
  const cycleLength = 18;
  const activeLength = 4;
  const cyclePhase = dialogueCount % cycleLength;
  const hiddenRaceCycleActive =
    adultEligible && race === 'BEASTKIN' && cyclePhase >= cycleLength - activeLength;

  let adultEncounterChance = 0;
  if (adultEligible) {
    if (race === 'ELF') adultEncounterChance = 0.05;
    else if (race === 'BEASTKIN') adultEncounterChance = hiddenRaceCycleActive ? 0.34 : 0.18;
    else adultEncounterChance = 0.1;
  }

  const socialRiskChance =
    race === 'BEASTKIN' ? 0.32 : race === 'ELF' ? 0.06 : 0.12;

  return {
    adultEligible,
    adultEncounterWindow:
      adultEligible && Math.random() < adultEncounterChance ? 'OPEN' : 'CLOSED',
    internalRaceCycleSignal: hiddenRaceCycleActive ? 'HIGH' : 'NORMAL',
    socialRiskWindow: Math.random() < socialRiskChance ? 'OPEN' : 'CLOSED',
    raceAdultEncounterBias:
      race === 'BEASTKIN' ? 'HIGH' : race === 'ELF' ? 'LOW' : 'NORMAL',
  };
}

// ============================================================
// 성인 상태 연출 reference 파이프라인
// ============================================================
//
// 실제 문장은 이 파일에 하드코딩하지 않습니다.
// 사용자가 src/data/adultNarrativeDirectives.ts의 빈 문자열에 작성한 내용은
// "최종 출력문"이 아니라 Gemini가 장면에 맞게 자유롭게 변형/조합할 참고자료입니다.

type RelationshipAphrodisiacRoll = {
  triggered: boolean;
  amount: number;
  addictionGain: number;
};

function randomIntInclusive(min: number, max: number): number {
  const safeMin = Math.ceil(min);
  const safeMax = Math.floor(max);

  if (safeMax <= safeMin) return safeMin;

  return Math.floor(
    Math.random() * (safeMax - safeMin + 1)
  ) + safeMin;
}

function rollRelationshipAphrodisiac(
  playerState: any
): RelationshipAphrodisiacRoll {
  const physicalAge = Number(playerState?.profile?.physicalAge ?? 0);
  const rule = ADULT_SYSTEM_CONFIG.aphrodisiac.relationshipInjection;

  if (
    physicalAge < ADULT_SYSTEM_CONFIG.adultPhysicalAge ||
    !rule.enabled
  ) {
    return {
      triggered: false,
      amount: 0,
      addictionGain: 0,
    };
  }

  if (Math.random() >= rule.chance) {
    return {
      triggered: false,
      amount: 0,
      addictionGain: 0,
    };
  }

  return {
    triggered: true,
    amount: randomIntInclusive(rule.minAmount, rule.maxAmount),
    addictionGain: randomIntInclusive(
      rule.addictionGainMin,
      rule.addictionGainMax
    ),
  };
}

function getDirectiveForCueType(cueType: string): string {
  switch (cueType) {
    case 'DESIRE_INCREASE':
      return ADULT_NARRATIVE_DIRECTIVES.desireIncrease;
    case 'DESIRE_HIGH':
      return ADULT_NARRATIVE_DIRECTIVES.desireHigh;
    case 'LEWDNESS_INCREASE':
      return ADULT_NARRATIVE_DIRECTIVES.lewdnessIncrease;
    case 'LEWDNESS_HIGH':
      return ADULT_NARRATIVE_DIRECTIVES.lewdnessHigh;
    case 'SENSITIVITY_INCREASE':
      return ADULT_NARRATIVE_DIRECTIVES.sensitivityIncrease;
    case 'SENSITIVITY_DECREASE':
      return ADULT_NARRATIVE_DIRECTIVES.sensitivityDecrease;
    case 'SENSITIVITY_HIGH':
      return ADULT_NARRATIVE_DIRECTIVES.sensitivityHigh;
    case 'CORRUPTION_INCREASE':
      return ADULT_NARRATIVE_DIRECTIVES.corruptionIncrease;
    case 'CORRUPTION_TIER_UP':
      return ADULT_NARRATIVE_DIRECTIVES.corruptionTierUp;
    case 'APHRODISIAC_APPLIED':
      return ADULT_NARRATIVE_DIRECTIVES.aphrodisiacApplied;
    case 'APHRODISIAC_INTENSIFIED':
      return ADULT_NARRATIVE_DIRECTIVES.aphrodisiacIntensified;
    case 'APHRODISIAC_DECAY':
      return ADULT_NARRATIVE_DIRECTIVES.aphrodisiacDecay;
    case 'APHRODISIAC_CLEARED':
      return ADULT_NARRATIVE_DIRECTIVES.aphrodisiacCleared;
    case 'ADDICTION_INCREASE':
      return ADULT_NARRATIVE_DIRECTIVES.addictionIncrease;
    case 'ADDICTION_TIER_UP':
      return ADULT_NARRATIVE_DIRECTIVES.addictionTierUp;
    default:
      return '';
  }
}

function addNarrativeReference(
  output: string[],
  trigger: string,
  reference: unknown
) {
  if (typeof reference !== 'string' || reference.trim().length === 0) {
    return;
  }

  output.push(
    `- 적용 조건: ${trigger}\n` +
    `  사용자 작성 참고자료: ${reference.trim()}`
  );
}


function collectMonsterAdultContextIds(
  playerState: any,
  action: string,
  history: any[]
): string[] {
  const ids: string[] = [];
  const add = (value: unknown) => {
    const id = String(value || '').trim();
    if (id && !ids.includes(id)) ids.push(id);
  };

  for (const id of playerState?.defeatAftermath?.sourceEnemyIds || []) add(id);
  for (const enemy of playerState?.activeBattle?.enemies || []) add(enemy?.archetype || enemy?.id);

  const dialogueCount = Number(playerState?.dialogueCount || 0);
  const expiresAt = Number(playerState?.recentMonsterContextExpiresAtDialogue ?? -1);
  if (dialogueCount <= expiresAt) {
    for (const id of playerState?.recentMonsterContextIds || []) add(id);
  }

  const recentHistoryText = Array.isArray(history)
    ? history.slice(-8).map((entry: any) => String(entry?.content ?? entry?.text ?? '')).join('\n')
    : '';
  for (const id of detectMonsterIdsInText(`${action || ''}
${recentHistoryText}`)) add(id);
  return ids;
}

function getAdultNarrationDirective(
  playerState: any,
  encounterDirector: any,
  relationshipRoll: RelationshipAphrodisiacRoll,
  action: string,
  history: any[]
): string {
  const physicalAge = Number(playerState?.profile?.physicalAge ?? 0);

  if (physicalAge < ADULT_SYSTEM_CONFIG.adultPhysicalAge) {
    return '';
  }

  const adultStatus = playerState?.adultStatus;
  if (!adultStatus) return '';

  const baseDesire = Number(adultStatus.desire ?? 0);
  const desire = Number(adultStatus.effectiveDesire ?? adultStatus.desire ?? 0);
  const lewdness = Number(adultStatus.lewdness ?? 0);
  const sensitivity = Number(adultStatus.sensitivity ?? 0);
  const aphrodisiacLevel = Number(adultStatus.aphrodisiacLevel ?? 0);
  const addiction = Number(adultStatus.addiction ?? 0);
  const permanentCorruption = Number(playerState?.corruptionStatus?.corruption ?? 0);
  const corruption = Number(
    playerState?.corruptionStatus?.effectiveCorruption ??
    playerState?.corruptionStatus?.corruption ??
    0
  );

  const references: string[] = [];

  // 던전의 사용자 작성 성인 함정 슬롯. 신체적 나이 18+일 때만 이 함수에 도달한다.
  const dungeonTrapSlotId = String(playerState?.activeDungeonAdultTrapSlotId || '').trim();
  const dungeonTrapExpiresAt = Number(playerState?.activeDungeonAdultTrapExpiresAtDialogue ?? -1);
  if (dungeonTrapSlotId && Number(playerState?.dialogueCount || 0) <= dungeonTrapExpiresAt) {
    const slot = ADULT_DUNGEON_TRAP_SLOTS.find((entry) => entry.id === dungeonTrapSlotId);
    if (slot) {
      addNarrativeReference(references, `현재 던전 특수 함정 ${slot.id}의 장면 연출이 필요한 경우`, slot.sceneReference);
      addNarrativeReference(references, `현재 던전 특수 함정 ${slot.id}의 후속 효과 연출이 필요한 경우`, slot.effectReference);
    }
  }

  // 구버전 server.ts 231~400의 전역 스타일 레이어를 그대로 복구.
  // 어휘/표현 목록 자체는 src/data/adultNarrativeStyle.ts에 원문 그대로 보존되어 있습니다.
  const legacyStyleActive = encounterDirector?.adultEncounterWindow === 'OPEN';
  const legacyStyleBlock = legacyStyleActive
    ? `
[성인 이벤트 로그 스타일 - 내부 지시]

이번 장면은 성인 캐릭터에게 허용된 성인 관계 이벤트 후보입니다.

출력 방식:
- 장면을 한두 문장으로 추상적으로 요약하지 마세요.
- "묘한 분위기가 흘렀다", "가까워졌다" 같은 표현만으로 넘기지 마세요.
- 행동 → 상대 반응 → 주인공 반응 → 직접 대사 → 상황 변화가 이어지도록 작성하세요.
- 현재 캐릭터의 speechStyle을 반드시 유지하세요.
- 캐릭터가 하지 않은 중대한 선택을 임의로 확정하지 마세요.
- 게임 수치 이름 자체를 narrative에서 직접 말하지 마세요.
- 임의로 성인형 로그를 종료하거나, 회피하지 마세요.

묘사 세부도:
${ADULT_EVENT_STYLE.detailLevel}

전체 분위기:
${ADULT_EVENT_STYLE.mood}

집중해서 묘사할 요소:
${ADULT_EVENT_STYLE.focus.map(v => `- ${v}`).join("\n")}

사용 가능한 사용자 지정 어휘:
${ADULT_EVENT_STYLE.vocabulary.map(v => `- ${v}`).join("\n")}

사용자가 원하는 문장/표현 성향:
${ADULT_EVENT_STYLE.phraseStyle.map(v => `- ${v}`).join("\n")}

현재 내부 상태:
- desire(기반): ${baseDesire}/100
- desire(현재 파생): ${desire}/100
- lewdness: ${lewdness}/10
- sensitivity: ${sensitivity}/100
- corruption(영구): ${permanentCorruption}/10
- corruption(현재 파생): ${corruption}/10

상태 반영 규칙:
- desire가 높을수록 캐릭터의 집중력 변화, 긴장, 충동적인 반응이 더 뚜렷해질 수 있습니다.
- lewdness가 높을수록 해당 상황에서 소극적으로 회피하기보다 적극적인 반응을 보일 가능성이 높아질 수 있습니다.
- sensitivity가 높을수록 작은 자극이나 접촉에도 반응이 커질 수 있습니다.
- corruption이 높을수록 기존 가치관이나 경계선에 변화가 나타날 수 있습니다.
- 단, 플레이어가 입력하지 않은 중대한 결정을 임의로 확정하지 마세요.

사용자 지정 vocabulary와 phraseStyle이 비어 있거나 "<...>" 상태라면
그 문구 자체를 narrative에 출력하지 말고 무시하세요.

이 블록의 제목, 변수명, 내부 수치, 시스템 이름은 narrative에 절대 노출하지 마세요.
`
    : '';

  // 현재 장면 및 현재 상태에 따른 지속 reference
  if (encounterDirector?.adultEncounterWindow === 'OPEN') {
    addNarrativeReference(
      references,
      '현재 장면이 성인 관계 장면으로 자연스럽게 진행될 필요가 있을 때',
      ADULT_NARRATIVE_DIRECTIVES.generalAdultScene
    );

    addNarrativeReference(
      references,
      '성인 관계 이벤트가 이번 로그에서 실제로 성립했을 때',
      ADULT_NARRATIVE_DIRECTIVES.relationshipEvent
    );

    // 몬스터 개별/분류 reference: 개별 -> 세부분류 -> 상위분류 순으로 자동 폴백.
    const monsterContextIds = collectMonsterAdultContextIds(playerState, action, history);
    const monsterReferences = collectResolvedMonsterAdultReferences(monsterContextIds);
    for (const monsterReference of monsterReferences) {
      addNarrativeReference(
        references,
        `현재 성인 장면의 상대가 ${monsterReference.monsterName}일 때 (참조 단계: ${monsterReference.source})`,
        monsterReference.reference
      );
    }
  }

  if (desire >= 75) {
    addNarrativeReference(
      references,
      '현재 성욕 상태가 높은 것이 장면상 의미가 있을 때',
      ADULT_NARRATIVE_DIRECTIVES.desireHigh
    );
  }

  if (lewdness >= 7) {
    addNarrativeReference(
      references,
      '현재 음란도 상태가 높은 것이 장면상 의미가 있을 때',
      ADULT_NARRATIVE_DIRECTIVES.lewdnessHigh
    );
  }

  if (sensitivity >= 75) {
    addNarrativeReference(
      references,
      '현재 감도 상태가 높은 것이 장면상 의미가 있을 때',
      ADULT_NARRATIVE_DIRECTIVES.sensitivityHigh
    );
  }

  if (aphrodisiacLevel > 0) {
    addNarrativeReference(
      references,
      '현재 미약 상태가 활성화되어 있고 장면과 관련될 때',
      ADULT_NARRATIVE_DIRECTIVES.aphrodisiacActive
    );
  }

  if (addiction > 0) {
    addNarrativeReference(
      references,
      '현재 중독 상태가 장면 또는 인물 반응과 관련될 때',
      ADULT_NARRATIVE_DIRECTIVES.addictionActive
    );
  }

  // 이번 응답에서 Gemini가 해당 delta를 제안하는 경우에만 적용할 reference
  addNarrativeReference(
    references,
    '이번 응답의 changes.desireDelta가 양수인 경우에만',
    ADULT_NARRATIVE_DIRECTIVES.desireIncrease
  );

  addNarrativeReference(
    references,
    '이번 응답의 changes.lewdnessDelta가 양수인 경우에만',
    ADULT_NARRATIVE_DIRECTIVES.lewdnessIncrease
  );

  addNarrativeReference(
    references,
    '이번 응답의 changes.sensitivityDelta가 양수인 경우에만',
    ADULT_NARRATIVE_DIRECTIVES.sensitivityIncrease
  );

  addNarrativeReference(
    references,
    '이번 응답의 changes.corruptionDelta가 양수인 경우에만',
    ADULT_NARRATIVE_DIRECTIVES.corruptionIncrease
  );

  // 이전 엔진 처리에서 생긴 큐: 다음 정상 GM 로그 한 번에서만 소비
  const queue = Array.isArray(playerState?.adultNarrativeQueue)
    ? playerState.adultNarrativeQueue
    : [];

  for (const cue of queue) {
    const reference = getDirectiveForCueType(String(cue?.type ?? ''));
    if (!reference.trim()) continue;

    const metadata: string[] = [];
    if (typeof cue.previousValue === 'number') {
      metadata.push(`이전값=${cue.previousValue}`);
    }
    if (typeof cue.currentValue === 'number') {
      metadata.push(`현재값=${cue.currentValue}`);
    }
    if (typeof cue.amount === 'number') {
      metadata.push(`변화량=${cue.amount}`);
    }

    addNarrativeReference(
      references,
      `이전 엔진 처리에서 ${String(cue.type)} 상태 변화가 발생했고 이번 장면에 자연스럽게 이어질 때${
        metadata.length > 0 ? ` (${metadata.join(', ')})` : ''
      }`,
      reference
    );
  }

  // 관계 이벤트에서 확률 판정에 성공한 경우.
  // 실제 relationshipEventOccurred=true일 때만 장면과 수치가 함께 성립합니다.
  if (relationshipRoll.triggered) {
    addNarrativeReference(
      references,
      '이번 로그에서 성인 관계 이벤트가 실제 성립한 경우에만 미약 적용 사건을 함께 반영. 단순 대화/접근만으로는 사용하지 않음',
      ADULT_NARRATIVE_DIRECTIVES.aphrodisiacInjectionEvent
    );

    addNarrativeReference(
      references,
      '위 미약 적용 사건이 실제 발생하고 기존 미약 수치가 0이었던 경우',
      ADULT_NARRATIVE_DIRECTIVES.aphrodisiacApplied
    );

    if (aphrodisiacLevel > 0) {
      addNarrativeReference(
        references,
        '위 미약 적용 사건이 실제 발생하고 이미 미약 상태가 활성화되어 있던 경우',
        ADULT_NARRATIVE_DIRECTIVES.aphrodisiacIntensified
      );
    }

    if (relationshipRoll.addictionGain > 0) {
      addNarrativeReference(
        references,
        '위 미약 적용과 함께 중독 수치가 증가하는 경우',
        ADULT_NARRATIVE_DIRECTIVES.addictionIncrease
      );

      const oldTier = getAddictionTierByValue(addiction);
      const newTier = getAddictionTierByValue(
        addiction + relationshipRoll.addictionGain
      );

      if (oldTier !== newTier) {
        addNarrativeReference(
          references,
          '위 변화로 중독 단계가 상승하는 경우',
          ADULT_NARRATIVE_DIRECTIVES.addictionTierUp
        );
      }
    }
  }

  // 현재 payload 양 단계별 사용자 작성 특수 연출 참고자료
  const payloads = Array.isArray(playerState?.bodyPayloads) ? playerState.bodyPayloads : [];
  for (const payload of payloads) {
    const compartmentId = payload?.compartmentId as keyof typeof BODY_LOAD_NARRATIVE_DIRECTIVES;
    const payloadKind = payload?.payloadKind as keyof (typeof BODY_LOAD_NARRATIVE_DIRECTIVES)[keyof typeof BODY_LOAD_NARRATIVE_DIRECTIVES];
    if (!BODY_LOAD_NARRATIVE_DIRECTIVES[compartmentId]?.[payloadKind]) continue;
    const capacity = Math.max(1, Number(BODY_COMPARTMENT_CAPACITY[compartmentId] ?? 100));
    const ratio = Math.max(0, Number(payload.amount) || 0) / capacity;
    const stage = BODY_LOAD_THRESHOLDS.find((entry) => ratio >= entry.minRatio)?.stage ?? 'EMPTY';
    if (stage === 'EMPTY') continue;
    const reference = (BODY_LOAD_NARRATIVE_DIRECTIVES[compartmentId][payloadKind] as any)[stage];
    addNarrativeReference(references, `현재 내부 상태 ${compartmentId}/${payloadKind}의 자동 판정 단계가 ${stage}인 동안`, reference);
  }

  if (references.length === 0 && !legacyStyleBlock) {
    return '';
  }

  const referenceBlock = references.length > 0
    ? `
[USER AUTHORED NARRATIVE REFERENCES - 내부 참고자료]

아래의 "사용자 작성 참고자료"는 최종 출력 문장, 대사 원고, 고정 문구가 아닙니다.
장면을 생성할 때 참고해야 하는 의미·분위기·반응·연출 방향입니다.

반드시 다음 원칙으로 사용하세요.
1. 참고자료의 문장을 원문 그대로 복사하거나 인용하지 마세요.
2. 단어 순서와 문장 구조를 그대로 재현하지 마세요.
3. 핵심 의도와 확정 설정만 유지한 채, 현재 등장인물/장소/행동/감정/직전 문맥에 맞는 새로운 표현으로 자유롭게 다시 작성하세요.
4. 여러 참고자료가 동시에 적용된다면 자연스럽게 하나의 장면으로 조합할 수 있습니다.
5. 장면 흐름에 따라 참고자료를 확장하거나 압축할 수 있습니다.
6. 조건에 맞지 않거나 현재 장면에 불필요한 참고자료는 생략하세요.
7. 참고자료에 없는 새로운 확정 설정을 임의로 만들어내지 마세요.
8. 내부 수치, 변수명, cue 이름, reference 제목을 narrative에 노출하지 마세요.
9. 캐릭터의 확정 설정 및 사용자의 현재 행동과 충돌하면 확정 설정/현재 행동을 우선하세요.
10. 빈 문자열인 reference는 존재하지 않는 것으로 취급하세요.

현재 내부 상태:
- desire: ${desire}/100
- lewdness: ${lewdness}/10
- sensitivity: ${sensitivity}/100
- aphrodisiac: ${aphrodisiacLevel}/100
- addiction: ${addiction}/100
- corruption: ${corruption}/10

사용 가능한 참고자료:
${references.join('\n\n')}
`
    : '';

  return `${legacyStyleBlock}${referenceBlock}`;
}


function buildDragonkinNarrativeReference(playerState:any): string {
  if (String(playerState?.race || playerState?.profile?.race || '') !== 'DRAGONKIN') return '';
  const refs=collectDragonkinNarrativeReferences(null);
  if(!refs.length) return '';
  return `
[용족 전용 세계관 참고자료 - 내부 참고]
${refs.map((r,i)=>`${i+1}. ${r}`).join('\n')}
- 위 참고자료는 설정과 분위기만 반영하고 원문을 그대로 복사하지 마세요.
- 구체적인 성적 착취/성폭력 장면을 새로 만들어 확장하지 마세요.
- 내부 키와 파일명은 narrative에 노출하지 마세요.
`;
}

function buildActiveEncounterNarrativeReference(playerState: any): string {
  const encounterId = String(playerState?.activeEncounterId || '').trim();
  if (!encounterId) return '';
  const encounter = getEncounterDefinition(encounterId);
  const reference = String(encounter?.sceneReference || '').trim();
  if (!encounter || !reference) return '';
  return `
[USER AUTHORED ENCOUNTER REFERENCE - 내부 참고자료]
현재 진행 중인 인카운터: ${encounter.title || encounter.id}
사용자 작성 연출 참고자료: ${reference}
- 위 문장을 그대로 복사하거나 인용하지 말고 현재 장면에 맞게 재구성하세요.
- reference에 없는 확정 설정이나 보상을 임의로 추가하지 마세요.
- 이 블록의 제목과 내부 ID는 narrative에 노출하지 마세요.
`;
}

function buildCompanionNeedNarrativeReference(playerState: any): string {
  const queue = Array.isArray(playerState?.companionNeedQueue) ? playerState.companionNeedQueue : [];
  if (!queue.length) return '';

  const playerAdult = Number(playerState?.profile?.physicalAge ?? 0) >= 18;
  const companions = Array.isArray(playerState?.companions) ? playerState.companions : [];
  const blocks: string[] = [];

  for (const cue of queue) {
    if (!cue || !['DESIRE', 'URINATION'].includes(String(cue.kind))) continue;
    if (cue.kind === 'DESIRE' && !playerAdult) continue;

    const companion = companions.find((c: any) => c?.id === cue.companionId);
    if (!companion) continue;
    if (Number(companion?.physicalAge ?? 20) < 18) continue;

    const reference = getCompanionNeedReference(cue.kind, Number(cue.threshold));
    if (!reference) continue;

    const secondary = cue.secondaryCompanionId
      ? companions.find((c: any) => c?.id === cue.secondaryCompanionId)
      : null;
    const lines = [
      `동료: ${companion.name}`,
      `장면 성격: ${reference.title}`,
      `기본 참고자료: ${reference.baseReference}`,
    ];
    if (secondary) {
      lines.push(`함께 장면에 반응할 수 있는 다른 동료: ${secondary.name} (상황을 눈치채거나 돕는 정도로만 자연스럽게 사용)`);
    }
    // 빈 사용자 작성 슬롯은 절대로 프롬프트에 포함하지 않는다.
    if (typeof reference.customReference === 'string' && reference.customReference.trim()) {
      lines.push(`사용자 작성 추가 참고자료: ${reference.customReference.trim()}`);
    }
    blocks.push(lines.join('\n'));
  }

  if (!blocks.length) return '';
  return `\n[동료 상태 장면 참고자료 - 내부용]\n${blocks.join('\n\n')}\n- 위 상태명, 내부 키, 임계값 숫자는 narrative에 직접 노출하지 마세요.\n- 플레이어의 행동과 반응을 임의로 확정하지 마세요.\n`;
}

function buildCompanionStatusSummary(playerState: any): string {
  const companions = Array.isArray(playerState?.companions) ? playerState.companions : [];
  if (!companions.length) return '';
  const lines = companions.map((c: any) => {
    const desire = Math.max(0, Math.min(100, Number(c?.needs?.desire) || 0));
    const urine = Math.max(0, Math.min(100, Number(c?.needs?.urinationUrge) || 0));
    return `- ${c.name}: 성별 ${c.gender || '남성'} · 성욕 ${Math.round(desire)}/100 · 배설 욕구(소변) ${Math.round(urine)}/100`;
  });
  return `\n[현재 동료 상태]\n${lines.join('\n')}\n`;
}

function buildPlayerAppearancePrompt(playerState: any): string {
  const profile = playerState?.profile;
  if (!profile) return '';

  const lines: string[] = [];

  // 이름
  const name = (profile.inGameName || profile.name || playerState?.characterName || '').trim();
  if (name) lines.push(`이름: ${name}`);

  // 종족
  const raceRaw = playerState?.race || profile.race || 'HUMAN';
  let raceStr = '';
  if (raceRaw === 'BEASTKIN') {
    const beastType = profile.beastkinType || playerState?.beastkinType;
    const beastTypeKr: Record<string, string> = {
      CAT: '고양이',
      FOX: '여우',
      DOG: '개',
      WOLF: '늑대',
      BIRD: '조류',
    };
    raceStr = `수인${beastType && beastTypeKr[beastType] ? ` (${beastTypeKr[beastType]})` : ''}`;
  } else if (raceRaw === 'ELF') {
    raceStr = '엘프';
  } else if (raceRaw === 'HUMAN') {
    raceStr = '인간';
  } else {
    raceStr = String(raceRaw);
  }
  if (raceStr) lines.push(`종족: ${raceStr}`);

  // 성별
  if (profile.gender && String(profile.gender).trim()) {
    lines.push(`성별: ${String(profile.gender).trim()}`);
  }

  // 신체적 나이
  if (typeof profile.physicalAge === 'number' && profile.physicalAge > 0) {
    lines.push(`신체적 나이: ${profile.physicalAge}세`);
  }

  // 키
  if (typeof profile.height === 'number' && profile.height > 0) {
    lines.push(`키: ${profile.height}cm`);
  }

  // 체격
  if (profile.build) {
    const buildMap: Record<string, string> = {
      SMALL: '작은 체격',
      AVERAGE: '보통 체격',
      LARGE: '큰/건장한 체격',
    };
    const buildStr = buildMap[profile.build] || String(profile.build);
    if (buildStr.trim()) lines.push(`체격: ${buildStr.trim()}`);
  }

  // 머리
  const hairParts = [profile.hairColor, profile.hairStyle].filter(
    (s) => typeof s === 'string' && s.trim() !== ''
  );
  if (hairParts.length > 0) {
    lines.push(`머리: ${hairParts.join(' ')}`);
  }

  // 눈
  if (profile.eyeColor && String(profile.eyeColor).trim()) {
    lines.push(`눈: ${String(profile.eyeColor).trim()}`);
  }

  // 피부
  if (profile.skinDescription && String(profile.skinDescription).trim()) {
    lines.push(`피부: ${String(profile.skinDescription).trim()}`);
  }

  // 외형
  if (profile.appearance && String(profile.appearance).trim()) {
    lines.push(`외형: ${String(profile.appearance).trim()}`);
  }

  // 기타 특징
  if (profile.features && String(profile.features).trim()) {
    lines.push(`기타 특징: ${String(profile.features).trim()}`);
  }

  // 수인 세부 특징
  if (raceRaw === 'BEASTKIN' && profile.beastFeatures) {
    const bf = profile.beastFeatures;
    const beastDetails: string[] = [];
    if (profile.beastkinType === 'BIRD') {
      if (bf.hasWings) {
        const wingParts = [bf.wingColor, bf.wingDescription].filter((s) => s && s.trim());
        beastDetails.push(`날개: ${wingParts.length > 0 ? wingParts.join(' ') : '있음'}`);
      }
      if (bf.furDescription && bf.furDescription.trim()) {
        beastDetails.push(`깃털: ${bf.furDescription.trim()}`);
      }
    } else {
      const earParts = [bf.earColor, bf.earDescription].filter((s) => s && s.trim());
      if (earParts.length > 0) beastDetails.push(`귀: ${earParts.join(' ')}`);
      const tailParts = [bf.tailColor, bf.tailDescription].filter((s) => s && s.trim());
      if (tailParts.length > 0) beastDetails.push(`꼬리: ${tailParts.join(' ')}`);
      if (bf.furDescription && bf.furDescription.trim()) {
        beastDetails.push(`털: ${bf.furDescription.trim()}`);
      }
    }
    if (beastDetails.length > 0) {
      lines.push(`수인 세부 특징: ${beastDetails.join(', ')}`);
    }
  }

  const bodyShapeRefs = collectBodyShapeGeminiReferences(profile);
  if (bodyShapeRefs.length > 0) {
    lines.push(`사용자 작성 신체 유형 참고: ${bodyShapeRefs.join(' / ')}`);
  }

  if (lines.length === 0) return '';

  return `
[PLAYER APPEARANCE]
${lines.join('\n')}

[외형 및 기타 특징 묘사 GM 연출 지침]
- 키와 체격 연출: 키와 체격 수치("185cm", "18세")를 본문에 숫자로 직접 연호하지 마세요. 대신 장면 연출의 참조값(상대와의 키 차이, 시선 높이, 좁은 공간/문 통과, 높은 물체에 손 뻗기, 체격 차이, 옷/장비의 착용감 등)으로 장면에 자연스럽게 반영하세요. 매 로그마다 억지로 반복해서 서술할 필요는 없습니다.
- 기타 특징 우선순위: 플레이어가 직접 입력한 '기타 특징'(흉터, 신체 특성, 행동 습관 등)은 AI가 임의로 만든 외형 서술보다 절대적으로 우선합니다. 플레이어 설정과 모순되는 외형(예: 흉터가 있는데 흉터 없는 얼굴로 서술)을 절대로 생성하지 마세요.
- 외형 일관성: 키, 체격, 머리, 눈, 종족 및 수인 특징, 기타 특징을 매 장면마다 바꾸지 말고 일관되게 유지하세요. 가슴/엉덩이 유형은 사용자가 별도 참고 문자열을 채운 경우에만 그 참고 문자열을 사용하세요.
- 소설형 자연스러운 서술: 설정값을 그대로 낭독하지 말고 소설적 상황 및 연출 속에서 의미 있게 서술하세요.
- 스탯 및 성인 시스템과의 분리: 키, 체격, 외형, 기타 특징은 문학적 연출용이며 기계적 전투 스탯(근력, 체력 등)이나 성인 수치를 변경하지 않습니다.`;
}

app.post('/api/rpg/action', async (req, res) => {
  try {
    const { action, history, playerState } = req.body;

    if (!action || typeof action !== 'string' || !action.trim()) {
      return res.status(400).json({ error: '플레이어의 행동을 입력해 주세요.' });
    }

    const ai = getGemini();
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    contents.push({
      role: 'model',
      parts: [
        {
          text: JSON.stringify({
            narrative: '눈을 뜨자, 낯선 숲이었다. 나뭇가지 사이로 희미한 빛이 내려오고, 축축한 흙냄새와 풀벌레 소리가 주변을 채운다.',
            changes: {
              hpDelta: 0,
              sanityDelta: 0,
              manaDelta: 0,
              rupeeDelta: 0,
              expGain: 0,
              desireDelta: 0,
              lewdnessDelta: 0,
              sensitivityDelta: 0,
              aphrodisiacDelta: 0,
              addictionDelta: 0,
              corruptionDelta: 0,
              clothingState: null,
              addItems: [],
              removeItems: [],
            },
          }),
        },
      ],
    });

    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) {
        if (item && item.content && (item.role === 'user' || item.role === 'model')) {
          contents.push({ role: item.role, parts: [{ text: item.content }] });
        }
      }
    }

    const profile = playerState?.profile;
    const raceDisplay =
      playerState?.race === 'BEASTKIN'
        ? `수인 (${playerState.beastkinType || '기본'})`
        : playerState?.race === 'ELF' ? '엘프'
        : playerState?.race === 'YETI' ? '설인'
        : playerState?.race === 'MERFOLK' ? '인어족'
        : playerState?.race === 'DRAGONKIN' ? '용족'
        : '인간';

    const appearanceSummary = buildPlayerAppearancePrompt(playerState);

    let speechSummary = '';
    if (profile?.speechStyle) {
      const sp = profile.speechStyle;
      speechSummary = `
[주인공 말투]
- 설명: ${sp.description || '자연스러운 말투'}
- 톤: ${sp.tone || '자연스러움'}
- 경어/반말: ${sp.politeness || '상황에 따름'}
- 특징: ${Array.isArray(sp.quirks) ? sp.quirks.join(', ') : '없음'}
- 예시: ${Array.isArray(sp.exampleLines) ? sp.exampleLines.map((line: string) => `“${line}”`).join(' / ') : '없음'}`;
    }

    const adultStatus = playerState?.adultStatus;
    const specialStatusSummary = adultStatus
      ? `
[특수 상태]
- 성욕(기반): ${adultStatus.desire}/100
- 현재 성욕(파생): ${adultStatus.effectiveDesire ?? adultStatus.desire}/100
- 음란도: ${adultStatus.lewdness}/10
- 감도: ${adultStatus.sensitivity}/100
- 미약: ${adultStatus.aphrodisiacLevel ?? 0}/100
- 중독: ${adultStatus.addiction ?? 0}/100
- 영구 타락도: ${playerState?.corruptionStatus?.corruption ?? 0}/10
- 현재 타락도(파생): ${playerState?.corruptionStatus?.effectiveCorruption ?? playerState?.corruptionStatus?.corruption ?? 0}/10`
      : `
[특수 상태]
- 타락도: ${playerState?.corruptionStatus?.corruption ?? 0}/10
- 성인 상태 수치: 비활성`;

    const encounterDirector = getEncounterDirector(playerState);
    const relationshipAphrodisiacRoll =
      rollRelationshipAphrodisiac(playerState);

    const adultNarrationDirective =
      getAdultNarrationDirective(
        playerState,
        encounterDirector,
        relationshipAphrodisiacRoll,
        action,
        history
      );
    const dragonkinNarrativeReference = buildDragonkinNarrativeReference(playerState);
    const activeEncounterNarrativeReference = buildActiveEncounterNarrativeReference(playerState);
    const companionNeedNarrativeReference = buildCompanionNeedNarrativeReference(playerState);
    const companionStatusSummary = buildCompanionStatusSummary(playerState);
    const payloadMonsterContextIds = collectMonsterAdultContextIds(playerState, action, history);

    const officialInGameName =
      profile?.inGameName || playerState?.characterName || profile?.name || '모험가';

    const currentHourStr = String(playerState.currentHour ?? 8).padStart(2, '0');
    const currentMinStr = String(playerState.currentMinute ?? 0).padStart(2, '0');
    const currentDay = playerState.dayCount || 1;
    const currentTimeOfDay = playerState.timeOfDay || 'MORNING';
    const fateRuntimeSummary = buildFateRuntimeSummary(playerState);

    const playerStatusText = playerState
      ? `
[현재 플레이어 상태]
- 공식 인게임 이름: ${officialInGameName}
- 종족: ${raceDisplay}
- 레벨: ${playerState.level} / EXP ${playerState.experience}
- HP: ${playerState.hp}/${playerState.maxHp}
- 정신력: ${playerState.sanity}/${playerState.maxSanity}
- 마나: ${playerState.mana}/${playerState.maxMana}
- 루피: ${playerState.rupees}
- 스탯: 근력 ${playerState.stats?.strength}, 체력 ${playerState.stats?.vitality}, 민첩 ${playerState.stats?.agility}, 지능 ${playerState.stats?.intelligence}, 정신 ${playerState.stats?.spirit}, 행운 ${playerState.stats?.luck}
- 패시브: ${(playerState.passives || []).join(', ') || '없음'}
- 스토리 플래그: ${(playerState.storyFlags || []).join(', ') || '없음'}
- 소지품: ${(playerState.inventory || []).map((i: any) => `${i.name}×${i.quantity}`).join(', ') || '없음'}
${fateRuntimeSummary ? `
[현재 운명]
${fateRuntimeSummary}` : ''}
${specialStatusSummary}
${speechSummary}
${appearanceSummary}

[WORLD TIME - 현재 세계 시간]
- 날짜/시간: Day ${currentDay} · ${currentHourStr}:${currentMinStr} (${currentTimeOfDay})
- 시간대 묘사 지침: 주변 환경(하늘의 색/밝기, 마을/던전의 분위기, 상점/NPC의 활동 여부 등)에 자연스럽게 반영하세요. 단, 기계적으로 '현재 시각은 XX시 XX분이다'라고 반복 서술하지 마세요.

${dragonkinNarrativeReference}
${activeEncounterNarrativeReference}
${companionStatusSummary}
${companionNeedNarrativeReference}
${adultNarrationDirective}

[INTERNAL_ENCOUNTER_DIRECTOR - 절대 narrative에 직접 노출하지 말 것]
${JSON.stringify(encounterDirector)}`
      : '';

    contents.push({
      role: 'user',
      parts: [{ text: `[플레이어 입력]\n${action.trim()}\n${playerStatusText}` }],
    });

    const generateOptions = {
      contents,
      config: {
        systemInstruction: GM_SYSTEM_INSTRUCTION,
        temperature: 0.85,
        topP: 0.95,
        responseMimeType: 'application/json',
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
          { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.OFF },
        ],
      },
    };

    let response: any = null;
    let lastError: any = null;

    // 1차 시도: gemini-3.6-flash
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        ...generateOptions,
      });
    } catch (err: any) {
      lastError = err;
      console.warn('Primary model (gemini-3.6-flash) attempt failed:', err?.message || err);

      if (isTransientError(err)) {
        await sleep(1500);
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            ...generateOptions,
          });
        } catch (retryErr: any) {
          lastError = retryErr;
          console.warn('Primary model retry failed:', retryErr?.message || retryErr);
        }
      }
    }

    // 2차 폴백: gemini-2.5-pro
    if (!response) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          ...generateOptions,
        });
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
        console.warn('Fallback model (gemini-2.5-pro) failed:', fallbackErr?.message || fallbackErr);
      }
    }

    // 3차 폴백: gemini-2.5-flash
    if (!response) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          ...generateOptions,
        });
      } catch (fallbackErr2: any) {
        lastError = fallbackErr2;
        console.error('Final fallback model (gemini-2.5-flash) failed:', fallbackErr2?.message || fallbackErr2);
      }
    }

    if (!response) {
      throw lastError || new Error('게임 마스터 응답을 생성하지 못했습니다.');
    }

    const fullText = response.text || '';
    let parsed: any = null;

    let jsonStr = fullText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }

    try {
      const direct = JSON.parse(jsonStr);
      if (typeof direct === 'string') {
        try {
          parsed = JSON.parse(direct);
        } catch {
          parsed = null;
        }
      } else if (direct && typeof direct === 'object') {
        parsed = direct;
      }
    } catch {
      // Substring slice search for outermost { ... }
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1));
        } catch {
          parsed = null;
        }
      }
    }

    // 1. 순수 스토리 추출 및 줄바꿈/이스케이프 정규화
    let story = '';
    if (parsed && typeof parsed === 'object') {
      const rawNarrative = parsed.narrative || parsed.story || parsed.content || parsed.text;
      if (typeof rawNarrative === 'string' && rawNarrative.trim()) {
        story = normalizeNarrativeText(rawNarrative);
      }
    }

    if (!story) {
      story = extractCleanStory(fullText);
    }

    // 2. 구조화 상태 데이터 파싱 (내부용)
    let changes: {
      hpDelta: number;
      sanityDelta: number;
      manaDelta: number;
      rupeeDelta: number;
      expGain: number;
      timeDeltaMinutes?: number;
      desireDelta: number;
      lewdnessDelta: number;
      sensitivityDelta: number;
      aphrodisiacDelta: number;
      addictionDelta: number;
      corruptionDelta: number;
      clothingState?: 'CLOTHED' | 'PARTIAL' | 'NAKED';
      addItems: Array<{ name: string; quantity: number }>;
      removeItems: Array<{ name: string; quantity: number }>;
      companionNeedChanges: Array<{ companionId: string; desireDelta?: number; urinationDelta?: number; relieveUrination?: boolean }>;
      battleTrigger?: any;
      bodyPayloadChanges: any[];
      bladderVoidRequested?: boolean;
      partnerCategory?: 'HUMANOID' | 'ABERRANT';
      customReflexTriggerOccurred?: boolean;
      pregnancyRequest?: any;
    } = {
      hpDelta: 0,
      sanityDelta: 0,
      manaDelta: 0,
      rupeeDelta: 0,
      expGain: 0,
      desireDelta: 0,
      lewdnessDelta: 0,
      sensitivityDelta: 0,
      aphrodisiacDelta: 0,
      addictionDelta: 0,
      corruptionDelta: 0,
      addItems: [] as Array<{ name: string; quantity: number }>,
      removeItems: [] as Array<{ name: string; quantity: number }>,
      companionNeedChanges: [],
      bodyPayloadChanges: [],
    };

    let actionResult: any = {
      intent: 'OTHER',
      startsCombat: false,
      hostileAction: false,
      forcedCombat: false,
      relationshipEventOccurred: false,
    };

    let lockAction: any = undefined;
    let worldAction: {
      type: 'TALK_CHARACTER' | 'MEET_CHARACTER' | 'ENTER_LOCATION';
      characterId?: string;
      characterName?: string;
      location?: string;
    } | undefined = undefined;

    let encounterAction: {
      type: 'RESOLVE' | 'FAIL';
      encounterId?: string;
      outcome?: string;
    } | undefined = undefined;

    let fateAction: {
      type: 'ADVANCE_CHAPTER' | 'COMPLETE_FATE';
      chapterId?: string;
      choiceId?: string;
      endingId?: string;
      outcome?: string;
    } | undefined = undefined;

    if (parsed && typeof parsed === 'object') {
      if (parsed.worldAction && typeof parsed.worldAction === 'object') {
        const rawType = String(parsed.worldAction.type || '').toUpperCase();
        if (rawType === 'TALK_CHARACTER' || rawType === 'MEET_CHARACTER' || rawType === 'ENTER_LOCATION') {
          worldAction = {
            type: rawType as 'TALK_CHARACTER' | 'MEET_CHARACTER' | 'ENTER_LOCATION',
            characterId: parsed.worldAction.characterId ? String(parsed.worldAction.characterId) : undefined,
            characterName: parsed.worldAction.characterName ? String(parsed.worldAction.characterName) : undefined,
            location: parsed.worldAction.location ? String(parsed.worldAction.location) : undefined,
          };
        }
      }

      if (parsed.encounterAction && typeof parsed.encounterAction === 'object' && playerState?.activeEncounterId) {
        const rawEncounterType = String(parsed.encounterAction.type || '').toUpperCase();
        if (rawEncounterType === 'RESOLVE' || rawEncounterType === 'FAIL') {
          encounterAction = {
            type: rawEncounterType as 'RESOLVE' | 'FAIL',
            encounterId: String(playerState.activeEncounterId),
            outcome: parsed.encounterAction.outcome ? String(parsed.encounterAction.outcome).slice(0, 120) : undefined,
          };
        }
      }

      if (parsed.fateAction && typeof parsed.fateAction === 'object' && playerState?.fate) {
        const rawFateType = String(parsed.fateAction.type || '').toUpperCase();
        if (rawFateType === 'ADVANCE_CHAPTER' || rawFateType === 'COMPLETE_FATE') {
          fateAction = {
            type: rawFateType as 'ADVANCE_CHAPTER' | 'COMPLETE_FATE',
            chapterId: parsed.fateAction.chapterId ? String(parsed.fateAction.chapterId) : undefined,
            choiceId: parsed.fateAction.choiceId ? String(parsed.fateAction.choiceId) : undefined,
            endingId: parsed.fateAction.endingId ? String(parsed.fateAction.endingId) : undefined,
            outcome: parsed.fateAction.outcome ? String(parsed.fateAction.outcome).slice(0, 160) : undefined,
          };
        }
      }

      if (parsed.actionResult && typeof parsed.actionResult === 'object') {
        const validIntents = [
          'EXPLORE', 'MOVE', 'TALK', 'SOCIAL', 'ROMANCE',
          'ADULT_SOCIAL', 'TRADE', 'USE_ITEM', 'COMBAT_ATTACK',
          'COMBAT_PROVOKE', 'ESCAPE', 'OTHER'
        ];
        const rawIntent = String(parsed.actionResult.intent || '').toUpperCase();
        actionResult = {
          intent: validIntents.includes(rawIntent) ? rawIntent : 'OTHER',
          startsCombat: parsed.actionResult.startsCombat === true,
          hostileAction: parsed.actionResult.hostileAction === true,
          forcedCombat: parsed.actionResult.forcedCombat === true,
          relationshipEventOccurred:
            parsed.actionResult.relationshipEventOccurred === true,
        };
      }

      if (parsed.sceneState && typeof parsed.sceneState === 'object') {
        const sceneState = parsed.sceneState;
        const partnerCategory = ['HUMANOID','ABERRANT'].includes(sceneState.partnerCategory) ? sceneState.partnerCategory : undefined;
        changes.partnerCategory = partnerCategory;
        changes.customReflexTriggerOccurred = sceneState.customReflexTriggerOccurred === true;
        if (sceneState.pregnancyEvent?.occurred === true) {
          const pa = sceneState.pregnancyEvent.parentA;
          const pb = sceneState.pregnancyEvent.parentB;
          const validCategory = (v: any) => ['HUMANOID','ABERRANT'].includes(v);
          const validSapience = (v: any) => ['SAPIENT','INSTINCTIVE','HIVE','UNKNOWN'].includes(v);
          if (pa && pb && validCategory(pa.category) && validCategory(pb.category) && validSapience(pa.sapience) && validSapience(pb.sapience) && pa.speciesId && pb.speciesId) {
            changes.pregnancyRequest = {
              parentA: { category: pa.category, sapience: pa.sapience, speciesId: String(pa.speciesId) },
              parentB: { category: pb.category, sapience: pb.sapience, speciesId: String(pb.speciesId) },
            };
          }
        }
        const validCompartments = ['COMPARTMENT_1','COMPARTMENT_2','COMPARTMENT_3'];
        const validKinds = ['STANDARD_FLUID','INSECTOID_SECRETION','URINE','EGG','PARASITE','OTHER'];
        const events = Array.isArray(sceneState.payloadEvents) ? sceneState.payloadEvents : [];
        changes.bodyPayloadChanges = events.flatMap((event: any) => {
          if (!event || event.occurred !== true) return [];
          const compartmentId = String(event.targetCompartment || '');
          const payloadKind = String(event.payloadKind || '');
          if (!validCompartments.includes(compartmentId) || !validKinds.includes(payloadKind)) return [];
          if ((payloadKind === 'EGG' || payloadKind === 'PARASITE') && compartmentId === 'COMPARTMENT_3') return [];

          const rawChannel = String(event.payloadChannel || '').toUpperCase();
          const payloadChannel = ['A','B','C'].includes(rawChannel)
            ? rawChannel
            : resolveBodyPayloadChannel(payloadKind as any, undefined);

          const rawSourceId = event.sourceId ? String(event.sourceId) : '';
          const rawSourceName = event.sourceName ? String(event.sourceName) : '';
          const requestedSourceType = ['CHARACTER','MONSTER','PARASITE','ENVIRONMENT','UNKNOWN'].includes(String(event.sourceType || '').toUpperCase())
            ? String(event.sourceType).toUpperCase()
            : 'UNKNOWN';

          let sourceMonster = rawSourceId ? getRegionalMonsterDefinition(rawSourceId) : undefined;
          if (!sourceMonster && rawSourceName) {
            const detected = detectMonsterIdsInText(rawSourceName);
            if (detected.length === 1) sourceMonster = getRegionalMonsterDefinition(detected[0]);
          }
          if (!sourceMonster && requestedSourceType === 'MONSTER' && payloadMonsterContextIds.length === 1) {
            sourceMonster = getRegionalMonsterDefinition(payloadMonsterContextIds[0]);
          }

          const sourceType = sourceMonster ? 'MONSTER' : requestedSourceType;
          const sourceId = sourceMonster?.id || rawSourceId || undefined;
          const sourceName = sourceMonster?.name || rawSourceName || undefined;
          const sourceSpeciesId = sourceMonster?.raceSubtype
            || (event.sourceSpeciesId ? String(event.sourceSpeciesId) : undefined);
          const sourceSpeciesName = sourceMonster
            ? getMonsterSubtypeDisplayName(sourceMonster.raceSubtype)
            : (event.sourceSpeciesName ? String(event.sourceSpeciesName) : undefined);

          let amount = Math.min(100, Math.max(0, Number(event.amount) || 0));
          if (sourceMonster) {
            amount = resolveMonsterPayloadAmount(sourceMonster.id, payloadChannel as any);
          }
          if (amount <= 0) return [];

          const payloadFamilyKey = sourceType === 'MONSTER' && sourceSpeciesId
            ? `MONSTER:${sourceSpeciesId}:${payloadChannel}`
            : sourceType === 'CHARACTER' && (sourceId || sourceName)
              ? `CHARACTER:${sourceId || sourceName}:${payloadChannel}`
              : undefined;

          return [{
            operation: 'ADD',
            compartmentId,
            payloadKind,
            payloadChannel,
            payloadFamilyKey,
            amount,
            sourceId,
            sourceName,
            sourceSpeciesId,
            sourceSpeciesName,
            sourceType,
            sourceSex: ['MALE','FEMALE','OTHER','UNKNOWN'].includes(String(event.sourceSex || '').toUpperCase())
              ? String(event.sourceSex).toUpperCase()
              : undefined,
            parasiteMode: ['INSERTED','INTERNAL'].includes(event.parasiteMode) ? event.parasiteMode : undefined,
          }];
        });
      }

      if (parsed.lockAction && typeof parsed.lockAction === 'object') {
        const validMethods = ['KEY', 'LOCKPICK', 'FORCE', 'MAGIC', 'QUEST', 'NPC_PERMISSION'];
        const method = String(parsed.lockAction.method || '').toUpperCase();
        if (parsed.lockAction.lockId && validMethods.includes(method)) {
          lockAction = {
            lockId: String(parsed.lockAction.lockId),
            method: method as 'KEY' | 'LOCKPICK' | 'FORCE' | 'MAGIC' | 'QUEST' | 'NPC_PERMISSION',
            keyItemId: parsed.lockAction.keyItemId ? String(parsed.lockAction.keyItemId) : undefined,
          };
        }
      }

      if (parsed.changes && typeof parsed.changes === 'object') {
        let battleTrigger = undefined;

        // 전투 안전장치: startsCombat이 true이고 적대적 행동/강제전투/공격/도발일 때만 battleTrigger 허용
        const canStartCombat =
          actionResult.startsCombat === true &&
          (actionResult.hostileAction === true ||
           actionResult.forcedCombat === true ||
           actionResult.intent === 'COMBAT_ATTACK' ||
           actionResult.intent === 'COMBAT_PROVOKE');

        if (canStartCombat && parsed.changes.battleTrigger && typeof parsed.changes.battleTrigger === 'object') {
          const bt = parsed.changes.battleTrigger;
          battleTrigger = {
            enemyTemplate: typeof bt.enemyTemplate === 'string' ? bt.enemyTemplate : 'wild_wolf',
            enemyName: typeof bt.enemyName === 'string' ? bt.enemyName : undefined,
            enemyLevel: Math.max(1, Math.min(99, Number(bt.enemyLevel) || 1)),
            enemyTier: ['WEAK', 'NORMAL', 'ELITE', 'BOSS'].includes(bt.enemyTier) ? bt.enemyTier : 'NORMAL',
            battlefield: bt.battlefield && typeof bt.battlefield === 'object' ? {
              name: String(bt.battlefield.name || '전장'),
              description: String(bt.battlefield.description || ''),
              environmentType: bt.battlefield.environmentType || 'FOREST',
            } : undefined,
            canEscape: bt.canEscape !== false,
          };
        } else {
          // 비전투 의도(대화, 유혹, 성인 관계, 탐험 등)일 경우 전투 트리거 완전 차단
          actionResult.startsCombat = false;
        }

        changes = {
          hpDelta: Number(parsed.changes.hpDelta) || 0,
          sanityDelta: Number(parsed.changes.sanityDelta) || 0,
          manaDelta: Number(parsed.changes.manaDelta) || 0,
          rupeeDelta: Number(parsed.changes.rupeeDelta) || 0,
          expGain: Math.max(0, Number(parsed.changes.expGain) || 0),
          timeDeltaMinutes:
            typeof parsed.changes.timeDeltaMinutes === 'number'
              ? Math.min(1440, Math.max(1, Math.floor(parsed.changes.timeDeltaMinutes)))
              : undefined,
          desireDelta: Number(parsed.changes.desireDelta) || 0,
          lewdnessDelta: Number(parsed.changes.lewdnessDelta) || 0,
          sensitivityDelta: Number(parsed.changes.sensitivityDelta) || 0,
          aphrodisiacDelta: Number(parsed.changes.aphrodisiacDelta) || 0,
          addictionDelta: Number(parsed.changes.addictionDelta) || 0,
          corruptionDelta: Number(parsed.changes.corruptionDelta) || 0,
          clothingState:
            ['CLOTHED', 'PARTIAL', 'NAKED'].includes(parsed.changes.clothingState)
              ? parsed.changes.clothingState
              : undefined,
          addItems: Array.isArray(parsed.changes.addItems) ? parsed.changes.addItems : [],
          removeItems: Array.isArray(parsed.changes.removeItems) ? parsed.changes.removeItems : [],
          companionNeedChanges: Array.isArray(parsed.changes.companionNeedChanges)
            ? parsed.changes.companionNeedChanges
                .filter((entry: any) => entry && typeof entry.companionId === 'string')
                .slice(0, 8)
                .map((entry: any) => ({
                  companionId: String(entry.companionId),
                  desireDelta: Math.max(-20, Math.min(20, Number(entry.desireDelta) || 0)),
                  urinationDelta: Math.max(-20, Math.min(20, Number(entry.urinationDelta) || 0)),
                  relieveUrination: entry.relieveUrination === true,
                }))
            : [],
          battleTrigger,
          bodyPayloadChanges: changes.bodyPayloadChanges,
          partnerCategory: changes.partnerCategory,
          customReflexTriggerOccurred: changes.customReflexTriggerOccurred,
          pregnancyRequest: changes.pregnancyRequest,
        };
      }
    }

    // 엔진 제어형 관계 미약 적용:
    // Gemini가 발생 확률이나 수치를 직접 결정하지 않습니다.
    const adultEligible =
      Number(playerState?.profile?.physicalAge ?? 0) >=
      ADULT_SYSTEM_CONFIG.adultPhysicalAge;

    const relationshipOccurred =
      actionResult.relationshipEventOccurred === true;

    if (
      adultEligible &&
      relationshipOccurred &&
      relationshipAphrodisiacRoll.triggered
    ) {
      changes.aphrodisiacDelta += relationshipAphrodisiacRoll.amount;
      changes.addictionDelta += relationshipAphrodisiacRoll.addictionGain;
    }

    if (!story) {
      story = '이야기가 계속 이어진다.';
    }

    res.json({ story, actionResult, changes, lockAction, worldAction, encounterAction, fateAction, battleTrigger: changes.battleTrigger });
  } catch (error: any) {
    console.error('RPG Action Error:', error);
    const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.';

    if (errorMessage.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        error: 'Gemini API 키가 설정되지 않았습니다. AI Studio의 Settings > Secrets 메뉴에서 GEMINI_API_KEY를 등록해 주세요.',
      });
    }

    res.status(500).json({
      error: `게임 마스터와 통신하는 중 문제가 발생했습니다: ${errorMessage}`,
    });
  }
});

// 전투 중 자유입력 분석 API
app.post('/api/battle/action', async (req, res) => {
  try {
    const { action, playerActor, enemies, battlefield, speechStyle } = req.body;

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ error: '행동 입력이 비어있습니다.' });
    }

    const ai = getGemini();

    const systemPrompt = `당신은 턴제 전투 중인 다크 판타지 RPG 『판타지악』의 전투 연출 심판관입니다.
플레이어가 전투 도중 자유롭게 입력한 행동을 분석하여 상황 연출 문장, 주인공의 대사, 가장 유사한 스킬/효과 매핑을 JSON 형태로 반환하세요.

[규칙]
1. 절대 직접적인 수치(HP 숫자 등)를 계산하지 마세요. 수치는 게임 엔진이 계산합니다.
2. 플레이어의 speechStyle에 어울리는 짧은 대사(speechLine)를 포함하세요.
3. [직접적인 신체 수치 묘사 금지]: 로그 서술(narrative) 시 키(cm 수치), 나이(숫자 세), 신체 치수, 스탯 숫자 등 구체적인 기계적/신체적 수치를 본문에 직접 나열하거나 언급하지 마세요.
4. actionType은 다음 중 하나로 분류하세요:
   - "ATTACK": 공격적인 시도 (무기 휘두르기, 기습, 환경을 이용한 타격)
   - "DEFEND": 방어/회피/엄폐 (탁자 뒤집기, 방패 세우기, 거리 벌리기)
   - "DISTRACT": 교란/상태이상 (모래 뿌리기, 소음 내기, 시야 가리기)
   - "ESCAPE": 도주 시도
   - "SPECIAL": 기타 특수 행동
5. suggestedSkillOrEffect는 "basic_attack", "throw_sand", "defend_stance", "first_aid" 중 하나를 제안하세요.

[반환 JSON 포맷]
{
  "actionNarrative": "행동의 박진감 넘치는 묘사",
  "speechLine": "주인공의 짧은 대사",
  "actionType": "ATTACK" | "DEFEND" | "DISTRACT" | "ESCAPE" | "SPECIAL",
  "suggestedSkillOrEffect": "basic_attack" | "throw_sand" | "defend_stance" | "first_aid"
}`;

    const promptText = `현재 전장: ${battlefield?.name || '전장'} (${battlefield?.description || ''})
주인공: ${playerActor?.name || '모험가'} (체력: ${playerActor?.hp}/${playerActor?.maxHp})
말투 설정: ${JSON.stringify(speechStyle || {})}
마주한 적: ${(enemies || []).map((e: any) => `${e.name}(체력: ${e.hp}/${e.maxHp})`).join(', ')}

플레이어의 자유 행동 입력: "${action}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${promptText}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
          { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.OFF },
        ],
      },
    });

    const text = response.text || '';
    let parsed: any = {};
    try {
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        actionNarrative: `${playerActor?.name || '모험가'}이(가) 기민하게 행동을 전개했다: "${action}"`,
        speechLine: '이걸로 끝낸다!',
        actionType: 'ATTACK',
        suggestedSkillOrEffect: 'basic_attack',
      };
    }

    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.actionNarrative === 'string') {
        parsed.actionNarrative = normalizeNarrativeText(parsed.actionNarrative);
      }
      if (typeof parsed.speechLine === 'string') {
        parsed.speechLine = normalizeNarrativeText(parsed.speechLine);
      }
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Battle Action Free-form Error:', error);
    res.json({
      actionNarrative: `순간적인 기지를 발휘하여 행동을 취했다.`,
      speechLine: '틈을 놓치지 않겠어!',
      actionType: 'ATTACK',
      suggestedSkillOrEffect: 'basic_attack',
    });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`판타지악 server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
