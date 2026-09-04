import type { HostileSiteKind } from './hostileSiteDefinitions';

export type HostileSiteMonsterPersonality = 'AGGRESSIVE' | 'DEFENSIVE' | 'TACTICAL' | 'BERSERK';

export interface HostileSiteMonsterSlot {
  id: string;
  hostileSiteKind: HostileSiteKind;
  enabled: boolean;
  userEditableSlot: true;
  name: string;
  description: string;
  minLevel: number;
  maxLevel: number;
  tier: 'NORMAL' | 'ELITE';
  skills: string[];
  passiveIds: string[];
  personality: HostileSiteMonsterPersonality;
  tags: string[];
  lootMaterialId: string;
  lootMaterialName: string;
  narrativeReference: string;
}

const M = (id: string, hostileSiteKind: HostileSiteKind): HostileSiteMonsterSlot => ({
  id,
  hostileSiteKind,
  enabled: false,
  userEditableSlot: true,
  name: '',
  description: '',
  minLevel: 1,
  maxLevel: 1,
  tier: 'NORMAL',
  skills: [],
  passiveIds: [],
  personality: 'TACTICAL',
  tags: [],
  lootMaterialId: '',
  lootMaterialName: '',
  narrativeReference: '',
});

/** [USER_TODO] 이름/능력/설명/스킬/패시브/연출을 임의 생성하지 않는다. */
export const HOSTILE_SITE_MONSTER_SLOTS: Record<string, HostileSiteMonsterSlot> = {
  INSECT_COLONY_MONSTER_01: M('INSECT_COLONY_MONSTER_01', 'INSECT_COLONY'),
  INSECT_COLONY_MONSTER_02: M('INSECT_COLONY_MONSTER_02', 'INSECT_COLONY'),
  INSECT_COLONY_MONSTER_03: M('INSECT_COLONY_MONSTER_03', 'INSECT_COLONY'),
  TENTACLE_RAID_MONSTER_01: M('TENTACLE_RAID_MONSTER_01', 'TENTACLE_RAID_SITE'),
  TENTACLE_RAID_MONSTER_02: M('TENTACLE_RAID_MONSTER_02', 'TENTACLE_RAID_SITE'),
  TENTACLE_RAID_MONSTER_03: M('TENTACLE_RAID_MONSTER_03', 'TENTACLE_RAID_SITE'),
};

export function getHostileSiteMonsterSlot(id?: string | null): HostileSiteMonsterSlot | undefined {
  if (!id) return undefined;
  const slot = HOSTILE_SITE_MONSTER_SLOTS[id];
  if (!slot || slot.enabled !== true || !slot.name.trim()) return undefined;
  return slot;
}
