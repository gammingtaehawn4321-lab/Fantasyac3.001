import type { BodyPayloadEntry, PheromoneLineage, PheromoneState, PheromoneStrengthTier, PlayerState } from '../types';
import { BODY_COMPARTMENT_CAPACITY } from './bodySystemConfig';

export interface PheromoneConfig {
  residualDurationMinutes: number;
  desireGainPerHourAtFullStrength: number;
  sensitivityGainPerHourAtFullStrength: number;
  encounterWeightMultiplierAtFullStrength: number;
  eventChanceBonusAtFullStrength: number;
  monsterShareBonusAtFullStrength: number;
}

/**
 * 페로몬은 별도 payload가 아니라 체내 정액에서 계산되는 파생 상태다.
 * 수치는 한 곳에서 조정할 수 있게 모아 둔다.
 */
export const PHEROMONE_CONFIG: PheromoneConfig = {
  residualDurationMinutes: 360,
  desireGainPerHourAtFullStrength: 2,
  sensitivityGainPerHourAtFullStrength: 0.25,
  encounterWeightMultiplierAtFullStrength: 8,
  eventChanceBonusAtFullStrength: 0.22,
  monsterShareBonusAtFullStrength: 0.28,
};

export function createEmptyPheromoneState(): PheromoneState {
  return {
    INSECTOID: { lineage: 'INSECTOID', activeStrength: 0, residualStrength: 0, effectiveStrength: 0, residualMinutesRemaining: 0, tier: 'NONE' },
    TENTACLE: { lineage: 'TENTACLE', activeStrength: 0, residualStrength: 0, effectiveStrength: 0, residualMinutesRemaining: 0, tier: 'NONE' },
  };
}

export function inferPheromoneLineage(entry: Pick<BodyPayloadEntry, 'payloadKind' | 'sourceSpeciesId' | 'payloadFamilyKey' | 'pheromoneLineage'>): PheromoneLineage | undefined {
  if (entry.pheromoneLineage === 'INSECTOID' || entry.pheromoneLineage === 'TENTACLE') return entry.pheromoneLineage;
  if (entry.payloadKind === 'INSECTOID_SECRETION') return 'INSECTOID';
  if (entry.payloadKind !== 'STANDARD_FLUID') return undefined;
  const source = `${entry.sourceSpeciesId || ''} ${entry.payloadFamilyKey || ''}`.toUpperCase();
  return source.includes('TENTACLE') ? 'TENTACLE' : undefined;
}

/**
 * 질/항문에 남아 있는 대응 정액의 각 구획 점유율을 합산한다.
 * 두 부위에 동시에 존재할 수 있으므로 합산 후 1로 제한한다.
 */
export function calculateActivePheromoneStrength(state: Pick<PlayerState, 'bodyPayloads'>, lineage: PheromoneLineage): number {
  let strength = 0;
  for (const entry of state.bodyPayloads || []) {
    if (entry.compartmentId !== 'COMPARTMENT_1' && entry.compartmentId !== 'COMPARTMENT_2') continue;
    if (inferPheromoneLineage(entry) !== lineage) continue;
    const capacity = Math.max(1, BODY_COMPARTMENT_CAPACITY[entry.compartmentId]);
    strength += Math.max(0, Number(entry.amount) || 0) / capacity;
  }
  return Math.max(0, Math.min(1, strength));
}

export function pheromoneTier(strength: number, residual = false): PheromoneStrengthTier {
  const x = Math.max(0, Math.min(1, strength));
  if (x <= 0.0001) return 'NONE';
  if (residual) return 'RESIDUAL';
  if (x >= 0.85) return 'OVERWHELMING';
  if (x >= 0.6) return 'HIGH';
  if (x >= 0.3) return 'MEDIUM';
  if (x >= 0.1) return 'LOW';
  return 'TRACE';
}

export function getEffectivePheromoneStrength(state: Pick<PlayerState, 'pheromoneState' | 'bodyPayloads'>, lineage: PheromoneLineage): number {
  const active = calculateActivePheromoneStrength(state as Pick<PlayerState, 'bodyPayloads'>, lineage);
  if (active > 0) return active;
  return Math.max(0, Math.min(1, Number(state.pheromoneState?.[lineage]?.effectiveStrength) || 0));
}

export function pheromoneMonsterWeightMultiplier(state: PlayerState, lineage: PheromoneLineage): number {
  const strength = getEffectivePheromoneStrength(state, lineage);
  return 1 + PHEROMONE_CONFIG.encounterWeightMultiplierAtFullStrength * strength;
}
