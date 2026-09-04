import { getFantasyacNativeBridge } from '../platform/nativeBridge';
import { buildNativeInterpreterRequest, parseNativeInterpreterText } from './nativeInterpreterPrompt';

function normalizeInterpreterPayload(data: any): any {
  const out = data && typeof data === 'object' ? { ...data } : {};
  if (!out.story && typeof out.narrative === 'string') out.story = out.narrative;
  out.changes = {
    hpDelta: 0, sanityDelta: 0, manaDelta: 0, rupeeDelta: 0, expGain: 0,
    desireDelta: 0, lewdnessDelta: 0, sensitivityDelta: 0, aphrodisiacDelta: 0,
    addictionDelta: 0, corruptionDelta: 0, addItems: [], removeItems: [],
    companionNeedChanges: [], bodyPayloadChanges: [],
    ...(out.changes || {}),
  };
  out.actionResult = {
    intent: 'OTHER', startsCombat: false, hostileAction: false, forcedCombat: false, relationshipEventOccurred: false,
    ...(out.actionResult || {}),
  };
  return out;
}

export interface InterpreterActionRequest {
  action: string;
  history: Array<{ role: 'user' | 'model'; content: string }>;
  playerState: unknown;
}

async function requestNativeInterpreter(input: InterpreterActionRequest): Promise<any> {
  const bridge = getFantasyacNativeBridge();
  if (!bridge?.generateGeminiInterpretation || !bridge.getGeminiKeyStatus) throw new Error('NATIVE_INTERPRETER_UNAVAILABLE');
  const status = await bridge.getGeminiKeyStatus();
  if (!status.configured) throw new Error('NATIVE_GEMINI_KEY_NOT_CONFIGURED');
  const payload = buildNativeInterpreterRequest(input);
  const raw = await bridge.generateGeminiInterpretation(JSON.stringify(payload));
  const normalized = normalizeInterpreterPayload(parseNativeInterpreterText(raw));
  // MOVE_HEX의 최종 허용 여부는 게임 엔진이 실제 인접 Hex/진입 조건으로 다시 검증한다.
  // 여기서 잘못된 이동을 조용히 버리면 Narrator가 "이동 성공"을 묘사하고 실제 좌표는 남는 불일치가 생길 수 있다.
  return normalized;
}

async function requestServerInterpreter(input: InterpreterActionRequest): Promise<any> {
  const response = await fetch('/api/rpg/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const rawText = await response.text();
  let data: any = {};
  try { data = JSON.parse(rawText); }
  catch {
    if (!response.ok) throw new Error(`서버 응답 오류 (${response.status}): AI 서비스 응답을 파싱할 수 없습니다.`);
    throw new Error('게임 마스터 응답 형식이 유효한 JSON이 아닙니다.');
  }
  if (!response.ok) throw new Error(data.error || '게임 마스터와 연결하지 못했습니다.');
  return normalizeInterpreterPayload(data);
}

export async function requestInterpreterAction(input: InterpreterActionRequest): Promise<any> {
  const bridge = getFantasyacNativeBridge();
  if (bridge?.generateGeminiInterpretation) {
    try { return await requestNativeInterpreter(input); }
    catch (error: any) {
      // A native app must never silently ship its API key to the web layer. If the key is
      // missing, surface a precise setup error instead of attempting an inaccessible /api route.
      if (String(error?.message || '').includes('NATIVE_GEMINI_KEY_NOT_CONFIGURED')) {
        throw new Error('Gemini API 키가 설정되지 않았습니다. 제목 화면의 AI 설정에서 키를 저장해 주세요.');
      }
      throw error;
    }
  }
  return requestServerInterpreter(input);
}
