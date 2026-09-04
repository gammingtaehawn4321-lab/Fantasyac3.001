export type NarratorProvider = 'LOCAL' | 'GEMINI' | 'AUTO';

export interface NarrationParticipant {
  id: string;
  name: string;
  role?: string;
  speechStyle?: string;
  stateSummary?: string;
}

export interface NarrationRequest {
  requestId: string;
  locale: 'ko-KR';
  sceneType: string;
  playerAction?: string;
  interpreterSummary?: string;
  currentLocation?: string;
  currentTime?: string;
  participants?: NarrationParticipant[];
  lockedFacts: string[];
  referenceTexts?: string[];
  recentLog?: string[];
  desiredLength?: 'SHORT' | 'MEDIUM' | 'LONG';
}

export interface NarrationResult {
  requestId: string;
  text: string;
  provider: 'LOCAL' | 'GEMINI';
  attempts: number;
  fallbackUsed?: boolean;
}

export interface NarratorStatus {
  configuredProvider: NarratorProvider;
  localAvailable: boolean;
  localBaseUrl: string;
  localModel: string;
  fallbackEnabled: boolean;
}
