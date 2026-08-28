import { useEffect, useMemo } from 'react';
import { DoorOpen, Gem, Skull, Sparkles, Swords, ToggleLeft, TriangleAlert, X } from 'lucide-react';
import type { PlayerState } from '../types';
import { advanceGameTime } from '../gameEngine';
import { createEnemyActor } from '../combat/enemyFactory';
import { initBattleState } from '../combat/battleEngine';
import { getRegionalMonsterDefinition } from '../data/world/monsterData';
import { ADULT_DUNGEON_TRAP_SLOTS, NORMAL_DUNGEON_TRAPS } from '../data/dungeons/dungeonTrapReferences';
import { createDungeonExplorationState, dungeonTileLabel, getAdjacentDungeonTiles, getDungeonLayout, WORLD_DUNGEON_DATABASE } from '../data/dungeons/dungeonSystem';

interface Props {
  isOpen:boolean;
  dungeonId?:string;
  playerState:PlayerState;
  onClose:()=>void;
  onUpdatePlayer:(state:PlayerState)=>void;
  onLog?:(text:string)=>void;
}

const tileBg:Record<string,string>={WALL:'bg-stone-950 border-stone-900',FLOOR:'bg-stone-800 border-stone-700',CORRIDOR:'bg-stone-800 border-stone-700',ENTRANCE:'bg-emerald-950 border-emerald-600',ENEMY:'bg-rose-950 border-rose-700',ELITE:'bg-red-950 border-red-500',BOSS:'bg-red-900 border-amber-400',TREASURE:'bg-amber-950 border-amber-600',LOOT_ROOM:'bg-yellow-900 border-yellow-300',DOOR:'bg-stone-700 border-amber-700',BUTTON:'bg-sky-950 border-sky-500',ALTAR:'bg-violet-950 border-violet-500',TRAP:'bg-orange-950 border-orange-600',ADULT_TRAP:'bg-fuchsia-950 border-fuchsia-700',EXIT:'bg-emerald-900 border-emerald-300'};
const glyph:Record<string,string>={WALL:'',FLOOR:'·',CORRIDOR:'·',ENTRANCE:'↥',ENEMY:'⚔',ELITE:'◆',BOSS:'☠',TREASURE:'◇',LOOT_ROOM:'★',DOOR:'▥',BUTTON:'●',ALTAR:'✦',TRAP:'△',ADULT_TRAP:'◇',EXIT:'⇥'};
const textureClass=(id:string)=>id.includes('ICE')||id.includes('FROST')?'from-sky-950/70 via-stone-950 to-cyan-950/40':id.includes('ROOT')||id.includes('FUNGAL')?'from-emerald-950/70 via-stone-950 to-lime-950/30':id.includes('FLOODED')||id.includes('BLUE')||id.includes('CORAL')?'from-blue-950/80 via-stone-950 to-cyan-950/40':id.includes('SAND')||id.includes('GLASS')?'from-amber-950/50 via-stone-950 to-orange-950/30':id.includes('CLOUD')||id.includes('STORM')?'from-slate-800/70 via-sky-950 to-stone-950':'from-violet-950/50 via-stone-950 to-stone-950';

export function DungeonExplorerModal({isOpen,dungeonId,playerState,onClose,onUpdatePlayer,onLog}:Props){
  const dungeon=dungeonId?WORLD_DUNGEON_DATABASE[dungeonId]:undefined;
  const layout=useMemo(()=>dungeonId?getDungeonLayout(dungeonId):undefined,[dungeonId]);
  const activeExploration=playerState.dungeonExploration;
  const recordedExploration=dungeon?playerState.dungeonRecords?.[dungeon.id]:undefined;
  const exploration=activeExploration?.dungeonId===dungeon?.id?activeExploration:recordedExploration;
  useEffect(()=>{if(!isOpen||!dungeon||!layout)return;if(!exploration||exploration.dungeonId!==dungeon.id){const fresh=createDungeonExplorationState(dungeon.id,playerState.dayCount);onUpdatePlayer({...playerState,dungeonExploration:fresh,dungeonRecords:{...(playerState.dungeonRecords||{}),[dungeon.id]:fresh}} as PlayerState);}},[isOpen,dungeonId]);
  if(!isOpen||!dungeon||!layout)return null;
  const state=exploration&&exploration.dungeonId===dungeon.id?exploration:createDungeonExplorationState(dungeon.id,playerState.dayCount);
  const current=layout.tiles.find(t=>t.id===state.currentTileId)!;const discovered=new Set(state.discoveredTileIds);const cleared=new Set(state.clearedTileIds);
  const updateExploration=(next:any,base=playerState)=>onUpdatePlayer({...base,dungeonExploration:next,dungeonRecords:{...(base.dungeonRecords||{}),[dungeon.id]:next}} as PlayerState);
  const discoverAround=(tile:any,next:any)=>{const ids=getAdjacentDungeonTiles(dungeon.id,tile.id).map(t=>t.id);return{...next,discoveredTileIds:Array.from(new Set([...(next.discoveredTileIds||[]),tile.id,...ids]))};};
  const log=(text:string)=>onLog?.(`🏛️ [${dungeon.name}]\n${text}`);

  const interact=(tile:any)=>{
    if(tile.kind==='WALL')return;const adjacent=Math.abs(tile.x-current.x)+Math.abs(tile.y-current.y)===1;if(!adjacent&&tile.id!==current.id){log('인접한 타일로만 이동할 수 있습니다.');return;}
    let next={...state,currentTileId:tile.id};next=discoverAround(tile,next);let base=advanceGameTime(playerState,3);
    if(tile.kind==='DOOR'&&!state.openedDoorIds.includes(tile.doorId||'')){
      const altarCount=layout.tiles.filter(t=>t.kind==='ALTAR'&&cleared.has(t.id)).length;const family=dungeon.gimmickId.split(':')[0];
      const open=family==='ALTAR_SEQUENCE'?altarCount>=2:family==='CRYSTAL_RESONANCE'?altarCount>=2:family==='LIGHT_PATH'?altarCount>=2:family==='ROTATING_SEAL'?state.pressedButtonIds.length>=2:family==='WEIGHT_PLATE'?state.pressedButtonIds.length>=2:tile.requiredButtonId?state.pressedButtonIds.includes(tile.requiredButtonId):state.pressedButtonIds.length>0;
      if(!open){log(`문이 잠겨 있다. 기믹: ${dungeon.gimmickName}`);return;}next.openedDoorIds=Array.from(new Set([...next.openedDoorIds,tile.doorId!]));log('연동 장치가 반응하며 문이 열렸다.');
    }
    if(tile.kind==='BUTTON'&&tile.buttonId){next.pressedButtonIds=Array.from(new Set([...next.pressedButtonIds,tile.buttonId]));next.clearedTileIds=Array.from(new Set([...next.clearedTileIds,tile.id]));log('기믹 장치가 작동했다.');}
    if(tile.kind==='ALTAR'){next.clearedTileIds=Array.from(new Set([...next.clearedTileIds,tile.id]));base={...base,mana:Math.min(base.maxMana,base.mana+Math.max(1,Math.round(base.maxMana*.08))),sanity:Math.min(base.maxSanity,base.sanity+4)};log('제단이 반응하며 마나와 정신이 조금 안정되었다.');}
    if((tile.kind==='TRAP'||tile.kind==='ADULT_TRAP')&&!state.triggeredTrapIds.includes(tile.id)){
      next.triggeredTrapIds=Array.from(new Set([...next.triggeredTrapIds,tile.id]));
      if(tile.kind==='TRAP'){const trap=NORMAL_DUNGEON_TRAPS.find(t=>t.id===tile.trapId)||NORMAL_DUNGEON_TRAPS[0];base={...base,hp:Math.max(1,base.hp-Math.round(base.maxHp*(trap.hpRatioDamage||0))),sanity:Math.max(1,base.sanity-(trap.sanityDamage||0))};if(trap.timeMinutes)base=advanceGameTime(base,trap.timeMinutes);log(`${trap.name}: ${trap.description}`);}else{const adult=ADULT_DUNGEON_TRAP_SLOTS.find(t=>t.id===tile.adultTrapSlotId);if(Number(base.profile?.physicalAge||0)<18){log('연령 제한이 걸린 특수 함정 슬롯이 비활성화되었다.');}else if(adult&&(adult.name||adult.sceneReference||adult.effectReference)){base={...base,activeDungeonAdultTrapSlotId:adult.id,activeDungeonAdultTrapExpiresAtDialogue:Number(base.dialogueCount||0)+1};log(`${adult.name||'성인 함정'}이 발동했다. 다음 장면에서 사용자 작성 참조 슬롯을 사용한다.`);}else{log('사용자 작성용 성인 함정 슬롯이다. 아직 내용이 비어 있어 일반 탐사 처리로 넘어간다.');}}
    }
    if(tile.kind==='TREASURE'&&!state.claimedTreasureIds.includes(tile.id)){next.claimedTreasureIds=Array.from(new Set([...next.claimedTreasureIds,tile.id]));const rupees=35+dungeon.rewardTier*45;const item={id:`dungeon_relic_${dungeon.regionId.toLowerCase()}`,name:`${dungeon.name} 유물편`,quantity:1+dungeon.rewardTier,category:'MATERIAL' as const,description:'던전 제작과 교환에 사용하는 유물 재료.'};const inv=[...base.inventory];const found=inv.find(i=>i.id===item.id);if(found)found.quantity+=item.quantity;else inv.push(item);base={...base,rupees:base.rupees+rupees,inventory:inv};log(`보물 발견: ${item.name} x${item.quantity}, ${rupees} 루피.`);}
    if(tile.kind==='LOOT_ROOM'){
      if(!state.bossDefeated){log('출구의 전리품방은 보스를 쓰러뜨리기 전에는 열리지 않는다.');return;}if(!state.claimedTreasureIds.includes(tile.id)){const qty=2+dungeon.rewardTier*2,rupees=120*dungeon.rewardTier;const item={id:`dungeon_core_${dungeon.id}`,name:`${dungeon.name} 공략 전리품`,quantity:qty,category:'MATERIAL' as const,description:'던전 최종 전리품방에서 획득한 희귀 재료.'};const inv=[...base.inventory];const found=inv.find(i=>i.id===item.id);if(found)found.quantity+=qty;else inv.push(item);base={...base,rupees:base.rupees+rupees,inventory:inv};next.claimedTreasureIds=Array.from(new Set([...next.claimedTreasureIds,tile.id]));next.completed=true;log(`던전 공략 완료. 전리품방에서 ${item.name} x${qty}, ${rupees} 루피를 획득했다.`);}}
    if((tile.kind==='ENEMY'||tile.kind==='ELITE'||tile.kind==='BOSS')&&!cleared.has(tile.id)&&tile.monsterId){const def=getRegionalMonsterDefinition(tile.monsterId);if(def){const enemy=createEnemyActor({templateId:def.id,name:def.name,level:Math.max(def.minLevel,Math.min(def.maxLevel,base.level+(dungeon.rewardTier-1)*2)),tier:tile.kind==='BOSS'?'BOSS':tile.kind==='ELITE'?'ELITE':def.tier,skills:def.skills,personality:def.personality,race:def.raceType==='HUMANOID'?(def.raceSubtype.startsWith('BEASTKIN_')?'BEASTKIN':def.raceSubtype==='ELF'?'ELF':'HUMAN'):'MONSTER',traits:[def.raceType,def.raceSubtype,'DUNGEON',`DUNGEON_REWARD_TIER:${dungeon.rewardTier}`,...(dungeon.layer==='DEEP_UNDERGROUND'?['DEEP_UNDERGROUND']:[]),...(tile.kind==='BOSS'?['DUNGEON_BOSS']:[]) ]});next.pendingCombatTileId=tile.id;next.pendingCombatMonsterId=def.id;base={...base,dungeonExploration:next,dungeonRecords:{...(base.dungeonRecords||{}),[dungeon.id]:next},activeBattle:initBattleState(base,[enemy],{name:dungeon.name,description:`${dungeon.kind} · ${dungeon.textureId} · ${dungeon.gimmickName}`,environmentType:'DUNGEON'})};onUpdatePlayer(base);onClose();return;}}
    next.clearedTileIds=Array.from(new Set([...next.clearedTileIds,...(['FLOOR','CORRIDOR','ENTRANCE','BUTTON','ALTAR','TRAP','ADULT_TRAP','TREASURE','DOOR','LOOT_ROOM'].includes(tile.kind)?[tile.id]:[])]));updateExploration(next,base);
  };

  return <div className="fixed inset-0 z-[75] bg-black/90 flex items-center justify-center p-2"><div className={`w-full max-w-6xl h-[94dvh] rounded-2xl overflow-hidden border border-stone-700 bg-gradient-to-br ${textureClass(dungeon.textureId)} flex flex-col`}>
    <header className="p-3 border-b border-white/10 flex items-center gap-3"><div><b className="text-amber-200">{dungeon.name}</b><div className="text-[11px] text-stone-400">{dungeon.kind} · {dungeon.size} · {layout.tileCount} 타일 · {dungeon.textureId}</div></div><div className="ml-auto text-xs text-violet-200">기믹: {dungeon.gimmickName}</div><button onClick={onClose} className="p-2 rounded bg-black/40"><X className="w-4"/></button></header>
    <div className="flex-1 min-h-0 grid md:grid-cols-[1fr_300px]"><div className="overflow-auto p-4 flex items-start justify-center"><div className="grid gap-[2px]" style={{gridTemplateColumns:`repeat(${layout.width}, minmax(22px, 34px))`}}>{layout.tiles.map(tile=>{const known=discovered.has(tile.id)||tile.id===current.id;const isCurrent=tile.id===current.id;const done=cleared.has(tile.id)||state.claimedTreasureIds.includes(tile.id);return <button key={tile.id} disabled={!known||tile.kind==='WALL'} onClick={()=>interact(tile)} title={known?`${dungeonTileLabel(tile.kind)} ${tile.x},${tile.y}`:'미탐사'} className={`aspect-square min-w-[22px] rounded-sm border text-[11px] flex items-center justify-center ${known?tileBg[tile.kind]:'bg-black border-stone-950'} ${isCurrent?'ring-2 ring-amber-300 z-10':''} ${done?'opacity-70':''}`}>{known?glyph[tile.kind]:''}</button>})}</div></div>
      <aside className="border-l border-white/10 p-4 overflow-y-auto space-y-3 text-xs"><div className="rounded-xl bg-black/35 p-3"><b>{dungeon.gimmickName}</b><p className="text-stone-400 mt-1">{dungeon.description}</p></div><div className="grid grid-cols-2 gap-2"><div className="rounded bg-black/30 p-2">탐사<br/><b>{state.discoveredTileIds.length}/{layout.tileCount}</b></div><div className="rounded bg-black/30 p-2">보스<br/><b>{state.bossDefeated?'처치':'생존'}</b></div></div><div className="space-y-1 text-stone-300"><div><Swords className="w-3 inline"/> 적/엘리트</div><div><Gem className="w-3 inline"/> 보물/전리품방</div><div><DoorOpen className="w-3 inline"/> 문</div><div><ToggleLeft className="w-3 inline"/> 버튼/기믹</div><div><TriangleAlert className="w-3 inline"/> 일반 함정 6종</div><div><Sparkles className="w-3 inline"/> 성인 함정 5슬롯(18+만)</div><div><Skull className="w-3 inline"/> 출구 전 보스</div></div>{state.completed&&<div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-amber-200 font-bold">공략 완료 · 출구 전리품방 확보</div>}</aside></div>
  </div></div>;
}
