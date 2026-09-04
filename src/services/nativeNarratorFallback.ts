import type { NarrationRequest, NarrationResult } from '../ai/narratorTypes';
import { LOCAL_NARRATOR_SYSTEM_PROMPT, buildNarratorUserPrompt } from '../ai/narratorPrompt';
import { validateNarration } from '../ai/narratorValidator';
import { getFantasyacNativeBridge } from '../platform/nativeBridge';

export async function requestNativeGeminiNarration(input: NarrationRequest): Promise<NarrationResult> {
  const bridge = getFantasyacNativeBridge();
  if (!bridge?.generateGeminiInterpretation || !bridge.getGeminiKeyStatus) throw new Error('Native Gemini unavailable');
  const status = await bridge.getGeminiKeyStatus();
  if (!status.configured) throw new Error('Native Gemini key not configured');
  let lastReason = 'unknown';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const payload = {
      model: 'gemini-3.6-flash',
      systemInstruction: `${LOCAL_NARRATOR_SYSTEM_PROMPT}\n최종 출력은 게임 본문 로그만 작성하세요. JSON으로 감싸지 마세요.`,
      temperature: attempt === 1 ? 0.72 : 0.62,
      topP: 0.92,
      responseMimeType: 'text/plain',
      contents: [{ role: 'user', text: buildNarratorUserPrompt(input) }],
    };
    const text = String(await bridge.generateGeminiInterpretation(JSON.stringify(payload)) || '').trim();
    const valid = validateNarration(text);
    if (valid.ok) {
      return { requestId: input.requestId, text, provider: 'GEMINI', attempts: attempt, fallbackUsed: true };
    }
    lastReason = valid.reason || 'invalid';
  }
  throw new Error(`Native Gemini Narrator validation failed: ${lastReason}`);
}
