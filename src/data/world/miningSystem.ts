import type { PlayerState, WorldRegionId } from '../../types';
import { WORLD_HEX_TILES } from './worldMapSystem';
import { getItemDefinition } from '../items/itemDatabase';
import { addTechnologyExp } from '../technology/technologyUtils';

export interface MiningRewardItem { id:string; name:string; quantity:number; category:'MATERIAL'; description:string; }
export interface MiningResult { success:boolean; message:string; items:MiningRewardItem[]; minutes:number; nextState:PlayerState; }

// IMPORTANT: every reward id below is a canonical ItemDefinition id.  Earlier builds used
// mining-only ids (ore_iron, ore_sylvan_iron, gem_emerald ...) which created unusable
// inventory stacks and could never satisfy quests that listen for iron_ore etc.
const REGION_ORES:Record<Exclude<WorldRegionId,'SCROZE'>,Array<{id:string;name:string;weight:number}>>={
  GRANDIA:[{id:'iron_ore',name:'철광석',weight:6},{id:'copper_ore',name:'동광석',weight:3},{id:'topaz_rough',name:'토파즈 원석',weight:1}],
  FOREZIN:[{id:'iron_ore',name:'철광석',weight:6},{id:'emerald_rough',name:'에메랄드 원석',weight:2},{id:'mana_crystal_shard',name:'빛나는 마나석 파편',weight:1}],
  SEIRE:[{id:'coral_fragment',name:'산호 조각',weight:5},{id:'sapphire_rough',name:'사파이어 원석',weight:3},{id:'opal_rough',name:'오팔 원석',weight:1}],
  SANTIMAC:[{id:'iron_ore',name:'철광석',weight:5},{id:'obsidian_shard',name:'흑요석 조각',weight:3},{id:'ruby_rough',name:'루비 원석',weight:1}],
  PROSTI:[{id:'frost_silver_ore',name:'빙은광',weight:5},{id:'mithril_sand',name:'미스릴 사금',weight:3},{id:'sapphire_rough',name:'사파이어 원석',weight:1}],
};

function pickWeighted<T extends {weight:number}>(items:T[],seed:number){let total=items.reduce((s,x)=>s+x.weight,0);let roll=(Math.abs(Math.sin(seed*12.9898))*10000%1)*total;for(const item of items){roll-=item.weight;if(roll<=0)return item;}return items[0];}

export function mineWorldOreVein(state:PlayerState,tileId:string):MiningResult{
  const tile=WORLD_HEX_TILES[tileId];
  if(!tile||!tile.oreVeinId||tile.regionId==='SCROZE'||(tile.layer!=='UNDERGROUND'&&tile.layer!=='DEEP_UNDERGROUND'))return{success:false,message:'이곳에는 채굴 가능한 광맥이 없습니다.',items:[],minutes:0,nextState:state};
  const minedFlag=`MINED_VEIN:${tile.oreVeinId}`;if((state.worldMap.accessFlags||[]).includes(minedFlag))return{success:false,message:'이 광맥은 이미 이번 탐사에서 채굴했습니다.',items:[],minutes:0,nextState:state};
  const deep=tile.layer==='DEEP_UNDERGROUND';const table=REGION_ORES[tile.regionId as Exclude<WorldRegionId,'SCROZE'>];const seed=tile.q*97+tile.r*131+state.dayCount*17+state.currentHour;const primary=pickWeighted(table,seed);
  const primaryDef=getItemDefinition(primary.id);
  const items:MiningRewardItem[]=[{id:primary.id,name:primaryDef?.name||primary.name,quantity:(deep?3:2)+Math.floor(Math.abs(Math.sin(seed))*3),category:'MATERIAL',description:primaryDef?.description||'장비 제작에 사용하는 광맥 재료.'}];
  // 강화 결정편은 정의/사용처가 없는 미래용 죽은 아이템이었다. 실제 제작에 사용되는 마나석 파편으로 통합한다.
  if(deep||Math.abs(Math.sin(seed*3.17))>.62){const d=getItemDefinition('mana_crystal_shard');items.push({id:'mana_crystal_shard',name:d?.name||'빛나는 마나석 파편',quantity:deep?2:1,category:'MATERIAL',description:d?.description||'마법 장비 강화와 제작에 쓰이는 결정 파편.'});}
  if(Math.abs(Math.sin(seed*7.31))>(deep?.60:.82)){const gem=table.find(x=>x.id.endsWith('_rough'))||table[table.length-1];const d=getItemDefinition(gem.id);items.push({id:gem.id,name:d?.name||gem.name,quantity:1,category:'MATERIAL',description:d?.description||'희귀 제작과 거래에 쓰이는 귀중한 광물.'});}
  const inventory=[...(state.inventory||[])];for(const reward of items){const found=inventory.find(i=>i.id===reward.id||i.name===reward.name);if(found)found.quantity+=reward.quantity;else inventory.push({id:reward.id,name:reward.name,quantity:reward.quantity,category:'MATERIAL',description:reward.description});}
  const technologyState=addTechnologyExp(state.technologyState||{},'MINING',deep?30:20);
  const nextState:PlayerState={...state,inventory,technologyState,worldMap:{...state.worldMap,accessFlags:Array.from(new Set([...(state.worldMap.accessFlags||[]),minedFlag])),mapRevision:(state.worldMap.mapRevision||0)+1}};
  return{success:true,message:`${tile.featureName||'광맥'}에서 ${items.map(i=>`${i.name} x${i.quantity}`).join(', ')}을 채굴했습니다.`,items,minutes:deep?45:30,nextState};
}
