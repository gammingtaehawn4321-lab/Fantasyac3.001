export type MobileAIPresetId = 'BATTERY' | 'BALANCED' | 'QUALITY';

export interface MobileModelCatalogEntry {
  id: string;
  displayName: string;
  fileName: string;
  downloadUrl: string;
  approximateSizeBytes: number;
  preset: MobileAIPresetId;
  contextSize: number;
  maxTokens: number;
  temperature: number;
  topP: number;
  recommendedFor: string;
}

export const MOBILE_AI_PRESETS: Record<MobileAIPresetId, { label: string; description: string }> = {
  BATTERY: { label: '절전', description: '발열과 메모리 사용을 최소화합니다.' },
  BALANCED: { label: '균형', description: '모바일 기본값. 속도와 로그 품질의 균형을 맞춥니다.' },
  QUALITY: { label: '고품질', description: '여유 메모리가 있는 기기에서 더 큰 모델과 긴 로그를 사용합니다.' },
};

export const MOBILE_MODEL_CATALOG: MobileModelCatalogEntry[] = [
  {
    id: 'qwen3-1.7b-q4_k_m',
    displayName: 'Qwen3 1.7B Q4_K_M',
    fileName: 'qwen3-1.7b-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/ggml-org/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf?download=true',
    approximateSizeBytes: 1_280_000_000,
    preset: 'BALANCED',
    contextSize: 3072,
    maxTokens: 1200,
    temperature: 0.72,
    topP: 0.92,
    recommendedFor: 'Galaxy A17 및 6GB RAM급 모바일 기본 권장',
  },
  {
    id: 'qwen3-4b-q4_k_m',
    displayName: 'Qwen3 4B Q4_K_M',
    fileName: 'qwen3-4b-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf?download=true',
    approximateSizeBytes: 2_500_000_000,
    preset: 'QUALITY',
    contextSize: 4096,
    maxTokens: 1600,
    temperature: 0.72,
    topP: 0.92,
    recommendedFor: '메모리 여유가 큰 iPad/고성능 모바일 선택 옵션',
  },
];

export function getMobileModelCatalogEntry(modelId: string | undefined | null): MobileModelCatalogEntry | undefined {
  return MOBILE_MODEL_CATALOG.find((entry) => entry.id === modelId);
}

export function formatModelSize(bytes: number): string {
  const gib = bytes / (1024 ** 3);
  return `${gib.toFixed(gib >= 2 ? 1 : 2)} GB`;
}
