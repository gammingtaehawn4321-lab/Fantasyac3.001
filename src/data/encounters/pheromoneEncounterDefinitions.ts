import type { EncounterDefinition, PheromoneLineage } from '../../types';

export interface PheromoneEncounterDefinition extends EncounterDefinition {
  pheromoneLineage: PheromoneLineage;
  userEditableSlot: true;
}

const P = (id: string, lineage: PheromoneLineage): PheromoneEncounterDefinition => ({
  id,
  title: '',
  summary: '',
  location: '',
  sceneReference: '',
  isPersistent: false,
  startsCombat: false,
  enabled: false,
  userEditableSlot: true,
  pheromoneLineage: lineage,
});

/** [USER_TODO] 실제 내용은 사용자가 작성한다. 빈/비활성 슬롯은 절대 자동 선택하지 않는다. */
export const PHEROMONE_ENCOUNTER_DEFINITIONS: Record<string, PheromoneEncounterDefinition> = {
  PHEROMONE_INSECTOID_ENCOUNTER_01: P('PHEROMONE_INSECTOID_ENCOUNTER_01', 'INSECTOID'),
  PHEROMONE_INSECTOID_ENCOUNTER_02: P('PHEROMONE_INSECTOID_ENCOUNTER_02', 'INSECTOID'),
  PHEROMONE_INSECTOID_ENCOUNTER_03: P('PHEROMONE_INSECTOID_ENCOUNTER_03', 'INSECTOID'),
  PHEROMONE_TENTACLE_ENCOUNTER_01: P('PHEROMONE_TENTACLE_ENCOUNTER_01', 'TENTACLE'),
  PHEROMONE_TENTACLE_ENCOUNTER_02: P('PHEROMONE_TENTACLE_ENCOUNTER_02', 'TENTACLE'),
  PHEROMONE_TENTACLE_ENCOUNTER_03: P('PHEROMONE_TENTACLE_ENCOUNTER_03', 'TENTACLE'),
};

export function getEnabledPheromoneEncounters(lineage: PheromoneLineage): PheromoneEncounterDefinition[] {
  return Object.values(PHEROMONE_ENCOUNTER_DEFINITIONS).filter((def) =>
    def.enabled === true && def.pheromoneLineage === lineage && Boolean(def.sceneReference?.trim())
  );
}
