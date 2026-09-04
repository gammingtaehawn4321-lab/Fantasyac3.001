import type { DungeonExplorationState, DungeonKind, DungeonSize, DungeonTileKind, PlayerState, WorldMapLayer, WorldRegionId } from '../../types';
import { REGIONAL_MONSTERS } from '../world/monsterData';
import { ADULT_DUNGEON_TRAP_SLOTS, NORMAL_DUNGEON_TRAPS } from './dungeonTrapReferences';
import { isAdultPhysicalAge } from '../../config/agePolicy';

export interface DungeonDefinition {
  id: string;
  name: string;
  kind: DungeonKind;
  size: DungeonSize;
  regionId: WorldRegionId;
  layer: WorldMapLayer;
  textureId: string;
  gimmickId: string;
  gimmickName: string;
  description: string;
  monsterIds: string[];
  bossMonsterId: string;
  rewardTier: number;
}

export interface DungeonTileDefinition {
  id: string;
  dungeonId: string;
  x: number;
  y: number;
  kind: DungeonTileKind;
  monsterId?: string;
  trapId?: string;
  adultTrapSlotId?: string;
  doorId?: string;
  requiredButtonId?: string;
  buttonId?: string;
  altarId?: string;
  rewardSeed?: number;
}

export interface DungeonLayout {
  dungeonId: string;
  width: number;
  height: number;
  tileCount: number;
  tiles: DungeonTileDefinition[];
  entranceTileId: string;
  bossTileId: string;
  lootRoomTileId: string;
}

const SIZE_DIMENSION: Record<DungeonSize, number> = { SMALL: 7, MEDIUM: 9, LARGE: 11, MEGA: 15 };
export const DUNGEON_TILE_COUNTS: Record<DungeonSize, number> = Object.fromEntries(Object.entries(SIZE_DIMENSION).map(([k,v])=>[k,v*v])) as Record<DungeonSize,number>;

const hashString = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
function mulberry32(seed:number){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

const GIMMICKS = [
  ['BUTTON_DOOR','연동 석문','멀리 떨어진 버튼을 눌러 봉인문을 해제한다.'],
  ['ALTAR_SEQUENCE','제단 순서','서로 다른 제단을 정해진 순서로 작동시킨다.'],
  ['CRYSTAL_RESONANCE','결정 공명','동일한 문양의 결정을 공명시켜 통로를 연다.'],
  ['WIND_GATE','풍압 관문','기류를 바꾸는 장치를 이용해 일방향 관문을 통과한다.'],
  ['WATER_LEVEL','수위 조절','배수 장치와 수문을 조작해 잠긴 통로를 연다.'],
  ['ROTATING_SEAL','회전 봉인','회전식 봉인판의 방향을 맞춰 문을 개방한다.'],
  ['WEIGHT_PLATE','중량 압력판','여러 압력판을 동시에 활성화해야 문이 열린다.'],
  ['LIGHT_PATH','광로 연결','빛을 반사시켜 중앙 제단까지 연결한다.'],
] as const;

const regionTexture:Record<WorldRegionId,string[]>={
  GRANDIA:['MINESTONE','SEWER_BRICK','IRON_CAVERN'],
  FOREZIN:['ROOTSTONE','FUNGAL_ROOT','RIVER_CAVE'],
  SEIRE:['FLOODED_RUIN','BLUE_GROTTO','CORAL_CAVE'],
  SANTIMAC:['SANDSTONE','GLASS_RUIN','DRY_CHASM'],
  PROSTI:['ICE_CAVE','CRYSTAL_FROST','GLACIAL_RUIN'],
  SCROZE:['CLOUDSTONE','STORM_GLASS','ASTRAL_MARBLE','SHRINE_GOLD'],
};

const nameSeeds:Record<WorldRegionId,string[]>={
  GRANDIA:['검은 갱도','왕도 하부석실','철맥 미궁','침수 암거'],
  FOREZIN:['거목 뿌리궁','청류 공동','균사 회랑','수액의 미궁'],
  SEIRE:['청색 침수궁','산호 지하전','심공 유적','푸른 수문궁'],
  SANTIMAC:['사암 회랑','유리석궁','갈라진 석문궁','메마른 심굴'],
  PROSTI:['빙정 미궁','대설산 내궁','서리 회랑','얼어붙은 심굴'],
  SCROZE:['구름 신전','폭풍 제단궁','별바람 성소','천공 대신전','황금 부유성소'],
};

interface Spec { regionId:WorldRegionId; layer:WorldMapLayer; kind:DungeonKind; size:DungeonSize; count:number; }
const SPECS:Spec[]=[
  {regionId:'GRANDIA',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'SMALL',count:1},
  {regionId:'GRANDIA',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'MEDIUM',count:1},
  {regionId:'GRANDIA',layer:'DEEP_UNDERGROUND',kind:'DEEP_DUNGEON',size:'LARGE',count:1},
  {regionId:'FOREZIN',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'SMALL',count:1},
  {regionId:'FOREZIN',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'MEDIUM',count:1},
  {regionId:'FOREZIN',layer:'DEEP_UNDERGROUND',kind:'DEEP_DUNGEON',size:'LARGE',count:1},
  {regionId:'SEIRE',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'SMALL',count:1},
  {regionId:'SEIRE',layer:'DEEP_UNDERGROUND',kind:'DEEP_DUNGEON',size:'MEDIUM',count:1},
  {regionId:'SEIRE',layer:'DEEP_UNDERGROUND',kind:'DEEP_DUNGEON',size:'MEGA',count:1},
  {regionId:'SANTIMAC',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'SMALL',count:1},
  {regionId:'SANTIMAC',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'MEDIUM',count:1},
  {regionId:'SANTIMAC',layer:'DEEP_UNDERGROUND',kind:'DEEP_DUNGEON',size:'LARGE',count:1},
  {regionId:'PROSTI',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'SMALL',count:1},
  {regionId:'PROSTI',layer:'UNDERGROUND',kind:'DEEP_DUNGEON',size:'MEDIUM',count:1},
  {regionId:'PROSTI',layer:'DEEP_UNDERGROUND',kind:'DEEP_DUNGEON',size:'LARGE',count:1},
  {regionId:'SCROZE',layer:'SKY',kind:'TEMPLE',size:'SMALL',count:5},
  {regionId:'SCROZE',layer:'SKY',kind:'TEMPLE',size:'MEDIUM',count:2},
  {regionId:'SCROZE',layer:'SKY',kind:'TEMPLE',size:'LARGE',count:1},
  {regionId:'SCROZE',layer:'CELESTIAL',kind:'GRAND_TEMPLE',size:'SMALL',count:4},
  {regionId:'SCROZE',layer:'CELESTIAL',kind:'GRAND_TEMPLE',size:'MEDIUM',count:2},
  {regionId:'SCROZE',layer:'CELESTIAL',kind:'GRAND_TEMPLE',size:'MEGA',count:1},
];

function monsterPool(regionId:WorldRegionId,layer:WorldMapLayer){
  const direct=REGIONAL_MONSTERS.filter(m=>m.regionId===regionId&&m.layers.includes(layer));
  if(direct.length) return direct;
  return REGIONAL_MONSTERS.filter(m=>m.regionId===regionId);
}

function buildDefinitions():DungeonDefinition[]{
  const out:DungeonDefinition[]=[]; let serial=1;
  for(const spec of SPECS){
    for(let i=0;i<spec.count;i++){
      const id=`dungeon_${String(serial).padStart(2,'0')}_${spec.kind.toLowerCase()}`;
      const pool=monsterPool(spec.regionId,spec.layer);
      const elite=pool.filter(m=>m.tier==='ELITE');
      const regionalElite=REGIONAL_MONSTERS.filter(m=>m.regionId===spec.regionId&&m.tier==='ELITE');
      const eliteBossPool=elite.length?elite:regionalElite;
      const boss=(eliteBossPool[i%Math.max(1,eliteBossPool.length)]||pool[(i*3)%Math.max(1,pool.length)]);
      const g=GIMMICKS[(serial-1)%GIMMICKS.length];
      const textures=regionTexture[spec.regionId]; const names=nameSeeds[spec.regionId];
      const prefix=names[(serial+i)%names.length];
      const kindLabel=spec.kind==='DEEP_DUNGEON'?'심층 던전':spec.kind==='TEMPLE'?'신전':'대신전';
      out.push({
        id,name:`${prefix} · ${kindLabel} ${i+1}`,kind:spec.kind,size:spec.size,regionId:spec.regionId,layer:spec.layer,
        textureId:textures[(serial+i)%textures.length],gimmickId:`${g[0]}:${id}`,gimmickName:`${g[1]} · ${String(serial).padStart(2,'0')}식`,
        description:`${g[2]} ${spec.size==='MEGA'?'초대형 복합 구조를 가진다.':''}`.trim(),
        monsterIds:pool.map(m=>m.id),bossMonsterId:boss?.id||'grandia_black_hound',rewardTier:Math.min(4,(spec.size==='SMALL'?1:spec.size==='MEDIUM'?2:spec.size==='LARGE'?3:4)+(spec.layer==='DEEP_UNDERGROUND'||spec.layer==='CELESTIAL'?1:0)),
      }); serial++;
    }
  }
  return out;
}

export const WORLD_DUNGEONS:DungeonDefinition[]=buildDefinitions();
export const WORLD_DUNGEON_DATABASE:Record<string,DungeonDefinition>=Object.fromEntries(WORLD_DUNGEONS.map(d=>[d.id,d]));

const layoutCache=new Map<string,DungeonLayout>();
const coordKey=(x:number,y:number)=>`${x}:${y}`;

export function getDungeonLayout(dungeonId:string):DungeonLayout{
  const cached=layoutCache.get(dungeonId); if(cached) return cached;
  const dungeon=WORLD_DUNGEON_DATABASE[dungeonId]; if(!dungeon) throw new Error(`Unknown dungeon: ${dungeonId}`);
  const width=SIZE_DIMENSION[dungeon.size],height=width,rng=mulberry32(hashString(dungeon.id));
  const grid:Array<Array<DungeonTileKind>>=Array.from({length:height},()=>Array.from({length:width},()=> 'WALL'));
  const visited=new Set<string>();
  const stack: Array<[number, number]> = [[1,1]]; visited.add(coordKey(1,1)); grid[1][1]='CORRIDOR';
  const dirs=[[2,0],[-2,0],[0,2],[0,-2]];
  while(stack.length){
    const [cx,cy]=stack[stack.length-1];
    const options=dirs.map(([dx,dy])=>[cx+dx,cy+dy,dx,dy]).filter(([nx,ny])=>nx>0&&ny>0&&nx<width-1&&ny<height-1&&!visited.has(coordKey(nx,ny)));
    if(!options.length){stack.pop();continue;}
    const pick=options[Math.floor(rng()*options.length)]; const [nx,ny,dx,dy]=pick;
    grid[cy+dy/2][cx+dx/2]='CORRIDOR'; grid[ny][nx]='CORRIDOR'; visited.add(coordKey(nx,ny)); stack.push([nx,ny]);
  }
  // 일부 벽을 추가로 뚫어 방과 순환로를 만든다.
  for(let y=1;y<height-1;y++) for(let x=1;x<width-1;x++) if(grid[y][x]==='WALL'&&rng()<0.13) grid[y][x]='FLOOR';
  grid[1][1]='ENTRANCE'; grid[height-2][width-2]='LOOT_ROOM';
  // 출구 직전 보스 칸 확보
  const bossX=width-2,bossY=Math.max(1,height-4); grid[bossY][bossX]='BOSS';
  // loot room까지 세로 연결
  for(let y=bossY;y<=height-2;y++) grid[y][bossX]= y===bossY?'BOSS':y===height-2?'LOOT_ROOM':'CORRIDOR';

  const walkable:Array<[number,number]>=[]; for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++)if(grid[y][x]!=='WALL'&&!(x===1&&y===1)&&!(x===bossX&&y===bossY)&&!(x===width-2&&y===height-2))walkable.push([x,y]);
  // 고정 콘텐츠 배치. seed 기반이라 세이브/재시작에도 변하지 않는다.
  const shuffled=[...walkable].sort(()=>rng()-.5); let cursor=0;
  const count=Math.max(1,walkable.length);
  const assign=(kind:DungeonTileKind,n:number)=>{for(let i=0;i<n&&cursor<shuffled.length;i++){const [x,y]=shuffled[cursor++];grid[y][x]=kind;}};
  const gimmickFamily=dungeon.gimmickId.split(':')[0];
  const altarTarget=['ALTAR_SEQUENCE','CRYSTAL_RESONANCE','LIGHT_PATH'].includes(gimmickFamily)?Math.max(2,Math.floor(count*.035)):Math.max(1,Math.floor(count*.025));
  const deviceTarget=['ROTATING_SEAL','WEIGHT_PLATE'].includes(gimmickFamily)?Math.max(2,Math.floor(count*.035)):Math.max(1,Math.floor(count*.025));
  assign('ENEMY',Math.floor(count*.18)); assign('ELITE',Math.max(1,Math.floor(count*.035))); assign('TREASURE',Math.max(2,Math.floor(count*.06))); assign('ALTAR',altarTarget); assign('TRAP',Math.max(2,Math.floor(count*.055))); assign('ADULT_TRAP',Math.max(1,Math.floor(count*.025)));
  const doorCount=deviceTarget;assign('DOOR',doorCount);assign('BUTTON',doorCount);

  const doorCoords:Array<[number,number]>=[],buttonCoords:Array<[number,number]>=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++){if(grid[y][x]==='DOOR')doorCoords.push([x,y]);if(grid[y][x]==='BUTTON')buttonCoords.push([x,y]);}
  const tiles:DungeonTileDefinition[]=[]; let normalTrapIndex=0,adultTrapIndex=0,enemyIndex=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const kind=grid[y][x]; const id=`${dungeon.id}:${x}:${y}`; const tile:DungeonTileDefinition={id,dungeonId:dungeon.id,x,y,kind};
    if(kind==='ENEMY'||kind==='ELITE'){const pool=dungeon.monsterIds.map(mid=>REGIONAL_MONSTERS.find(m=>m.id===mid)).filter(Boolean) as any[];const candidates=kind==='ELITE'?pool.filter(m=>m.tier==='ELITE'):pool;const actual=candidates.length?candidates:pool;tile.monsterId=actual[(enemyIndex++*7+hashString(id))%Math.max(1,actual.length)]?.id;}
    if(kind==='BOSS')tile.monsterId=dungeon.bossMonsterId;
    if(kind==='TRAP')tile.trapId=NORMAL_DUNGEON_TRAPS[normalTrapIndex++%NORMAL_DUNGEON_TRAPS.length].id;
    if(kind==='ADULT_TRAP')tile.adultTrapSlotId=ADULT_DUNGEON_TRAP_SLOTS[adultTrapIndex++%ADULT_DUNGEON_TRAP_SLOTS.length].id;
    if(kind==='DOOR'){const di=doorCoords.findIndex(([dx,dy])=>dx===x&&dy===y);tile.doorId=`${dungeon.id}:door:${di}`;tile.requiredButtonId=`${dungeon.id}:button:${Math.max(0,di%Math.max(1,buttonCoords.length))}`;}
    if(kind==='BUTTON'){const bi=buttonCoords.findIndex(([bx,by])=>bx===x&&by===y);tile.buttonId=`${dungeon.id}:button:${bi}`;}
    if(kind==='ALTAR')tile.altarId=`${dungeon.id}:altar:${x}:${y}`;
    if(kind==='TREASURE'||kind==='LOOT_ROOM')tile.rewardSeed=hashString(id);
    tiles.push(tile);
  }
  const layout={dungeonId,width,height,tileCount:width*height,tiles,entranceTileId:`${dungeon.id}:1:1`,bossTileId:`${dungeon.id}:${bossX}:${bossY}`,lootRoomTileId:`${dungeon.id}:${width-2}:${height-2}`};
  layoutCache.set(dungeonId,layout);return layout;
}

export function getDungeonTile(dungeonId:string,tileId:string){return getDungeonLayout(dungeonId).tiles.find(t=>t.id===tileId);}
export function getAdjacentDungeonTiles(dungeonId:string,tileId:string){const layout=getDungeonLayout(dungeonId),tile=layout.tiles.find(t=>t.id===tileId);if(!tile)return[];return layout.tiles.filter(t=>Math.abs(t.x-tile.x)+Math.abs(t.y-tile.y)===1);}

export function canTriggerAdultDungeonTrap(state:PlayerState,slotId?:string){if(!isAdultPhysicalAge(state.profile?.physicalAge))return false;const slot=ADULT_DUNGEON_TRAP_SLOTS.find(s=>s.id===slotId);return Boolean(slot&&(slot.name||slot.sceneReference||slot.effectReference));}

export function createDungeonExplorationState(dungeonId:string,dayCount=1): DungeonExplorationState {
  const layout=getDungeonLayout(dungeonId);
  const entrance=layout.tiles.find(t=>t.id===layout.entranceTileId)!;
  const nearby=layout.tiles.filter(t=>Math.abs(t.x-entrance.x)+Math.abs(t.y-entrance.y)<=1).map(t=>t.id);
  return {dungeonId,currentTileId:layout.entranceTileId,discoveredTileIds:Array.from(new Set([layout.entranceTileId,...nearby])),clearedTileIds:[layout.entranceTileId],openedDoorIds:[],pressedButtonIds:[],claimedTreasureIds:[],triggeredTrapIds:[],bossDefeated:false,completed:false,enteredAtDay:dayCount};
}

export function dungeonTileLabel(kind:DungeonTileKind){
  return ({WALL:'벽',FLOOR:'방',ENTRANCE:'입구',CORRIDOR:'통로',ENEMY:'적',ELITE:'엘리트',BOSS:'보스',TREASURE:'보물',LOOT_ROOM:'전리품방',DOOR:'문',BUTTON:'버튼',ALTAR:'제단',TRAP:'함정',ADULT_TRAP:'성인 함정',EXIT:'출구'} as Record<DungeonTileKind,string>)[kind];
}
