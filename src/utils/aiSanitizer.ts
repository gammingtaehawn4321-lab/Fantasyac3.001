/**
 * AI API(Gemini) 전송 전 게임 상태(gameState/playerState)에서
 * UI 전용 이미지 데이터(portraitUrl, base64 data URL 등)만 안전하게 제거하는 정제 유틸리티.
 *
 * - 실제 저장된 gameState/playerState는 메모리 및 저장소(IndexedDB 등)에 원본 그대로 유지됨.
 * - AI 프롬프트 및 API 요청 payload 용 복제본에서만 이미지 데이터가 제거됨.
 */

function isBase64ImageData(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  if (val.startsWith('data:image/') || val.startsWith('data:blob/')) return true;
  if (val.length > 500 && val.startsWith('data:')) return true;
  return false;
}

export function sanitizeGameStateForAI<T>(state: T): T {
  if (state === null || state === undefined) {
    return state;
  }

  if (typeof state !== 'object') {
    return state;
  }

  let cloned: T;
  try {
    cloned = JSON.parse(JSON.stringify(state));
  } catch {
    return state;
  }

  function recursiveClean(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (isBase64ImageData(obj[i])) {
          obj[i] = undefined;
        } else if (typeof obj[i] === 'object' && obj[i] !== null) {
          recursiveClean(obj[i]);
        }
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (
        key === 'portraitUrl' ||
        key === 'avatarUrl' ||
        key === 'iconUrl' ||
        key === 'imageUrl' ||
        key === 'portrait' ||
        key === 'imageData'
      ) {
        delete obj[key];
      } else if (isBase64ImageData(val)) {
        delete obj[key];
      } else if (typeof val === 'object' && val !== null) {
        recursiveClean(val);
      }
    }
  }

  recursiveClean(cloned);
  return cloned;
}
