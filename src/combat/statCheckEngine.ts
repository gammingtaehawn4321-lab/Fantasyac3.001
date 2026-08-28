import { PlayerStats, StatCheckOutcome, StatCheckResult, StatCheckType } from '../types';

/**
 * 스탯 판정 엔진 (D20 + 스탯 보정치 vs 난이도 DC)
 * 결과: CRITICAL_SUCCESS, SUCCESS, PARTIAL_SUCCESS, FAILURE, CRITICAL_FAILURE
 */
export function performStatCheck(
  stat: StatCheckType,
  difficulty: number,
  stats: PlayerStats
): StatCheckResult {
  const statValue = stats[stat] ?? 5;
  const statModifier = Math.floor((statValue - 10) / 2); // D&D 스타일 보정치 (-2, 0, +2, +5 등)
  const roll = Math.floor(Math.random() * 20) + 1; // 1 ~ 20 주사위
  const totalScore = roll + statModifier;

  let outcome: StatCheckOutcome = 'FAILURE';
  let description = '';

  if (roll === 20 || totalScore >= difficulty + 8) {
    outcome = 'CRITICAL_SUCCESS';
    description = `[대성공] 완벽한 능력 발휘! 주사위(${roll}) + 보정치(${statModifier}) = 총합 ${totalScore} (목표 난이도: ${difficulty})`;
  } else if (totalScore >= difficulty) {
    outcome = 'SUCCESS';
    description = `[성공] 목표 완수. 주사위(${roll}) + 보정치(${statModifier}) = 총합 ${totalScore} (목표 난이도: ${difficulty})`;
  } else if (totalScore >= difficulty - 3) {
    outcome = 'PARTIAL_SUCCESS';
    description = `[부분 성공] 목적은 달성했으나 약간의 대가나 차질이 발생했습니다. (총합 ${totalScore} / 목표 ${difficulty})`;
  } else if (roll === 1 || totalScore <= difficulty - 10) {
    outcome = 'CRITICAL_FAILURE';
    description = `[대실패] 치명적인 실수나 돌발 위기가 닥쳤습니다! (주사위: ${roll}, 총합 ${totalScore} / 목표 ${difficulty})`;
  } else {
    outcome = 'FAILURE';
    description = `[실패] 능력 부족이나 방해로 시도가 실패했습니다. (총합 ${totalScore} / 목표 ${difficulty})`;
  }

  return {
    stat,
    difficulty,
    roll,
    statValue,
    totalScore,
    outcome,
    description,
  };
}
