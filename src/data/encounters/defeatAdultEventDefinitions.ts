import type { DefeatAdultEventOutcome, EncounterDefinition } from '../../types';

export type DefeatAdultEventGroup = 'GENERIC' | 'INSECTOID' | 'TENTACLE' | 'INSECT_COLONY' | 'TENTACLE_RAID';

export interface DefeatAdultEventDefinition extends EncounterDefinition {
  defeatGroup: DefeatAdultEventGroup;
  userEditableSlot: true;
  outcome?: DefeatAdultEventOutcome;
  monsterIds?: string[];
  relocationHexId?: string;
  chainEncounterId?: string;
  survivalHpRatio?: number;
}

const D = (id: string, defeatGroup: DefeatAdultEventGroup): DefeatAdultEventDefinition => ({
  id,
  defeatGroup,
  enabled: false,
  userEditableSlot: true,
  title: '',
  summary: '',
  location: '',
  sceneReference: '',
  isPersistent: false,
  startsCombat: false,
  monsterIds: [],
});

/**
 * [USER_TODO] 실제 장면/결과는 사용자가 작성한다.
 * 선택 조건: enabled=true + sceneReference 비어있지 않음 + outcome 지정.
 */
export const DEFEAT_ADULT_EVENT_DEFINITIONS: Record<string, DefeatAdultEventDefinition> = {
  DEFEAT_ADULT_GENERIC_01: D('DEFEAT_ADULT_GENERIC_01', 'GENERIC'),
  DEFEAT_ADULT_GENERIC_02: D('DEFEAT_ADULT_GENERIC_02', 'GENERIC'),
  DEFEAT_ADULT_GENERIC_03: D('DEFEAT_ADULT_GENERIC_03', 'GENERIC'),
  DEFEAT_ADULT_GENERIC_04: D('DEFEAT_ADULT_GENERIC_04', 'GENERIC'),
  DEFEAT_ADULT_GENERIC_05: D('DEFEAT_ADULT_GENERIC_05', 'GENERIC'),

  DEFEAT_ADULT_INSECTOID_01: D('DEFEAT_ADULT_INSECTOID_01', 'INSECTOID'),
  DEFEAT_ADULT_INSECTOID_02: D('DEFEAT_ADULT_INSECTOID_02', 'INSECTOID'),
  DEFEAT_ADULT_INSECTOID_03: D('DEFEAT_ADULT_INSECTOID_03', 'INSECTOID'),
  DEFEAT_ADULT_INSECTOID_04: D('DEFEAT_ADULT_INSECTOID_04', 'INSECTOID'),
  DEFEAT_ADULT_INSECTOID_05: D('DEFEAT_ADULT_INSECTOID_05', 'INSECTOID'),

  DEFEAT_ADULT_TENTACLE_01: D('DEFEAT_ADULT_TENTACLE_01', 'TENTACLE'),
  DEFEAT_ADULT_TENTACLE_02: D('DEFEAT_ADULT_TENTACLE_02', 'TENTACLE'),
  DEFEAT_ADULT_TENTACLE_03: D('DEFEAT_ADULT_TENTACLE_03', 'TENTACLE'),
  DEFEAT_ADULT_TENTACLE_04: D('DEFEAT_ADULT_TENTACLE_04', 'TENTACLE'),
  DEFEAT_ADULT_TENTACLE_05: D('DEFEAT_ADULT_TENTACLE_05', 'TENTACLE'),

  DEFEAT_ADULT_INSECT_COLONY_01: D('DEFEAT_ADULT_INSECT_COLONY_01', 'INSECT_COLONY'),
  DEFEAT_ADULT_INSECT_COLONY_02: D('DEFEAT_ADULT_INSECT_COLONY_02', 'INSECT_COLONY'),
  DEFEAT_ADULT_INSECT_COLONY_03: D('DEFEAT_ADULT_INSECT_COLONY_03', 'INSECT_COLONY'),
  DEFEAT_ADULT_INSECT_COLONY_04: D('DEFEAT_ADULT_INSECT_COLONY_04', 'INSECT_COLONY'),
  DEFEAT_ADULT_INSECT_COLONY_05: D('DEFEAT_ADULT_INSECT_COLONY_05', 'INSECT_COLONY'),

  DEFEAT_ADULT_TENTACLE_RAID_01: D('DEFEAT_ADULT_TENTACLE_RAID_01', 'TENTACLE_RAID'),
  DEFEAT_ADULT_TENTACLE_RAID_02: D('DEFEAT_ADULT_TENTACLE_RAID_02', 'TENTACLE_RAID'),
  DEFEAT_ADULT_TENTACLE_RAID_03: D('DEFEAT_ADULT_TENTACLE_RAID_03', 'TENTACLE_RAID'),
  DEFEAT_ADULT_TENTACLE_RAID_04: D('DEFEAT_ADULT_TENTACLE_RAID_04', 'TENTACLE_RAID'),
  DEFEAT_ADULT_TENTACLE_RAID_05: D('DEFEAT_ADULT_TENTACLE_RAID_05', 'TENTACLE_RAID'),
};

export function getEnabledDefeatAdultEvent(id?: string | null): DefeatAdultEventDefinition | undefined {
  if (!id) return undefined;
  const def = DEFEAT_ADULT_EVENT_DEFINITIONS[id];
  if (!def || def.enabled !== true || !def.sceneReference?.trim() || !def.outcome) return undefined;
  return def;
}
