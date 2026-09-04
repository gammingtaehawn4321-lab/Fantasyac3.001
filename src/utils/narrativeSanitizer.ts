import { sanitizeGameStateForAI } from './aiSanitizer';
export { sanitizeGameStateForAI };

/**
 * 『판타지악』 내러티브 / 스토리 텍스트 정제 및 정규화 유틸리티
 */

/**
 * 줄바꿈 정규화 및 이중 이스케이프 문자열 정제
 * - 실제 개행 문자(\n) 보존
 * - 문자 그대로 들어온 "\n", "\r\n", "\\n", "\\r\\n" 등을 실제 줄바꿈('\n')으로 변환
 * - 이중/다중 escape 완화
 * - 연속 3개 이상의 빈 줄은 2줄(\n\n)로 압축
 */
export function normalizeNarrativeText(text: any): string {
  if (text === null || text === undefined) return '';

  if (typeof text !== 'string') {
    if (typeof text === 'object') {
      const candidate = text.narrative || text.story || text.content || text.text;
      if (typeof candidate === 'string') {
        return normalizeNarrativeText(candidate);
      }
      return '이야기가 계속 이어진다.';
    }
    text = String(text);
  }

  let result = text;

  // 전체 문자열이 JSON 따옴표로 감싸진 경우 unwrap 시도
  if ((result.startsWith('"') && result.endsWith('"')) || (result.startsWith("'") && result.endsWith("'"))) {
    try {
      const unwrapped = JSON.parse(result);
      if (typeof unwrapped === 'string') {
        result = unwrapped;
      }
    } catch {
      // 파싱 안되면 유지
    }
  }

  // 문자 리터럴 이스케이프 해제: "\\n", "\\r\\n", "\n" 등이 텍스트로 박혀있는 경우 실제 개행으로 변환
  // 최대 3중 이스케이프까지 반복 치환
  for (let i = 0; i < 3; i++) {
    if (result.includes('\\n') || result.includes('\\r')) {
      result = result
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\n');
    } else {
      break;
    }
  }

  // 표준 줄바꿈으로 통일
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // escaped quotation 정리 (\" -> ")
  result = result.replace(/\\"/g, '"');

  // 앞뒤 공백 정리
  result = result.trim();

  // 3개 이상의 연속 줄바꿈은 2개(\n\n)로 정규화
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}

/**
 * Gemini 또는 서버 응답에서 순수 스토리/내러티브만 안전하게 추출
 * - 구조화된 JSON, 코드블록, 문자열화된 JSON 등을 모두 처리
 * - JSON 파싱 실패 시에도 내부 데이터(actionResult, changes 등)가 사용자에게 노출되지 않도록 차단
 */
export function extractCleanStory(raw: any): string {
  if (!raw) return '이야기가 계속 이어진다.';

  // 1. 객체 형태로 직접 넘어온 경우
  if (typeof raw === 'object') {
    const candidate = raw.narrative || raw.story || raw.content || raw.text;
    if (typeof candidate === 'string' && candidate.trim()) {
      return normalizeNarrativeText(candidate);
    }
    return '이야기가 계속 이어진다.';
  }

  if (typeof raw !== 'string') {
    return '이야기가 계속 이어진다.';
  }

  let text = raw.trim();

  // 2. Markdown 코드블록 제거
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  // 3. JSON.parse 시도 (단일/이중 문자열화 처리)
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const candidate = parsed.narrative || parsed.story || parsed.content || parsed.text;
      if (typeof candidate === 'string' && candidate.trim()) {
        return normalizeNarrativeText(candidate);
      }
      return '이야기가 계속 이어진다.';
    }
    if (typeof parsed === 'string') {
      return extractCleanStory(parsed);
    }
  } catch {
    // 일반 JSON 파싱 실패 시 아래 로직으로 계속 진행
  }

  // 4. JSON 파싱 실패 시, "narrative" 또는 "story" 필드만 정규식으로 안전하게 추출
  // 예: {"narrative": "스토리 본문...", "changes": ...} 에서 narrative 값만 추출
  const regex = /"(?:narrative|story|content)"\s*:\s*"((?:[^"\\]|\\.)*)"/s;
  const match = text.match(regex);
  if (match && match[1]) {
    try {
      const extracted = JSON.parse(`"${match[1]}"`);
      return normalizeNarrativeText(extracted);
    } catch {
      return normalizeNarrativeText(match[1]);
    }
  }

  // 5. 안전 필터링: 내부 JSON 구조나 키가 포함되어 있는지 검사
  // 절대 actionResult, changes, lockAction, worldAction 등의 내부 데이터가 화면에 출력되면 안 됨
  const isStructuredLeak =
    text.startsWith('{') ||
    text.includes('"actionResult"') ||
    text.includes('"worldAction"') ||
    text.includes('"encounterAction"') ||
    text.includes('"lockAction"') ||
    text.includes('"changes"') ||
    text.includes('"battleTrigger"') ||
    text.includes('"intent"') ||
    text.includes('"startsCombat"') ||
    text.includes('"hostileAction"') ||
    text.includes('"forcedCombat"');

  if (isStructuredLeak) {
    // 구조화 데이터 누출 방지
    return '이야기가 계속 이어진다.';
  }

  // 순수 텍스트 서술문인 경우
  return normalizeNarrativeText(text);
}
