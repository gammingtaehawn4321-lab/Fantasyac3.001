import type { InventoryItem, PlayerState } from '../../types';
import type { WorldHexTile } from './worldMapSystem';
import { LIFE_MATERIAL_META } from '../items/lifeMaterialSystem';
import { getItemDefinition } from '../items/itemDatabase';

const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)/4294967295;};
const terrainAliases:Record<string,string[]>={
  PLAINS:['PLAINS'],HILL:['HILL'],FOREST:['FOREST'],RIVER:['RIVER'],URBAN:['URBAN'],COAST:['COAST'],SEA:['SEA','COAST'],DEEP_SEA:['DEEP_SEA'],SNOW:['SNOW'],MOUNTAIN:['MOUNTAIN'],
  FLOATING_LAND:['FLOATING_LAND'],CLOUD:['CLOUD','SKY'],STORM:['STORM'],SHRINE:['SHRINE'],CAVE:['CAVE'],TUNNEL:['CAVE','TUNNEL'],UNDERGROUND_RIVER:['UNDERGROUND_RIVER','RIVER'],CHASM:['CHASM','CAVE'],CRYSTAL_CAVE:['CRYSTAL_CAVE','CAVE'],FUNGAL_CAVE:['FUNGAL_CAVE','CAVE'],MAGMA_RIFT:['MAGMA_RIFT','CAVE'],UNKNOWN:[],
};
export function getGatherableLifeMaterialIds(tile:WorldHexTile):string[]{const tags=terrainAliases[tile.terrain]||[tile.terrain];return Object.values(LIFE_MATERIAL_META).filter(m=>m.sourceRegions.includes(tile.regionId)&&m.sourceTerrainTags.some(t=>tags.includes(t)||tile.tags.includes(t))).map(m=>m.itemId);}
function add(inv:InventoryItem[],id:string,n:number){const out=inv.map(x=>({...x}));const ex=out.find(x=>x.id===id);const def=getItemDefinition(id);if(ex)ex.quantity+=n;else out.push({id,name:def?.name||id,quantity:n,category:def?.category||'MATERIAL',description:def?.description,quality:'NORMAL'});return out;}
export function gatherLifeResources(state:PlayerState,tile:WorldHexTile):{success:boolean;nextState:PlayerState;minutes:number;items:Array<{id:string;name:string;quantity:number}>;message:string}{
  const pool=getGatherableLifeMaterialIds(tile);if(!pool.length)return{success:false,nextState:state,minutes:0,items:[],message:'이 Hex에서는 현재 채집 가능한 생활 재료를 찾지 못했습니다.'};
  const hasPotion=(id:string)=>Boolean(state.activePotionEffects?.some((effect)=>effect.statusEffectId===id&&effect.remainingMinutes>0));
  const trackerActive=hasPotion('status_potion_tracker');const gatherSenseActive=hasPotion('status_potion_gather_sense');
  const trackerExtra=trackerActive&&hash(`${tile.id}:${state.dayCount}:${state.currentHour}:tracker`)<0.30?1:0;
  const rolls=1+(hash(`${tile.id}:${state.dayCount}:rolls`)>0.62?1:0)+(hash(`${tile.id}:${state.currentHour}:rare`)>0.9?1:0)+trackerExtra;let inv=state.inventory;const got:Record<string,number>={};
  for(let i=0;i<rolls;i++){const idx=Math.floor(hash(`${tile.encounterKey}:${state.dayCount}:${state.currentHour}:${i}`)*pool.length)%pool.length;const id=pool[idx];const amount=1+Math.floor(hash(`${id}:${state.currentMinute}:${i}`)*3)+(gatherSenseActive?1:0);got[id]=(got[id]||0)+amount;inv=add(inv,id,amount);}
  const items=Object.entries(got).map(([id,quantity])=>({id,name:getItemDefinition(id)?.name||id,quantity}));const minutes=18+rolls*7;return{success:true,nextState:{...state,inventory:inv},minutes,items,message:items.map(x=>`${x.name} x${x.quantity}`).join(', ')};
}
