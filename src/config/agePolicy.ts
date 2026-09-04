/**
 * 판타지악 연령 정책.
 *
 * 인게임 설정이 아니라 코드에서만 관리합니다.
 * 성인 시스템의 기준 나이를 바꾸고 싶으면 ADULT_MIN_PHYSICAL_AGE만 수정하세요.
 * 예: 20세 기준 -> ADULT_MIN_PHYSICAL_AGE = 20
 */

/** 캐릭터 생성에서 허용하는 최소 신체 나이. */
export const CHARACTER_MIN_PHYSICAL_AGE = 13;

/** 신규 플레이어의 기본 신체 나이. */
export const DEFAULT_PLAYER_PHYSICAL_AGE = 18;

/**
 * 성인 관련 시스템이 활성화되는 최소 신체 나이.
 * 이 값 하나를 18, 20, 21 등으로 바꾸면 성인 판정이 함께 변경됩니다.
 */
export const ADULT_MIN_PHYSICAL_AGE = 18;

/** 사람형 동료의 기본 신체 나이. */
export const DEFAULT_HUMANOID_COMPANION_PHYSICAL_AGE = 20;

/** 성인 기준은 코드상 절대로 18세 미만으로 내려가지 않게 보호합니다. */
const ABSOLUTE_MIN_ADULT_PHYSICAL_AGE = 18;

export function getAdultMinPhysicalAge(): number {
  const configured = Math.trunc(Number(ADULT_MIN_PHYSICAL_AGE));
  if (!Number.isFinite(configured)) return ABSOLUTE_MIN_ADULT_PHYSICAL_AGE;
  return Math.max(ABSOLUTE_MIN_ADULT_PHYSICAL_AGE, configured);
}

export function isAdultPhysicalAge(age: unknown): boolean {
  const value = Number(age);
  return Number.isFinite(value) && value >= getAdultMinPhysicalAge();
}

export function normalizeCharacterPhysicalAge(age: unknown): number {
  const value = Math.trunc(Number(age));
  if (!Number.isFinite(value)) return DEFAULT_PLAYER_PHYSICAL_AGE;
  return Math.max(CHARACTER_MIN_PHYSICAL_AGE, value);
}

/** 성인 사람형 동료로 취급되는 항목의 나이를 정책 기준 이상으로 정규화합니다. */
export function normalizeAdultHumanoidPhysicalAge(age: unknown): number {
  const value = Math.trunc(Number(age));
  const fallback = Math.max(DEFAULT_HUMANOID_COMPANION_PHYSICAL_AGE, getAdultMinPhysicalAge());
  if (!Number.isFinite(value)) return fallback;
  return Math.max(getAdultMinPhysicalAge(), value);
}
