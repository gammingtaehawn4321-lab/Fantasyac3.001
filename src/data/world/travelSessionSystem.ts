import type { PlayerState, TravelEncounterUnit, TravelSession } from '../../types';
import { dispatchGameEvent } from '../../gameEvents';
import {
  WORLD_HEX_TILES,
  getEffectiveSectorId,
  revealAround,
  rollTravelStep,
  type WorldRouteResult,
  getHostileSiteAtHex,
} from './worldMapSystem';
import { getSectorEncounterProfile } from './sectorEncounters';
import { getRegionalMonsterDefinition } from './monsterData';
import { getEncounterDefinition } from '../encounters/encounterDatabase';
import { rollDragonkinHunterTravelEvent } from '../dragonkin/dragonkinEncounterSystem';
import { airshipFuelCostForDistance, consumeAirshipFuel } from './lifeTravelSystem';
import { advanceGameTime } from '../../gameEngine';
import { getHostileSiteMonsterSlot } from './hostileSiteMonsterSlots';
import { getEnabledPheromoneEncounters } from '../encounters/pheromoneEncounterDefinitions';
import { getEffectivePheromoneStrength } from '../pheromoneSystem';

export const TRAVEL_ENCOUNTERS_PER_HEX = 2;
export const WORLD_TRAVEL_ENCOUNTER_ID = 'world_travel_encounter';

function hash01(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function rollPheromoneSpecialEncounter(state: PlayerState, seed: number) {
  const insectStrength = getEffectivePheromoneStrength(state, 'INSECTOID');
  const tentacleStrength = getEffectivePheromoneStrength(state, 'TENTACLE');
  const insect = getEnabledPheromoneEncounters('INSECTOID');
  const tentacle = getEnabledPheromoneEncounters('TENTACLE');
  const weighted: Array<{ strength: number; defs: typeof insect }> = [];
  if (insectStrength > 0 && insect.length) weighted.push({ strength: insectStrength, defs: insect });
  if (tentacleStrength > 0 && tentacle.length) weighted.push({ strength: tentacleStrength, defs: tentacle });
  const totalStrength = weighted.reduce((sum, row) => sum + row.strength, 0);
  if (!weighted.length || totalStrength <= 0) return undefined;
  const triggerChance = Math.min(.72, .18 + Math.min(1, totalStrength) * .48);
  if (hash01(seed + 941) >= triggerChance) return undefined;
  let roll = hash01(seed + 942) * totalStrength;
  let chosen = weighted[0];
  for (const row of weighted) { roll -= row.strength; if (roll <= 0) { chosen = row; break; } }
  return chosen.defs[Math.floor(hash01(seed + 943) * chosen.defs.length) % chosen.defs.length];
}

function buildHostileSiteEncounter(state: PlayerState, tileId: string, seed: number) {
  const site = getHostileSiteAtHex(tileId, state);
  if (!site || site.status !== 'ACTIVE') return undefined;
  const def = site.definition;
  const encounterDefs = (def.encounterIds || []).map((id) => getEncounterDefinition(id)).filter(Boolean);
  const monsterDefs = (def.monsterIds || []).map((id) => getHostileSiteMonsterSlot(id)).filter((m) => m && m.hostileSiteKind === def.kind);
  const hasEventReference = Boolean(def.explorationReference.trim() || def.entryReference.trim());
  if (!encounterDefs.length && !monsterDefs.length && !hasEventReference) return undefined;

  const chooseMonster = monsterDefs.length > 0 && (!encounterDefs.length && !hasEventReference || hash01(seed + 701) < .6);
  if (chooseMonster) {
    const monster = monsterDefs[Math.floor(hash01(seed + 702) * monsterDefs.length) % monsterDefs.length]!;
    return { kind: 'MONSTER' as const, monsterId: monster.id, monsterName: monster.name, title: monster.name, summary: `${def.name}에서 전용 적과 조우했다.`, sceneReference: monster.narrativeReference || def.explorationReference || def.entryReference };
  }
  if (encounterDefs.length) {
    const encounter = encounterDefs[Math.floor(hash01(seed + 703) * encounterDefs.length) % encounterDefs.length]!;
    return { kind: 'EVENT' as const, title: encounter.title || def.name, summary: encounter.summary || def.description, sceneReference: encounter.sceneReference || def.explorationReference || def.entryReference, sourceEncounterId: encounter.id };
  }
  return { kind: 'EVENT' as const, title: def.name, summary: def.description, sceneReference: def.explorationReference || def.entryReference };
}

function fallbackTravelEventText(state: PlayerState, tileId: string, seed: number): { title: string; text: string } {
  const tile = WORLD_HEX_TILES[tileId];
  if (!tile) return { title: '여행 중의 작은 사건', text: '이동 경로에서 예상하지 못한 작은 변수가 생겼다.' };
  const sectorId = getEffectiveSectorId(tile, state.dayCount);
  const profile = getSectorEncounterProfile(sectorId);
  if (profile?.events?.length) {
    const idx = Math.floor(hash01(seed) * profile.events.length) % profile.events.length;
    return {
      title: `${profile.name}의 여행 사건`,
      text: `[${profile.name}] ${profile.events[idx]}`,
    };
  }
  return {
    title: `${tile.sectorName || '여행 경로'} 통과`,
    text: `${tile.sectorName || '이동 경로'}의 ${tile.terrain} 지형을 지나던 중 주변 환경과 길의 상태를 직접 확인해야 하는 상황이 생겼다.`,
  };
}

function buildTravelEncounterUnit(
  state: PlayerState,
  tileId: string,
  pathIndex: number,
  encounterIndexInHex: number,
  globalIndex: number,
  encountersPerHex: number,
): TravelEncounterUnit {
  const tile = WORLD_HEX_TILES[tileId];
  const seed =
    (state.dayCount || 1) * 100003 +
    (state.dialogueCount || 0) * 1009 +
    pathIndex * 101 +
    encounterIndexInHex * 17 +
    globalIndex * 7;
  const rolled = tile ? rollTravelStep(state, tile, seed) : undefined;
  const fullStepMinutes = Math.max(1, Number(rolled?.minutes || 20));
  const baseMinutes = Math.floor(fullStepMinutes / encountersPerHex);
  const remainder = fullStepMinutes % encountersPerHex;
  const minutes = Math.max(1, baseMinutes + (encounterIndexInHex < remainder ? 1 : 0));

  // 적대 거점은 일반/페로몬 인카운터보다 우선한다. 활성 거점에 콘텐츠가 채워져 있으면 매 슬롯이 거점 전용 사건/몬스터로 고정된다.
  const hostile = tile ? buildHostileSiteEncounter(state, tile.id, seed + globalIndex * 19) : undefined;
  if (hostile) {
    return {
      id: `travel-${Date.now()}-${pathIndex}-${encounterIndexInHex}-${globalIndex}`,
      index: globalIndex, pathIndex, encounterIndexInHex, tileId, minutes,
      kind: hostile.kind, title: hostile.title, summary: hostile.summary, sceneReference: hostile.sceneReference,
      monsterId: hostile.kind === 'MONSTER' ? hostile.monsterId : undefined,
      monsterName: hostile.kind === 'MONSTER' ? hostile.monsterName : undefined,
      sourceEncounterId: hostile.kind === 'EVENT' ? hostile.sourceEncounterId : undefined,
    };
  }

  // 페로몬 전용 사용자 슬롯은 활성/작성된 경우에만 일반 인카운터보다 먼저 후보가 된다.
  const pheromoneEncounter = rollPheromoneSpecialEncounter(state, seed + globalIndex * 23);
  if (pheromoneEncounter) {
    return {
      id: `travel-${Date.now()}-${pathIndex}-${encounterIndexInHex}-${globalIndex}`,
      index: globalIndex, pathIndex, encounterIndexInHex, tileId, minutes, kind: 'EVENT',
      title: pheromoneEncounter.title || '페로몬 인카운터',
      summary: pheromoneEncounter.summary || '',
      sceneReference: pheromoneEncounter.sceneReference || '',
      sourceEncounterId: pheromoneEncounter.id,
    };
  }

  // 층 보스는 해당 Hex의 첫 번째 여행 인카운터에서 한 번만 길을 막는다.
  // 두 번째 슬롯까지 같은 보스를 미리 생성하면 승리 직후 재전투가 발생하므로 중복 생성하지 않는다.
  if (rolled?.encounterType === 'MONSTER' && rolled.monsterId && rolled.monsterName && tile?.layerBossId === rolled.monsterId && encounterIndexInHex === 0) {
    return {
      id: `travel-${Date.now()}-${pathIndex}-${encounterIndexInHex}-${globalIndex}`,
      index: globalIndex,
      pathIndex,
      encounterIndexInHex,
      tileId,
      minutes,
      kind: 'MONSTER',
      title: `${rolled.monsterName} 조우`,
      summary: rolled.eventText || `${rolled.monsterName}이 다음 길을 막고 있다.`,
      sceneReference: `${rolled.monsterName}와의 층 보스 조우. 전투 결과가 확정되기 전에는 플레이어의 승패를 미리 결정하지 않는다.`,
      monsterId: rolled.monsterId,
      monsterName: rolled.monsterName,
    };
  }

  const dragonkinSpecial = tile ? rollDragonkinHunterTravelEvent(state, tile.regionId, seed + 811) : null;
  if (dragonkinSpecial?.kind === 'MONSTER') {
    const monster = getRegionalMonsterDefinition(dragonkinSpecial.id);
    return {
      id: `travel-${Date.now()}-${pathIndex}-${encounterIndexInHex}-${globalIndex}`,
      index: globalIndex,
      pathIndex,
      encounterIndexInHex,
      tileId,
      minutes,
      kind: 'MONSTER',
      title: `${monster?.name || '용족 사냥꾼'} 조우`,
      summary: `${monster?.name || '용족 사냥꾼'}의 포획대가 여행 경로를 막아섰다.`,
      sceneReference: '용족 플레이어를 노리는 전문 사냥대와의 여행 중 조우. 전투 결과를 미리 확정하지 않는다.',
      monsterId: dragonkinSpecial.id,
      monsterName: monster?.name || '용족 사냥꾼',
      dragonkinHunter: true,
    };
  }
  if (dragonkinSpecial?.kind === 'ENCOUNTER') {
    const def = getEncounterDefinition(dragonkinSpecial.id);
    return {
      id: `travel-${Date.now()}-${pathIndex}-${encounterIndexInHex}-${globalIndex}`,
      index: globalIndex,
      pathIndex,
      encounterIndexInHex,
      tileId,
      minutes,
      kind: 'EVENT',
      title: def?.title || '용족 사냥꾼의 움직임',
      summary: def?.summary || '용족을 노리는 전문 사냥 세력의 움직임이 감지되었다.',
      sceneReference: String(def?.sceneReference || def?.summary || '용족을 노리는 전문 사냥 세력의 여행 사건.'),
      sourceEncounterId: dragonkinSpecial.id,
      dragonkinHunter: true,
    };
  }

  if (rolled?.encounterType === 'MONSTER' && rolled.monsterId && rolled.monsterName && !(tile?.layerBossId === rolled.monsterId && encounterIndexInHex > 0)) {
    return {
      id: `travel-${Date.now()}-${pathIndex}-${encounterIndexInHex}-${globalIndex}`,
      index: globalIndex,
      pathIndex,
      encounterIndexInHex,
      tileId,
      minutes,
      kind: 'MONSTER',
      title: `${rolled.monsterName} 조우`,
      summary: rolled.eventText || `${rolled.monsterName}와 조우했다.`,
      sceneReference: `${rolled.monsterName}와의 여행 중 조우. 전투 결과가 확정되기 전에는 플레이어의 승패를 미리 결정하지 않는다.`,
      monsterId: rolled.monsterId,
      monsterName: rolled.monsterName,
    };
  }

  const fallback = rolled?.encounterType === 'EVENT' && rolled.eventText
    ? {
        title: `${getSectorEncounterProfile(rolled.sectorId)?.name || tile?.sectorName || '여행'}의 사건`,
        text: rolled.eventText,
      }
    : fallbackTravelEventText(state, tileId, seed + 313);

  return {
    id: `travel-${Date.now()}-${pathIndex}-${encounterIndexInHex}-${globalIndex}`,
    index: globalIndex,
    pathIndex,
    encounterIndexInHex,
    tileId,
    minutes,
    kind: 'EVENT',
    title: fallback.title,
    summary: fallback.text,
    sceneReference: `${fallback.text}\n이 사건은 목적지까지 이동하는 도중 발생한 독립적인 여행 인카운터다. 플레이어가 어떻게 대응할지 선택할 수 있게 하고, 해결되기 전 다음 여행 사건이나 목적지 도착을 서술하지 않는다.`,
  };
}

export function createTravelSession(state: PlayerState, route: WorldRouteResult): TravelSession | null {
  if (!route.found || route.tileIds.length < 2) return null;
  const encounters: TravelEncounterUnit[] = [];
  const path = route.tileIds.slice(1);
  let globalIndex = 0;

  path.forEach((tileId, pathOffset) => {
    const pathIndex = pathOffset + 1;
    for (let encounterIndexInHex = 0; encounterIndexInHex < TRAVEL_ENCOUNTERS_PER_HEX; encounterIndexInHex += 1) {
      encounters.push(
        buildTravelEncounterUnit(
          state,
          tileId,
          pathIndex,
          encounterIndexInHex,
          globalIndex,
          TRAVEL_ENCOUNTERS_PER_HEX,
        ),
      );
      globalIndex += 1;
    }
  });

  // findWorldRoute는 전체 경로의 원시 이동시간을 마지막에 한 번 반올림하고,
  // 개별 Hex 계산은 각각 반올림하므로 합계가 1~수 분 어긋날 수 있다.
  // 우측 이동 계획에 표시한 예상 시간과 실제 TravelSession 경과 시간이 정확히 같도록
  // 인카운터별 시간을 1분 단위로 분산 보정한다.
  let minuteDelta = Math.round(route.totalMinutes) - encounters.reduce((sum, unit) => sum + unit.minutes, 0);
  let cursor = encounters.length - 1;
  while (minuteDelta !== 0 && encounters.length > 0) {
    const unit = encounters[cursor];
    if (minuteDelta > 0) {
      unit.minutes += 1;
      minuteDelta -= 1;
    } else if (unit.minutes > 1) {
      unit.minutes -= 1;
      minuteDelta += 1;
    }
    cursor = cursor <= 0 ? encounters.length - 1 : cursor - 1;
  }

  return {
    active: true,
    originHexId: route.tileIds[0],
    destinationHexId: route.tileIds[route.tileIds.length - 1],
    pathTileIds: [...route.tileIds],
    travelMode: route.travelMode || 'FOOT',
    encountersPerHex: TRAVEL_ENCOUNTERS_PER_HEX,
    encounters,
    currentEncounterIndex: 0,
    completedEncounters: 0,
    completedHexSteps: 0,
    completedSkySteps: 0,
    completedCelestialSteps: 0,
    totalHexSteps: Math.max(0, route.tileIds.length - 1),
    totalMinutes: route.totalMinutes,
    averageDanger: route.averageDanger,
    startedAtDay: state.dayCount,
    startedAtHour: state.currentHour,
    startedAtMinute: state.currentMinute,
    status: 'MOVING',
    currentPathIndex: 0,
  };
}

/**
 * 4.0.1: 현재 여행 인카운터를 해당 월드 Hex에 실제로 고정한다.
 * 인카운터가 별도 추상 공간에서 진행되지 않도록, 사건이 열리는 순간 currentHexId가 먼저 갱신된다.
 */
export function anchorCurrentTravelEncounterToWorldHex(
  state: PlayerState,
): { nextState: PlayerState; movedToHexId?: string; fuelSpent?: number } {
  const session = state.worldMap?.travelSession;
  const unit = session?.active ? session.encounters?.[session.currentEncounterIndex] : undefined;
  if (!session || !unit) return { nextState: state };
  const tile = WORLD_HEX_TILES[unit.tileId];
  if (!tile) return { nextState: state };

  const alreadyAnchored = state.worldMap.currentHexId === tile.id;
  if (alreadyAnchored) {
    return {
      nextState: {
        ...state,
        worldMap: {
          ...state.worldMap,
          travelSession: { ...session, status: 'ENCOUNTER_PAUSED', currentPathIndex: unit.pathIndex, pausedAtHexId: tile.id },
        },
      },
      fuelSpent: 0,
    };
  }

  let fuelSpent = 0;
  let completedSkySteps = session.completedSkySteps || 0;
  let completedCelestialSteps = session.completedCelestialSteps || 0;
  let movedState = state;
  if (session.travelMode === 'AIRSHIP' && (tile.layer === 'SKY' || tile.layer === 'CELESTIAL')) {
    const previousLayerSteps = tile.layer === 'SKY' ? completedSkySteps : completedCelestialSteps;
    const nextLayerSteps = previousLayerSteps + 1;
    const previousCost = previousLayerSteps > 0 ? airshipFuelCostForDistance(state, previousLayerSteps, tile.layer) : 0;
    const nextCost = airshipFuelCostForDistance(state, nextLayerSteps, tile.layer);
    fuelSpent = Math.max(0, nextCost - previousCost);
    if (tile.layer === 'SKY') completedSkySteps = nextLayerSteps;
    else completedCelestialSteps = nextLayerSteps;
    if (fuelSpent > 0) {
      movedState = consumeAirshipFuel(movedState, fuelSpent);
      movedState = dispatchGameEvent(movedState, 'AIRSHIP_TRAVELED', { fuelSpent }).nextState;
    }
  }

  const currentSession = movedState.worldMap.travelSession || session;
  let next: PlayerState = {
    ...movedState,
    worldMap: {
      ...movedState.worldMap,
      currentHexId: tile.id,
      currentRegionId: tile.regionId,
      currentLayer: tile.layer,
      exploredHexIds: Array.from(new Set([...(movedState.worldMap.exploredHexIds || []), tile.id])),
      discoveredHexIds: Array.from(new Set([...(movedState.worldMap.discoveredHexIds || []), tile.id])),
      lastSelectedHexId: tile.id,
      mapRevision: (movedState.worldMap.mapRevision || 0) + 1,
      travelSession: {
        ...currentSession,
        status: 'ENCOUNTER_PAUSED',
        currentPathIndex: unit.pathIndex,
        pausedAtHexId: tile.id,
        completedSkySteps,
        completedCelestialSteps,
      },
    },
  };
  next = revealAround(next, tile.id, 1);
  next = dispatchGameEvent(next, 'LOCATION_ENTERED', {
    locationId: tile.locationTag || tile.id,
    locationName: tile.locationName || tile.sectorName,
    location: tile.id,
  }).nextState;
  return { nextState: next, movedToHexId: tile.id, fuelSpent };
}

export function getCurrentTravelEncounter(state: PlayerState): TravelEncounterUnit | undefined {
  const session = state.worldMap?.travelSession;
  if (!session?.active) return undefined;
  return session.encounters?.[session.currentEncounterIndex];
}

export interface TravelAdvanceResult {
  nextState: PlayerState;
  completedUnit?: TravelEncounterUnit;
  movedToHexId?: string;
  arrived: boolean;
  fuelSpent: number;
}

export function completeCurrentTravelEncounter(state: PlayerState): TravelAdvanceResult {
  const session = state.worldMap?.travelSession;
  const unit = getCurrentTravelEncounter(state);
  if (!session || !unit) return { nextState: state, arrived: false, fuelSpent: 0 };

  let next = advanceGameTime(state, Math.max(1, unit.minutes));
  const fuelSpent = 0;
  let completedHexSteps = session.completedHexSteps;
  const completedSkySteps = session.completedSkySteps || 0;
  const completedCelestialSteps = session.completedCelestialSteps || 0;

  const finishesHex = unit.encounterIndexInHex >= session.encountersPerHex - 1;
  if (finishesHex) {
    const tile = WORLD_HEX_TILES[unit.tileId];
    if (tile) completedHexSteps += 1;
  }

  const completedEncounters = session.completedEncounters + 1;
  const nextIndex = session.currentEncounterIndex + 1;
  const arrived = nextIndex >= session.encounters.length || completedHexSteps >= session.totalHexSteps;
  const updatedSession: TravelSession | null = arrived
    ? null
    : {
        ...session,
        currentEncounterIndex: nextIndex,
        completedEncounters,
        completedHexSteps,
        completedSkySteps,
        completedCelestialSteps,
        status: 'MOVING',
        pausedAtHexId: undefined,
      };

  next = {
    ...next,
    worldMap: {
      ...next.worldMap,
      travelSession: updatedSession,
    },
  };

  return { nextState: next, completedUnit: unit, arrived, fuelSpent };
}

export function attachTravelSession(state: PlayerState, session: TravelSession): PlayerState {
  return {
    ...state,
    worldMap: {
      ...state.worldMap,
      travelSession: session,
      lastSelectedHexId: session.destinationHexId,
    },
  };
}

export function cancelTravelSession(state: PlayerState): PlayerState {
  return {
    ...state,
    activeEncounterId: state.activeEncounterId === WORLD_TRAVEL_ENCOUNTER_ID ? null : state.activeEncounterId,
    worldMap: {
      ...state.worldMap,
      travelSession: null,
    },
  };
}
