import type { HexTerrain } from '../../types';

export type HostileSiteKind = 'INSECT_COLONY' | 'TENTACLE_RAID_SITE';

export interface HostileSiteDefinition {
  id: string;
  kind: HostileSiteKind;
  enabled: boolean;
  userEditableSlot: true;
  name: string;
  description: string;
  allowedTerrains: HexTerrain[];
  encounterIds: string[];
  monsterIds: string[];
  entryReference: string;
  explorationReference: string;
  clearReference: string;
}

const S = (id: string, kind: HostileSiteKind): HostileSiteDefinition => ({
  id,
  kind,
  enabled: false,
  userEditableSlot: true,
  name: '',
  description: '',
  allowedTerrains: ['PLAINS', 'FOREST'],
  encounterIds: [],
  monsterIds: [],
  entryReference: '',
  explorationReference: '',
  clearReference: '',
});

/**
 * [USER_TODO] 월드맵 적대 거점 10종.
 * 이름/설명/인카운터/몬스터/연출은 사용자가 직접 작성한다.
 * enabled=false 또는 필수 내용이 비어 있으면 월드맵에 배치하지 않는다.
 */
export const HOSTILE_SITE_DEFINITIONS: Record<string, HostileSiteDefinition> = {
  INSECT_COLONY_01: S('INSECT_COLONY_01', 'INSECT_COLONY'),
  INSECT_COLONY_02: S('INSECT_COLONY_02', 'INSECT_COLONY'),
  INSECT_COLONY_03: S('INSECT_COLONY_03', 'INSECT_COLONY'),
  INSECT_COLONY_04: S('INSECT_COLONY_04', 'INSECT_COLONY'),
  INSECT_COLONY_05: S('INSECT_COLONY_05', 'INSECT_COLONY'),
  TENTACLE_RAID_SITE_01: S('TENTACLE_RAID_SITE_01', 'TENTACLE_RAID_SITE'),
  TENTACLE_RAID_SITE_02: S('TENTACLE_RAID_SITE_02', 'TENTACLE_RAID_SITE'),
  TENTACLE_RAID_SITE_03: S('TENTACLE_RAID_SITE_03', 'TENTACLE_RAID_SITE'),
  TENTACLE_RAID_SITE_04: S('TENTACLE_RAID_SITE_04', 'TENTACLE_RAID_SITE'),
  TENTACLE_RAID_SITE_05: S('TENTACLE_RAID_SITE_05', 'TENTACLE_RAID_SITE'),
};

export function getEnabledHostileSiteDefinitions(): HostileSiteDefinition[] {
  return Object.values(HOSTILE_SITE_DEFINITIONS).filter((site) =>
    site.enabled === true && Boolean(site.name.trim()) && site.allowedTerrains.some((t) => t === 'PLAINS' || t === 'FOREST')
  );
}
