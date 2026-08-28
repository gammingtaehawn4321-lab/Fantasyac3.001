import type { PlayerState, WorldRegionId } from '../../types';
import { WORLD_HEX_TILES } from './worldMapSystem';

export interface MiningRewardItem { id:string; name:string; quantity:number; category:'MATERIAL'; description:string; }
export interface MiningResult { success:boolean; message:string; items:MiningRewardItem[]; minutes:number; nextState:PlayerState; }

const REGION_ORES:Record<Exclude<WorldRegionId,'SCROZE'>,Array<{id:string;name:string;weight:number}>>={
  GRANDIA:[{id:'ore_iron',name:'철광석',weight:6},{id:'ore_copper',name:'동광석',weight:3},{id:'gem_garnet',name:'석류석',weight:1}],
  FOREZIN:[{id:'ore_sylvan_iron',name:'수림철',weight:5},{id:'material_resin_crystal',name:'수액 결정',weight:3},{id:'gem_emerald',name:'에메랄드 원석',weight:1}],
  SEIRE:[{id:'ore_blue_silver',name:'청은광',weight:5},{id:'material_coral_crystal',name:'산호 결정',weight:3},{id:'gem_aquamarine',name:'아쿠아마린 원석',weight:1}],
  SANTIMAC:[{id:'ore_obsidian_iron',name:'흑유리철',weight:5},{id:'material_glass_crystal',name:'유리질 결정',weight:3},{id:'gem_topaz',name:'토파즈 원석',weight:1}],
  PROSTI:[{id:'ore_frost_iron',name:'빙철광',weight:5},{id:'material_frost_crystal',name:'빙정 결정',weight:3},{id:'gem_sapphire',name:'사파이어 원석',weight:1}],
};

function pickWeighted<T extends {weight:number}>(items:T[],seed:number){let total=items.reduce((s,x)=>s+x.weight,0);let roll=(Math.abs(Math.sin(seed*12.9898))*10000%1)*total;for(const item of items){roll-=item.weight;if(roll<=0)return item;}return items[0];}

export function mineWorldOreVein(state:PlayerState,tileId:string):MiningResult{
  const tile=WORLD_HEX_TILES[tileId];
  if(!tile||!tile.oreVeinId||tile.regionId==='SCROZE'||(tile.layer!=='UNDERGROUND'&&tile.layer!=='DEEP_UNDERGROUND'))return{success:false,message:'이곳에는 채굴 가능한 광맥이 없습니다.',items:[],minutes:0,nextState:state};
  const minedFlag=`MINED_VEIN:${tile.oreVeinId}`;if((state.worldMap.accessFlags||[]).includes(minedFlag))return{success:false,message:'이 광맥은 이미 이번 탐사에서 채굴했습니다.',items:[],minutes:0,nextState:state};
  const deep=tile.layer==='DEEP_UNDERGROUND';const table=REGION_ORES[tile.regionId as Exclude<WorldRegionId,'SCROZE'>];const seed=tile.q*97+tile.r*131+state.dayCount*17+state.currentHour;const primary=pickWeighted(table,seed);
  const items:MiningRewardItem[]=[{id:primary.id,name:primary.name,quantity:(deep?3:2)+Math.floor(Math.abs(Math.sin(seed))*3),category:'MATERIAL',description:'장비 제작에 사용하는 광맥 재료.'}];
  if(deep||Math.abs(Math.sin(seed*3.17))>.62)items.push({id:'enhancement_crystal_fragment',name:'강화 결정편',quantity:deep?2:1,category:'MATERIAL',description:'장비 강화 시스템 확장에 사용할 예정인 강화 재료.'});
  if(Math.abs(Math.sin(seed*7.31))>(deep?.60:.82)){const gem=table.find(x=>x.id.startsWith('gem_'))||table[table.length-1];items.push({id:gem.id,name:gem.name,quantity:1,category:'MATERIAL',description:'희귀 제작과 거래에 쓰이는 귀중한 보석 원석.'});}
  const inventory=[...(state.inventory||[])];for(const reward of items){const found=inventory.find(i=>i.id===reward.id||i.name===reward.name);if(found)found.quantity+=reward.quantity;else inventory.push({id:reward.id,name:reward.name,quantity:reward.quantity,category:'MATERIAL',description:reward.description});}
  const nextState:PlayerState={...state,inventory,worldMap:{...state.worldMap,accessFlags:Array.from(new Set([...(state.worldMap.accessFlags||[]),minedFlag])),mapRevision:(state.worldMap.mapRevision||0)+1}};
  return{success:true,message:`${tile.featureName||'광맥'}에서 ${items.map(i=>`${i.name} x${i.quantity}`).join(', ')}을 채굴했습니다.`,items,minutes:deep?45:30,nextState};
}
