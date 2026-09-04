import type { NarrationRequest, NarrationResult } from './narratorTypes';
import { LOCAL_NARRATOR_SYSTEM_PROMPT, buildNarratorUserPrompt } from './narratorPrompt';
import { validateNarration } from './narratorValidator';

export interface LocalNarratorOptions {
  baseUrl: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  repeatPenalty: number;
  retries: number;
  timeoutMs: number;
}

export class LocalNarratorAdapter {
  constructor(private readonly options: LocalNarratorOptions) {}

  async healthCheck(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(this.options.timeoutMs, 2500));
    try {
      const response = await fetch(`${this.options.baseUrl}/models`, { signal: controller.signal });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateNarration(input: NarrationRequest): Promise<NarrationResult> {
    const userPrompt = buildNarratorUserPrompt(input);
    let lastReason = 'unknown';

    for (let attempt = 1; attempt <= this.options.retries + 1; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
      try {
        const response = await fetch(`${this.options.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.options.model,
            messages: [
              { role: 'system', content: LOCAL_NARRATOR_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: this.options.temperature,
            top_p: this.options.topP,
            max_tokens: this.options.maxTokens,
            repeat_penalty: this.options.repeatPenalty,
            stream: false,
          }),
        });

        if (!response.ok) {
          lastReason = `http_${response.status}`;
          continue;
        }

        const body = await response.json() as any;
        const text = String(body?.choices?.[0]?.message?.content ?? '').trim();
        const validation = validateNarration(text);
        if (!validation.ok) {
          lastReason = validation.reason ?? 'validation_failed';
          continue;
        }

        return { requestId: input.requestId, text, provider: 'LOCAL', attempts: attempt };
      } catch (error) {
        lastReason = error instanceof Error ? error.message : String(error);
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error(`Local narrator failed after retries: ${lastReason}`);
  }
}
