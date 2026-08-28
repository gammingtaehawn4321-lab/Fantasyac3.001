import type { AddictionTier } from '../types';

export const ADULT_SYSTEM_CONFIG = {
  adultPhysicalAge: 18,

  // 정상 GM 스토리 로그 하나당 자연 증가
  naturalDesireGainPerStoryLog: 5,

  sensitivity: {
    // 144분마다 -1
    // = 1440분(24시간)마다 -10
    decayIntervalMinutes: 144,
    decayPerInterval: 1,
  },

  aphrodisiac: {
    maxLevel: 100,

    // 60분마다 -5
    decayIntervalMinutes: 60,
    decayPerInterval: 5,

    // 미약 5당 최종 감도 +1
    sensitivityBonusPerLevelBlock: 5,

    // 미약 20당 정상 로그 성욕 증가량 +1
    desireBonusPerLevelBlock: 20,

    // 성인 관계 이벤트 실제 성립 시 적용되는 미약 규칙
    relationshipInjection: {
      enabled: true,

      // 임시 기본값: 20%
      // 나중에 이 숫자만 바꾸면 됨.
      chance: 0.20,

      // 당첨 시 미약 증가량
      minAmount: 10,
      maxAmount: 25,

      // 당첨 시 중독도 증가량
      addictionGainMin: 0,
      addictionGainMax: 2,
    },
  },

  addiction: {
    maxLevel: 100,
  },

  // 영구 타락도는 매우 느리게 누적됩니다.
  // payload/기생/현재 신체상태 영향은 effectiveCorruption에서 별도로 처리합니다.
  permanentCorruption: {
    maxGainPerLog: 0.5,
  },
} as const;

export function getAddictionTierByValue(
  addiction: number
): AddictionTier {
  const value = Math.max(
    0,
    Math.min(100, Number(addiction) || 0)
  );

  if (value < 20) return 'NONE';
  if (value < 40) return 'MILD';
  if (value < 60) return 'MODERATE';
  if (value < 80) return 'SEVERE';

  return 'EXTREME';
}

export type CorruptionTier =
  | 'NONE'
  | 'NOTICEABLE'
  | 'STIGMATIZED'
  | 'SEVERE'
  | 'EXTREME';

export function getCorruptionTierByValue(
  corruption: number
): CorruptionTier {
  const value = Math.max(
    0,
    Math.min(10, Number(corruption) || 0)
  );

  if (value < 2) return 'NONE';
  if (value < 4) return 'NOTICEABLE';
  if (value < 6) return 'STIGMATIZED';
  if (value < 8) return 'SEVERE';

  return 'EXTREME';
}