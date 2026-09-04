import type { NarrationRequest, NarrationResult, NarratorStatus } from '../ai/narratorTypes';
import { generateNarrationViaNative, getFantasyacNativeBridge } from '../platform/nativeBridge';
import { requestNativeGeminiNarration } from './nativeNarratorFallback';

export async function getNarratorStatus(): Promise<NarratorStatus> {
  const native = getFantasyacNativeBridge();
  if (native?.getLocalAIStatus) {
    try {
      const status = await native.getLocalAIStatus();
      return {
        configuredProvider: 'AUTO',
        localAvailable: Boolean(status.available && status.modelId),
        localBaseUrl: 'native://local-ai',
        localModel: status.modelId || 'native-local-model',
        fallbackEnabled: true,
      };
    } catch {}
  }
  const response = await fetch('/api/narrator/status');
  if (!response.ok) throw new Error('Narrator 상태를 확인하지 못했습니다.');
  return response.json();
}

export async function requestNarration(input: NarrationRequest): Promise<NarrationResult> {
  const native = getFantasyacNativeBridge();
  if (native?.generateLocalNarration) {
    try {
      const result = await generateNarrationViaNative(input);
      if (result?.text?.trim()) return result;
    } catch (error) {
      console.warn('Native narrator failed, trying native Gemini fallback:', error);
      try { return await requestNativeGeminiNarration(input); }
      catch (fallbackError) {
        console.warn('Native Gemini narrator fallback failed:', fallbackError);
        throw new Error('로컬 Narrator와 모바일 Gemini fallback 모두 사용할 수 없습니다. 로컬 모델 또는 Gemini API 키를 확인해 주세요.');
      }
    }
  }

  const response = await fetch('/api/narrator/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.text) throw new Error(body?.error || '최종 로그 생성에 실패했습니다.');
  return body as NarrationResult;
}
