import { useMemo, useRef, useState } from 'react';
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
  type WorldRouteResult,
} from '../data/world/worldMapSystem';
import { getSectorEncounterProfile } from '../data/world/sectorEncounters';
import { WORLD_DUNGEON_DATABASE } from '../data/dungeons/dungeonSystem';
import { calculateSurfaceTravelRange, AIRSHIP_BUILD_COST, AIRSHIP_UPGRADES } from '../data/world/lifeTravelSystem';
import { getWaystationAt, getWaystationRoutes, getWaystationDestination, type WaystationRoute } from '../data/world/waystationSystem';
import { HexTerrainArt } from './worldMap/HexTerrainArt';

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

export function WorldMapModal({ isOpen, playerState, onClose, onTravel, onChangePreference, onEnterDungeon, onMine, onGather, onWaystationTravel, onBuildAirship, onUpgradeAirship, onRefuelAirship }: Props) {
  const [layer, setLayer] = useState<WorldMapLayer>(playerState.worldMap?.currentLayer || 'SURFACE');
  const [selected, setSelected] = useState<string | undefined>(playerState.worldMap?.currentHexId);
  const [scale, setScale] = useState(.82);
  const [pan, setPan] = useState({ x: 440, y: 300 });
  const pointer = useRef<Map<number, { x:number; y:number }>>(new Map());
  const pinch = useRef<{ d:number; s:number } | null>(null);
  const drag = useRef<{ x:number; y:number; px:number; py:number } | null>(null);

  const tiles = useMemo(
    () => WORLD_HEX_TILE_LIST.filter((t) => t.layer === layer),
    [layer, playerState.worldMap?.mapRevision],
  );
  if (!isOpen) return null;

  const currentId = playerState.worldMap.currentHexId;
  const current = WORLD_HEX_TILES[currentId];
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
  const down = (e:any) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointer.current.set(e.pointerId, { x:e.clientX, y:e.clientY });
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
      const [a,b] = [...pointer.current.values()];
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      setScale(Math.max(.28, Math.min(2.8, pinch.current.s * d / Math.max(1, pinch.current.d))));
    } else if (pointer.current.size === 1 && drag.current) {
      setPan({ x:drag.current.px + e.clientX - drag.current.x, y:drag.current.py + e.clientY - drag.current.y });
    }
  };
  const up = (e:any) => {
    pointer.current.delete(e.pointerId);
    if (pointer.current.size < 2) pinch.current = null;
    if (pointer.current.size === 0) drag.current = null;
  };

  const selectedSector = selectedTile ? getSectorEncounterProfile(getEffectiveSectorId(selectedTile, playerState.dayCount)) : undefined;
  const selectedDungeon = selectedTile?.dungeonId ? WORLD_DUNGEON_DATABASE[selectedTile.dungeonId] : undefined;

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

      <main className="flex-1 min-h-0 grid md:grid-cols-[1fr_350px]">
        <div className="relative overflow-hidden bg-[#0b1112] touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={(e)=>{e.preventDefault();setScale((v)=>Math.max(.28,Math.min(2.8,v+(e.deltaY<0?.08:-.08))))}}>
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
                const c = toXY(t.q, t.r);
                const showDetail = scale > .48;
                const showName = known && scale > .68 && (Boolean(t.locationName) || (isAbella && t.id === abellaAnchorId));
                return <g key={t.id} onClick={() => setSelected(t.id)} className="cursor-pointer">
                  <polygon points={poly(t.q,t.r)} fill={terrainKnown?(terrainFill[t.terrain]||'#343434'):'#121416'} stroke={currentNow?'#f59e0b':selectedNow?'#fff7d6':routeNow?'#60a5fa':terrainKnown?regionStroke[t.regionId]:'#25292a'} strokeOpacity={currentNow||selectedNow||routeNow?1:.34} strokeWidth={currentNow?4:selectedNow?3:routeNow?2:1}/>
                  {terrainKnown && <HexTerrainArt tile={t} x={c.x} y={c.y} showDetails={showDetail} isAbella={isAbella}/>} 
                  {showName && <><rect x={c.x-23} y={c.y-22} width="46" height="10" rx="3" fill="#090909" opacity=".72"/><text x={c.x} y={c.y-14.5} fontSize="6.2" textAnchor="middle" fill="#fff">{t.locationName||(isAbella?'아벨라':'')}</text></>}
                  {currentNow && <circle cx={c.x} cy={c.y+15} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1"/>}
                  {known&&!explored.has(t.id)&&scale>.75&&<text x={c.x+15} y={c.y-12} fontSize="8" textAnchor="middle" fill="#f3f4f6">?</text>}
                </g>;
              })}
            </g>
          </svg>
          <div className="absolute left-2 bottom-2 text-[10px] bg-black/75 p-2 rounded text-stone-300"><Compass className="w-3 inline"/> 현재 {current?.locationName||REGION_DEFINITIONS[current?.regionId||'GRANDIA'].name} · {current?.layer}</div>
        </div>

        <aside className="border-l border-stone-800 p-3 overflow-y-auto space-y-3 text-sm">
          <div><b>현재 위치</b><p className="text-xs text-stone-500">{current?.locationName||current?.sectorName||currentId}</p></div>
          {selectedTile ? <div className="rounded-xl border border-stone-800 p-3 space-y-2">
            <div className="flex justify-between gap-2"><b>{selectedTile.locationName||selectedTile.featureName||selectedSector?.name||'탐사 Hex'}</b><span className="text-xs text-stone-500">{selectedTile.q},{selectedTile.r}</span></div>
            <div className="text-xs text-stone-400">{REGION_DEFINITIONS[selectedTile.regionId].name} · {terrainLabel[selectedTile.terrain]||selectedTile.terrain} · 위험도 ★{selectedTile.dangerLevel}</div>
            <div className="text-xs rounded bg-stone-900 p-2"><b className="text-amber-200">섹터: {selectedSector?.name||selectedTile.sectorName}</b><div className="text-stone-500 mt-1">{selectedSector?.description}</div></div>
            {selectedTile.structureType&&<div className="text-xs">구조: <b>{structureLabel[selectedTile.structureType]}</b></div>}
            {selectedTile.featureType&&<div className="text-xs text-cyan-200">지도 요소: <b>{featureLabel[selectedTile.featureType]||selectedTile.featureType}</b></div>}
            {selectedTile.layerBossId && <div className="text-xs border border-rose-900 rounded p-2 text-rose-200">층 보스: {selectedTile.featureName}<br/><span className="text-stone-500">처치 후 다음 층 접근이 해금됩니다.</span></div>}
            {selectedDungeon && <div className="text-xs border border-violet-900 rounded p-2"><b className="text-violet-200">{selectedDungeon.name}</b><div>{selectedDungeon.kind} · {selectedDungeon.size} · 보상 등급 {selectedDungeon.rewardTier}</div><div className="text-stone-500">기믹: {selectedDungeon.gimmickName}</div><button disabled={selectedTile.id!==currentId} onClick={()=>onEnterDungeon?.(selectedDungeon.id)} className="mt-2 w-full p-2 rounded bg-violet-700 text-white font-bold disabled:opacity-40">{selectedTile.id===currentId?'던전 탐사':'이 Hex로 이동해야 입장 가능'}</button></div>}
            {selectedTile.oreVeinId && <button disabled={selectedTile.id!==currentId} onClick={()=>onMine?.(selectedTile.id)} className="w-full p-2 rounded bg-cyan-800 text-cyan-50 font-bold disabled:opacity-40"><Gem className="w-4 inline mr-1"/>{selectedTile.id===currentId?'광맥 채굴':'이 Hex로 이동해야 채굴 가능'}</button>}
            <button disabled={selectedTile.id!==currentId} onClick={()=>onGather?.(selectedTile.id)} className="w-full p-2 rounded bg-emerald-900 text-emerald-100 font-bold disabled:opacity-40">{selectedTile.id===currentId?'생활 자원 채집':'이 Hex로 이동해야 채집 가능'}</button>
            {selectedTile.featureType==='HELL_GATE' && <div className="text-xs border border-red-950 bg-red-950/20 p-2 rounded text-red-300">지옥층은 아직 미구현입니다. 심층 보스 처치 기록만 저장됩니다.</div>}
            {route?.found ? <>
              <div className="text-xs">거리 {Math.max(0,route.tileIds.length-1)}칸 · 예상 {route.totalMinutes}분 · 평균 위험 {route.averageDanger}{route.travelMode==='AIRSHIP'?` · 비행정 연료 ${route.fuelCost||0}`:route.travelMode==='FLIGHT'?' · 직접 비행':''}</div>
              <div className="grid grid-cols-3 gap-1">{(['SHORTEST','FASTEST','SAFEST'] as RoutePreference[]).map((p)=><button key={p} onClick={()=>onChangePreference?.(p)} className={`p-2 rounded border text-[10px] ${pref===p?'border-amber-500':'border-stone-800'}`}>{p==='SHORTEST'?'최단':p==='FASTEST'?'최속':'안전'}</button>)}</div>
              <button disabled={selectedTile.id===currentId} onClick={()=>onTravel(route)} className="w-full p-3 bg-amber-500 text-stone-950 font-bold rounded-xl disabled:opacity-40"><Navigation className="w-4 inline mr-1"/>이동 시작</button>
            </> : <p className="text-rose-300 text-xs">{route?.reason||'경로 없음'}</p>}
          </div> : <div className="text-stone-500">육각형을 선택하세요.</div>}

          {layer==='SURFACE'&&<div className="rounded-xl border border-emerald-900/60 bg-emerald-950/10 p-3 text-xs space-y-1"><b className="text-emerald-200">지상 단일 이동 한도: {surfaceRange.total} Hex</b><div className="text-stone-500">기본 {surfaceRange.base} + 종족 {surfaceRange.raceBonus} + 패시브 {surfaceRange.passiveBonus} + 도구 {surfaceRange.toolBonus} + 장비 {surfaceRange.equipmentBonus}</div></div>}
          {currentWaystation&&<div className="rounded-xl border border-amber-800 bg-amber-950/10 p-3 text-xs space-y-2"><b className="text-amber-200">역참 · {currentWaystation.name}</b><div className="text-stone-500">일반 야외 인카운터를 생략하는 유료 안전노선. 약탈/수상한 상인/가짜 검문 같은 특수 사건은 드물게 발생합니다.</div>{waystationRoutes.map((wr)=>{const dest=getWaystationDestination(wr,currentWaystation.id);return <button key={wr.id} disabled={playerState.rupees<wr.fare} onClick={()=>onWaystationTravel?.(wr)} className="w-full p-2 rounded border border-amber-900 bg-stone-900 disabled:opacity-40 text-left"><b>{dest?.name||'목적지'}</b><span className="float-right">{wr.fare} 루피 · {wr.minutes}분</span></button>})}</div>}
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
