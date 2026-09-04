import type { BreastSizeType, HipSizeType, CharacterProfile } from '../types';
import { isAdultPhysicalAge } from '../config/agePolicy';

/**
 * UI 표기명은 고정이지만, Gemini가 실제 묘사에 참고할 문자열은 사용자가 직접 작성한다.
 * 빈 문자열은 Gemini 프롬프트에 포함하지 않는다.
 */
export const BREAST_SIZE_LABELS: Record<BreastSizeType, string> = {
  SMALL: '빈유',
  SLENDER: '슬렌더형',
  LARGE: '거유',
};

export const HIP_SIZE_LABELS: Record<HipSizeType, string> = {
  SLIM: '부실함',
  AVERAGE: '적당함',
  FULL: '풍만함',
};

/** [USER_TODO] 선택값별 Gemini 참조 문구. 기본값은 전부 공란. */
export const BREAST_SIZE_GEMINI_REFERENCES: Record<BreastSizeType, string> = {
  SMALL: '거의 매끈하다시피 한 작은 가슴입니다. 작은 유두에 성감대가 몰려 있습니다.',
  SLENDER: '적당한 가슴입니다. 성감대는 골고루 분포되어 있습니다.',
  LARGE: '매우 큰 가슴입니다. 큰 가슴에 성감대가 분포하고, 큰 유두에는 성감대가 집중되어 있습니다.',
};

/** [USER_TODO] 선택값별 Gemini 참조 문구. 기본값은 전부 공란. */
export const HIP_SIZE_GEMINI_REFERENCES: Record<HipSizeType, string> = {
  SLIM: '얇은 엉덩이입니다.',
  AVERAGE: '적당한 엉덩이입니다.',
  FULL: '풍만한 엉덩이입니다.',
};

export function collectBodyShapeGeminiReferences(profile: Partial<CharacterProfile> | undefined): string[] {
  if (!profile || !isAdultPhysicalAge(profile.physicalAge)) return [];
  const output: string[] = [];
  if (profile.breastSize) {
    const ref = BREAST_SIZE_GEMINI_REFERENCES[profile.breastSize]?.trim();
    if (ref) output.push(ref);
  }
  if (profile.hipSize) {
    const ref = HIP_SIZE_GEMINI_REFERENCES[profile.hipSize]?.trim();
    if (ref) output.push(ref);
  }
  return output;
}
