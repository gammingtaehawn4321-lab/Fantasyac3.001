import type {
  HexPosition, HexTerrain, PlayerState, RoutePreference, WorldMapLayer, WorldMapState, WorldRegionId,
} from '../../types';
import { getRegionalMonsterDefinition, getRegionalMonsterPool } from './monsterData';
import { getSectorEncounterProfile } from './sectorEncounters';
import { UNDERGROUND_ENTRANCES, UNDERGROUND_LAYER_BOSSES } from './undergroundDevelopment';
import { WORLD_DUNGEONS } from '../dungeons/dungeonSystem';
import { calculateSurfaceTravelRange, airshipFuelCostForDistance } from './lifeTravelSystem';
import { WAYSTATIONS, getWaystationAt } from './waystationSystem';
import { HOSTILE_SITE_DEFINITIONS, getEnabledHostileSiteDefinitions, type HostileSiteDefinition } from './hostileSiteDefinitions';
import { PHEROMONE_CONFIG, getEffectivePheromoneStrength, pheromoneMonsterWeightMultiplier } from '../pheromoneSystem';

export type MapStructureType = 'CITY' | 'VILLAGE' | 'SHRINE' | 'OUTPOST' | 'PORT' | 'WAYSTATION';
export type MapFeatureType = 'MINE' | 'CANYON' | 'SINKHOLE' | 'DUNGEON_RESERVED' | 'DUNGEON' | 'ORE_VEIN' | 'LAYER_BOSS' | 'HELL_GATE' | 'RESOURCE' | 'ENEMY_OUTPOST' | 'RUIN';

export interface WorldHexTile extends HexPosition {
  id: string;
  regionId: WorldRegionId;
  terrain: HexTerrain;
  movementCost: number;
  dangerLevel: number;
  sectorId: string;
  sectorName: string;
  encounterKey: string;
  locationTag?: string;
  locationName?: string;
  structureType?: MapStructureType;
  structureGroupId?: string;
  districtId?: string;
  featureType?: MapFeatureType;
  featureName?: string;
  undergroundHookId?: string;
  dungeonId?: string;
  oreVeinId?: string;
  layerBossId?: string;
  layerBossClearFlag?: string;
  requiredAccessFlag?: string;
  verticalLinks?: string[];
  roadConnections?: number[];
  waterConnections?: number[];
  visualVariant: number;
  tags: string[];
}

export interface WorldRouteResult {
  found: boolean;
  tileIds: string[];
  totalMinutes: number;
  averageDanger: number;
  totalCost: number;
  reason?: string;
  travelMode?: 'FOOT' | 'AIRSHIP' | 'FLIGHT';
  fuelCost?: number;
  surfaceRangeLimit?: number;
}

export interface TravelStepResult {
  tileId: string;
  minutes: number;
  sectorId?: string;
  eventText?: string;
  monsterId?: string;
  monsterName?: string;
  encounterType: 'NONE' | 'EVENT' | 'MONSTER';
}

export const TECHNICAL_WORLD_LAYOUT_NOTICE =
  'v1.3 지도는 지상·수중·하늘·천공과 함께 거대한 1층 지하 미로 및 2층 심층 미로를 포함합니다. 3층 지옥은 봉인문/플래그만 존재하며 아직 미구현입니다.';

// 이전 1,655 Hex -> 정확히 반올림 1.5배인 2,483 Hex.
const SURFACE_Q = [-17, 17] as const; // 35
const SURFACE_R = [-12, 12] as const; // 25 => 875
const CELESTIAL_Q = [-12, 12] as const; // 25
const CELESTIAL_R = [-9, 9] as const; // 19 => 475
const UNDERWATER_Q = [-10, 6] as const; // 17
const UNDERWATER_R = [5, 13] as const; // 9 => 153
const DEEP_Q = [-9, 5] as const; // 15
const DEEP_R = [7, 13] as const; // 7 => 105

const REGION_CENTERS: Record<Exclude<WorldRegionId, 'SCROZE'>, { q: number; r: number }> = {
  GRANDIA: { q: -12, r: 0 },
  FOREZIN: { q: -4, r: -6 },
  SANTIMAC: { q: 10, r: 2 },
  PROSTI: { q: 8, r: -9 },
  SEIRE: { q: -3, r: 9 },
};

const hash01 = (q: number, r: number, salt = 0) => {
  const n = Math.sin(q * 12.9898 + r * 78.233 + salt * 37.719) * 43758.5453;
  return n - Math.floor(n);
};

const axialDistance = (a: { q: number; r: number }, b: { q: number; r: number }) =>
  (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;

const tileId = (layer: WorldMapLayer, q: number, r: number) => `${layer}:${q}:${r}`;
const directions = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]] as const;

const nearestSurfaceRegion = (q: number, r: number): Exclude<WorldRegionId, 'SCROZE'> => {
  let selected: Exclude<WorldRegionId, 'SCROZE'> = 'GRANDIA';
  let best = Number.POSITIVE_INFINITY;
  (Object.keys(REGION_CENTERS) as Array<Exclude<WorldRegionId, 'SCROZE'>>).forEach((id) => {
    const d = axialDistance({ q, r }, REGION_CENTERS[id]);
    if (d < best) { best = d; selected = id; }
  });
  return selected;
};

function defaultSurfaceSector(regionId: Exclude<WorldRegionId,'SCROZE'>, q:number, r:number): string {
  if (regionId==='GRANDIA') {
    if (q <= -14) return 'grandia_west_hills';
    if (q >= -7 && r <= 1) return 'grandia_forezin_front';
    if (r >= 5) return 'grandia_south_road';
    return 'grandia_central_plains';
  }
  if (regionId==='FOREZIN') {
    if (q <= -7) return 'forezin_invasion_front';
    if (r <= -8 || q >= -1) return 'forezin_mineral_ridge';
    return hash01(q,r,301)<.48 ? 'forezin_river_villages' : 'forezin_deep_forest';
  }
  if (regionId==='SANTIMAC') {
    if (r <= -2) return 'santimac_desert_alto';
    if (q >= 13 || r >= 6) return 'santimac_border_ridges';
    return 'santimac_southlands';
  }
  if (regionId==='PROSTI') {
    if (r <= -10) return 'prosti_summit';
    if (r <= -6) return 'prosti_mid_mountain';
    return 'prosti_lower_snowfield';
  }
  if (regionId==='SEIRE') return r >= 9 || q <= -6 ? 'seire_polluted_coast' : 'seire_surface_waters';
  return 'grandia_central_plains';
}

function terrainForSurface(regionId: Exclude<WorldRegionId,'SCROZE'>, q: number, r: number): HexTerrain {
  const h = hash01(q, r, 1);
  if (regionId === 'GRANDIA') {
    if (q<=-14 || h<.18) return 'HILL';
    return 'PLAINS';
  }
  if (regionId === 'FOREZIN') return h < .82 ? 'FOREST' : 'HILL';
  if (regionId === 'SANTIMAC') return (q>=13 || Math.abs(r-2)>5 || h<.34) ? 'HILL' : 'PLAINS';
  if (regionId === 'PROSTI') {
    const summit=axialDistance({q,r},{q:8,r:-10});
    return summit<4 || h<.48 ? 'MOUNTAIN' : 'SNOW';
  }
  if (regionId === 'SEIRE') return (q>-1 && r<8) ? 'COAST' : 'SEA';
  return 'UNKNOWN';
}

const movementCostForTerrain = (terrain: HexTerrain) => ({
  PLAINS: 1.0, HILL: 1.35, FOREST: 1.45, RIVER: 1.55, URBAN: 0.72, COAST: 1.15,
  SEA: 1.3, DEEP_SEA: 1.8, SNOW: 1.55, MOUNTAIN: 2.35, FLOATING_LAND: 1.0,
  CLOUD: 1.3, STORM: 2.3, SHRINE: 0.8, CAVE: 1.35, TUNNEL: 1.0, UNDERGROUND_RIVER: 1.7, CHASM: 2.55, CRYSTAL_CAVE: 1.55, FUNGAL_CAVE: 1.45, MAGMA_RIFT: 2.8, UNKNOWN: 2.0,
}[terrain] ?? 1.0);

function cubeRound(x:number,y:number,z:number){
  let rx=Math.round(x), ry=Math.round(y), rz=Math.round(z);
  const xd=Math.abs(rx-x), yd=Math.abs(ry-y), zd=Math.abs(rz-z);
  if(xd>yd&&xd>zd) rx=-ry-rz; else if(yd>zd) ry=-rx-rz; else rz=-rx-ry;
  return {q:rx,r:rz};
}
function hexLine(a:{q:number;r:number},b:{q:number;r:number}){
  const n=Math.max(1,axialDistance(a,b)); const out:Array<{q:number;r:number}>=[];
  for(let i=0;i<=n;i++){const t=i/n;const ax=a.q,az=a.r,ay=-ax-az,bx=b.q,bz=b.r,by=-bx-bz;out.push(cubeRound(ax+(bx-ax)*t,ay+(by-ay)*t,az+(bz-az)*t));}
  return Array.from(new Map(out.map(p=>[`${p.q}:${p.r}`,p])).values());
}
function hexDisk(center:{q:number;r:number},radius:number){
  const out:Array<{q:number;r:number}>=[];
  for(let dq=-radius;dq<=radius;dq++) for(let dr=Math.max(-radius,-dq-radius);dr<=Math.min(radius,-dq+radius);dr++) out.push({q:center.q+dq,r:center.r+dr});
  return out;
}

function makeTile(layer:WorldMapLayer,q:number,r:number,regionId:WorldRegionId,terrain:HexTerrain,sectorId:string):WorldHexTile{
  const profile=getSectorEncounterProfile(sectorId);
  return {id:tileId(layer,q,r),q,r,layer,regionId,terrain,movementCost:movementCostForTerrain(terrain),dangerLevel:Math.round(1+hash01(q,r,3+layer.length)*4),sectorId,sectorName:profile?.name||sectorId,encounterKey:`${sectorId}:${layer}:${q}:${r}`,visualVariant:Math.floor(hash01(q,r,119)*5),tags:[]};
}


function undergroundTerrainFor(regionId: Exclude<WorldRegionId,'SCROZE'>, q:number, r:number, isMainTunnel:boolean, deep=false): HexTerrain {
  if (isMainTunnel && hash01(q,r,601+(deep?71:0)) < .68) return 'TUNNEL';
  const h=hash01(q,r,603+(deep?97:0));
  if (deep) {
    if (regionId==='FOREZIN') return h<.30?'FUNGAL_CAVE':h<.48?'UNDERGROUND_RIVER':h<.67?'CRYSTAL_CAVE':h<.82?'CHASM':'CAVE';
    if (regionId==='SEIRE') return h<.38?'UNDERGROUND_RIVER':h<.58?'CRYSTAL_CAVE':h<.80?'CHASM':'CAVE';
    if (regionId==='PROSTI') return h<.42?'CRYSTAL_CAVE':h<.60?'FUNGAL_CAVE':h<.80?'CHASM':'CAVE';
    if (regionId==='SANTIMAC') return h<.20?'MAGMA_RIFT':h<.43?'CHASM':h<.65?'CRYSTAL_CAVE':'CAVE';
    return h<.22?'FUNGAL_CAVE':h<.42?'CRYSTAL_CAVE':h<.61?'CHASM':'CAVE';
  }
  if (regionId==='FOREZIN') return h<.25?'UNDERGROUND_RIVER':h<.40?'FUNGAL_CAVE':h<.55?'CRYSTAL_CAVE':h<.66?'CHASM':'CAVE';
  if (regionId==='SEIRE') return h<.42?'UNDERGROUND_RIVER':h<.63?'CAVE':h<.82?'CHASM':'CRYSTAL_CAVE';
  if (regionId==='PROSTI') return h<.34?'CRYSTAL_CAVE':h<.54?'CHASM':h<.66?'TUNNEL':'CAVE';
  if (regionId==='SANTIMAC') return h<.28?'CHASM':h<.47?'CRYSTAL_CAVE':h<.64?'TUNNEL':'CAVE';
  return h<.22?'UNDERGROUND_RIVER':h<.40?'CRYSTAL_CAVE':h<.55?'CHASM':'CAVE';
}

const DEEP_SECTORS:Record<Exclude<WorldRegionId,'SCROZE'>,[string,string,string]>={
  GRANDIA:['grandia_deep_labyrinth','grandia_deep_oresea','grandia_deep_abyss'],
  FOREZIN:['forezin_deep_rootmaze','forezin_deep_sporesea','forezin_deep_oreheart'],
  SEIRE:['seire_deep_bluegrotto','seire_deep_ruins','seire_deep_abyss'],
  SANTIMAC:['santimac_deep_glassmaze','santimac_deep_orevault','santimac_deep_abyss'],
  PROSTI:['prosti_deep_crystalmaze','prosti_deep_frosthollow','prosti_deep_abyss'],
};
const UNDERGROUND_VILLAGES:Record<Exclude<WorldRegionId,'SCROZE'>,{name:string;tag:string}>={
  GRANDIA:{name:'암석등 마을',tag:'UG_VILLAGE_GRANDIA'},FOREZIN:{name:'뿌리샘 부락',tag:'UG_VILLAGE_FOREZIN'},SEIRE:{name:'청해굴 마을',tag:'UG_VILLAGE_SEIRE'},SANTIMAC:{name:'석풍 마을',tag:'UG_VILLAGE_SANTIMAC'},PROSTI:{name:'빙등 취락',tag:'UG_VILLAGE_PROSTI'},
};

// 심층은 지상 좌표와 무관한 더 깊은 공간이므로 지역별 전용 좌표권을 사용한다.
// 1층 보스에서 이 좌표의 심층 입구로 수직 링크가 이어져 서로 다른 지역 심층 미로가 겹치지 않는다.
const DEEP_ANCHORS:Record<Exclude<WorldRegionId,'SCROZE'>,{q:number;r:number}>={
  GRANDIA:{q:-48,r:0}, FOREZIN:{q:-12,r:-42}, SEIRE:{q:-42,r:38}, SANTIMAC:{q:42,r:18}, PROSTI:{q:30,r:-38},
};

function buildUndergroundNetworks(tiles:Record<string,WorldHexTile>) {
  const regions=(['GRANDIA','FOREZIN','SEIRE','SANTIMAC','PROSTI'] as const);
  for (const regionId of regions) {
    const entrances=UNDERGROUND_ENTRANCES.filter((entry)=>entry.regionId===regionId);
    const mainEntrances=entrances.filter(e=>!e.isolatedPocket);
    const isolatedEntrances=entrances.filter(e=>e.isolatedPocket);
    if (!mainEntrances.length) continue;
    const hub=mainEntrances.find((entry)=>entry.type==='DUNGEON_RESERVED') || mainEntrances[0];
    const cells=new Map<string,{q:number;r:number;main:boolean}>();
    const isolatedZones=isolatedEntrances.map(e=>({q:e.q,r:e.r}));
    const allowed=(q:number,r:number)=>nearestSurfaceRegion(q,r)===regionId && axialDistance({q,r},{q:hub.q,r:hub.r})<=16 && !isolatedZones.some(p=>axialDistance({q,r},p)<=2);
    const add=(q:number,r:number,main=false)=>{if(!allowed(q,r))return;const k=`${q}:${r}`;const old=cells.get(k);cells.set(k,{q,r,main:Boolean(main||old?.main)});};

    // 입구 공동을 넓게 만들고 주 갱도를 서로 연결한다.
    for (const entry of mainEntrances) {
      hexDisk({q:entry.q,r:entry.r},3).forEach((p)=>add(p.q,p.r,false));
      hexLine({q:entry.q,r:entry.r},{q:hub.q,r:hub.r}).forEach((p)=>{add(p.q,p.r,true);hexDisk(p,1).forEach(n=>{if(hash01(n.q,n.r,701)>.62)add(n.q,n.r,false);});});
    }
    // 수십 갈래의 굴곡진 가지/막다른 공동을 만들어 거대한 미로형 동굴망을 만든다.
    const seeds=[...cells.values()];
    for(let branch=0;branch<42;branch++){
      const startCell=seeds[Math.floor(hash01(branch,regionId.length,711)*Math.max(1,seeds.length))]||{q:hub.q,r:hub.r};
      let cq=startCell.q,cr=startCell.r; const len=8+Math.floor(hash01(branch,hub.q,713)*13);
      for(let step=0;step<len;step++){
        const di=Math.floor(hash01(cq+branch*3,cr-step,719)*6)%6;const [dq,dr]=directions[di];
        const nq=cq+dq,nr=cr+dr;if(!allowed(nq,nr))continue;cq=nq;cr=nr;add(cq,cr,step%5===0);
        if(step%4===0&&hash01(cq,cr,727)>.48)hexDisk({q:cq,r:cr},1).forEach(p=>add(p.q,p.r,false));
      }
    }

    // 고립 공동: 특정 싱크홀 하나로만 접근 가능. 주 동굴망과 연결하지 않는다.
    for(const entry of isolatedEntrances){
      const pocket=new Map<string,{q:number;r:number}>();const padd=(q:number,r:number)=>{if(nearestSurfaceRegion(q,r)!==regionId)return;if([...cells.values()].some(c=>axialDistance({q,r},c)<=1))return;pocket.set(`${q}:${r}`,{q,r});};
      hexDisk({q:entry.q,r:entry.r},3).forEach(p=>padd(p.q,p.r));let cq=entry.q,cr=entry.r;
      for(let step=0;step<18;step++){const di=Math.floor(hash01(cq,cr,801+step)*6)%6;const[dq,dr]=directions[di];cq+=dq;cr+=dr;if(axialDistance({q:cq,r:cr},entry)<=5){padd(cq,cr);if(step%5===0)hexDisk({q:cq,r:cr},1).forEach(p=>padd(p.q,p.r));}}
      for(const cell of pocket.values()){
        const id=tileId('UNDERGROUND',cell.q,cell.r);if(tiles[id])continue;const terrain=undergroundTerrainFor(regionId,cell.q,cell.r,false,false);const t=makeTile('UNDERGROUND',cell.q,cell.r,regionId,terrain,entry.sectorId);t.tags.push('UNDERGROUND','CAVE_NETWORK','ISOLATED_SINKHOLE_CAVERN');t.dangerLevel=Math.max(3,t.dangerLevel+1);tiles[id]=t;
      }
    }

    for (const cell of cells.values()) {
      const nearest=[...mainEntrances].sort((a,b)=>axialDistance(cell,a)-axialDistance(cell,b))[0];
      if (!nearest) continue; const terrain=undergroundTerrainFor(regionId,cell.q,cell.r,cell.main,false);const id=tileId('UNDERGROUND',cell.q,cell.r);
      if (tiles[id]) continue;const t=makeTile('UNDERGROUND',cell.q,cell.r,regionId,terrain,nearest.sectorId);t.tags.push('UNDERGROUND','CAVE_NETWORK','LABYRINTH',cell.main?'MAIN_TUNNEL':'SIDE_CAVERN');t.dangerLevel=Math.max(2,t.dangerLevel+1);tiles[id]=t;
    }

    for (const entry of entrances) {
      let t=tiles[tileId('UNDERGROUND',entry.q,entry.r)];
      if(!t){t=makeTile('UNDERGROUND',entry.q,entry.r,regionId,'CAVE',entry.sectorId);tiles[t.id]=t;}
      t.locationTag=`UNDERGROUND_ENTRY_${entry.hookId}`;t.locationName=entry.undergroundName;t.featureType=entry.type;t.featureName=entry.undergroundName;t.undergroundHookId=entry.hookId;t.tags.push('LOCATION','UNDERGROUND_ENTRANCE',entry.isolatedPocket?'ISOLATED_ENTRY':'MAIN_ENTRY');
    }

    // 1층 지역 보스는 주 동굴망에서 허브와 가장 먼 칸에 배치한다.
    const allMainTiles=[...cells.values()].map(c=>tiles[tileId('UNDERGROUND',c.q,c.r)]).filter((t):t is WorldHexTile=>Boolean(t&&t.regionId===regionId));
    const reachableMainIds=new Set<string>();const hubTile=tiles[tileId('UNDERGROUND',hub.q,hub.r)];
    if(hubTile){const queue=[hubTile];reachableMainIds.add(hubTile.id);while(queue.length){const cur=queue.shift()!;for(const[dq,dr]of directions){const n=tiles[tileId('UNDERGROUND',cur.q+dq,cur.r+dr)];if(n&&n.regionId===regionId&&!reachableMainIds.has(n.id)){reachableMainIds.add(n.id);queue.push(n);}}}}
    const mainTiles=allMainTiles.filter(t=>reachableMainIds.has(t.id));
    const bossTile=[...mainTiles].sort((a,b)=>axialDistance(b,hub)-axialDistance(a,hub))[0];
    const firstBoss=UNDERGROUND_LAYER_BOSSES.find(b=>b.regionId===regionId&&b.layer==='UNDERGROUND');
    if(bossTile&&firstBoss){bossTile.featureType='LAYER_BOSS';bossTile.featureName=firstBoss.name;bossTile.layerBossId=firstBoss.monsterId;bossTile.layerBossClearFlag=firstBoss.clearFlag;bossTile.locationTag=`UNDERGROUND_BOSS_${regionId}`;bossTile.locationName=firstBoss.name;bossTile.tags.push('LAYER_BOSS','DEPTH_GATE');}

    // 지하 마을 1곳/지역. radius 1 = 7칸의 연결된 생활권.
    const villageInfo=UNDERGROUND_VILLAGES[regionId];
    const villageCandidates=[...mainTiles].sort((a,b)=>Math.abs(axialDistance(a,hub)-4)-Math.abs(axialDistance(b,hub)-4));
    const villageCenter=villageCandidates.find((candidate)=>isolatedEntrances.every((entry)=>axialDistance(candidate,entry)>=6)&&hexDisk(candidate,1).every((p)=>{const occupied=tiles[tileId('UNDERGROUND',p.q,p.r)];return !occupied||occupied.regionId===regionId;}))||tiles[tileId('UNDERGROUND',hub.q,hub.r)];
    if(villageCenter){hexDisk(villageCenter,1).forEach((p,idx)=>{let t=tiles[tileId('UNDERGROUND',p.q,p.r)];if(t&&t.regionId!==regionId)return;if(!t){t=makeTile('UNDERGROUND',p.q,p.r,regionId,'CAVE',mainEntrances[0].sectorId);tiles[t.id]=t;}t.structureType='VILLAGE';t.structureGroupId=villageInfo.tag;t.districtId=`${villageInfo.tag}_${idx+1}`;t.tags.push('UNDERGROUND_VILLAGE','SAFE_ZONE');if(p.q===villageCenter.q&&p.r===villageCenter.r){t.locationTag=villageInfo.tag;t.locationName=villageInfo.name;}});}

    // 2층 심층: 1층 보스 아래에서 시작해 더 넓고 위험한 독립 미로를 만든다.
    if(bossTile&&firstBoss){
      const deepAnchor=DEEP_ANCHORS[regionId];
      const deepCells=new Map<string,{q:number;r:number;main:boolean}>();const deepAdd=(q:number,r:number,main=false)=>{if(axialDistance({q,r},deepAnchor)>18)return;const k=`${q}:${r}`;const old=deepCells.get(k);deepCells.set(k,{q,r,main:Boolean(main||old?.main)});};
      hexDisk(deepAnchor,4).forEach(p=>deepAdd(p.q,p.r,false));
      for(let branch=0;branch<58;branch++){let cq=deepAnchor.q,cr=deepAnchor.r;const drift=4+Math.floor(hash01(branch,deepAnchor.q,907)*8);for(let pre=0;pre<drift;pre++){const di=Math.floor(hash01(branch+pre,cr,911)*6)%6;const[dq,dr]=directions[di];cq+=dq;cr+=dr;deepAdd(cq,cr,true);}const len=9+Math.floor(hash01(branch,deepAnchor.r,919)*16);for(let step=0;step<len;step++){const di=Math.floor(hash01(cq+step,cr-branch,929)*6)%6;const[dq,dr]=directions[di];const nq=cq+dq,nr=cr+dr;if(axialDistance({q:nq,r:nr},deepAnchor)>18)continue;cq=nq;cr=nr;deepAdd(cq,cr,step%6===0);if(step%5===0&&hash01(cq,cr,937)>.44)hexDisk({q:cq,r:cr},1).forEach(p=>deepAdd(p.q,p.r,false));}}
      const sectorIds=DEEP_SECTORS[regionId];
      for(const cell of deepCells.values()){
        const d=axialDistance(cell,deepAnchor);const bucket=d>12?2:hash01(cell.q,cell.r,941)>.55?1:0;const sectorId=sectorIds[bucket];const terrain=undergroundTerrainFor(regionId,cell.q,cell.r,cell.main,true);const id=tileId('DEEP_UNDERGROUND',cell.q,cell.r);if(tiles[id])continue;const t=makeTile('DEEP_UNDERGROUND',cell.q,cell.r,regionId,terrain,sectorId);t.requiredAccessFlag=firstBoss.clearFlag;t.tags.push('UNDERGROUND','DEEP_UNDERGROUND','LABYRINTH',cell.main?'MAIN_TUNNEL':'SIDE_CAVERN');t.dangerLevel=Math.min(5,Math.max(4,t.dangerLevel+3));t.movementCost*=1.08;tiles[id]=t;
      }
      const deepEntry=tiles[tileId('DEEP_UNDERGROUND',deepAnchor.q,deepAnchor.r)];if(deepEntry){deepEntry.locationTag=`DEEP_ENTRY_${regionId}`;deepEntry.locationName=`${regionId} 심층 하강점`;deepEntry.tags.push('DEEP_ENTRY');}
      const deepTiles=[...deepCells.values()].map(c=>tiles[tileId('DEEP_UNDERGROUND',c.q,c.r)]).filter((t):t is WorldHexTile=>Boolean(t&&t.regionId===regionId));
      const deepBossTile=[...deepTiles].sort((a,b)=>axialDistance(b,deepAnchor)-axialDistance(a,deepAnchor))[0];const deepBoss=UNDERGROUND_LAYER_BOSSES.find(b=>b.regionId===regionId&&b.layer==='DEEP_UNDERGROUND');
      if(deepBossTile&&deepBoss){deepBossTile.featureType='LAYER_BOSS';deepBossTile.featureName=deepBoss.name;deepBossTile.layerBossId=deepBoss.monsterId;deepBossTile.layerBossClearFlag=deepBoss.clearFlag;deepBossTile.locationTag=`DEEP_BOSS_${regionId}`;deepBossTile.locationName=deepBoss.name;deepBossTile.tags.push('LAYER_BOSS','HELL_UNLOCK_BOSS');
        const gatePos=directions.map(([dq,dr])=>({q:deepBossTile.q+dq,r:deepBossTile.r+dr})).find(p=>Boolean(tiles[tileId('DEEP_UNDERGROUND',p.q,p.r)]));if(gatePos){const gate=tiles[tileId('DEEP_UNDERGROUND',gatePos.q,gatePos.r)];gate.featureType='HELL_GATE';gate.featureName='지옥층 봉인문 · 미구현';gate.requiredAccessFlag=deepBoss.clearFlag;gate.locationTag=`HELL_GATE_${regionId}`;gate.locationName='지옥층 봉인문';gate.tags.push('HELL_GATE','NOT_IMPLEMENTED');}}
    }
  }

  // 생성 과정에서 생긴 단독 1칸 조각은 실제 입구에서 도달할 수 없으므로 제거한다.
  // 의도적으로 고립된 공동은 싱크홀 자체가 입구이므로 그대로 보존된다.
  for(const regionId of regions){
    const seeds=UNDERGROUND_ENTRANCES.filter(e=>e.regionId===regionId).map(e=>tiles[tileId('UNDERGROUND',e.q,e.r)]).filter((t):t is WorldHexTile=>Boolean(t));
    const reachable=new Set<string>();const queue=[...seeds];seeds.forEach(t=>reachable.add(t.id));
    while(queue.length){const cur=queue.shift()!;for(const[dq,dr]of directions){const n=tiles[tileId('UNDERGROUND',cur.q+dq,cur.r+dr)];if(n&&n.regionId===regionId&&!reachable.has(n.id)){reachable.add(n.id);queue.push(n);}}}
    Object.values(tiles).filter(t=>t.layer==='UNDERGROUND'&&t.regionId===regionId&&!reachable.has(t.id)).forEach(t=>delete tiles[t.id]);
  }

  // 광맥: 1층보다 심층에서 더 자주 나타나며 심층 광맥은 보상 등급도 높다.
  const oreNames:Record<Exclude<WorldRegionId,'SCROZE'>,string>={GRANDIA:'철맥 광맥',FOREZIN:'수액결정 광맥',SEIRE:'청해 수정광맥',SANTIMAC:'흑유리 보석광맥',PROSTI:'빙정 광맥'};
  Object.values(tiles).forEach(t=>{if((t.layer!=='UNDERGROUND'&&t.layer!=='DEEP_UNDERGROUND')||t.regionId==='SCROZE'||t.structureType||t.featureType)return;const chance=t.layer==='DEEP_UNDERGROUND'?.095:.06;if(hash01(t.q,t.r,1009+t.layer.length)<chance){t.featureType='ORE_VEIN';t.oreVeinId=`ore_${t.regionId.toLowerCase()}_${t.layer.toLowerCase()}_${t.q}_${t.r}`;t.featureName=`${oreNames[t.regionId as Exclude<WorldRegionId,'SCROZE'>]}${t.layer==='DEEP_UNDERGROUND'?' · 심층':''}`;t.tags.push('ORE_VEIN',t.layer==='DEEP_UNDERGROUND'?'RICH_VEIN':'COMMON_VEIN');}});
}

function applyDungeonPlacements(tiles:Record<string,WorldHexTile>){
  const occupied:WorldHexTile[]=[];
  for(const dungeon of WORLD_DUNGEONS){
    let candidates=Object.values(tiles).filter(t=>t.layer===dungeon.layer&&t.regionId===dungeon.regionId&&!t.structureType&&!t.featureType&&!t.layerBossId);
    if(dungeon.layer==='SKY'||dungeon.layer==='CELESTIAL')candidates=candidates.filter(t=>t.terrain==='FLOATING_LAND'||t.terrain==='SHRINE');
    else candidates=candidates.filter(t=>['CAVE','TUNNEL','CRYSTAL_CAVE','FUNGAL_CAVE','UNDERGROUND_RIVER','CHASM'].includes(t.terrain));
    const spaced=candidates.filter(t=>occupied.every(o=>o.layer!==t.layer||axialDistance(o,t)>=4));if(spaced.length)candidates=spaced;
    candidates.sort((a,b)=>hash01(a.q,a.r,dungeon.id.length+1117)-hash01(b.q,b.r,dungeon.id.length+1117));const t=candidates[0];if(!t)continue;t.featureType='DUNGEON';t.dungeonId=dungeon.id;t.featureName=dungeon.name;t.locationName=dungeon.name;t.tags.push('DUNGEON_ENTRANCE',dungeon.kind,dungeon.size);occupied.push(t);
  }
}

function buildWorldMap(): Record<string, WorldHexTile> {
  const tiles: Record<string, WorldHexTile> = {};
  for (let q = SURFACE_Q[0]; q <= SURFACE_Q[1]; q++) for (let r = SURFACE_R[0]; r <= SURFACE_R[1]; r++) {
    const regionId = nearestSurfaceRegion(q, r);
    const sectorId=defaultSurfaceSector(regionId,q,r);
    const terrain=terrainForSurface(regionId,q,r);
    tiles[tileId('SURFACE',q,r)] = makeTile('SURFACE',q,r,regionId,terrain,sectorId);
  }

  for (let q = UNDERWATER_Q[0]; q <= UNDERWATER_Q[1]; q++) for (let r = UNDERWATER_R[0]; r <= UNDERWATER_R[1]; r++) {
    const sectorId=(q<=-6||r>=11)?'seire_polluted_shelf':'seire_polluted_shelf';
    const t=makeTile('UNDERWATER',q,r,'SEIRE','SEA',sectorId);t.tags.push('AQUATIC');tiles[t.id]=t;
  }
  for (let q = DEEP_Q[0]; q <= DEEP_Q[1]; q++) for (let r = DEEP_R[0]; r <= DEEP_R[1]; r++) {
    const t=makeTile('DEEP_SEA',q,r,'SEIRE','DEEP_SEA','seire_deep_trench');t.tags.push('AQUATIC','DEEP');t.dangerLevel=Math.max(3,t.dangerLevel);tiles[t.id]=t;
  }

  // 하늘 전체. 부유 육지는 전체의 약 1/5이며, 서로 고립되지 않도록 작은 군집 노이즈를 사용한다.
  for (let q = SURFACE_Q[0]; q <= SURFACE_Q[1]; q++) for (let r = SURFACE_R[0]; r <= SURFACE_R[1]; r++) {
    const cluster=(hash01(Math.floor(q/2),Math.floor(r/2),10)*.65+hash01(q,r,12)*.35);
    const storm=hash01(q,r,15)>.91;
    const terrain:HexTerrain=cluster<.205?'FLOATING_LAND':storm?'STORM':'CLOUD';
    const sectorId=terrain==='STORM'?'scroze_stormbelt':terrain==='FLOATING_LAND'?'scroze_floating_isles':'scroze_open_sky';
    const t=makeTile('SKY',q,r,'SCROZE',terrain,sectorId);if(terrain==='FLOATING_LAND')t.tags.push('FLOATING_LAND');if(storm)t.dangerLevel=5;tiles[t.id]=t;
  }
  for (let q = CELESTIAL_Q[0]; q <= CELESTIAL_Q[1]; q++) for (let r = CELESTIAL_R[0]; r <= CELESTIAL_R[1]; r++) {
    const cluster=(hash01(Math.floor(q/2),Math.floor(r/2),20)*.6+hash01(q,r,22)*.4);
    const terrain:HexTerrain=cluster<.30?'FLOATING_LAND':hash01(q,r,25)>.92?'STORM':'CLOUD';
    const t=makeTile('CELESTIAL',q,r,'SCROZE',terrain,'scroze_celestial_open');t.tags.push('HIGH_ALTITUDE');t.dangerLevel=Math.max(2,t.dangerLevel);tiles[t.id]=t;
  }

  const applyFootprint=(layer:WorldMapLayer,center:{q:number;r:number},radius:number,opts:{regionId:WorldRegionId;terrain?:HexTerrain;sectorId:string;structure:MapStructureType;groupId:string;centerTag?:string;centerName?:string;districtPrefix?:string})=>{
    const cells=hexDisk(center,radius);
    cells.forEach((p,idx)=>{const t=tiles[tileId(layer,p.q,p.r)];if(!t)return;t.regionId=opts.regionId;t.terrain=opts.terrain||t.terrain;t.movementCost=movementCostForTerrain(t.terrain);t.sectorId=opts.sectorId;t.sectorName=getSectorEncounterProfile(opts.sectorId)?.name||opts.sectorId;t.structureType=opts.structure;t.structureGroupId=opts.groupId;t.districtId=`${opts.districtPrefix||opts.groupId}_${idx+1}`;t.tags.push('LOCATION_ZONE',opts.structure);if(p.q===center.q&&p.r===center.r){t.locationTag=opts.centerTag;t.locationName=opts.centerName;t.tags.push('LOCATION');}});
  };

  // 대도시: radius 2 = 19칸으로 최소 10칸을 여유 있게 충족.
  applyFootprint('SURFACE',{q:-12,r:0},2,{regionId:'GRANDIA',terrain:'URBAN',sectorId:'grandia_peless',structure:'CITY',groupId:'THE_PELLESS',centerTag:'THE_PELLESS_LOWER',centerName:'더 펠리스'});
  applyFootprint('SURFACE',{q:-3,r:9},2,{regionId:'SEIRE',terrain:'URBAN',sectorId:'seire_sky_city',structure:'CITY',groupId:'SKY_CITY',centerTag:'SKY_PORT',centerName:'수상도시 스카이'});
  applyFootprint('UNDERWATER',{q:-3,r:9},2,{regionId:'SEIRE',terrain:'URBAN',sectorId:'seire_aquaria',structure:'CITY',groupId:'AQUARIA',centerTag:'AQUARIA',centerName:'아쿠아리아'});
  applyFootprint('SURFACE',{q:10,r:2},2,{regionId:'SANTIMAC',terrain:'URBAN',sectorId:'santimac_remusian',structure:'CITY',groupId:'REMUSIAN',centerTag:'REMUSIAN_OUTER',centerName:'레무시안'});
  applyFootprint('SURFACE',{q:9,r:-4},2,{regionId:'SANTIMAC',terrain:'URBAN',sectorId:'santimac_desert_alto',structure:'CITY',groupId:'DESERT_ALTO',centerTag:'DESERT_ALTO_GATE',centerName:'데저트 알토'});

  // 부락/마을: radius 1 = 7칸, 최소 3칸 충족.
  const villages=[
    ['SURFACE',-5,-6,'FOREZIN','forezin_river_villages','FOREZIN_RIVER_VILLAGE','포레진 강변 부락'],['SURFACE',-8,-4,'FOREZIN','forezin_river_villages','FOREZIN_WEST_VILLAGE','포레진 서부 부락'],['SURFACE',-2,-8,'FOREZIN','forezin_deep_forest','FOREZIN_NORTH_VILLAGE','포레진 북부 부락'],['SURFACE',0,-4,'FOREZIN','forezin_river_villages','FOREZIN_EAST_VILLAGE','포레진 동부 부락'],['SURFACE',-6,-9,'FOREZIN','forezin_mineral_ridge','FOREZIN_RIDGE_VILLAGE','포레진 능선 부락'],
    ['SURFACE',8,-8,'PROSTI','prosti_settlement','PROSTI_VILLAGE','설인·늑대 수인 공생 취락'],
    ['SKY',2,-2,'SCROZE','scroze_sky_village','SKY_VILLAGE','새 수인 부유 부락'],['SKY',-9,-2,'SCROZE','scroze_sky_village','SKY_WEST_VILLAGE','서풍 부유 부락'],['SKY',7,4,'SCROZE','scroze_sky_village','SKY_SOUTH_VILLAGE','남운 부유 부락'],
  ] as const;
  villages.forEach(([layer,q,r,regionId,sectorId,tag,name])=>applyFootprint(layer,{q,r},1,{regionId,terrain:layer==='SKY'?'FLOATING_LAND':undefined,sectorId,structure:'VILLAGE',groupId:tag,centerTag:tag,centerName:name}));

  // 2.0 생활·이동 패치: 20개 역참. 개별 Hex 거점이며 역참 노선은 일반 랜덤 인카운터를 건너뛴다.
  WAYSTATIONS.forEach((ws)=>{const t=tiles[tileId('SURFACE',ws.q,ws.r)];if(!t)return;t.regionId=ws.regionId;t.structureType='WAYSTATION';t.structureGroupId=ws.id;t.locationTag=`WAYSTATION_${ws.id.toUpperCase()}`;t.locationName=ws.name;t.tags.push('WAYSTATION','SAFE_ROUTE_NODE','ROAD','LOCATION');t.movementCost=Math.min(t.movementCost,.82);});

  // 프로스티 정상과 하늘 자연 진입구.
  const summit=tiles[tileId('SURFACE',8,-11)];if(summit){summit.locationTag='PROSTI_SUMMIT';summit.locationName='대설산 중앙 정상';summit.sectorId='prosti_summit';summit.sectorName='대설산 정상권';summit.tags.push('LOCATION','SKY_GATE');}
  const skyGate=tiles[tileId('SKY',8,-11)];if(skyGate){skyGate.locationTag='PROSTI_SKY_GATE';skyGate.locationName='대설산 상공';skyGate.tags.push('LOCATION','SKY_GATE');}

  // 에도와는 고정 신사권. radius 2의 하나의 연결된 천공 대지로 보이게 한다.
  applyFootprint('CELESTIAL',{q:-5,r:1},2,{regionId:'SCROZE',terrain:'SHRINE',sectorId:'scroze_edowa',structure:'SHRINE',groupId:'EDOWA',centerTag:'EDOWA_APPROACH',centerName:'에도와'});

  // 연결형 도로. 도시/부락을 실제 선형 네트워크로 묶는다.
  const markRoad=(layer:WorldMapLayer,a:{q:number;r:number},b:{q:number;r:number})=>hexLine(a,b).forEach(p=>{const t=tiles[tileId(layer,p.q,p.r)];if(t){t.tags.push('ROAD');}});
  markRoad('SURFACE',{q:-12,r:0},{q:-5,r:-6});
  markRoad('SURFACE',{q:-12,r:0},{q:10,r:2});
  markRoad('SURFACE',{q:-12,r:0},{q:-3,r:9});
  markRoad('SURFACE',{q:-5,r:-6},{q:-8,r:-4});markRoad('SURFACE',{q:-5,r:-6},{q:-2,r:-8});markRoad('SURFACE',{q:-5,r:-6},{q:0,r:-4});markRoad('SURFACE',{q:-5,r:-6},{q:-6,r:-9});
  markRoad('SURFACE',{q:10,r:2},{q:9,r:-4});markRoad('SURFACE',{q:10,r:2},{q:8,r:-8});markRoad('SURFACE',{q:8,r:-8},{q:8,r:-11});

  // 포레진의 강줄기를 연속 선으로 조각한다.
  const markRiver=(a:{q:number;r:number},b:{q:number;r:number})=>hexLine(a,b).forEach(p=>{const t=tiles[tileId('SURFACE',p.q,p.r)];if(t&&t.regionId==='FOREZIN'&&!t.structureType){t.terrain='RIVER';t.movementCost=movementCostForTerrain('RIVER');t.tags.push('WATERWAY');}});
  markRiver({q:-9,r:-9},{q:-5,r:-6});markRiver({q:-5,r:-6},{q:0,r:-4});markRiver({q:-5,r:-6},{q:-8,r:-4});markRiver({q:-2,r:-8},{q:-5,r:-6});

  // 지하 입구/특수지형. 대륙 5지역의 예약 훅은 실제 UNDERGROUND 동굴망과 연결된다.
  const features:Array<[WorldMapLayer,number,number,MapFeatureType,string,string?]>=[
    ['SURFACE',-15,-2,'MINE','왕도 서부 광산','UG_GRANDIA_MINE_01'],['SURFACE',-10,4,'CANYON','그란디아 붉은 협곡','UG_GRANDIA_CANYON_01'],['SURFACE',-14,4,'SINKHOLE','초원 싱크홀','UG_GRANDIA_SINK_01'],['SURFACE',-8,-2,'DUNGEON_RESERVED','미개방 던전 부지','UG_GRANDIA_DUNGEON_01'],
    ['SURFACE',-4,-10,'MINE','포레진 광맥 갱도','UG_FOREZIN_MINE_01'],['SURFACE',-1,-7,'CANYON','수림 협곡','UG_FOREZIN_CANYON_01'],['SURFACE',-7,-7,'SINKHOLE','뿌리 싱크홀','UG_FOREZIN_SINK_01'],['SURFACE',-2,-4,'DUNGEON_RESERVED','숲속 봉인 유적','UG_FOREZIN_DUNGEON_01'],
    ['SURFACE',13,-1,'MINE','산티맥 동부 광산','UG_SANTIMAC_MINE_01'],['SURFACE',14,4,'CANYON','산티맥 대협곡','UG_SANTIMAC_CANYON_01'],['SURFACE',6,3,'SINKHOLE','남부 함몰지','UG_SANTIMAC_SINK_01'],['SURFACE',12,6,'DUNGEON_RESERVED','폐쇄된 석문','UG_SANTIMAC_DUNGEON_01'],
    ['SURFACE',11,-9,'MINE','빙벽 광산','UG_PROSTI_MINE_01'],['SURFACE',5,-10,'CANYON','빙설 대협곡','UG_PROSTI_CANYON_01'],['SURFACE',9,-12,'SINKHOLE','빙하 싱크홀','UG_PROSTI_SINK_01'],['SURFACE',4,-8,'DUNGEON_RESERVED','얼어붙은 던전 입구','UG_PROSTI_DUNGEON_01'],
    ['UNDERWATER',-5,11,'MINE','해저 광맥','UG_SEIRE_MINE_01'],['UNDERWATER',-7,10,'SINKHOLE','청색 심공','UG_SEIRE_SINK_01'],['UNDERWATER',1,11,'DUNGEON_RESERVED','침수 유적 입구','UG_SEIRE_DUNGEON_01'],
    ['SKY',4,-4,'RESOURCE','부유 수정 광맥'],['SKY',-8,5,'DUNGEON_RESERVED','공중 폐허 관문','UG_SKY_DUNGEON_01'],['SKY',10,0,'ENEMY_OUTPOST','공중 적 거점'],
    ['CELESTIAL',4,3,'DUNGEON_RESERVED','천공 봉인문','UG_CELESTIAL_DUNGEON_01'],['CELESTIAL',8,-2,'ENEMY_OUTPOST','천공 약탈대 거점'],['CELESTIAL',0,6,'RESOURCE','천공 결정지'],
  ];
  features.forEach(([layer,q,r,feature,name,hook])=>{const t=tiles[tileId(layer,q,r)];if(!t)return;t.featureType=feature;t.featureName=name;t.undergroundHookId=hook;t.tags.push('MAP_FEATURE',feature);if(hook)t.tags.push('UNDERGROUND_FUTURE_HOOK');});

  // 예약 입구를 실제 지역별 지하/심층 미로로 확장한다.
  buildUndergroundNetworks(tiles);
  // 심층 던전·하늘 신전·천공 대신전을 월드맵 실제 Hex에 배치한다.
  applyDungeonPlacements(tiles);

  // 연결 방향을 저장해 SVG가 실제로 이어지는 도로/강을 그릴 수 있게 한다.
  Object.values(tiles).forEach(t=>{
    t.encounterKey=`${t.sectorId}:${t.layer}:${t.q}:${t.r}`;
    t.roadConnections=[];t.waterConnections=[];
    directions.forEach(([dq,dr],idx)=>{const n=tiles[tileId(t.layer,t.q+dq,t.r+dr)];if(!n)return;if(t.tags.includes('ROAD')&&n.tags.includes('ROAD'))t.roadConnections!.push(idx);if((t.terrain==='RIVER'||t.terrain==='UNDERGROUND_RIVER')&&(n.terrain==='RIVER'||n.terrain==='UNDERGROUND_RIVER'))t.waterConnections!.push(idx);});
  });

  const link=(a:string,b:string) => {if (!tiles[a] || !tiles[b]) return;tiles[a].verticalLinks=[...(tiles[a].verticalLinks||[]),b];tiles[b].verticalLinks=[...(tiles[b].verticalLinks||[]),a];};
  UNDERGROUND_ENTRANCES.forEach((entry)=>link(tileId(entry.sourceLayer,entry.q,entry.r),tileId('UNDERGROUND',entry.q,entry.r)));
  // 지역별 1층 보스 타일 아래로 심층이 이어진다. 실제 진입은 canEnterHex의 보스 클리어 플래그가 제한한다.
  (['GRANDIA','FOREZIN','SEIRE','SANTIMAC','PROSTI'] as const).forEach((regionId)=>{const boss=Object.values(tiles).find(t=>t.layer==='UNDERGROUND'&&t.regionId===regionId&&t.locationTag===`UNDERGROUND_BOSS_${regionId}`);const deepEntry=Object.values(tiles).find(t=>t.layer==='DEEP_UNDERGROUND'&&t.regionId===regionId&&t.locationTag===`DEEP_ENTRY_${regionId}`);if(boss&&deepEntry)link(boss.id,deepEntry.id);});
  link(tileId('SURFACE',-3,9),tileId('UNDERWATER',-3,9));
  link(tileId('UNDERWATER',-5,9),tileId('DEEP_SEA',-5,9));
  link(tileId('UNDERWATER',-3,9),tileId('DEEP_SEA',-3,9));
  link(tileId('SURFACE',8,-11),tileId('SKY',8,-11));
  [[-6,-1],[3,4],[10,-2]].forEach(([q,r])=>link(tileId('SKY',q,r),tileId('CELESTIAL',Math.max(-12,Math.min(12,q)),Math.max(-9,Math.min(9,r)))));
  return tiles;
}

export const WORLD_HEX_TILES = buildWorldMap();
export const WORLD_HEX_TILE_LIST = Object.values(WORLD_HEX_TILES);
export interface HostileSitePlacement {
  siteId: string;
  hexId: string;
  definition: HostileSiteDefinition;
}

function stringHash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function buildHostileSitePlacements(): Record<string, HostileSitePlacement> {
  const candidates = WORLD_HEX_TILE_LIST.filter((tile) =>
    tile.layer === 'SURFACE'
    && (tile.terrain === 'PLAINS' || tile.terrain === 'FOREST')
    && !tile.structureType
    && !tile.featureType
    && !tile.locationTag
  );
  const occupied = new Set<string>();
  const byHex: Record<string, HostileSitePlacement> = {};
  for (const definition of getEnabledHostileSiteDefinitions()) {
    const eligible = candidates.filter((tile) => definition.allowedTerrains.includes(tile.terrain) && !occupied.has(tile.id));
    if (!eligible.length) continue;
    const index = stringHash(definition.id) % eligible.length;
    const tile = eligible[index];
    occupied.add(tile.id);
    byHex[tile.id] = { siteId: definition.id, hexId: tile.id, definition };
  }
  return byHex;
}

export const HOSTILE_SITE_PLACEMENTS_BY_HEX = buildHostileSitePlacements();

export function getHostileSiteAtHex(tileIdValue?: string | null, state?: Pick<PlayerState, 'worldMap'>): (HostileSitePlacement & { status: 'HIDDEN' | 'ACTIVE' | 'CLEARED' }) | undefined {
  if (!tileIdValue) return undefined;
  const placement = HOSTILE_SITE_PLACEMENTS_BY_HEX[tileIdValue];
  if (!placement) return undefined;
  const stored = state?.worldMap?.hostileSiteStates?.[placement.siteId];
  const status = stored === 'CLEARED' ? 'CLEARED' : stored === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE';
  return { ...placement, status };
}

export function setHostileSiteStatus(
  state: PlayerState,
  siteId: string,
  status: 'HIDDEN' | 'ACTIVE' | 'CLEARED',
): PlayerState {
  if (!siteId || !Object.values(HOSTILE_SITE_PLACEMENTS_BY_HEX).some((placement) => placement.siteId === siteId)) return state;
  return {
    ...state,
    worldMap: {
      ...state.worldMap,
      hostileSiteStates: {
        ...(state.worldMap.hostileSiteStates || {}),
        [siteId]: status,
      },
    },
  };
}

const ABELLA_CANDIDATES = WORLD_HEX_TILE_LIST.filter((t)=>t.layer==='CELESTIAL'&&Math.abs(t.q)<=9&&Math.abs(t.r)<=6&&t.locationTag!=='EDOWA_APPROACH');

export function findHexByLocationTag(tag: string): WorldHexTile | undefined {return WORLD_HEX_TILE_LIST.find((tile)=>tile.locationTag===tag);}

export function getAbellaHex(dayCount: number): WorldHexTile {
  return ABELLA_CANDIDATES[Math.abs(Math.floor(dayCount*17+5)) % ABELLA_CANDIDATES.length];
}
export function getAbellaFootprint(dayCount:number): WorldHexTile[] {
  const anchor=getAbellaHex(dayCount);return hexDisk(anchor,2).map(p=>WORLD_HEX_TILES[tileId('CELESTIAL',p.q,p.r)]).filter(Boolean).slice(0,19);
}
export function getEffectiveSectorId(tile:WorldHexTile,dayCount:number):string {
  return tile.layer==='CELESTIAL'&&getAbellaFootprint(dayCount).some(t=>t.id===tile.id)?'scroze_abella':tile.sectorId;
}

export function getNeighborHexIds(tile: WorldHexTile): string[] {
  const ids=directions.map(([dq,dr])=>tileId(tile.layer,tile.q+dq,tile.r+dr)).filter((id)=>Boolean(WORLD_HEX_TILES[id]));
  if (tile.verticalLinks) ids.push(...tile.verticalLinks.filter((id)=>Boolean(WORLD_HEX_TILES[id])));
  return Array.from(new Set(ids));
}

function getTravelNeighborHexIds(state: PlayerState, tile: WorldHexTile): string[] {
  const ids = getNeighborHexIds(tile);
  // 용족의 『천룡비행』은 특정 승강장/상승기류가 아니라 자신의 비행 능력으로
  // 지상↔하늘↔천공을 오갈 수 있다. 같은 좌표의 레이어가 존재할 때 직접 수직 이동을 허용한다.
  if (state.race === 'DRAGONKIN') {
    const add = (layer: WorldMapLayer) => {
      const id = tileId(layer, tile.q, tile.r);
      if (WORLD_HEX_TILES[id]) ids.push(id);
    };
    if (tile.layer === 'SURFACE') add('SKY');
    if (tile.layer === 'SKY') { add('SURFACE'); add('CELESTIAL'); }
    if (tile.layer === 'CELESTIAL') add('SKY');
  }
  return Array.from(new Set(ids));
}

function hasFullTools(tools: {map:boolean;compass:boolean;telescope:boolean}) { return tools.map && tools.compass && tools.telescope; }
export function getEffectiveNavigationTools(state: PlayerState) {
  const ids = new Set((state.inventory || []).flatMap((i:any)=>[String(i.id||''), String(i.name||'')]));const has=(...keys:string[])=>keys.some(k=>ids.has(k));
  return {sky:{map:Boolean(state.worldMap?.skyTools?.map||has('sky_navigation_map','하늘 지도')),compass:Boolean(state.worldMap?.skyTools?.compass||has('sky_navigation_compass','하늘 나침반')),telescope:Boolean(state.worldMap?.skyTools?.telescope||has('sky_navigation_telescope','하늘 망원경'))},celestial:{map:Boolean(state.worldMap?.celestialTools?.map||has('celestial_navigation_map','천공 지도')),compass:Boolean(state.worldMap?.celestialTools?.compass||has('celestial_navigation_compass','천공 나침반')),telescope:Boolean(state.worldMap?.celestialTools?.telescope||has('celestial_navigation_telescope','천공 망원경'))},celestialPermit:Boolean(has('celestial_flight_permit','천공 비행 허가증'))};
}
export function canEnterHex(state: PlayerState, tile: WorldHexTile): { ok:boolean; reason?:string } {
  const flags=new Set(state.worldMap?.accessFlags||[]);const nav=getEffectiveNavigationTools(state);const airship=state.airship;
  const hasPotion=(id:string)=>Boolean(state.activePotionEffects?.some((effect)=>effect.statusEffectId===id&&effect.remainingMinutes>0));
  if(tile.layer==='HELL') return {ok:false,reason:'지옥층은 아직 미구현입니다.'};
  if(tile.layer==='DEEP_UNDERGROUND'&&tile.requiredAccessFlag&&!flags.has(tile.requiredAccessFlag)) return {ok:false,reason:'이 지역의 지하층 보스를 처치해야 심층으로 내려갈 수 있습니다.'};
  if ((tile.layer==='UNDERWATER'||tile.layer==='DEEP_SEA') && state.race!=='MERFOLK' && !flags.has('UNDERWATER_ACCESS') && !hasPotion('status_potion_water_breathing')) return {ok:false,reason:'수중 이동 능력 또는 장비가 필요합니다.'};
  if (tile.layer==='SKY') {
    const dragonFlight=state.race==='DRAGONKIN';const native=dragonFlight||flags.has('SKY_NATIVE_ACCESS')||state.beastkinType==='BIRD';const equipped=hasFullTools(nav.sky);const discovered=(state.worldMap?.discoveredHexIds||[]).includes(tile.id);const prostiNaturalGate=tile.locationTag==='PROSTI_SKY_GATE';const transport=Boolean(airship?.built)||flags.has('SKY_MAGIC_ACCESS')||prostiNaturalGate||native;
    if(!transport)return{ok:false,reason:'하늘 진입에는 직접 제작한 비행정, 비행 마법, 새 수인 비행 능력 또는 프로스티 정상 진입로가 필요합니다.'};
    if(!equipped&&!prostiNaturalGate&&!dragonFlight&&!(native&&discovered))return{ok:false,reason:'미지의 하늘 이동에는 하늘 지도·나침반·망원경 3종이 필요합니다.'};
  }
  if (tile.layer==='CELESTIAL') {
    const dragonFlight=state.race==='DRAGONKIN';const native=dragonFlight||(flags.has('CELESTIAL_NATIVE_ACCESS')&&state.beastkinType==='FOX');const equipped=hasFullTools(nav.celestial);const discovered=(state.worldMap?.discoveredHexIds||[]).includes(tile.id);const currentAccess=flags.has('CELESTIAL_CURRENT_ACCESS');const airshipReady=Boolean(airship?.built&&airship.level>=3);
    if((!airshipReady&&!native&&!currentAccess)||(!equipped&&!dragonFlight&&!(native&&discovered)))return{ok:false,reason:'천공 이동에는 천공 항법도구 3종과 Lv.3 이상 직접 제작 비행정 또는 특수 상승기류 진입권이 필요합니다.'};
  }
  if(tile.structureGroupId==='DESERT_ALTO'&&state.race!=='ELF'&&!flags.has('DESERT_ALTO_ACCESS')) return {ok:false,reason:'데저트 알토는 엘프 이외의 외부인에게 폐쇄되어 있습니다.'};
  return {ok:true};
}
function raceMovementMultiplier(state: PlayerState, tile: WorldHexTile): number {if(state.race==='DRAGONKIN'&&(tile.layer==='SKY'||tile.layer==='CELESTIAL'))return .72;if(state.race==='YETI'&&(tile.terrain==='SNOW'||tile.terrain==='MOUNTAIN'))return .72;if(state.race==='MERFOLK'&&(tile.layer==='UNDERWATER'||tile.layer==='DEEP_SEA'))return .68;if(state.race==='ELF'&&tile.terrain==='FOREST')return .78;if(state.race==='BEASTKIN'&&state.beastkinType==='BIRD'&&(tile.layer==='SKY'||tile.layer==='CELESTIAL'||tile.terrain==='MOUNTAIN'))return .76;if(state.race==='BEASTKIN'&&state.beastkinType==='WOLF'&&tile.terrain==='SNOW')return .86;return 1;}
function routeStepScore(state:PlayerState,tile:WorldHexTile,pref:RoutePreference):number {const move=tile.movementCost*raceMovementMultiplier(state,tile);if(pref==='SHORTEST')return 1;if(pref==='SAFEST')return move+tile.dangerLevel*1.9;return move;}

export function findWorldRoute(state: PlayerState, fromId: string, toId: string, preference: RoutePreference = 'FASTEST'): WorldRouteResult {
  const start=WORLD_HEX_TILES[fromId], goal=WORLD_HEX_TILES[toId];if(!start||!goal)return{found:false,tileIds:[],totalMinutes:0,averageDanger:0,totalCost:0,reason:'출발지 또는 목적지가 없습니다.'};const goalAccess=canEnterHex(state,goal);if(!goalAccess.ok)return{found:false,tileIds:[],totalMinutes:0,averageDanger:0,totalCost:0,reason:goalAccess.reason};
  const open=new Set<string>([start.id]);const came:Record<string,string|undefined>={};const g:Record<string,number>={[start.id]:0};const f:Record<string,number>={[start.id]:axialDistance(start,goal)};let safety=0;
  while(open.size&&safety<20000){safety++;let current=[...open].sort((a,b)=>(f[a]??1e9)-(f[b]??1e9))[0];if(current===goal.id){const path=[current];while(came[current]){current=came[current]!;path.push(current);}path.reverse();const traversed=path.slice(1).map(id=>WORLD_HEX_TILES[id]);
      const surfaceSteps=traversed.filter(t=>t.layer==='SURFACE').length;const range=calculateSurfaceTravelRange(state);
      if(surfaceSteps>range.total)return{found:false,tileIds:path,totalMinutes:0,averageDanger:0,totalCost:g[goal.id]||0,reason:`한 번의 지상 이동 한도(${range.total} Hex)를 ${surfaceSteps-range.total}칸 초과합니다. 경유지를 지정하거나 여행 도구/패시브/장비를 준비하세요.`,surfaceRangeLimit:range.total};
      const airTiles=traversed.filter(t=>t.layer==='SKY'||t.layer==='CELESTIAL');const dragonFlight=state.race==='DRAGONKIN';const nativeAir=dragonFlight||state.beastkinType==='BIRD'||(state.beastkinType==='FOX'&&goal.layer==='CELESTIAL'&&(state.worldMap?.accessFlags||[]).includes('CELESTIAL_NATIVE_ACCESS'));
      let fuelCost=0;let travelMode:'FOOT'|'AIRSHIP'|'FLIGHT'=dragonFlight&&airTiles.length?'FLIGHT':'FOOT';if(airTiles.length&&!nativeAir&&!((state.worldMap?.accessFlags||[]).includes('SKY_MAGIC_ACCESS'))){travelMode='AIRSHIP';const skyCount=airTiles.filter(t=>t.layer==='SKY').length;const celestialCount=airTiles.filter(t=>t.layer==='CELESTIAL').length;fuelCost=airshipFuelCostForDistance(state,skyCount,'SKY')+(celestialCount?airshipFuelCostForDistance(state,celestialCount,'CELESTIAL'):0);if(!state.airship?.built)return{found:false,tileIds:path,totalMinutes:0,averageDanger:0,totalCost:g[goal.id]||0,reason:'이 항로는 직접 제작한 비행정이 필요합니다.'};if(state.airship.fuel<fuelCost)return{found:false,tileIds:path,totalMinutes:0,averageDanger:0,totalCost:g[goal.id]||0,reason:`비행정 연료 부족: 필요 ${fuelCost}, 현재 ${state.airship.fuel}`,travelMode,fuelCost};}
      const mins=Math.round(traversed.reduce((sum,t)=>sum+35*t.movementCost*raceMovementMultiplier(state,t),0));const danger=traversed.length?traversed.reduce((s,t)=>s+t.dangerLevel,0)/traversed.length:0;return{found:true,tileIds:path,totalMinutes:mins,averageDanger:Number(danger.toFixed(2)),totalCost:g[goal.id]||0,travelMode,fuelCost,surfaceRangeLimit:range.total};}open.delete(current);const curTile=WORLD_HEX_TILES[current];for(const nid of getTravelNeighborHexIds(state,curTile)){const n=WORLD_HEX_TILES[nid];const access=canEnterHex(state,n);if(!access.ok)continue;const tentative=(g[current]??1e9)+routeStepScore(state,n,preference);if(tentative<(g[nid]??1e9)){came[nid]=current;g[nid]=tentative;f[nid]=tentative+(n.layer===goal.layer?axialDistance(n,goal):3);open.add(nid);}}}
  return{found:false,tileIds:[],totalMinutes:0,averageDanger:0,totalCost:0,reason:'이동 가능한 경로를 찾지 못했습니다.'};
}
export function calculateStepMinutes(state:PlayerState,tile:WorldHexTile):number {return Math.max(8,Math.round(35*tile.movementCost*raceMovementMultiplier(state,tile)));}
export function rollTravelStep(state:PlayerState,tile:WorldHexTile,seed:number):TravelStepResult {
  const minutes=calculateStepMinutes(state,tile);const sectorId=getEffectiveSectorId(tile,state.dayCount);const flags=new Set(state.worldMap?.accessFlags||[]);
  if(tile.layerBossId&&tile.layerBossClearFlag&&!flags.has(tile.layerBossClearFlag)){const boss=getRegionalMonsterDefinition(tile.layerBossId);return{tileId:tile.id,minutes,sectorId,encounterType:'MONSTER',monsterId:tile.layerBossId,monsterName:boss?.name||tile.featureName||'층 수문장',eventText:`[층 보스] ${boss?.name||tile.featureName||'수문장'}이 다음 층으로 향하는 길을 막고 있다.`};}
  const profile=getSectorEncounterProfile(sectorId);
  const insectPheromone=getEffectivePheromoneStrength(state,'INSECTOID');const tentaclePheromone=getEffectivePheromoneStrength(state,'TENTACLE');const pheromonePressure=Math.min(1,insectPheromone+tentaclePheromone);
  const roll=hash01(tile.q+seed,tile.r+state.dayCount,31);let eventChance=Math.min(.86,Math.max(.04,.10+tile.dangerLevel*.045+(profile?.eventChanceModifier||0)+PHEROMONE_CONFIG.eventChanceBonusAtFullStrength*pheromonePressure));if(state.activePotionEffects?.some((effect)=>effect.statusEffectId==='status_potion_scent_mask'&&effect.remainingMinutes>0)) eventChance=Math.max(.02,eventChance*.6);if(roll>=eventChance)return{tileId:tile.id,minutes,sectorId,encounterType:'NONE'};
  let monsterPool=getRegionalMonsterPool(tile.regionId,tile.layer,tile.terrain,state.level,sectorId);
  const monsterShare=Math.min(.95,(profile?.monsterShare??.58)+PHEROMONE_CONFIG.monsterShareBonusAtFullStrength*pheromonePressure);
  const chooseMonster=monsterPool.length>0&&hash01(tile.q,tile.r,seed+40)<monsterShare;if(chooseMonster){
    // 지하/심층 생태 가중치 + 페로몬 계통 가중치. 거점 내부의 고정 풀은 TravelSession에서 더 높은 우선순위로 처리한다.
    const weighted=(m:(typeof monsterPool)[number])=>m.encounterWeight*((tile.layer==='UNDERGROUND'||tile.layer==='DEEP_UNDERGROUND')&&m.raceSubtype==='INSECTOID'?2.6:1)*(m.raceSubtype==='INSECTOID'?pheromoneMonsterWeightMultiplier(state,'INSECTOID'):m.raceSubtype==='TENTACLE'?pheromoneMonsterWeightMultiplier(state,'TENTACLE'):1);
    const total=monsterPool.reduce((s,m)=>s+weighted(m),0);let x=hash01(tile.q,tile.r,seed+41)*total;let picked=monsterPool[0];for(const m of monsterPool){x-=weighted(m);if(x<=0){picked=m;break;}}return{tileId:tile.id,minutes,sectorId,encounterType:'MONSTER',monsterId:picked.id,monsterName:picked.name,eventText:`[${profile?.name||tile.sectorName}] ${picked.name}와 조우했다.`};}
  if(profile?.events.length){const idx=Math.floor(hash01(tile.q,tile.r,seed+50)*profile.events.length)%profile.events.length;return{tileId:tile.id,minutes,sectorId,encounterType:'EVENT',eventText:`[${profile.name}] ${profile.events[idx]}`};}
  return{tileId:tile.id,minutes,sectorId,encounterType:'NONE'};
}
export function createInitialWorldMapState(startTag:string,storyFlags:string[]=[]):WorldMapState {const start=findHexByLocationTag(startTag)||findHexByLocationTag('THE_PELLESS_LOWER')!;const accessFlags=[...storyFlags];const initialNearby=[start.id,...getNeighborHexIds(start)];return{currentHexId:start.id,currentRegionId:start.regionId,currentLayer:start.layer,discoveredHexIds:Array.from(new Set(initialNearby)),exploredHexIds:[start.id],routePreference:'FASTEST',skyTools:{map:false,compass:false,telescope:false},celestialTools:{map:false,compass:false,telescope:false},accessFlags,lastSelectedHexId:start.id,discoveredWaystationIds:[],hostileSiteStates:{},mapRevision:4};}
export function revealAround(state:PlayerState,tileIdValue:string,radius=1):PlayerState {const origin=WORLD_HEX_TILES[tileIdValue];if(!origin)return state;const trackerBonus=state.activePotionEffects?.some((effect)=>effect.statusEffectId==='status_potion_tracker'&&effect.remainingMinutes>0)?1:0;radius=Math.max(0,radius+trackerBonus);const discovered=new Set(state.worldMap.discoveredHexIds||[]);discovered.add(origin.id);(origin.verticalLinks||[]).forEach((id)=>discovered.add(id));const nav=getEffectiveNavigationTools(state);const flags=new Set(state.worldMap?.accessFlags||[]);const dragonFlight=state.race==='DRAGONKIN';const skyLocal=origin.layer==='SKY'&&!hasFullTools(nav.sky)&&!dragonFlight&&!(flags.has('SKY_NATIVE_ACCESS')||state.beastkinType==='BIRD');const celestialLocal=origin.layer==='CELESTIAL'&&!hasFullTools(nav.celestial)&&!dragonFlight&&!(flags.has('CELESTIAL_NATIVE_ACCESS')&&state.beastkinType==='FOX');const effectiveRadius=(skyLocal||celestialLocal)?0:radius;Object.values(WORLD_HEX_TILES).forEach(tile=>{if(tile.layer===origin.layer&&axialDistance(tile,origin)<=effectiveRadius)discovered.add(tile.id);});const nearbyStations=WAYSTATIONS.filter(ws=>discovered.has(tileId('SURFACE',ws.q,ws.r))).map(ws=>ws.id);return{...state,worldMap:{...state.worldMap,discoveredHexIds:[...discovered],discoveredWaystationIds:Array.from(new Set([...(state.worldMap.discoveredWaystationIds||[]),...nearbyStations])),mapRevision:(state.worldMap.mapRevision||0)+1}};}
