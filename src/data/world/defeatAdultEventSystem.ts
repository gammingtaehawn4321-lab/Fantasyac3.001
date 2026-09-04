import type { BattleState } from '../../combat/combatTypes';
import type { DefeatAdultEventRuntimeState, PlayerState } from '../../types';
import { getRegionalMonsterDefinition } from './monsterData';
import { getHostileSiteMonsterSlot } from './hostileSiteMonsterSlots';
import { getHostileSiteAtHex, WORLD_HEX_TILES } from './worldMapSystem';
import { DEFEAT_ADULT_EVENT_DEFINITIONS, getEnabledDefeatAdultEvent, type DefeatAdultEventDefinition, type DefeatAdultEventGroup } from '../encounters/defeatAdultEventDefinitions';
import { getEncounterDefinition } from '../encounters/encounterDatabase';
import { isAdultPhysicalAge } from '../../config/agePolicy';

function isAdultEligible(state: PlayerState): boolean {
  return isAdultPhysicalAge(state.profile?.physicalAge);
}

function enemySubtype(id: string): string | undefined {
  return getRegionalMonsterDefinition(id)?.raceSubtype
    || (getHostileSiteMonsterSlot(id)?.hostileSiteKind === 'INSECT_COLONY' ? 'INSECTOID' : getHostileSiteMonsterSlot(id)?.hostileSiteKind === 'TENTACLE_RAID_SITE' ? 'TENTACLE' : undefined);
}

function enabledGroup(group: DefeatAdultEventGroup): DefeatAdultEventDefinition[] {
  return Object.values(DEFEAT_ADULT_EVENT_DEFINITIONS).filter((def) => def.defeatGroup === group && Boolean(getEnabledDefeatAdultEvent(def.id)));
}

export function selectDefeatAdultEvent(state: PlayerState, battle: BattleState, randomValue = Math.random()): DefeatAdultEventDefinition | undefined {
  if (!isAdultEligible(state)) return undefined;
  const enemyIds = battle.enemies.map((enemy) => String(enemy.archetype || enemy.id));

  const explicit = Object.values(DEFEAT_ADULT_EVENT_DEFINITIONS).filter((def) => {
    const active = getEnabledDefeatAdultEvent(def.id);
    return Boolean(active && (def.monsterIds || []).some((id) => enemyIds.includes(id)));
  });
  if (explicit.length) return explicit[Math.floor(Math.max(0, Math.min(.999999, randomValue)) * explicit.length)];

  const site = getHostileSiteAtHex(state.worldMap?.currentHexId, state);
  const siteGroup: DefeatAdultEventGroup | undefined = site?.definition.kind === 'INSECT_COLONY'
    ? 'INSECT_COLONY'
    : site?.definition.kind === 'TENTACLE_RAID_SITE'
      ? 'TENTACLE_RAID'
      : undefined;
  if (siteGroup) {
    const pool = enabledGroup(siteGroup);
    if (pool.length) return pool[Math.floor(Math.max(0, Math.min(.999999, randomValue)) * pool.length)];
  }

  const subtypes = enemyIds.map(enemySubtype);
  if (subtypes.includes('INSECTOID')) {
    const pool = enabledGroup('INSECTOID');
    if (pool.length) return pool[Math.floor(Math.max(0, Math.min(.999999, randomValue)) * pool.length)];
  }
  if (subtypes.includes('TENTACLE')) {
    const pool = enabledGroup('TENTACLE');
    if (pool.length) return pool[Math.floor(Math.max(0, Math.min(.999999, randomValue)) * pool.length)];
  }
  const generic = enabledGroup('GENERIC');
  if (generic.length) return generic[Math.floor(Math.max(0, Math.min(.999999, randomValue)) * generic.length)];
  return undefined;
}

export function createDefeatAdultEventRuntime(state: PlayerState, battle: BattleState, eventId: string): DefeatAdultEventRuntimeState {
  return {
    active: true,
    eventId,
    sourceEnemyIds: battle.enemies.map((enemy) => String(enemy.archetype || enemy.id)),
    sourceEnemyNames: battle.enemies.map((enemy) => enemy.name),
    startedAtDay: state.dayCount,
    startedAtHour: state.currentHour,
    startedAtMinute: state.currentMinute,
  };
}

export function resolveDefeatAdultEventOutcome(state: PlayerState, eventId: string): PlayerState {
  const def = getEnabledDefeatAdultEvent(eventId);
  if (!def?.outcome) return state;
  const ratio = Math.max(0.01, Math.min(1, Number(def.survivalHpRatio ?? 0.15)));
  const base: PlayerState = { ...state, defeatAdultEvent: null, activeEncounterId: null };

  if (def.outcome === 'GAME_OVER') return { ...base, hp: 0 };

  let next: PlayerState = { ...base, hp: Math.max(1, Math.round(base.maxHp * ratio)) };
  if (def.outcome === 'CAPTURED') {
    next = { ...next, storyFlags: Array.from(new Set([...(next.storyFlags || []), 'DEFEAT_ADULT_CAPTURED'])) };
  }
  if (def.outcome === 'RELOCATED' && def.relocationHexId && WORLD_HEX_TILES[def.relocationHexId]) {
    const tile = WORLD_HEX_TILES[def.relocationHexId];
    next = {
      ...next,
      worldMap: {
        ...next.worldMap,
        currentHexId: tile.id,
        currentRegionId: tile.regionId,
        currentLayer: tile.layer,
        discoveredHexIds: Array.from(new Set([...(next.worldMap.discoveredHexIds || []), tile.id])),
        exploredHexIds: Array.from(new Set([...(next.worldMap.exploredHexIds || []), tile.id])),
      },
    };
  }
  if ((def.outcome === 'CHAIN_ENCOUNTER' || def.outcome === 'CAPTURED') && def.chainEncounterId && getEncounterDefinition(def.chainEncounterId)) {
    next = { ...next, activeEncounterId: def.chainEncounterId };
  }
  return next;
}
