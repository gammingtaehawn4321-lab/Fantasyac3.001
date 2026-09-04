import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Cloud, Compass, Gem, Lock, Map as MapIcon, Minus, Navigation, Plus, Search, X } from 'lucide-react';
import type { PlayerState, RoutePreference, WorldMapLayer } from '../types';
import { REGION_DEFINITIONS } from '../data/world/regionData';
import { UNDERGROUND_DEVELOPMENT } from '../data/world/undergroundDevelopment';
import {
  WORLD_HEX_TILE_LIST,
  WORLD_HEX_TILES,
  findWorldRoute,
  getAbellaFootprint,
  getEffectiveNavigationTools,
  getEffectiveSectorId,
  getHostileSiteAtHex,
  type WorldHexTile,
  type WorldRouteResult,
} from '../data/world/worldMapSystem';
import { getSectorEncounterProfile } from '../data/world/sectorEncounters';
import { getRegionalMonsterDefinition } from '../data/world/monsterData';
import { getHostileSiteMonsterSlot } from '../data/world/hostileSiteMonsterSlots';
import { TRAVEL_ENCOUNTERS_PER_HEX } from '../data/world/travelSessionSystem';
import { WORLD_DUNGEON_DATABASE } from '../data/dungeons/dungeonSystem';
import { calculateSurfaceTravelRange, AIRSHIP_BUILD_COST, AIRSHIP_UPGRADES } from '../data/world/lifeTravelSystem';
import { getWaystationAt, getWaystationRoutes, getWaystationDestination, type WaystationRoute } from '../data/world/waystationSystem';
import { HexTerrainArt } from './worldMap/HexTerrainArt';
import { getSettlementByGroupId } from '../data/world/settlements';

interface Props {
  isOpen: boolean;
  playerState: PlayerState;
  onClose: () => void;
  onTravel: (route: WorldRouteResult) => void;
  onChangePreference?: (p: RoutePreference) => void;
  onEnterDungeon?: (dungeonId: string) => void;
  onMine?: (tileId: string) => void;
  onGather?: (tileId: string) => void;
  onWaystationTravel?: (route: WaystationRoute) => void;
  onBuildAirship?: () => void;
  onUpgradeAirship?: (upgradeId: string) => void;
  onRefuelAirship?: (fuelItemId: 'aether_fuel_cell' | 'storm_fuel_cell') => void;
  onEnterSettlement?: (settlementId: string) => void;
}

const SQRT3 = Math.sqrt(3);
const HEX = 24;
const layers: Array<{ id: WorldMapLayer; label: string }> = [
  { id: 'SURFACE', label: '지상' },
  { id: 'SKY', label: '하늘' },
  { id: 'CELESTIAL', label: '천공' },
  { id: 'UNDERWATER', label: '해저' },
  { id: 'DEEP_SEA', label: '심해' },
  { id: 'UNDERGROUND', label: '지하' },
  { id: 'DEEP_UNDERGROUND', label: '심층' },
  { id: 'HELL', label: '지옥' },
];

const terrainFill: Record<string, string> = {
  PLAINS:'#57713b', HILL:'#79664a', FOREST:'#245038', RIVER:'#286e8b', URBAN:'#675f59', COAST:'#8b8a62',
  SEA:'#1b5d86', DEEP_SEA:'#112d50', SNOW:'#cbd8de', MOUNTAIN:'#596671', FLOATING_LAND:'#727d50', CLOUD:'#8795a1',
  STORM:'#49445f', SHRINE:'#79577c', CAVE:'#2d2a28', TUNNEL:'#3d352d', UNDERGROUND_RIVER:'#183f4d', CHASM:'#171316',
  CRYSTAL_CAVE:'#38485a', FUNGAL_CAVE:'#304133', MAGMA_RIFT:'#4a251e', UNKNOWN:'#343434',
};
const terrainLabel: Record<string, string> = {
  PLAINS:'초원', HILL:'구릉', FOREST:'숲', RIVER:'강', URBAN:'도시', COAST:'해안', SEA:'바다', DEEP_SEA:'심해', SNOW:'설원',
  MOUNTAIN:'설산', FLOATING_LAND:'부유 대지', CLOUD:'구름', STORM:'폭풍', SHRINE:'신사', CAVE:'동굴', TUNNEL:'지하 터널',
  UNDERGROUND_RIVER:'지하수맥', CHASM:'지하 균열', CRYSTAL_CAVE:'결정 동굴', FUNGAL_CAVE:'균사 공동', MAGMA_RIFT:'마그마 균열', UNKNOWN:'미지',
};
const featureLabel: Record<string, string> = {
  MINE:'광산', CANYON:'협곡', SINKHOLE:'싱크홀', DUNGEON_RESERVED:'던전 예약지', DUNGEON:'던전', ORE_VEIN:'광맥',
  LAYER_BOSS:'층 보스', HELL_GATE:'지옥층 봉인문', RESOURCE:'자원지', ENEMY_OUTPOST:'적 거점', RUIN:'폐허',
};
const structureLabel: Record<string, string> = { CITY:'대도시권', VILLAGE:'마을/부락권', SHRINE:'신사권', OUTPOST:'전초기지', PORT:'항구', WAYSTATION:'역참' };
const regionStroke: Record<string, string> = { GRANDIA:'#d7b66a', SEIRE:'#77c7e6', FOREZIN:'#75b977', SANTIMAC:'#d19b69', PROSTI:'#dcecf3', SCROZE:'#c3b4ef' };

export function WorldMapModal({ isOpen, playerState, onClose, onTravel, onChangePreference, onEnterDungeon, onMine, onGather, onWaystationTravel, onBuildAirship, onUpgradeAirship, onRefuelAirship, onEnterSettlement }: Props) {
  const [layer, setLayer] = useState<WorldMapLayer>(playerState.worldMap?.currentLayer || 'SURFACE');
  const [selected, setSelected] = useState<string | undefined>(playerState.worldMap?.currentHexId);
  const [scale, setScale] = useState(.82);
  const [pan, setPan] = useState({ x: 440, y: 300 });
  const pointer = useRef<Map<number, { x:number; y:number }>>(new Map());
  const pinch = useRef<{ d:number; s:number } | null>(null);
  const drag = useRef<{ x:number; y:number; px:number; py:number } | null>(null);
  const isMoved = useRef(false);
  const lastClickTimeRef = useRef(0);
  const mapViewportRef = useRef<HTMLDivElement>(null);

  const tiles = useMemo(
    () => WORLD_HEX_TILE_LIST.filter((t) => t.layer === layer),
    [layer, playerState.worldMap?.mapRevision],
  );

  const currentId = playerState.worldMap.currentHexId;
  const current = WORLD_HEX_TILES[currentId];

  // The mobile layout previously let the absolutely-positioned SVG collapse its
  // grid row to 0px.  When the modal/layer opens, also center the visible map on
  // the current hex (or the layer bounds) so a narrow viewport never opens on an
  // empty part of the world.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const viewport = mapViewportRef.current;
      if (!viewport || tiles.length === 0) return;

      let anchorX: number;
      let anchorY: number;
      if (current && current.layer === layer) {
        const c = { x: SQRT3 * (current.q + current.r / 2) * HEX, y: 1.5 * current.r * HEX };
        anchorX = c.x;
        anchorY = c.y;
      } else {
        const coords = tiles.map((t) => ({ x: SQRT3 * (t.q + t.r / 2) * HEX, y: 1.5 * t.r * HEX }));
        const minX = Math.min(...coords.map((c) => c.x));
        const maxX = Math.max(...coords.map((c) => c.x));
        const minY = Math.min(...coords.map((c) => c.y));
        const maxY = Math.max(...coords.map((c) => c.y));
        anchorX = (minX + maxX) / 2;
        anchorY = (minY + maxY) / 2;
      }

      setPan({
        x: viewport.clientWidth / 2 - anchorX * scale,
        y: viewport.clientHeight / 2 - anchorY * scale,
      });
    });
    return () => cancelAnimationFrame(frame);
    // Deliberately do not depend on scale: manual zoom/pan must not snap back.
  }, [isOpen, layer, currentId, tiles]);

  if (!isOpen) return null;
  const selectedTile = selected ? WORLD_HEX_TILES[selected] : undefined;
  const pref = playerState.worldMap.routePreference || 'FASTEST';
  const route = selectedTile ? findWorldRoute(playerState, currentId, selectedTile.id, pref) : undefined;
  const abellaTiles = getAbellaFootprint(playerState.dayCount);
  const abellaFootprint = new Set(abellaTiles.map((t) => t.id));
  const abellaAnchorId = abellaTiles[0]?.id;
  const discovered = new Set(playerState.worldMap.discoveredHexIds || []);
  const explored = new Set(playerState.worldMap.exploredHexIds || []);
  const routeSet = new Set(route?.tileIds || []);
  const navTools = getEffectiveNavigationTools(playerState);
  const flags = new Set(playerState.worldMap.accessFlags || []);
  const surfaceRange = calculateSurfaceTravelRange(playerState);
  const currentWaystation = current?.layer === 'SURFACE' ? getWaystationAt(current.q, current.r) : undefined;
  const waystationRoutes = currentWaystation ? getWaystationRoutes(currentWaystation.id) : [];
  const airship = playerState.airship;

  const atProstiSkyGate = current?.locationTag === 'PROSTI_SUMMIT' || current?.locationTag === 'PROSTI_SKY_GATE';
  const skyUnlocked = playerState.race === 'DRAGONKIN' || atProstiSkyGate || playerState.beastkinType === 'BIRD' || flags.has('SKY_NATIVE_ACCESS') || (navTools.sky.map && navTools.sky.compass && navTools.sky.telescope);
  const celestialUnlocked = playerState.race === 'DRAGONKIN' || Boolean(playerState.airship?.built && playerState.airship.level >= 3) || current?.layer === 'CELESTIAL' || flags.has('CELESTIAL_NATIVE_ACCESS') || (navTools.celestial.map && navTools.celestial.compass && navTools.celestial.telescope);
  const undergroundUnlocked = current?.layer === 'UNDERGROUND' || current?.layer === 'DEEP_UNDERGROUND' || (playerState.worldMap.discoveredHexIds || []).some((id) => id.startsWith('UNDERGROUND:'));
  const deepUnlocked = current?.layer === 'DEEP_UNDERGROUND' || [...flags].some((f) => f.startsWith('UG_BOSS_') && f.endsWith('_CLEARED'));

  const isLayerLocked = (id: WorldMapLayer) =>
    id === 'HELL' ||
    (id === 'UNDERGROUND' && !undergroundUnlocked) ||
    (id === 'DEEP_UNDERGROUND' && !deepUnlocked) ||
    (id === 'SKY' && !skyUnlocked) ||
    (id === 'CELESTIAL' && !celestialUnlocked) ||
    (id === 'UNDERWATER' && playerState.race !== 'MERFOLK' && !flags.has('UNDERWATER_ACCESS'));

  const toXY = (q:number, r:number) => ({ x: SQRT3 * (q + r / 2) * HEX, y: 1.5 * r * HEX });
  const poly = (q:number, r:number) => {
    const c = toXY(q, r);
    return Array.from({ length:6 }, (_, i) => {
      const a = Math.PI / 180 * (60 * i - 30);
      return `${c.x + HEX * Math.cos(a)},${c.y + HEX * Math.sin(a)}`;
    }).join(' ');
  };

  const getHexAtWorldPos = (worldX: number, worldY: number, targetLayer: WorldMapLayer): WorldHexTile | undefined => {
    const qFrac = (SQRT3 / 3 * worldX - (1 / 3) * worldY) / HEX;
    const rFrac = ((2 / 3) * worldY) / HEX;
    const sFrac = -qFrac - rFrac;

    let q = Math.round(qFrac);
    let r = Math.round(rFrac);
    let s = Math.round(sFrac);

    const qDiff = Math.abs(q - qFrac);
    const rDiff = Math.abs(r - rFrac);
    const sDiff = Math.abs(s - sFrac);

    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    }

    const id = `${targetLayer}:${q}:${r}`;
    return WORLD_HEX_TILES[id];
  };

  const handleTileClick = (t: WorldHexTile) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 200) return;
    lastClickTimeRef.current = now;

    // Hex 탭은 목적지 선택만 담당한다. 실제 여행 시작은 우측 정보창의 [이동] 버튼에서만 실행한다.
    setSelected(t.id);
  };

  const down = (e:any) => {
    pointer.current.set(e.pointerId, { x:e.clientX, y:e.clientY });
    isMoved.current = false;
    if (pointer.current.size === 1) drag.current = { x:e.clientX, y:e.clientY, px:pan.x, py:pan.y };
    if (pointer.current.size === 2) {
      const [a,b] = [...pointer.current.values()];
      pinch.current = { d:Math.hypot(a.x-b.x, a.y-b.y), s:scale };
    }
  };

  const move = (e:any) => {
    if (!pointer.current.has(e.pointerId)) return;
    pointer.current.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (pointer.current.size === 2 && pinch.current) {
      isMoved.current = true;
      const [a,b] = [...pointer.current.values()];
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      setScale(Math.max(.28, Math.min(2.8, pinch.current.s * d / Math.max(1, pinch.current.d))));
    } else if (pointer.current.size === 1 && drag.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.hypot(dx, dy) > 5) {
        isMoved.current = true;
      }
      if (isMoved.current) {
        setPan({ x:drag.current.px + dx, y:drag.current.py + dy });
      }
    }
  };

  const up = (e:any) => {
    const moved = isMoved.current;
    pointer.current.delete(e.pointerId);
    if (pointer.current.size < 2) pinch.current = null;
    if (pointer.current.size === 0) {
      drag.current = null;
      if (!moved) {
        const viewport = mapViewportRef.current;
        if (viewport) {
          const rect = viewport.getBoundingClientRect();
          const mapX = (e.clientX - rect.left - pan.x) / scale;
          const mapY = (e.clientY - rect.top - pan.y) / scale;
          const tappedTile = getHexAtWorldPos(mapX, mapY, layer);
          if (tappedTile) {
            handleTileClick(tappedTile);
          }
        }
      }
    }
  };

  const selectedSector = selectedTile ? getSectorEncounterProfile(getEffectiveSectorId(selectedTile, playerState.dayCount)) : undefined;
  const selectedDungeon = selectedTile?.dungeonId ? WORLD_DUNGEON_DATABASE[selectedTile.dungeonId] : undefined;
  const selectedHostileSite = selectedTile ? getHostileSiteAtHex(selectedTile.id, playerState) : undefined;
  const selectedHostileMonsters = selectedHostileSite ? selectedHostileSite.definition.monsterIds.map((id) => getHostileSiteMonsterSlot(id)?.name).filter((name): name is string => Boolean(name)) : [];
  const selectedMonsterNames = (selectedSector?.monsterIds || [])
    .map((id) => getRegionalMonsterDefinition(id)?.name)
    .filter((name): name is string => Boolean(name));
  const travelSession = playerState.worldMap.travelSession;
  const activeTravelDestination = travelSession?.active ? WORLD_HEX_TILES[travelSession.destinationHexId] : undefined;
  const selectedSettlement = getSettlementByGroupId(selectedTile?.structureGroupId);
  const atSelectedSettlement = Boolean(selectedSettlement && current?.structureGroupId === selectedSettlement.worldStructureGroupId);

  return <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-2">
    <div className="w-full h-[95dvh] max-w-7xl bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
      <header className="p-3 border-b border-stone-800 flex items-center gap-2 flex-wrap">
        <MapIcon className="w-4 h-4 text-amber-400"/><b>판타지악 삽화형 육각 월드맵</b>
        <span className="text-xs text-stone-500">{WORLD_HEX_TILE_LIST.length.toLocaleString()} Hex · 다층 동굴 미로 · 고정 던전 · 광맥</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setScale((v) => Math.min(2.8, v + .15))} className="p-2 bg-stone-800 rounded"><Plus className="w-4"/></button>
          <button onClick={() => setScale((v) => Math.max(.28, v - .15))} className="p-2 bg-stone-800 rounded"><Minus className="w-4"/></button>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded"><X className="w-4"/></button>
        </div>
      </header>

      <div className="flex gap-1 p-2 border-b border-stone-800 overflow-x-auto">
        {layers.map((l) => {
          const locked = isLayerLocked(l.id);
          const title = l.id === 'HELL' ? '지옥층은 아직 미구현입니다.' : l.id === 'DEEP_UNDERGROUND' ? '해당 지역 지하층 보스를 처치하면 심층이 열립니다.' : l.id === 'UNDERGROUND' ? UNDERGROUND_DEVELOPMENT.message : '항법/진입 조건이 필요합니다.';
          return <button key={l.id} disabled={locked} onClick={() => { if (!locked) { setLayer(l.id); setSelected(l.id === current?.layer ? currentId : undefined); } }} title={locked ? title : l.label}
            className={`px-3 py-2 rounded-lg text-xs border flex items-center gap-1 whitespace-nowrap ${layer===l.id?'border-amber-500 bg-amber-500/10 text-amber-200':'border-stone-800 text-stone-400'} ${locked?'opacity-45':''}`}>
            {locked && <Lock className="w-3"/>}{l.label}{l.id==='HELL'&&<span className="text-[9px]">미구현</span>}
          </button>;
        })}
      </div>

      <main className="flex-1 min-h-0 grid grid-rows-[minmax(280px,44dvh)_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-[minmax(0,1fr)_350px]">
        <div ref={mapViewportRef} className="relative min-h-[280px] md:min-h-0 overflow-hidden bg-[#0b1112] touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={(e)=>{e.preventDefault();setScale((v)=>Math.max(.28,Math.min(2.8,v+(e.deltaY<0?.08:-.08))))}}>
          <svg className="absolute inset-0 w-full h-full"><defs><filter id="mapShadow"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity=".45"/></filter></defs>
            <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`} filter="url(#mapShadow)">
              {tiles.map((t) => {
                const charted = (layer==='SKY'&&navTools.sky.map&&navTools.sky.compass&&navTools.sky.telescope)||(layer==='CELESTIAL'&&navTools.celestial.map&&navTools.celestial.compass&&navTools.celestial.telescope);
                const known = discovered.has(t.id) || t.id === currentId;
                const terrainKnown = known || charted;
                const selectedNow = selected === t.id;
                const routeNow = routeSet.has(t.id);
                const currentNow = currentId === t.id;
                const isAbella = layer === 'CELESTIAL' && abellaFootprint.has(t.id);
                const hostileSite = known ? getHostileSiteAtHex(t.id, playerState) : undefined;
                const c = toXY(t.q, t.r);
                const showDetail = scale > .48;
                const showName = known && scale > .68 && (Boolean(t.locationName) || (isAbella && t.id === abellaAnchorId));
                return <g
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isMoved.current) {
                      handleTileClick(t);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <polygon points={poly(t.q,t.r)} fill={terrainKnown?(terrainFill[t.terrain]||'#343434'):'#121416'} stroke={currentNow?'#f59e0b':selectedNow?'#fff7d6':routeNow?'#60a5fa':terrainKnown?regionStroke[t.regionId]:'#25292a'} strokeOpacity={currentNow||selectedNow||routeNow?1:.34} strokeWidth={currentNow?4:selectedNow?3:routeNow?2:1}/>
                  {terrainKnown && <HexTerrainArt tile={t} x={c.x} y={c.y} showDetails={showDetail} isAbella={isAbella}/>} 
                  {showName && <g pointerEvents="none"><rect x={c.x-23} y={c.y-22} width="46" height="10" rx="3" fill="#090909" opacity=".72"/><text x={c.x} y={c.y-14.5} fontSize="6.2" textAnchor="middle" fill="#fff">{t.locationName||(isAbella?'아벨라':'')}</text></g>}
                  {currentNow && <circle cx={c.x} cy={c.y+15} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1" pointerEvents="none"/>}
                  {hostileSite?.status === 'ACTIVE' && <g pointerEvents="none"><circle cx={c.x} cy={c.y-1} r="7" fill="#2a0b0b" stroke="#ef4444" strokeWidth="1.5"/><text x={c.x} y={c.y+2} fontSize="8" fontWeight="bold" textAnchor="middle" fill="#fecaca">!</text></g>}
                  {known&&!explored.has(t.id)&&scale>.75&&<text x={c.x+15} y={c.y-12} fontSize="8" textAnchor="middle" fill="#f3f4f6" pointerEvents="none">?</text>}
                </g>;
              })}
            </g>
          </svg>
          <div className="absolute left-2 bottom-2 text-[10px] bg-black/75 p-2 rounded text-stone-300 pointer-events-none"><Compass className="w-3 inline"/> 현재 {current?.locationName||REGION_DEFINITIONS[current?.regionId||'GRANDIA'].name} · {current?.layer}</div>
        </div>

        <aside className="border-l border-stone-800 p-3 overflow-y-auto space-y-3 text-sm">
          <div><b>현재 위치</b><p className="text-xs text-stone-500">{current?.locationName||current?.sectorName||currentId}</p></div>
          {travelSession?.active && <div className="rounded-xl border border-amber-700/70 bg-amber-950/15 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2"><b className="text-amber-200">여행 진행 중</b><span>{travelSession.completedEncounters}/{travelSession.encounters.length}</span></div>
            <div className="text-stone-300">목적지: <b>{activeTravelDestination?.locationName||activeTravelDestination?.featureName||activeTravelDestination?.sectorName||travelSession.destinationHexId}</b></div>
            <div className="text-stone-500">진행 Hex {travelSession.completedHexSteps}/{travelSession.totalHexSteps} · 남은 인카운터 {Math.max(0,travelSession.encounters.length-travelSession.completedEncounters)}회 · {travelSession.status === 'ENCOUNTER_PAUSED' ? '현재 Hex 인카운터 진행 중' : '이동 중'}</div>
            <div className="h-1.5 rounded bg-stone-900 overflow-hidden"><div className="h-full bg-amber-500" style={{width:`${Math.min(100,Math.max(0,(travelSession.completedEncounters/Math.max(1,travelSession.encounters.length))*100))}%`}}/></div>
            <div className="text-stone-500">현재 여행이 끝날 때까지 새 목적지 이동은 시작할 수 없습니다.</div>
          </div>}
          {selectedTile ? <div className="rounded-xl border border-stone-800 p-3 space-y-2">
            <div className="flex justify-between gap-2"><b>{selectedTile.locationName||selectedTile.featureName||selectedSector?.name||'탐사 Hex'}</b><span className="text-xs text-stone-500">{selectedTile.q},{selectedTile.r}</span></div>
            <div className="text-xs text-stone-400">{REGION_DEFINITIONS[selectedTile.regionId].name} · {terrainLabel[selectedTile.terrain]||selectedTile.terrain} · 위험도 ★{selectedTile.dangerLevel}</div>
            <div className="text-xs rounded bg-stone-900 p-2"><b className="text-amber-200">섹터: {selectedSector?.name||selectedTile.sectorName}</b><div className="text-stone-500 mt-1">{selectedSector?.description}</div></div>
            {selectedHostileSite?.status === 'ACTIVE' && <div className="text-xs rounded border border-red-900 bg-red-950/30 p-2 space-y-1"><b className="text-red-300">⚠ 적대 거점 · {selectedHostileSite.definition.name}</b><div className="text-stone-400">{selectedHostileSite.definition.kind === 'INSECT_COLONY' ? '곤충 군락' : '촉수 습격지'} · 해당 거점의 전용 인카운터/적만 사용</div>{selectedHostileSite.definition.description && <div className="text-stone-500">{selectedHostileSite.definition.description}</div>}{selectedHostileMonsters.length > 0 && <div className="text-stone-400">확인된 전용 적: {selectedHostileMonsters.join(', ')}</div>}</div>}
            {selectedTile.structureType&&<div className="text-xs">구조: <b>{structureLabel[selectedTile.structureType]}</b></div>}
            {selectedSettlement && <div className="text-xs rounded border border-amber-900/70 bg-amber-950/10 p-2 space-y-2"><div><b className="text-amber-200">{selectedSettlement.name}</b> · {selectedSettlement.tier==='METROPOLIS'?'대도시':selectedSettlement.tier==='CITY'?'도시':selectedSettlement.tier==='VILLAGE'?'마을':'촌락'}</div><div className="text-stone-500">상점 {selectedSettlement.facilities.filter((f)=>f.type==='SHOP').length}곳 · 시설 {selectedSettlement.facilities.length}곳</div><button disabled={Boolean(travelSession?.active)||!atSelectedSettlement} onClick={()=>onEnterSettlement?.(selectedSettlement.id)} className="w-full p-2 rounded bg-amber-600 text-stone-950 font-bold disabled:opacity-40">{travelSession?.active?'여행 중에는 진입 불가':atSelectedSettlement?'정착지 들어가기':'이 정착지 생활권으로 이동해야 함'}</button></div>}
            {selectedTile.featureType&&<div className="text-xs text-cyan-200">지도 요소: <b>{featureLabel[selectedTile.featureType]||selectedTile.featureType}</b></div>}
            {selectedTile.layerBossId && <div className="text-xs border border-rose-900 rounded p-2 text-rose-200">층 보스: {selectedTile.featureName}<br/><span className="text-stone-500">처치 후 다음 층 접근이 해금됩니다.</span></div>}
            {selectedDungeon && <div className="text-xs border border-violet-900 rounded p-2"><b className="text-violet-200">{selectedDungeon.name}</b><div>{selectedDungeon.kind} · {selectedDungeon.size} · 보상 등급 {selectedDungeon.rewardTier}</div><div className="text-stone-500">기믹: {selectedDungeon.gimmickName}</div><button disabled={Boolean(travelSession?.active)||selectedTile.id!==currentId} onClick={()=>onEnterDungeon?.(selectedDungeon.id)} className="mt-2 w-full p-2 rounded bg-violet-700 text-white font-bold disabled:opacity-40">{travelSession?.active?'여행 중에는 입장 불가':selectedTile.id===currentId?'던전 탐사':'이 Hex로 이동해야 입장 가능'}</button></div>}
            {selectedTile.oreVeinId && <button disabled={Boolean(travelSession?.active)||selectedTile.id!==currentId} onClick={()=>onMine?.(selectedTile.id)} className="w-full p-2 rounded bg-cyan-800 text-cyan-50 font-bold disabled:opacity-40"><Gem className="w-4 inline mr-1"/>{travelSession?.active?'여행 중에는 채굴 불가':selectedTile.id===currentId?'광맥 채굴':'이 Hex로 이동해야 채굴 가능'}</button>}
            <button disabled={Boolean(travelSession?.active)||selectedTile.id!==currentId} onClick={()=>onGather?.(selectedTile.id)} className="w-full p-2 rounded bg-emerald-900 text-emerald-100 font-bold disabled:opacity-40">{travelSession?.active?'여행 중에는 채집 불가':selectedTile.id===currentId?'생활 자원 채집':'이 Hex로 이동해야 채집 가능'}</button>
            {selectedTile.featureType==='HELL_GATE' && <div className="text-xs border border-red-950 bg-red-950/20 p-2 rounded text-red-300">지옥층은 아직 미구현입니다. 심층 보스 처치 기록만 저장됩니다.</div>}
            <div className="rounded-lg border border-stone-800 bg-black/20 p-2 text-xs space-y-1">
              <b className="text-stone-200">섹터 정보</b>
              <div className="text-stone-500">탐색: {explored.has(selectedTile.id)?'탐사 완료':discovered.has(selectedTile.id)?'발견됨':'미발견'} · 태그 {(selectedTile.tags||[]).slice(0,4).join(', ')||'없음'}</div>
              <div className="text-stone-500">섹터 사건 {selectedSector?.events?.length||0}종 · 출현 몬스터 {selectedMonsterNames.length}종</div>
              {selectedMonsterNames.length>0&&<div className="text-stone-400">출현 가능: {selectedMonsterNames.slice(0,6).join(' · ')}{selectedMonsterNames.length>6?' 외':''}</div>}
            </div>
            {route?.found ? <>
              <div className="rounded-lg border border-amber-900/60 bg-amber-950/10 p-2 text-xs space-y-1">
                <b className="text-amber-200">이동 계획</b>
                <div>거리 <b>{Math.max(0,route.tileIds.length-1)}칸</b> · 여행 인카운터 <b>{Math.max(0,route.tileIds.length-1)*TRAVEL_ENCOUNTERS_PER_HEX}회</b></div>
                <div>예상 {route.totalMinutes}분 · 평균 위험 {route.averageDanger}{route.travelMode==='AIRSHIP'?` · 비행정 연료 ${route.fuelCost||0}`:route.travelMode==='FLIGHT'?' · 직접 비행':''}</div>
                <div className="text-stone-500">{TRAVEL_ENCOUNTERS_PER_HEX}개의 인카운터를 해결할 때마다 실제 위치가 다음 Hex로 전진합니다.</div>
              </div>
              <div className="grid grid-cols-3 gap-1">{(['SHORTEST','FASTEST','SAFEST'] as RoutePreference[]).map((p)=><button key={p} disabled={Boolean(travelSession?.active)} onClick={()=>onChangePreference?.(p)} className={`p-2 rounded border text-[10px] disabled:opacity-40 ${pref===p?'border-amber-500':'border-stone-800'}`}>{p==='SHORTEST'?'최단':p==='FASTEST'?'최속':'안전'}</button>)}</div>
              <button disabled={selectedTile.id===currentId||Boolean(travelSession?.active)} onClick={()=>onTravel(route)} className="w-full p-3 bg-amber-500 text-stone-950 font-bold rounded-xl disabled:opacity-40"><Navigation className="w-4 inline mr-1"/>{travelSession?.active?'여행 진행 중':'이동'}</button>
            </> : <p className="text-rose-300 text-xs">{route?.reason||'경로 없음'}</p>}
          </div> : <div className="text-stone-500">육각형을 선택하세요.</div>}

          {layer==='SURFACE'&&<div className="rounded-xl border border-emerald-900/60 bg-emerald-950/10 p-3 text-xs space-y-1"><b className="text-emerald-200">지상 단일 이동 한도: {surfaceRange.total} Hex</b><div className="text-stone-500">기본 {surfaceRange.base} + 종족 {surfaceRange.raceBonus} + 패시브 {surfaceRange.passiveBonus} + 도구 {surfaceRange.toolBonus} + 장비 {surfaceRange.equipmentBonus}</div></div>}
          {currentWaystation&&<div className="rounded-xl border border-amber-800 bg-amber-950/10 p-3 text-xs space-y-2"><b className="text-amber-200">역참 · {currentWaystation.name}</b><div className="text-stone-500">일반 야외 인카운터를 생략하는 유료 안전노선. 약탈/수상한 상인/가짜 검문 같은 특수 사건은 드물게 발생합니다.</div>{waystationRoutes.map((wr)=>{const dest=getWaystationDestination(wr,currentWaystation.id);return <button key={wr.id} disabled={Boolean(travelSession?.active)||playerState.rupees<wr.fare} onClick={()=>onWaystationTravel?.(wr)} className="w-full p-2 rounded border border-amber-900 bg-stone-900 disabled:opacity-40 text-left"><b>{dest?.name||'목적지'}</b><span className="float-right">{wr.fare} 루피 · {wr.minutes}분</span></button>})}</div>}
          <div className="rounded-xl border border-sky-900 bg-sky-950/10 p-3 text-xs space-y-2"><b className="text-sky-200">비행정</b>{airship?.built?<><div>{airship.name} · Lv.{airship.level} · 연료 {airship.fuel}/{airship.maxFuel} · 내구 {airship.hull}/{airship.maxHull}</div><div className="grid grid-cols-2 gap-1"><button onClick={()=>onRefuelAirship?.('aether_fuel_cell')} className="p-2 rounded bg-sky-900">에테르 연료 주입</button><button onClick={()=>onRefuelAirship?.('storm_fuel_cell')} className="p-2 rounded bg-violet-900">폭풍 연료 주입</button></div>{AIRSHIP_UPGRADES.filter(u=>!airship.unlockedUpgradeIds.includes(u.id)).slice(0,1).map(u=><button key={u.id} onClick={()=>onUpgradeAirship?.(u.id)} className="w-full p-2 rounded bg-stone-800">다음 업그레이드: {u.name} · 재료 제작</button>)}</>:<><div className="text-stone-500">선장에게 돈을 내는 방식 대신 재료를 모아 직접 건조합니다.</div><div className="text-stone-600">필요 재료 {AIRSHIP_BUILD_COST.reduce((s,c)=>s+c.quantity,0)}개 단위</div><button onClick={()=>onBuildAirship?.()} className="w-full p-2 rounded bg-sky-800 text-white font-bold">비행정 건조</button></>}</div>
          {layer==='SKY'&&!skyUnlocked&&<div className="rounded-xl border border-sky-900 bg-sky-950/20 p-3 text-xs"><Cloud className="w-4 inline"/> 구름을 걷어내려면 하늘 지도·나침반·망원경이 필요합니다.</div>}
          {layer==='CELESTIAL'&&<div className="rounded-xl border border-violet-900 p-3 text-xs"><Search className="w-4 inline"/> 아벨라는 천공 지도에서 계속 이동합니다. 대신전은 천공의 고정 부유 대지에 배치됩니다.</div>}
          {layer==='UNDERGROUND'&&<div className="rounded-xl border border-stone-700 bg-stone-900/40 p-3 text-xs"><Search className="w-4 inline"/> 지하 1층은 거대한 미로형 동굴망입니다. 지역별 층 보스를 처치해야 심층으로 내려갈 수 있습니다.</div>}
          {layer==='DEEP_UNDERGROUND'&&<div className="rounded-xl border border-red-900 bg-red-950/10 p-3 text-xs"><Search className="w-4 inline"/> 심층은 더 높은 위험도와 풍부한 광맥·보상을 가집니다. 심층 보스 뒤에는 미구현 지옥층 봉인문이 있습니다.</div>}
          {layer==='HELL'&&<div className="rounded-xl border border-red-950 p-3 text-xs text-red-300"><Lock className="w-4 inline"/> 지옥층은 아직 미구현입니다.</div>}
        </aside>
      </main>
    </div>
  </div>;
}
