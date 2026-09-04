import type { PlayerState, WorldMapLayer } from '../../types';
import { WORLD_HEX_TILES, canEnterHex, getNeighborHexIds, type WorldHexTile } from './worldMapSystem';

export type HexMoveDirection = 'E' | 'NE' | 'NW' | 'W' | 'SW' | 'SE' | 'UP' | 'DOWN' | 'LINK';
export type EncounterMovementType = 'WALK' | 'RUN' | 'ESCAPE' | 'TRAVEL';

export interface EncounterMovementOption {
  hexId: string;
  direction: HexMoveDirection;
  label: string;
  terrain: string;
  layer: WorldMapLayer;
  enterable: boolean;
  blockedReason?: string;
}

const LAYER_ORDER: WorldMapLayer[] = [
  'HELL',
  'DEEP_UNDERGROUND',
  'UNDERGROUND',
  'DEEP_SEA',
  'UNDERWATER',
  'SURFACE',
  'SKY',
  'CELESTIAL',
];

function directionBetween(from: WorldHexTile, to: WorldHexTile): HexMoveDirection {
  if (from.layer !== to.layer) {
    const fromIndex = LAYER_ORDER.indexOf(from.layer);
    const toIndex = LAYER_ORDER.indexOf(to.layer);
    if (fromIndex >= 0 && toIndex >= 0) return toIndex > fromIndex ? 'UP' : 'DOWN';
    return 'LINK';
  }

  const dq = to.q - from.q;
  const dr = to.r - from.r;
  if (dq === 1 && dr === 0) return 'E';
  if (dq === 1 && dr === -1) return 'NE';
  if (dq === 0 && dr === -1) return 'NW';
  if (dq === -1 && dr === 0) return 'W';
  if (dq === -1 && dr === 1) return 'SW';
  if (dq === 0 && dr === 1) return 'SE';
  return 'LINK';
}

export function getEncounterMovementOptions(state: PlayerState): EncounterMovementOption[] {
  if (!state.activeEncounterId || state.activeBattle) return [];
  const current = WORLD_HEX_TILES[state.worldMap?.currentHexId || ''];
  if (!current) return [];

  return getNeighborHexIds(current).flatMap((hexId) => {
    const tile = WORLD_HEX_TILES[hexId];
    if (!tile) return [];
    const access = canEnterHex(state, tile);
    return [{
      hexId: tile.id,
      direction: directionBetween(current, tile),
      label: tile.locationName || tile.featureName || tile.sectorName || tile.terrain,
      terrain: tile.terrain,
      layer: tile.layer,
      enterable: access.ok,
      blockedReason: access.ok ? undefined : access.reason,
    }];
  });
}

export function buildEncounterMovementPromptContext(state: PlayerState): string {
  if (!state.activeEncounterId || state.activeBattle) return '';
  const current = WORLD_HEX_TILES[state.worldMap?.currentHexId || ''];
  if (!current) return '';
  const options = getEncounterMovementOptions(state);
  const route = state.worldMap?.travelSession;
  const rows = options.map((option) => {
    const status = option.enterable ? '이동 가능' : `이동 불가${option.blockedReason ? `: ${option.blockedReason}` : ''}`;
    return `- ${option.direction} | ${option.hexId} | ${option.label} | ${option.terrain}/${option.layer} | ${status}`;
  });

  return `[인카운터 월드맵 이동 판정]
- 현재 실제 Hex: ${current.id} | ${current.locationName || current.featureName || current.sectorName || current.terrain} | ${current.terrain}/${current.layer}
${route?.active ? `- 목적지 여행 경로가 현재 Hex에서 일시정지되어 있음: ${route.destinationHexId}\n- 이 인카운터에서 다른 Hex로 실제 이동하면 기존 목적지 여행 경로는 즉시 중단됨.` : '- 현재 별도의 목적지 여행 경로 없음.'}
- 이동 가능한/차단된 인접 Hex:
${rows.length ? rows.join('\n') : '- 없음'}
- 플레이어가 걷기, 달리기, 도주, 길을 따라 이동하기처럼 현재 장소를 실제로 벗어나는 이동을 수행해 인접 Hex까지 도달한 경우에만 worldAction.type="MOVE_HEX"를 반환하세요.
- 방/건물/한 장소 안에서 몇 걸음 움직이기, 전투 자세 변경, 회피 동작은 Hex 이동이 아닙니다.
- MOVE_HEX의 hexId는 위 목록의 "이동 가능" Hex ID 중 정확히 하나만 사용하세요.
- 명시된 방향이 있으면 해당 방향을 우선하고, 방향이 없으면 현재 사건/길/도주 맥락에 가장 자연스러운 이동 가능 Hex를 선택하세요.
- movementType은 WALK/RUN/ESCAPE/TRAVEL 중 하나를 사용하고, direction에는 위 방향 값을 그대로 사용하세요.`;
}

export function resolveEncounterMovementTarget(
  state: PlayerState,
  targetHexId?: string,
  direction?: HexMoveDirection,
): EncounterMovementOption | undefined {
  const options = getEncounterMovementOptions(state).filter((option) => option.enterable);
  if (targetHexId) {
    const exact = options.find((option) => option.hexId === targetHexId);
    if (exact) return exact;
  }
  if (direction) {
    const directional = options.filter((option) => option.direction === direction);
    if (directional.length === 1) return directional[0];
  }
  return undefined;
}

export function isValidEncounterMoveTarget(state: PlayerState, targetHexId: string): boolean {
  return getEncounterMovementOptions(state).some((option) => option.hexId === targetHexId && option.enterable);
}
