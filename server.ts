import express from 'express';
import path from 'path';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { normalizeNarrativeText, extractCleanStory, sanitizeGameStateForAI } from './src/utils/narrativeSanitizer';
import {
  ADULT_SYSTEM_CONFIG,
  getAddictionTierByValue,
} from './src/data/adultSystemConfig';
import { ADULT_NARRATIVE_DIRECTIVES } from './src/data/adultNarrativeDirectives';
import { EGG_NARRATIVE_REFERENCES, EGG_TYPE_NARRATIVE_REFERENCES, EGG_ROUTE_NARRATIVE_REFERENCES, EGG_TYPE_ROUTE_NARRATIVE_REFERENCES } from './src/data/eggNarrativeReferences';
import { PARASITE_NARRATIVE_REFERENCES, MATURE_PARASITE_ADULT_REFERENCES, MATURE_PARASITE_EFFECT_REFERENCES, PARASITE_ROUTE_NARRATIVE_REFERENCES, PARASITE_ORIGIN_NARRATIVE_REFERENCES } from './src/data/parasiteNarrativeReferences';
import { PREGNANCY_NARRATIVE_REFERENCES, PREGNANCY_PERSISTENT_REFERENCES, PREGNANCY_CONDITION_REFERENCES } from './src/data/pregnancyNarrativeReferences';
import { PHEROMONE_NARRATIVE_REFERENCES } from './src/data/pheromoneNarrativeReferences';
import { getEffectivePheromoneStrength } from './src/data/pheromoneSystem';
import { ADULT_EVENT_STYLE } from './src/data/adultNarrativeStyle';
import { BODY_SYSTEM_USER_RULES } from './src/data/bodySystemUserRules';
import { BODY_LOAD_NARRATIVE_DIRECTIVES } from './src/data/bodyLoadNarrativeDirectives';
import { BODY_COMPARTMENT_CAPACITY, BODY_LOAD_THRESHOLDS } from './src/data/bodySystemConfig';
import { collectResolvedMonsterAdultReferences, detectMonsterIdsInText } from './src/data/world/monsterAdultSceneReferences';
import { getEncounterDefinition } from './src/data/encounters/encounterDatabase';
import { ADULT_DUNGEON_TRAP_SLOTS } from './src/data/dungeons/dungeonTrapReferences';
import { getCompanionNeedReference } from './src/data/companions/companionNeedReferences';
import { getPetTameReferencePool, getPetUserReferencePool } from './src/data/pets/petEventReferences';
import { getPetSpeciesDefinition, isPetSpeciesId } from './src/data/pets/petDatabase';
import { collectRaceNarrativeReferences, getRaceEncounterTuning, getRaceNarrativeProfile } from './src/data/raceNarrativeReferences';
import { collectBodyPayloadGeminiReferences } from './src/data/bodyPayloadUserDefinitions';
import { collectBodyShapeGeminiReferences } from './src/data/bodyShapeUserReferences';
import { resolveMonsterPayloadAmount, getMonsterSubtypeDisplayName } from './src/data/world/monsterPayloadEmission';
import { getRegionalMonsterDefinition } from './src/data/world/monsterData';
import { getHostileSiteMonsterSlot } from './src/data/world/hostileSiteMonsterSlots';
import { buildFateRuntimeSummary } from './src/data/world/fateSystem';
import { WORLD_HEX_TILES } from './src/data/world/worldMapSystem';
import { buildEncounterMovementPromptContext } from './src/data/world/encounterMovement';
import { LocalNarratorAdapter } from './src/ai/localNarratorAdapter';
import { LOCAL_NARRATOR_SYSTEM_PROMPT, buildNarratorUserPrompt } from './src/ai/narratorPrompt';
import { validateNarration } from './src/ai/narratorValidator';
import type { NarrationRequest, NarrationResult, NarratorProvider } from './src/ai/narratorTypes';
import { FANTASYAC_APP_VERSION } from './src/runtime/version';
import { FANTASYAC_DEFAULT_UPDATE_MANIFEST_URL } from './src/runtime/releaseChannel';
import { DEFAULT_HUMANOID_COMPANION_PHYSICAL_AGE, isAdultPhysicalAge } from './src/config/agePolicy';

dotenv.config();

const app = express();
const PORT = 3000;

function normalizeNarratorProvider(value: unknown): NarratorProvider {
  const v = String(value || 'AUTO').trim().toUpperCase();
  return v === 'LOCAL' || v === 'GEMINI' ? v : 'AUTO';
}

const NARRATOR_PROVIDER = normalizeNarratorProvider(process.env.NARRATOR_PROVIDER);
const LOCAL_NARRATOR_BASE_URL = String(process.env.LOCAL_NARRATOR_BASE_URL || 'http://127.0.0.1:8080/v1').replace(/\/$/, '');
const LOCAL_NARRATOR_MODEL = String(process.env.LOCAL_NARRATOR_MODEL || 'local-narrator');
const NARRATOR_GEMINI_FALLBACK = String(process.env.NARRATOR_GEMINI_FALLBACK ?? 'true').toLowerCase() !== 'false';

const localNarrator = new LocalNarratorAdapter({
  baseUrl: LOCAL_NARRATOR_BASE_URL,
  model: LOCAL_NARRATOR_MODEL,
  temperature: Number(process.env.LOCAL_NARRATOR_TEMPERATURE || 0.72),
  topP: Number(process.env.LOCAL_NARRATOR_TOP_P || 0.92),
  maxTokens: Number(process.env.LOCAL_NARRATOR_MAX_TOKENS || 2400),
  repeatPenalty: Number(process.env.LOCAL_NARRATOR_REPEAT_PENALTY || 1.08),
  retries: Math.max(0, Number(process.env.LOCAL_NARRATOR_RETRIES || 2)),
  timeoutMs: Math.max(5000, Number(process.env.LOCAL_NARRATOR_TIMEOUT_MS || 120000)),
});

const BODY_PAYLOAD_GEMINI_REFERENCE_BLOCK = (() => {
  const refs = collectBodyPayloadGeminiReferences();
  if (!refs.length) return '';
  return `
[사용자 정의 내용물 종류 - 내부 참고]
${refs.map((entry) => `- ${entry.kind}${entry.displayName ? ` (${entry.displayName})` : ''}: ${entry.reference}`).join('\n')}
- 별도 A/B/C 채널은 없습니다. 실제 payloadKind 5종 자체가 UI/연출/배출량의 공통 분류입니다.
- 위 정의에 맞는 경우 sceneState.payloadEvents[].payloadKind에 해당 실제 종류를 직접 반환하세요.
`;
})();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

[하이브리드 AI 역할 분리 - 최우선]
- 당신(Gemini)은 자유 입력의 의미 해석과 구조화 판정만 담당합니다. 최종 소설형 로그는 별도 Narrator가 작성합니다.
- narrative 필드는 화면에 직접 출력할 장문이 아니라, 현재 행동/반응/장면 결과를 1~3문장으로 압축한 내부 장면 요약입니다.
- narrative에 문학적 장문을 쓰지 말고 가능하면 80~220자 내외로 유지하세요.
- 수치와 게임 상태의 최종 확정은 게임 엔진이 담당하므로 구조화 필드를 정확히 반환하는 것을 최우선으로 하세요.

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
4. [체형 탭 최우선]: PLAYER APPEARANCE에 저장된 height/build/breastSize/hipSize 등 사용자가 체형 탭에서 확정한 값은 종족의 전형적 체격 묘사보다 항상 우선합니다. 종족 정보로 사용자의 체형을 덮어쓰지 마세요.
5. [사용자 입력 특징 최우선]: 플레이어가 직접 입력한 '기타 특징'(흉터, 신체 특성, 신체 장식, 행동 습관 등)은 AI가 임의로 생성한 묘사보다 절대적으로 우선하며, 이에 모순되는 외형(예: 흉터가 있는데 흉터 없는 얼굴로 묘사)을 절대로 생성하지 마세요.
6. [외형 일관성 유지]: 설정된 외형은 매 장면마다 새로 만들어내지 말고 일관되게 유지하세요.
7. 플레이어가 직접 입력한 대사는 바꾸지 마세요.
8. 플레이어가 행동만 입력한 경우 저장된 speechStyle에 맞춰 짧은 주인공 대사를 자연스럽게 넣을 수 있습니다.
9. 플레이어가 명시하지 않은 중대한 선택, 살해, 계약, 세력 가입, 동료 배신 등을 대신 결정하지 마세요.

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
- type은 다음 네 가지 중 하나여야 합니다:
  1. "TALK_CHARACTER": 이름 있는 인물과 대화를 나누었을 때 (characterId 또는 characterName 지정)
  2. "MEET_CHARACTER": 이름 있는 인물과 처음 조우/대면했을 때 (characterId 또는 characterName 지정)
  3. "ENTER_LOCATION": 같은 Hex 안의 특정 장소/건물/던전 등에 진입했을 때 (location 명시)
  4. "MOVE_HEX": 진행 중인 인카운터 안에서 플레이어가 걷기·달리기·도주·길을 따라 이동하여 현재 장소를 벗어나 실제 인접 Hex까지 도달했을 때 사용. 제공된 이동 가능 인접 Hex ID를 hexId에 정확히 반환하세요.
- 방 안을 몇 걸음 움직이거나 같은 거리/건물 내 이동, 전투 회피/자세 변경에는 MOVE_HEX를 사용하지 마세요.
- 목적지 여행 인카운터 중에도 실제로 다른 인접 Hex로 이탈하면 MOVE_HEX를 사용할 수 있으며, 엔진이 기존 목적지 경로를 현재 위치에서 중단합니다.
- 단순한 목적지 선택→자동 여행 자체는 엔진이 담당하므로 Gemini가 MOVE_HEX로 흉내 내지 마세요.
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
- payloadKind는 STANDARD_FLUID / INSECTOID_SECRETION / URINE / EGG / PARASITE 중 하나만 사용하세요.
- 별도 payloadChannel은 없습니다. 실제 5종을 직접 구분하세요.
- 다섯 종류 중 어느 것인지 판정할 수 없는 경우 payloadEvents를 만들지 마세요.
- EGG/PARASITE는 COMPARTMENT_1 또는 COMPARTMENT_2에서만 허용됩니다.
- EGG는 곤충형(INSECTOID_EGG) 또는 촉수형(TENTACLE_EGG) 두 종류만 존재합니다. 곤충형/촉수형 출처가 아닌 경우 EGG 이벤트를 만들지 마세요.
- 곤충형은 INSECTOID_SECRETION과 INSECTOID_EGG, 촉수형은 STANDARD_FLUID와 TENTACLE_EGG 계통을 사용합니다.
- eggType은 INSECTOID_EGG / TENTACLE_EGG 중 하나이며 EGG가 아닐 때는 null입니다.
- parasiteMode는 INSERTED / INTERNAL 중 하나입니다. EGG에 지정하면 부화 후 성장형을 뜻합니다.
- 임신 여부는 AI가 결정하지 않습니다. COMPARTMENT_1에 실제 저장된 임신 가능 정액량으로 엔진이 자동 판정합니다. COMPARTMENT_2에서는 임신이 절대 발생하지 않습니다.
- canCausePregnancy는 정액 계열이 실제 임신 가능성을 가지는지 나타냅니다. 별도 설정이 없다면 STANDARD_FLUID / INSECTOID_SECRETION은 true, 그 외는 false로 처리됩니다.
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
  "narrative": "최종 로그 작성용 내부 장면 요약. 1~3문장, 약 80~220자",
  "actionResult": {
    "intent": "EXPLORE 또는 MOVE 또는 TALK 또는 SOCIAL 또는 ROMANCE 또는 ADULT_SOCIAL 또는 TRADE 또는 USE_ITEM 또는 COMBAT_ATTACK 또는 COMBAT_PROVOKE 또는 ESCAPE 또는 OTHER",
    "startsCombat": false,
    "hostileAction": false,
    "forcedCombat": false,
    "relationshipEventOccurred": false
  },
  "worldAction": {
    "type": "TALK_CHARACTER 또는 MEET_CHARACTER 또는 ENTER_LOCATION 또는 MOVE_HEX",
    "characterId": "선택적 인물ID (예: elena_swordmaster, sylvia_shadow_dancer 등)",
    "characterName": "인물 이름 (예: 엘레나, 실비아 등)",
    "location": "이동/진입한 지역명 (예: 발터 성채 주점, 달빛 오아시스 등)",
    "hexId": "MOVE_HEX일 때 제공된 인접 Hex ID",
    "movementType": "WALK 또는 RUN 또는 ESCAPE 또는 TRAVEL",
    "direction": "E 또는 NE 또는 NW 또는 W 또는 SW 또는 SE 또는 UP 또는 DOWN 또는 LINK"
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
    "pregnancyEvent": { "occurred": false },
    "payloadEvents": [
      {
        "occurred": false,
        "targetCompartment": null,
        "payloadKind": null,
        "amount": 0,
        "sourceId": null,
        "sourceName": null,
        "sourceSpeciesId": null,
        "sourceType": "UNKNOWN",
        "sourceSex": null,
        "eggType": null,
        "canCausePregnancy": null,
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


function numericVersionParts(value: string): number[] {
  const core = String(value || '').match(/\d+(?:\.\d+)*/)?.[0] || '0';
  return core.split('.').map((v) => Number(v) || 0);
}

function isNewerVersion(candidate: string, current: string): boolean {
  const a = numericVersionParts(candidate);
  const b = numericVersionParts(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

app.get('/api/runtime/info', (_req, res) => {
  res.json({ version: FANTASYAC_APP_VERSION, narratorProvider: NARRATOR_PROVIDER });
});

app.get('/api/update/status', async (_req, res) => {
  const manifestUrl = String(process.env.FANTASYAC_UPDATE_MANIFEST_URL || FANTASYAC_DEFAULT_UPDATE_MANIFEST_URL || '').trim();
  if (!manifestUrl) {
    return res.json({ enabled: false, currentVersion: FANTASYAC_APP_VERSION, updateAvailable: false });
  }
  try {
    const response = await fetch(manifestUrl, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
    const manifest = await response.json() as any;
    const latestVersion = String(manifest?.version || '');
    return res.json({
      enabled: true,
      currentVersion: FANTASYAC_APP_VERSION,
      latestVersion,
      updateAvailable: Boolean(latestVersion && isNewerVersion(latestVersion, FANTASYAC_APP_VERSION)),
      manifest,
    });
  } catch (error: any) {
    return res.status(502).json({ enabled: true, currentVersion: FANTASYAC_APP_VERSION, error: error?.message || '업데이트 정보를 확인하지 못했습니다.' });
  }
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

async function generateContentWithFallback(ai: GoogleGenAI, generateOptions: any) {
  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        ...generateOptions,
      });
      if (response) return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model (${model}) attempt failed:`, err?.message || err);

      if (isTransientError(err)) {
        await sleep(1500);
        try {
          const retryResponse = await ai.models.generateContent({
            model,
            ...generateOptions,
          });
          if (retryResponse) return retryResponse;
        } catch (retryErr: any) {
          lastError = retryErr;
          console.warn(`Model (${model}) retry failed:`, retryErr?.message || retryErr);
        }
      }
    }
  }

  throw lastError || new Error('게임 마스터 응답을 생성하지 못했습니다.');
}


function parseGeneratedJsonForValidation(rawText: string): any | null {
  let text = String(rawText || '').trim();
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf('{'); const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) { try { return JSON.parse(text.slice(first, last + 1)); } catch {} }
  return null;
}

function isRefusalLikeText(text: string): boolean {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return true;
  const markers = [
    "i'm sorry", 'i am sorry', "i can't help", 'i cannot help', "i can't assist", 'i cannot assist',
    'unable to comply', 'cannot fulfill', 'safety policy', 'policy violation',
    '도와드릴 수 없습니다', '도움을 드릴 수 없습니다', '제공할 수 없습니다', '요청을 수행할 수 없습니다',
    '안전 정책', '정책상', '해당 요청에는 응답할 수'
  ];
  return markers.some((m) => t.includes(m));
}

async function generateValidatedGameContent(
  ai: GoogleGenAI,
  generateOptions: any,
  mode: 'RPG' | 'BATTLE',
  maxContentRetries = 2,
) {
  let lastResponse: any = null;
  for (let attempt = 0; attempt <= maxContentRetries; attempt++) {
    const response = await generateContentWithFallback(ai, generateOptions);
    lastResponse = response;
    const text = String(response?.text || '');
    const parsed = parseGeneratedJsonForValidation(text);
    const narrative = mode === 'RPG'
      ? (parsed?.narrative || parsed?.story || parsed?.content || parsed?.text)
      : parsed?.actionNarrative;
    const blocked = isRefusalLikeText(text) || isRefusalLikeText(String(narrative || ''));
    if (!blocked && typeof narrative === 'string' && narrative.trim().length >= 8) return response;
    console.warn(`[${mode}] Gemini returned refusal/invalid log; retrying identical action (${attempt + 1}/${maxContentRetries + 1})`);
    if (attempt < maxContentRetries) await sleep(350);
  }
  throw new Error(`${mode === 'RPG' ? '스토리' : '전투'} 로그가 거부되거나 유효하지 않아 동일 행동 자동 재시도에 실패했습니다.`);
}


async function generateGeminiNarration(input: NarrationRequest): Promise<NarrationResult> {
  const ai = getGemini();
  const userPrompt = buildNarratorUserPrompt(input);
  let lastReason = 'unknown';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await generateContentWithFallback(ai, {
      contents: [{ role: 'user', parts: [{ text: `${LOCAL_NARRATOR_SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
      config: {
        temperature: 0.72,
        topP: 0.92,
      },
    });
    const text = normalizeNarrativeText(String(response?.text || '')).trim();
    const validation = validateNarration(text);
    if (validation.ok) {
      return { requestId: input.requestId, text, provider: 'GEMINI', attempts: attempt };
    }
    lastReason = validation.reason || 'validation_failed';
    if (attempt < 3) await sleep(250);
  }
  throw new Error(`Gemini narrator validation failed: ${lastReason}`);
}

async function generateNarration(input: NarrationRequest): Promise<NarrationResult> {
  const localAllowed = NARRATOR_PROVIDER === 'LOCAL' || NARRATOR_PROVIDER === 'AUTO';
  const geminiAllowed = NARRATOR_PROVIDER === 'GEMINI' || (NARRATOR_PROVIDER === 'AUTO' && NARRATOR_GEMINI_FALLBACK);
  let localError: any = null;

  if (localAllowed) {
    try {
      return await localNarrator.generateNarration(input);
    } catch (error) {
      localError = error;
      if (NARRATOR_PROVIDER === 'LOCAL' && !NARRATOR_GEMINI_FALLBACK) throw error;
      console.warn('Local narrator failed:', error instanceof Error ? error.message : error);
    }
  }

  if (geminiAllowed || (NARRATOR_PROVIDER === 'LOCAL' && NARRATOR_GEMINI_FALLBACK)) {
    const result = await generateGeminiNarration(input);
    return { ...result, fallbackUsed: Boolean(localError) };
  }

  throw localError || new Error('사용 가능한 Narrator가 없습니다.');
}

app.get('/api/narrator/status', async (_req, res) => {
  const localAvailable = await localNarrator.healthCheck();
  res.json({
    configuredProvider: NARRATOR_PROVIDER,
    localAvailable,
    localBaseUrl: LOCAL_NARRATOR_BASE_URL,
    localModel: LOCAL_NARRATOR_MODEL,
    fallbackEnabled: NARRATOR_GEMINI_FALLBACK,
  });
});

app.post('/api/narrator/generate', async (req, res) => {
  try {
    const raw = req.body || {};
    const request: NarrationRequest = {
      requestId: String(raw.requestId || `narration-${Date.now()}`),
      locale: 'ko-KR',
      sceneType: String(raw.sceneType || 'RPG_ACTION'),
      playerAction: raw.playerAction ? String(raw.playerAction) : undefined,
      interpreterSummary: raw.interpreterSummary ? String(raw.interpreterSummary) : undefined,
      currentLocation: raw.currentLocation ? String(raw.currentLocation) : undefined,
      currentTime: raw.currentTime ? String(raw.currentTime) : undefined,
      participants: Array.isArray(raw.participants) ? raw.participants.slice(0, 12) : [],
      lockedFacts: Array.isArray(raw.lockedFacts) ? raw.lockedFacts.map((v: any) => String(v)).filter(Boolean).slice(0, 80) : [],
      referenceTexts: Array.isArray(raw.referenceTexts) ? raw.referenceTexts.map((v: any) => String(v)).filter(Boolean).slice(0, 40) : [],
      recentLog: Array.isArray(raw.recentLog) ? raw.recentLog.map((v: any) => String(v)).filter(Boolean).slice(-8) : [],
      desiredLength: ['SHORT', 'MEDIUM', 'LONG'].includes(raw.desiredLength) ? raw.desiredLength : 'LONG',
    };
    const result = await generateNarration(request);
    res.json(result);
  } catch (error: any) {
    res.status(503).json({ error: error?.message || '최종 로그 생성에 실패했습니다.' });
  }
});

function getEncounterDirector(playerState: any) {
  const physicalAge = Number(playerState?.profile?.physicalAge ?? 0);
  const adultEligible = isAdultPhysicalAge(physicalAge);
  const race = String(playerState?.race || playerState?.profile?.race || 'HUMAN');
  const beastkinType = String(playerState?.beastkinType || playerState?.profile?.beastkinType || '');
  const dialogueCount = Math.max(0, Number(playerState?.dialogueCount ?? 0));
  const tuning = getRaceEncounterTuning(race, beastkinType);

  // 종족별 숨은 주기는 중앙 종족 서사 설정에서만 관리한다.
  // UI/스토리에는 주기의 이름, 길이, 내부 수치를 직접 노출하지 않는다.
  const cycle = tuning.hiddenCycle;
  const cyclePhase = cycle ? dialogueCount % cycle.length : 0;
  const hiddenRaceCycleActive = Boolean(
    adultEligible && cycle && cyclePhase >= cycle.length - cycle.activeLength
  );

  const insectPheromone = getEffectivePheromoneStrength(playerState, 'INSECTOID');
  const tentaclePheromone = getEffectivePheromoneStrength(playerState, 'TENTACLE');
  const pheromonePressure = Math.min(1, insectPheromone + tentaclePheromone);
  const baseAdultEncounterChance = !adultEligible
    ? 0
    : hiddenRaceCycleActive && cycle
      ? cycle.activeAdultChance
      : tuning.adultBaseChance;
  const adultEncounterChance = Math.min(.95, baseAdultEncounterChance + pheromonePressure * .18);

  return {
    adultEligible,
    adultEncounterWindow:
      adultEligible && Math.random() < adultEncounterChance ? 'OPEN' : 'CLOSED',
    internalRaceCycleSignal: hiddenRaceCycleActive ? 'HIGH' : 'NORMAL',
    socialRiskWindow: Math.random() < tuning.socialRiskChance ? 'OPEN' : 'CLOSED',
    raceAdultEncounterBias: tuning.adultBias,
    pheromoneSignals: { insectoid: insectPheromone, tentacle: tentaclePheromone },
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

function joinNarrativeReferences(...values: unknown[]): string {
  return values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .join('\n');
}

function getEggCueContext(cue?: any) {
  const eggType = cue?.eggType === 'TENTACLE_EGG' ? 'TENTACLE_EGG'
    : cue?.eggType === 'INSECTOID_EGG' ? 'INSECTOID_EGG'
    : undefined;
  const route = cue?.originRoute === 'ANAL' ? 'ANAL'
    : cue?.originRoute === 'VAGINAL' ? 'VAGINAL'
    : undefined;
  return { eggType, route };
}

function getDirectiveForCueType(cueType: string, cue?: any): string {
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
    case 'EGG_DEPOSITED': {
      const { eggType, route } = getEggCueContext(cue);
      return joinNarrativeReferences(
        EGG_NARRATIVE_REFERENCES.deposited,
        eggType && route ? EGG_TYPE_ROUTE_NARRATIVE_REFERENCES[eggType][route].deposited : ''
      );
    }
    case 'EGG_ACTIVATED': {
      const { eggType } = getEggCueContext(cue);
      return joinNarrativeReferences(
        EGG_NARRATIVE_REFERENCES.activated,
        EGG_NARRATIVE_REFERENCES.reactionStarted,
        eggType ? EGG_TYPE_NARRATIVE_REFERENCES[eggType].reactionWithFluid : ''
      );
    }
    case 'EGG_REACTION_STOPPED':
      return EGG_NARRATIVE_REFERENCES.reactionStopped;
    case 'EGG_DEVELOPING':
      return EGG_NARRATIVE_REFERENCES.developingMid;
    case 'EGG_HATCH_READY': {
      const { eggType, route } = getEggCueContext(cue);
      return joinNarrativeReferences(
        EGG_NARRATIVE_REFERENCES.hatchReady,
        eggType && route ? EGG_TYPE_ROUTE_NARRATIVE_REFERENCES[eggType][route].hatchReady : ''
      );
    }
    case 'EGG_HATCHED': {
      const { eggType, route } = getEggCueContext(cue);
      return joinNarrativeReferences(
        EGG_NARRATIVE_REFERENCES.hatched,
        eggType ? EGG_TYPE_NARRATIVE_REFERENCES[eggType].hatch : '',
        eggType && route ? EGG_TYPE_ROUTE_NARRATIVE_REFERENCES[eggType][route].hatched : ''
      );
    }
    case 'PARASITE_INSERTED_MATURED':
      return PARASITE_NARRATIVE_REFERENCES.insertedMatured;
    case 'PARASITE_INTERNAL_MATURED':
      return PARASITE_NARRATIVE_REFERENCES.internalMatured;
    case 'PREGNANCY_STARTED':
      return PREGNANCY_NARRATIVE_REFERENCES.conception;
    case 'PREGNANCY_STAGE_CHANGED':
      if (cue?.previousStage === 'EARLY' && cue?.currentStage === 'MID') return PREGNANCY_NARRATIVE_REFERENCES.stageChangedEarlyToMid || ADULT_NARRATIVE_DIRECTIVES.pregnancyStageChanged;
      if (cue?.previousStage === 'MID' && cue?.currentStage === 'LATE') return PREGNANCY_NARRATIVE_REFERENCES.stageChangedMidToLate || ADULT_NARRATIVE_DIRECTIVES.pregnancyStageChanged;
      if (cue?.previousStage === 'LATE' && cue?.currentStage === 'READY') return PREGNANCY_NARRATIVE_REFERENCES.stageChangedLateToReady || ADULT_NARRATIVE_DIRECTIVES.pregnancyStageChanged;
      return ADULT_NARRATIVE_DIRECTIVES.pregnancyStageChanged;
    case 'PREGNANCY_READY':
      return PREGNANCY_NARRATIVE_REFERENCES.birthReady;
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

  // 던전의 사용자 작성 성인 함정 슬롯. agePolicy의 성인 기준을 충족할 때만 이 함수에 도달한다.
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
    const reference = getDirectiveForCueType(String(cue?.type ?? ''), cue);
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

  // 페로몬/잔향 상시 참고자료. 실제 효과와 지속시간은 엔진이 계산한다.
  const insectPheromone = getEffectivePheromoneStrength(playerState, 'INSECTOID');
  const tentaclePheromone = getEffectivePheromoneStrength(playerState, 'TENTACLE');
  const insectResidual = Number(playerState?.pheromoneState?.INSECTOID?.activeStrength || 0) <= 0 && Number(playerState?.pheromoneState?.INSECTOID?.effectiveStrength || 0) > 0;
  const tentacleResidual = Number(playerState?.pheromoneState?.TENTACLE?.activeStrength || 0) <= 0 && Number(playerState?.pheromoneState?.TENTACLE?.effectiveStrength || 0) > 0;
  if (insectPheromone > 0) addNarrativeReference(references, insectResidual ? '곤충 계통 페로몬의 잔향이 남아 있을 때' : '곤충 계통 페로몬이 활성 상태일 때', insectResidual ? PHEROMONE_NARRATIVE_REFERENCES.PHEROMONE_INSECTOID_RESIDUAL_LOW : PHEROMONE_NARRATIVE_REFERENCES.PHEROMONE_INSECTOID_ACTIVE);
  if (tentaclePheromone > 0) addNarrativeReference(references, tentacleResidual ? '촉수 계통 페로몬의 잔향이 남아 있을 때' : '촉수 계통 페로몬이 활성 상태일 때', tentacleResidual ? PHEROMONE_NARRATIVE_REFERENCES.PHEROMONE_TENTACLE_RESIDUAL_LOW : PHEROMONE_NARRATIVE_REFERENCES.PHEROMONE_TENTACLE_ACTIVE);
  if (insectPheromone > 0 && tentaclePheromone > 0) addNarrativeReference(references, '곤충/촉수 계통 페로몬이 동시에 감지될 때', insectResidual && tentacleResidual ? PHEROMONE_NARRATIVE_REFERENCES.PHEROMONE_DUAL_RESIDUAL : PHEROMONE_NARRATIVE_REFERENCES.PHEROMONE_DUAL_ACTIVE);

  // 임신 상시 참고자료: 산란/알/기생체와 별도 상태로 수집한다.
  const pregnancy = playerState?.pregnancy;
  if (pregnancy?.active) {
    addNarrativeReference(references, '현재 임신 상태가 지속 중일 때', PREGNANCY_PERSISTENT_REFERENCES.anyPregnancy);
    const stageKey = String(pregnancy.stage || '').toUpperCase();
    if (stageKey === 'EARLY') { addNarrativeReference(references, '현재 임신 초기 단계가 지속 중일 때', PREGNANCY_PERSISTENT_REFERENCES.earlyPersistent); addNarrativeReference(references, '현재 임신 단계 자체가 EARLY일 때', PREGNANCY_NARRATIVE_REFERENCES.EARLY); }
    if (stageKey === 'MID') { addNarrativeReference(references, '현재 임신 중기 단계가 지속 중일 때', PREGNANCY_PERSISTENT_REFERENCES.midPersistent); addNarrativeReference(references, '현재 임신 단계 자체가 MID일 때', PREGNANCY_NARRATIVE_REFERENCES.MID); }
    if (stageKey === 'LATE') { addNarrativeReference(references, '현재 임신 후기 단계가 지속 중일 때', PREGNANCY_PERSISTENT_REFERENCES.latePersistent); addNarrativeReference(references, '현재 임신 단계 자체가 LATE일 때', PREGNANCY_NARRATIVE_REFERENCES.LATE); }
    if (stageKey === 'READY') { addNarrativeReference(references, '현재 임신 완료/출산 준비 단계가 지속 중일 때', PREGNANCY_PERSISTENT_REFERENCES.readyPersistent); addNarrativeReference(references, '현재 임신 단계 자체가 READY일 때', PREGNANCY_NARRATIVE_REFERENCES.READY); }
    const vaginalFluid = (playerState?.bodyPayloads || []).filter((entry: any) => entry?.compartmentId === 'COMPARTMENT_1' && (entry?.payloadKind === 'STANDARD_FLUID' || entry?.payloadKind === 'INSECTOID_SECRETION')).reduce((sum: number, entry: any) => sum + Math.max(0, Number(entry?.amount) || 0), 0);
    if (vaginalFluid / Math.max(1, BODY_COMPARTMENT_CAPACITY.COMPARTMENT_1) >= 0.6) addNarrativeReference(references, '임신 중이며 질/자궁 계통의 정액 부하도 높은 경우', PREGNANCY_CONDITION_REFERENCES.withHighFluidLoad);
    if ((playerState?.eggCohorts || []).length > 0) addNarrativeReference(references, '임신과 알 상태가 동시에 존재할 때', PREGNANCY_CONDITION_REFERENCES.withEggsPresent);
  }

  // 알 상시 참고자료. 실제 활성/부화 판정은 엔진이 하고 빈칸이 아닌 문구만 전달한다.
  for (const cohort of Array.isArray(playerState?.eggCohorts) ? playerState.eggCohorts : []) {
    const eggType = cohort?.eggType === 'TENTACLE_EGG' ? 'TENTACLE_EGG' : 'INSECTOID_EGG';
    const route = cohort?.compartmentId === 'COMPARTMENT_2' ? 'ANAL' : 'VAGINAL';
    addNarrativeReference(references, `현재 ${eggType} 알 묶음이 존재할 때`, EGG_TYPE_NARRATIVE_REFERENCES[eggType].general);

    const incubationMinutes = Math.max(1, Number(cohort?.incubationMinutes) || 1);
    const developmentRatio = Math.max(0, Number(cohort?.elapsedActiveMinutes) || 0) / incubationMinutes;
    if (developmentRatio < 0.34) {
      addNarrativeReference(references, `현재 ${eggType} 알의 활성 성장도가 초기 구간일 때`, EGG_NARRATIVE_REFERENCES.developingEarly);
    } else if (developmentRatio < 0.67) {
      addNarrativeReference(references, `현재 ${eggType} 알의 활성 성장도가 중간 구간일 때`, EGG_NARRATIVE_REFERENCES.developingMid);
    } else if (developmentRatio < 1) {
      addNarrativeReference(references, `현재 ${eggType} 알의 활성 성장도가 후기 구간일 때`, EGG_NARRATIVE_REFERENCES.developingLate);
    }

    if (cohort?.stage === 'ACTIVE' || cohort?.stage === 'DEVELOPING') {
      addNarrativeReference(references, `현재 ${eggType} 알이 대응 정액과 반응 중일 때`, EGG_TYPE_NARRATIVE_REFERENCES[eggType].reactionWithFluid);
      addNarrativeReference(references, `현재 ${route} 기원의 알이 성장 중일 때`, EGG_ROUTE_NARRATIVE_REFERENCES[route].developing);
      addNarrativeReference(references, `현재 ${eggType}/${route} 알이 성장 중일 때`, EGG_TYPE_ROUTE_NARRATIVE_REFERENCES[eggType][route].developing);
    }
    if (cohort?.stage === 'HATCH_READY') {
      addNarrativeReference(references, `현재 ${route} 기원의 알이 부화 직전일 때`, EGG_ROUTE_NARRATIVE_REFERENCES[route].hatchReady);
      addNarrativeReference(references, `현재 ${eggType}/${route} 알이 부화 직전일 때`, EGG_TYPE_ROUTE_NARRATIVE_REFERENCES[eggType][route].hatchReady);
    }
  }

  // 완전히 성장한 기생체는 원래 구획 payload와 별개인 독립 상태로 상시 참고한다.
  const matureParasites = (Array.isArray(playerState?.parasiteStates) ? playerState.parasiteStates : []).filter((parasite: any) => parasite?.stage === 'MATURE');
  if (matureParasites.length > 0) {
    addNarrativeReference(references, '완전히 성장한 기생체가 하나 이상 존재할 때', MATURE_PARASITE_ADULT_REFERENCES.anyMatureParasite);
    if (matureParasites.some((p: any) => p.mode === 'INSERTED')) addNarrativeReference(references, '성숙한 삽입형 기생체가 존재할 때', MATURE_PARASITE_ADULT_REFERENCES.insertedMaturePresent);
    if (matureParasites.some((p: any) => p.mode === 'INTERNAL')) addNarrativeReference(references, '성숙한 내부형 기생체가 존재할 때', MATURE_PARASITE_ADULT_REFERENCES.internalMaturePresent);
    if (matureParasites.some((p: any) => p.originRoute === 'VAGINAL')) addNarrativeReference(references, '질 기원의 성숙 기생체가 존재할 때', MATURE_PARASITE_ADULT_REFERENCES.vaginalOriginPresent);
    if (matureParasites.some((p: any) => p.originRoute === 'ANAL')) addNarrativeReference(references, '항문 기원의 성숙 기생체가 존재할 때', MATURE_PARASITE_ADULT_REFERENCES.analOriginPresent);
    if (matureParasites.some((p: any) => p.originKind === 'INSECTOID')) addNarrativeReference(references, '곤충 알에서 유래한 성숙 기생체가 존재할 때', MATURE_PARASITE_ADULT_REFERENCES.insectoidOriginPresent);
    if (matureParasites.some((p: any) => p.originKind === 'TENTACLE')) addNarrativeReference(references, '촉수 알에서 유래한 성숙 기생체가 존재할 때', MATURE_PARASITE_ADULT_REFERENCES.tentacleOriginPresent);
    if (matureParasites.reduce((sum: number, p: any) => sum + Math.max(1, Number(p?.count) || 1), 0) > 1) addNarrativeReference(references, '성숙 기생체가 복수 존재할 때', MATURE_PARASITE_ADULT_REFERENCES.multipleMatureParasites);
    addNarrativeReference(references, '성숙 기생체가 성욕 상태에 영향을 주는 설정을 사용할 때', MATURE_PARASITE_EFFECT_REFERENCES.desireEffect);
    addNarrativeReference(references, '성숙 기생체가 감도 상태에 영향을 주는 설정을 사용할 때', MATURE_PARASITE_EFFECT_REFERENCES.sensitivityEffect);
    addNarrativeReference(references, '성숙 기생체가 현재 타락 상태에 영향을 주는 설정을 사용할 때', MATURE_PARASITE_EFFECT_REFERENCES.corruptionEffect);
    addNarrativeReference(references, '성숙 기생체의 분비 활동을 묘사해야 할 때', MATURE_PARASITE_EFFECT_REFERENCES.secretionEffect);
    addNarrativeReference(references, '성숙 내부형 기생체의 이동이 장면상 의미가 있을 때', MATURE_PARASITE_EFFECT_REFERENCES.movementEffect);
    addNarrativeReference(references, '성숙 기생체의 번식 관련 설정이 장면상 의미가 있을 때', MATURE_PARASITE_EFFECT_REFERENCES.reproductionEffect);
    for (const parasite of matureParasites) {
      const route = parasite?.originRoute === 'ANAL' ? 'ANAL' : 'VAGINAL';
      const origin = parasite?.originKind === 'TENTACLE' ? 'TENTACLE' : parasite?.originKind === 'INSECTOID' ? 'INSECTOID' : undefined;
      addNarrativeReference(references, `성숙 기생체의 기원 경로가 ${route}일 때`, PARASITE_ROUTE_NARRATIVE_REFERENCES[route].mature);
      if (origin) addNarrativeReference(references, `성숙 기생체의 기원 계통이 ${origin}일 때`, PARASITE_ORIGIN_NARRATIVE_REFERENCES[origin].mature);
    }
  }
  if (pregnancy?.active && matureParasites.length > 0) addNarrativeReference(references, '임신과 성숙 기생체가 동시에 존재할 때', PREGNANCY_CONDITION_REFERENCES.withMatureParasitePresent);
  if (pregnancy?.active && matureParasites.some((p: any) => p.mode === 'INSERTED')) addNarrativeReference(references, '임신과 삽입형 성숙 기생체가 동시에 존재할 때', PREGNANCY_CONDITION_REFERENCES.withInsertedParasitePresent);
  if (pregnancy?.active && matureParasites.some((p: any) => p.mode === 'INTERNAL')) addNarrativeReference(references, '임신과 내부형 성숙 기생체가 동시에 존재할 때', PREGNANCY_CONDITION_REFERENCES.withInternalParasitePresent);

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


function buildRaceNarrativeReference(playerState:any): string {
  const race = String(playerState?.race || playerState?.profile?.race || 'HUMAN');
  const beastkinType = String(playerState?.beastkinType || playerState?.profile?.beastkinType || '');
  const profile = getRaceNarrativeProfile(race, beastkinType);
  const refs = collectRaceNarrativeReferences(race, beastkinType);
  if (!refs.length) return '';
  const promptRules = (profile.promptRules || []).map((rule) => `- ${rule}`).join('\n');
  return `
[종족별 서사 참고자료 - 내부 참고]
- 적용 종족: ${profile.displayName}
${refs.map((r,i)=>`${i+1}. ${r}`).join('\n')}
- 위 참고자료는 현재 캐릭터의 종족성이 평소 서사 전체에 자연스럽게 스며들도록 사용하세요.
- 종족성이 캐릭터의 확정 성격, 말투, 현재 행동을 덮어쓰게 하지 마세요.
- 참고문장을 원문 그대로 복사하지 말고 현재 장소·인물·상황에 맞게 변형하세요.
- 실제 능력 판정과 수치 효과는 게임 상태를 우선하며, reference만으로 새로운 능력이나 페널티를 만들지 마세요.
${promptRules ? `${promptRules}\n` : ''}- 내부 키와 파일명은 narrative에 노출하지 마세요.
`;
}

function buildActiveEncounterNarrativeReference(playerState: any): string {
  const encounterId = String(playerState?.activeEncounterId || '').trim();
  if (!encounterId) return '';
  const encounter = getEncounterDefinition(encounterId);
  if (!encounter) return '';

  if (encounterId === 'world_travel_encounter') {
    const session = playerState?.worldMap?.travelSession;
    const index = Number(session?.currentEncounterIndex ?? -1);
    const unit = Array.isArray(session?.encounters) && index >= 0 ? session.encounters[index] : null;
    if (!unit) return '';
    const destination = String(session?.destinationHexId || '목적지');
    const total = Number(session?.encounters?.length || 0);
    const current = index + 1;
    return `
[TRAVEL ENCOUNTER REFERENCE - 내부 참고자료]
현재 여행 인카운터: ${String(unit.title || '여행 중 사건')}
진행도: ${current}/${total}
목적지 Hex: ${destination}
현재 사건 요약: ${String(unit.summary || '')}
현재 사건 연출 참고: ${String(unit.sceneReference || '')}
- 지금은 목적지까지 이동 중이며 이 사건 하나만 처리하세요.
- 플레이어의 대응이 끝나기 전 다음 여행 인카운터나 목적지 도착을 서술하지 마세요.
- 이 사건이 충분히 해결되거나 실패가 확정된 경우에만 encounterAction으로 현재 인카운터를 RESOLVE 또는 FAIL 처리하세요.
- 이동 시간과 실제 Hex 전진은 게임 엔진이 인카운터 해결 후 처리하므로 직접 stateChanges로 위치를 바꾸지 마세요.
- 이 블록의 내부 ID, 진행용 필드명, 시스템 구조를 narrative에 노출하지 마세요.
`;
  }

  const reference = String(encounter?.sceneReference || '').trim();
  if (!reference) return '';
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
  const playerAdult = isAdultPhysicalAge(playerState?.profile?.physicalAge);
  const companions = Array.isArray(playerState?.companions) ? playerState.companions : [];
  const blocks: string[] = [];

  for (const cue of queue) {
    if (!cue) continue;
    const companion = companions.find((c: any) => c?.id === cue.companionId);
    if (!companion) continue;

    if (cue.entityKind === 'PET' || companion.kind === 'PET') {
      const speciesId = companion?.petState?.speciesId;
      if (!isPetSpeciesId(speciesId)) continue;
      if (cue.kind === 'DESIRE' && !playerAdult) continue;
      const need = cue.kind === 'BATHROOM' ? 'BATHROOM' : 'DESIRE';
      const phase = cue.phase || 'REQUEST';
      const pool = getPetUserReferencePool(speciesId, need, phase);
      const reference = pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
      const def = getPetSpeciesDefinition(speciesId);
      const lines = [
        `펫: ${companion.name} (${def.displayName} · ${def.category === 'ANIMAL' ? '동물형' : '곤충형'})`,
        `상호작용 단계: ${phase}`,
        `욕구 종류: ${need === 'DESIRE' ? '성욕' : '배설 욕구'}`,
      ];
      if (reference) lines.push(`사용자 작성 종별 연출 참고자료: ${reference}`);
      lines.push('펫의 욕구 상태와 반응은 비성적·비노골적인 행동/분위기 수준으로만 묘사하고, 성적 행위·신체 부위·체액 묘사는 생성하지 마세요.');
      blocks.push(lines.join('\n'));
      continue;
    }

    if (!['DESIRE', 'URINATION'].includes(String(cue.kind))) continue;
    if (cue.kind === 'DESIRE' && !playerAdult) continue;
    if (!isAdultPhysicalAge(companion?.physicalAge ?? DEFAULT_HUMANOID_COMPANION_PHYSICAL_AGE)) continue;
    const reference = getCompanionNeedReference(cue.kind, Number(cue.threshold));
    if (!reference) continue;
    const lines = [`동료: ${companion.name}`, `장면 성격: ${reference.title}`, `기본 참고자료: ${reference.baseReference}`];
    if (typeof reference.customReference === 'string' && reference.customReference.trim()) lines.push(`사용자 작성 추가 참고자료: ${reference.customReference.trim()}`);
    blocks.push(lines.join('\n'));
  }
  if (!blocks.length) return '';
  return `\n[동반자 상태 장면 참고자료 - 내부용]\n${blocks.join('\n\n')}\n- 내부 키와 임계값 숫자는 narrative에 직접 노출하지 마세요.\n`;
}

function buildCompanionStatusSummary(playerState: any): string {
  const companions = Array.isArray(playerState?.companions) ? playerState.companions : [];
  if (!companions.length) return '';
  const lines = companions.map((c: any) => {
    if (c?.kind === 'PET' && c?.petState && isPetSpeciesId(c.petState.speciesId)) {
      const def = getPetSpeciesDefinition(c.petState.speciesId);
      const ps = c.petState;
      return `- ${c.name}: ${def.displayName} · ${def.category === 'ANIMAL' ? '동물형' : '곤충형'} · 친밀도 ${Math.round(Number(ps.relationship?.familiarity)||0)}/100 · 충성도 ${Math.round(Number(ps.relationship?.loyalty)||0)}/100 · 야생성 ${Math.round(Number(ps.wildness)||0)}/100 · 성욕 ${Math.round(Number(ps.needs?.desire)||0)}/100 · 배설 욕구 ${Math.round(Number(ps.needs?.bathroomUrge)||0)}/100`;
    }
    const desire = Math.max(0, Math.min(100, Number(c?.needs?.desire) || 0));
    const urine = Math.max(0, Math.min(100, Number(c?.needs?.urinationUrge) || 0));
    return `- ${c.name}: 성별 ${c.gender || '미지정'} · 성욕 ${Math.round(desire)}/100 · 배설 욕구(소변) ${Math.round(urine)}/100`;
  });
  return `\n[현재 동반자 상태]\n${lines.join('\n')}\n`;
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

app.post('/api/rpg/pet-interaction', async (req, res) => {
  try {
    const { pet, interaction, resultSummary, playerState: rawPlayerState } = req.body || {};
    if (!pet?.name || !isPetSpeciesId(pet?.petState?.speciesId)) return res.status(400).json({ error: '유효한 펫 정보가 필요합니다.' });
    const speciesId = pet.petState.speciesId;
    const def = getPetSpeciesDefinition(speciesId);
    const need = interaction?.need === 'BATHROOM' ? 'BATHROOM' : 'DESIRE';
    const playerAdult = isAdultPhysicalAge(rawPlayerState?.profile?.physicalAge);
    if (need === 'DESIRE' && interaction?.type !== 'TAME' && !playerAdult) return res.status(400).json({ error: '성인 자격이 없는 플레이어에게는 해당 펫 욕구 장면을 생성하지 않습니다.' });
    const phase = interaction?.phase || 'REQUEST';
    const isTame = interaction?.type === 'TAME';
    const pool = isTame ? getPetTameReferencePool(speciesId) : getPetUserReferencePool(speciesId, need, phase);
    const reference = pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
    const ps = pet.petState;
    const actionLabel = isTame
      ? '길들이기'
      : phase === 'ACCEPTED'
        ? '욕구 해소 요청 수락'
        : phase === 'REFUSED'
          ? '욕구 해소 요청 거절'
          : phase === 'REFUSAL_LIMIT'
            ? '반복 거절 한계에 도달한 후속 요청'
            : '욕구 해소 요청';

    const narration = await generateNarration({
      requestId: `pet-${pet.id || speciesId}-${Date.now()}`,
      locale: 'ko-KR',
      sceneType: isTame ? 'PET_TAME' : `PET_NEED_${phase}`,
      playerAction: actionLabel,
      participants: [
        {
          id: String(pet.id || speciesId),
          name: String(pet.name),
          role: `${def.displayName} · ${def.category === 'ANIMAL' ? '동물형' : '곤충형'} 펫`,
          stateSummary: `친밀도 ${ps.relationship?.familiarity ?? 0}, 충성도 ${ps.relationship?.loyalty ?? 0}, 야생성 ${ps.wildness ?? 0}`,
        },
      ],
      lockedFacts: [String(resultSummary || `${pet.name}에게 ${actionLabel}을 시도했다.`)],
      referenceTexts: reference ? [reference] : [],
      desiredLength: 'MEDIUM',
    });
    return res.json({ narrative: narration.text, narratorProvider: narration.provider, fallbackUsed: narration.fallbackUsed === true });
  } catch (error:any) {
    return res.status(500).json({ error: error?.message || '펫 상호작용 로그 생성에 실패했습니다.' });
  }
});

app.post('/api/rpg/action', async (req, res) => {
  try {
    const { action, history, playerState: rawPlayerState } = req.body;

    if (!action || typeof action !== 'string' || !action.trim()) {
      return res.status(400).json({ error: '플레이어의 행동을 입력해 주세요.' });
    }

    const playerState = sanitizeGameStateForAI(rawPlayerState);

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
    const raceNarrativeReference = buildRaceNarrativeReference(playerState);
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
    const currentWorldTile = WORLD_HEX_TILES[playerState?.worldMap?.currentHexId || ''];
    const encounterMovementContext = playerState ? buildEncounterMovementPromptContext(playerState) : '';
    const worldPositionSummary = currentWorldTile
      ? `현재 Hex: ${currentWorldTile.id} · ${currentWorldTile.locationName || currentWorldTile.featureName || currentWorldTile.sectorName || currentWorldTile.terrain} · ${currentWorldTile.layer}${encounterMovementContext ? `\n${encounterMovementContext}` : ''}`
      : '';

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
${worldPositionSummary ? `- ${worldPositionSummary}` : ''}
${fateRuntimeSummary ? `
[현재 운명]
${fateRuntimeSummary}` : ''}
${specialStatusSummary}
${speechSummary}
${appearanceSummary}

[WORLD TIME - 현재 세계 시간]
- 날짜/시간: Day ${currentDay} · ${currentHourStr}:${currentMinStr} (${currentTimeOfDay})
- 시간대 묘사 지침: 주변 환경(하늘의 색/밝기, 마을/던전의 분위기, 상점/NPC의 활동 여부 등)에 자연스럽게 반영하세요. 단, 기계적으로 '현재 시각은 XX시 XX분이다'라고 반복 서술하지 마세요.

${raceNarrativeReference}
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

    const response = await generateValidatedGameContent(ai, generateOptions, 'RPG');

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
      type: 'TALK_CHARACTER' | 'MEET_CHARACTER' | 'ENTER_LOCATION' | 'MOVE_HEX';
      characterId?: string;
      characterName?: string;
      location?: string;
      hexId?: string;
      movementType?: 'WALK' | 'RUN' | 'ESCAPE' | 'TRAVEL';
      direction?: 'E' | 'NE' | 'NW' | 'W' | 'SW' | 'SE' | 'UP' | 'DOWN' | 'LINK';
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
        if (rawType === 'TALK_CHARACTER' || rawType === 'MEET_CHARACTER' || rawType === 'ENTER_LOCATION' || rawType === 'MOVE_HEX') {
          worldAction = {
            type: rawType as 'TALK_CHARACTER' | 'MEET_CHARACTER' | 'ENTER_LOCATION' | 'MOVE_HEX',
            characterId: parsed.worldAction.characterId ? String(parsed.worldAction.characterId) : undefined,
            characterName: parsed.worldAction.characterName ? String(parsed.worldAction.characterName) : undefined,
            location: parsed.worldAction.location ? String(parsed.worldAction.location) : undefined,
            hexId: parsed.worldAction.hexId ? String(parsed.worldAction.hexId) : undefined,
            movementType: ['WALK','RUN','ESCAPE','TRAVEL'].includes(String(parsed.worldAction.movementType || '').toUpperCase()) ? String(parsed.worldAction.movementType).toUpperCase() as any : undefined,
            direction: ['E','NE','NW','W','SW','SE','UP','DOWN','LINK'].includes(String(parsed.worldAction.direction || '').toUpperCase()) ? String(parsed.worldAction.direction).toUpperCase() as any : undefined,
          };
        }
      }

      // MOVE_HEX는 파서에서 버리지 않는다. 실제 인접/진입 가능 여부는 클라이언트 게임 엔진이
      // 최종 검증하고, 실패 사실을 Narrator의 잠금 사실로 전달해 서술-좌표 불일치를 막는다.

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
        // 임신은 sceneState 제안으로 시작하지 않는다. 실제 저장된 정액량을 게임 엔진이 판정한다.
        const validCompartments = ['COMPARTMENT_1','COMPARTMENT_2','COMPARTMENT_3'];
        const validKinds = ['STANDARD_FLUID','INSECTOID_SECRETION','URINE','EGG','PARASITE'];
        const events = Array.isArray(sceneState.payloadEvents) ? sceneState.payloadEvents : [];
        changes.bodyPayloadChanges = events.flatMap((event: any) => {
          if (!event || event.occurred !== true) return [];
          const compartmentId = String(event.targetCompartment || '');
          const payloadKind = String(event.payloadKind || '');
          if (!validCompartments.includes(compartmentId) || !validKinds.includes(payloadKind)) return [];
          if ((payloadKind === 'EGG' || payloadKind === 'PARASITE') && compartmentId === 'COMPARTMENT_3') return [];

          const rawSourceId = event.sourceId ? String(event.sourceId) : '';
          const rawSourceName = event.sourceName ? String(event.sourceName) : '';
          const requestedSourceType = ['CHARACTER','MONSTER','PARASITE','ENVIRONMENT','UNKNOWN'].includes(String(event.sourceType || '').toUpperCase())
            ? String(event.sourceType).toUpperCase()
            : 'UNKNOWN';

          let sourceMonster: any = rawSourceId ? (getRegionalMonsterDefinition(rawSourceId) || getHostileSiteMonsterSlot(rawSourceId)) : undefined;
          if (!sourceMonster && rawSourceName) {
            const detected = detectMonsterIdsInText(rawSourceName);
            if (detected.length === 1) sourceMonster = getRegionalMonsterDefinition(detected[0]);
          }
          if (!sourceMonster && requestedSourceType === 'MONSTER' && payloadMonsterContextIds.length === 1) {
            sourceMonster = getRegionalMonsterDefinition(payloadMonsterContextIds[0]) || getHostileSiteMonsterSlot(payloadMonsterContextIds[0]);
          }

          const sourceType = sourceMonster ? 'MONSTER' : requestedSourceType;
          const sourceId = sourceMonster?.id || rawSourceId || undefined;
          const sourceName = sourceMonster?.name || rawSourceName || undefined;
          const sourceSpeciesId = sourceMonster?.raceSubtype
            || (sourceMonster?.hostileSiteKind === 'INSECT_COLONY' ? 'INSECTOID' : sourceMonster?.hostileSiteKind === 'TENTACLE_RAID_SITE' ? 'TENTACLE' : undefined)
            || (event.sourceSpeciesId ? String(event.sourceSpeciesId) : undefined);
          const sourceSpeciesName = sourceMonster
            ? getMonsterSubtypeDisplayName(sourceMonster.raceSubtype || (sourceMonster.hostileSiteKind === 'INSECT_COLONY' ? 'INSECTOID' : 'TENTACLE'))
            : (event.sourceSpeciesName ? String(event.sourceSpeciesName) : undefined);

          const sourceSubtype = String(sourceSpeciesId || '').toUpperCase();
          // 생식 계통 분리: 곤충형은 곤충 분비물, 촉수형은 일반 체액 계통을 사용한다.
          if (sourceSubtype === 'INSECTOID' && payloadKind === 'STANDARD_FLUID') return [];
          if (sourceSubtype === 'TENTACLE' && payloadKind === 'INSECTOID_SECRETION') return [];

          let amount = Math.min(Math.max(1, Number(BODY_COMPARTMENT_CAPACITY[compartmentId as keyof typeof BODY_COMPARTMENT_CAPACITY] ?? 100)), Math.max(0, Number(event.amount) || 0));
          if (sourceMonster) {
            amount = resolveMonsterPayloadAmount(sourceMonster.id, payloadKind as any);
          }
          if (amount <= 0) return [];

          let eggType: 'INSECTOID_EGG' | 'TENTACLE_EGG' | undefined;
          if (payloadKind === 'EGG') {
            const requestedEggType = String(event.eggType || '').toUpperCase();
            if (sourceSubtype === 'INSECTOID') {
              if (requestedEggType && requestedEggType !== 'INSECTOID_EGG') return [];
              eggType = 'INSECTOID_EGG';
            } else if (sourceSubtype === 'TENTACLE') {
              if (requestedEggType && requestedEggType !== 'TENTACLE_EGG') return [];
              eggType = 'TENTACLE_EGG';
            } else {
              return [];
            }
          }

          const payloadFamilyKey = sourceType === 'MONSTER' && sourceSpeciesId
            ? `MONSTER:${sourceSpeciesId}:${payloadKind}`
            : sourceType === 'CHARACTER' && (sourceId || sourceName)
              ? `CHARACTER:${sourceId || sourceName}:${payloadKind}`
              : undefined;

          return [{
            operation: 'ADD',
            compartmentId,
            payloadKind,
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
            eggType,
            canCausePregnancy: typeof event.canCausePregnancy === 'boolean'
              ? event.canCausePregnancy
              : (payloadKind === 'STANDARD_FLUID' || payloadKind === 'INSECTOID_SECRETION'),
            pheromoneLineage: sourceSubtype === 'INSECTOID' && payloadKind === 'INSECTOID_SECRETION'
              ? 'INSECTOID'
              : sourceSubtype === 'TENTACLE' && payloadKind === 'STANDARD_FLUID'
                ? 'TENTACLE'
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
    const sanitizedBody = sanitizeGameStateForAI(req.body);
    const { action, playerActor, enemies, battlefield, speechStyle } = sanitizedBody;

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

    const battleGenerateOptions = {
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
    };
    const response = await generateValidatedGameContent(ai, battleGenerateOptions, 'BATTLE');

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

// Fallback for API 404 routes
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: '요청하신 API 엔드포인트를 찾을 수 없습니다.' });
});

// Express global error handler (forces JSON responses for server errors)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err?.status || 500).json({
    error: err?.message || '서버 내부 처리 중 오류가 발생했습니다.',
  });
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
