import type { InterpreterActionRequest } from './interpreterClient';
import type { PlayerState } from '../types';
import { buildEncounterMovementPromptContext } from '../data/world/encounterMovement';

const NATIVE_INTERPRETER_SYSTEM = `당신은 한국어 다크 판타지 텍스트 RPG 『판타지악』의 행동 해석기입니다.
최종 소설형 로그를 쓰지 말고 플레이어 자유 입력을 구조화된 JSON으로만 해석하세요.
수치의 최종 확정은 게임 엔진이 담당합니다. narrative는 1~3문장의 짧은 내부 장면 요약만 작성하세요.
게임 상태에 없는 아이템/인물/퀘스트/지역 ID를 임의로 확정하지 마세요.
전투는 실제 공격/피할 수 없는 습격일 때만 시작하며, 단순 대화·접근·거래·관찰은 전투가 아닙니다.
진행 중 인카운터에서 플레이어가 현재 장소를 벗어나 걷기·달리기·도주·길을 따라 이동하여 실제 인접 Hex까지 도달했다면 worldAction.type=\"MOVE_HEX\"를 반환하세요. 같은 장소 안의 몇 걸음/회피/자세 변경은 Hex 이동이 아닙니다.

반드시 하나의 JSON 객체만 반환하세요. 기본 형태:
{
  "narrative":"짧은 장면 요약",
  "changes":{
    "hpDelta":0,"sanityDelta":0,"manaDelta":0,"rupeeDelta":0,"expGain":0,"timeDeltaMinutes":15,
    "desireDelta":0,"lewdnessDelta":0,"sensitivityDelta":0,"aphrodisiacDelta":0,"addictionDelta":0,"corruptionDelta":0,
    "addItems":[],"removeItems":[],"companionNeedChanges":[],"bodyPayloadChanges":[]
  },
  "actionResult":{"intent":"OTHER","startsCombat":false,"hostileAction":false,"forcedCombat":false,"relationshipEventOccurred":false},
  "lockAction":null,
  "worldAction":null,
  "encounterAction":null,"fateAction":null,"battleTrigger":null,"sceneState":null
}
worldAction이 필요한 경우 다음 필드를 사용하세요:
- MOVE_HEX: {"type":"MOVE_HEX","hexId":"제공된 이동 가능 인접 Hex ID","movementType":"WALK|RUN|ESCAPE|TRAVEL","direction":"E|NE|NW|W|SW|SE|UP|DOWN|LINK"}
- TALK_CHARACTER / MEET_CHARACTER / ENTER_LOCATION은 기존 의미대로 사용하세요.
필요하지 않은 선택 객체는 null 또는 생략하세요.`;

function safeState(input: unknown): unknown {
  // Native transport keeps the existing game-state shape, but strips log-sized fields that
  // are redundant because the last history entries are sent separately.
  if (!input || typeof input !== 'object') return input;
  const clone: any = JSON.parse(JSON.stringify(input));
  delete clone.messages;
  delete clone.combatLog;
  return clone;
}

export function buildNativeInterpreterRequest(input: InterpreterActionRequest) {
  const movementContext = buildEncounterMovementPromptContext(input.playerState as PlayerState);
  return {
    model: 'gemini-3.6-flash',
    systemInstruction: NATIVE_INTERPRETER_SYSTEM,
    temperature: 0.45,
    topP: 0.9,
    responseMimeType: 'application/json',
    contents: [
      ...input.history.slice(-10).map((h) => ({ role: h.role, text: h.content })),
      {
        role: 'user' as const,
        text: `[플레이어 입력]\n${input.action.trim()}\n\n${movementContext ? `${movementContext}\n\n` : ''}[현재 게임 상태 JSON]\n${JSON.stringify(safeState(input.playerState))}`,
      },
    ],
  };
}

export function parseNativeInterpreterText(raw: string): any {
  let text = String(raw || '').trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return JSON.parse(text.slice(first, last + 1));
  throw new Error('Native Gemini 응답이 유효한 JSON이 아닙니다.');
}
