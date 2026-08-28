import type { EnemyTier } from '../../combat/combatTypes';
import { EQUIPMENT_DATABASE } from '../equipment/equipmentDatabase';
import { getRegionalMonsterDefinition, REGIONAL_MONSTERS, type RegionalMonsterDefinition } from './monsterData';
import { RESURRECTION_POTION_ID, RESURRECTION_POTION_NAME } from './monsterLootItems';

export interface MonsterLootProfile {
  id: string;
  monsterId: string;
  materialId: string;
  materialName: string;
  equipmentDropIds: string[];
  baseExp: number;
  baseRupees: number;
  materialDropChance: number;
  equipmentDropChance: number;
  resurrectionPotionChance: number;
}

export interface RolledMonsterLootItem {
  id?: string;
  name: string;
  quantity: number;
  equipmentId?: string;
  description?: string;
  category?: 'MATERIAL' | 'EQUIPMENT' | 'CONSUMABLE';
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const SPECIAL_EQUIPMENT_LINKS: Record<string, string[]> = {
  prosti_avalanche_colossus: ['zweihander_colossus', 'heavy_plate_cuirass'],
  forezin_venom_mantis: ['shadow_twin_daggers'],
  scroze_thunder_raptor: ['swift_leather_boots', 'scout_leather_vest'],
  scroze_nebula_ray: ['mage_mystic_robe', 'shadow_mirage_cloak'],
};

function selectEquipmentDrops(monster: RegionalMonsterDefinition): string[] {
  const targetTier = Math.max(1, Math.min(12, Math.ceil(((monster.minLevel + monster.maxLevel) / 2) / 5)));
  const candidates = Object.values(EQUIPMENT_DATABASE)
    .filter((eq) => {
      const tier = eq.tier ?? Math.max(1, Math.ceil((eq.requiredLevel ?? 1) / 5));
      if (Math.abs(tier - targetTier) > (monster.tier === 'ELITE' ? 3 : 2)) return false;
      if (monster.tier === 'NORMAL' && eq.grade === 'LEGENDARY') return false;
      return true;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const themed = Object.values(EQUIPMENT_DATABASE).filter((eq) => eq.sourceMonsterId === monster.id).map((eq) => eq.id);
  const desired = Math.max(monster.tier === 'ELITE' ? 3 : 2, themed.length);
  const picked: string[] = [...themed, ...(SPECIAL_EQUIPMENT_LINKS[monster.id] || [])].filter((id, index, arr) => Boolean(EQUIPMENT_DATABASE[id]) && arr.indexOf(id) === index);
  if (candidates.length === 0) return picked;

  let cursor = hashString(monster.id) % candidates.length;
  let safety = 0;
  while (picked.length < desired && safety < candidates.length * 2) {
    const candidate = candidates[cursor % candidates.length];
    if (candidate && !picked.includes(candidate.id)) picked.push(candidate.id);
    cursor += 17;
    safety += 1;
  }
  return picked.slice(0, desired);
}

export const MONSTER_LOOT_PROFILES: Record<string, MonsterLootProfile> = Object.fromEntries(
  REGIONAL_MONSTERS.map((monster) => {
    const avgLevel = (monster.minLevel + monster.maxLevel) / 2;
    const eliteMultiplier = monster.tier === 'ELITE' ? 1.75 : 1;
    const profile: MonsterLootProfile = {
      id: `loot_table_${monster.id}`,
      monsterId: monster.id,
      materialId: monster.lootMaterialId,
      materialName: monster.lootMaterialName,
      equipmentDropIds: selectEquipmentDrops(monster),
      baseExp: Math.round((24 + avgLevel * 14) * eliteMultiplier),
      baseRupees: Math.round((10 + avgLevel * 7) * eliteMultiplier),
      materialDropChance: monster.tier === 'ELITE' ? 1 : 0.82,
      equipmentDropChance: monster.tier === 'ELITE' ? 0.52 : 0.16,
      resurrectionPotionChance: monster.tier === 'ELITE' ? 0.012 : (monster.maxLevel >= 10 ? 0.005 : 0.0015),
    };
    return [monster.id, profile];
  })
);

// 장비 도감의 획득처에도 실제 몬스터 전리품 테이블을 연결한다.
for (const profile of Object.values(MONSTER_LOOT_PROFILES)) {
  for (const equipmentId of profile.equipmentDropIds) {
    const equipment = EQUIPMENT_DATABASE[equipmentId];
    if (!equipment) continue;
    const acquisition = equipment.acquisition || { methods: ['LOOT'] as const };
    equipment.acquisition = {
      ...acquisition,
      methods: Array.from(new Set([...(acquisition.methods || []), 'LOOT'])),
      lootTableIds: Array.from(new Set([...(acquisition.lootTableIds || []), profile.id])),
    };
    if (!equipment.sourceMonsterId && SPECIAL_EQUIPMENT_LINKS[profile.monsterId]?.includes(equipmentId)) {
      equipment.sourceMonsterId = profile.monsterId;
    }
  }
}

export function getMonsterLootProfile(monsterId?: string | null): MonsterLootProfile | undefined {
  return monsterId ? MONSTER_LOOT_PROFILES[monsterId] : undefined;
}

export function getMonsterExperienceReward(monsterId: string | undefined, level: number, tier: EnemyTier = 'NORMAL'): number {
  const profile = getMonsterLootProfile(monsterId);
  if (profile) {
    const def = getRegionalMonsterDefinition(monsterId);
    const avg = def ? Math.max(1, (def.minLevel + def.maxLevel) / 2) : Math.max(1, level);
    return Math.max(1, Math.round(profile.baseExp * (0.75 + Math.max(1, level) / avg * 0.25)));
  }
  const mult = tier === 'BOSS' ? 3 : tier === 'ELITE' ? 1.8 : 1;
  return Math.round((25 + Math.max(1, level) * 15) * mult);
}

export function getMonsterRupeeReward(monsterId: string | undefined, level: number, tier: EnemyTier = 'NORMAL'): number {
  const profile = getMonsterLootProfile(monsterId);
  if (profile) return Math.max(0, Math.round(profile.baseRupees * (0.8 + Math.max(1, level) / 50)));
  const mult = tier === 'BOSS' ? 2.2 : tier === 'ELITE' ? 1.5 : 1;
  return Math.round((12 + Math.max(1, level) * 7) * mult);
}

function mergeLoot(items: RolledMonsterLootItem[]): RolledMonsterLootItem[] {
  const map = new Map<string, RolledMonsterLootItem>();
  for (const item of items) {
    const key = item.equipmentId ? `eq:${item.equipmentId}` : `item:${item.id || item.name}`;
    const existing = map.get(key);
    if (existing) existing.quantity += item.quantity;
    else map.set(key, { ...item });
  }
  return [...map.values()];
}

export function rollMonsterLoot(monsterId: string | undefined, tier: EnemyTier = 'NORMAL'): RolledMonsterLootItem[] {
  const profile = getMonsterLootProfile(monsterId);
  if (!profile) return [];
  const monster = getRegionalMonsterDefinition(monsterId);
  const items: RolledMonsterLootItem[] = [];

  if (Math.random() <= profile.materialDropChance) {
    items.push({
      id: profile.materialId,
      name: profile.materialName,
      quantity: monster?.tier === 'ELITE' ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2),
      category: 'MATERIAL',
      description: `${monster?.name || '몬스터'}에게서 얻은 장비 제작용 전리품.`,
    });
  }

  if (profile.equipmentDropIds.length > 0 && Math.random() <= profile.equipmentDropChance) {
    const equipmentId = profile.equipmentDropIds[Math.floor(Math.random() * profile.equipmentDropIds.length) % profile.equipmentDropIds.length];
    const equipment = EQUIPMENT_DATABASE[equipmentId];
    if (equipment) {
      items.push({
        name: equipment.name,
        quantity: 1,
        equipmentId: equipment.id,
        category: 'EQUIPMENT',
        description: equipment.description,
      });
    }
  }

  if (Math.random() <= profile.resurrectionPotionChance) {
    items.push({ id: RESURRECTION_POTION_ID, name: RESURRECTION_POTION_NAME, quantity: 1, category: 'CONSUMABLE' });
  }

  return mergeLoot(items);
}
