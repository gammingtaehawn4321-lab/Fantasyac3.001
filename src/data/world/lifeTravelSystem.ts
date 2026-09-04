import type { AirshipState, InventoryItem, PlayerState, TravelRangeBreakdown, WorldMapLayer } from '../../types';
import { getEquipmentDefinition } from '../equipment/equipmentDatabase';
import { getItemDefinition } from '../items/itemDatabase';

export const DEFAULT_AIRSHIP_STATE: AirshipState = {
  built:false,name:'무명 비행정',level:0,fuel:0,maxFuel:0,hull:0,maxHull:0,cargoLevel:0,engineLevel:0,navigationLevel:0,unlockedUpgradeIds:[],
};

export interface MaterialCost { itemId:string; quantity:number; }
export interface AirshipUpgradeDefinition {id:string;name:string;requiredLevel:number;rupees:number;materials:MaterialCost[];effect:string;}

export const AIRSHIP_BUILD_COST:MaterialCost[]=[
  {itemId:'hardwood_board',quantity:45},{itemId:'canvas_roll',quantity:24},{itemId:'steel_bolt',quantity:36},{itemId:'pitch_barrel',quantity:8},
  {itemId:'bronze_gear',quantity:18},{itemId:'aether_crystal',quantity:12},{itemId:'navigation_lens',quantity:3},{itemId:'wind_rune_plate',quantity:2},
];

export const AIRSHIP_UPGRADES:AirshipUpgradeDefinition[]=[
  {id:'airship_hull_2',name:'이중 보강 선체',requiredLevel:1,rupees:0,materials:[{itemId:'ironwood_log',quantity:18},{itemId:'steel_bolt',quantity:28},{itemId:'pitch_barrel',quantity:5}],effect:'비행정 Lv.2 · 내구도/연료 증가'},
  {id:'airship_engine_2',name:'에테르 이중기관',requiredLevel:2,rupees:0,materials:[{itemId:'sky_iron_ore',quantity:16},{itemId:'aether_crystal',quantity:18},{itemId:'pressure_valve',quantity:6},{itemId:'bronze_gear',quantity:24}],effect:'비행정 Lv.3 · 천공 진입 가능'},
  {id:'airship_nav_2',name:'천공 항법실',requiredLevel:3,rupees:0,materials:[{itemId:'navigation_lens',quantity:8},{itemId:'wind_rune_plate',quantity:7},{itemId:'starstone',quantity:3},{itemId:'glass_sheet',quantity:12}],effect:'비행정 Lv.4 · 천공 연료 효율/항법 강화'},
  {id:'airship_storm_core',name:'폭풍심장 기관',requiredLevel:4,rupees:0,materials:[{itemId:'storm_crystal',quantity:8},{itemId:'mithril_sand',quantity:16},{itemId:'aether_condenser',quantity:3},{itemId:'sky_iron_ore',quantity:24}],effect:'비행정 Lv.5 · 폭풍 항로와 장거리 비행 특화'},
];

const qty=(inv:InventoryItem[],id:string)=>inv.filter(x=>x.id===id).reduce((s,x)=>s+x.quantity,0);
const remove=(inv:InventoryItem[],id:string,n:number)=>{let left=n;return inv.map(x=>{if(x.id!==id||left<=0)return x;const take=Math.min(x.quantity,left);left-=take;return {...x,quantity:x.quantity-take};}).filter(x=>x.quantity>0);};
const add=(inv:InventoryItem[],id:string,n:number)=>{const def=getItemDefinition(id);const out=inv.map(x=>({...x}));const ex=out.find(x=>x.id===id);if(ex)ex.quantity+=n;else out.push({id,name:def?.name||id,quantity:n,category:def?.category||'MISC',description:def?.description});return out;};
export function canPayMaterials(state:PlayerState,cost:MaterialCost[]){return cost.every(c=>qty(state.inventory,c.itemId)>=c.quantity);}
export function payMaterials(state:PlayerState,cost:MaterialCost[]):PlayerState{let inv=state.inventory;for(const c of cost)inv=remove(inv,c.itemId,c.quantity);return {...state,inventory:inv};}

export function buildAirship(state:PlayerState,name='개척자의 비행정'):{ok:boolean;state:PlayerState;message:string}{
  if(state.airship?.built)return{ok:false,state,message:'이미 비행정을 보유하고 있습니다.'};
  if(!canPayMaterials(state,AIRSHIP_BUILD_COST))return{ok:false,state,message:'비행정 건조 재료가 부족합니다.'};
  let next=payMaterials(state,AIRSHIP_BUILD_COST);next={...next,airship:{built:true,name,level:1,fuel:20,maxFuel:40,hull:100,maxHull:100,cargoLevel:1,engineLevel:1,navigationLevel:1,unlockedUpgradeIds:[]}};
  return{ok:true,state:next,message:`${name} 건조 완료. 이제 하늘을 직접 비행할 수 있습니다.`};
}
export function upgradeAirship(state:PlayerState,upgradeId:string):{ok:boolean;state:PlayerState;message:string}{
  const u=AIRSHIP_UPGRADES.find(x=>x.id===upgradeId);if(!u)return{ok:false,state,message:'알 수 없는 비행정 업그레이드입니다.'};
  const a=state.airship||DEFAULT_AIRSHIP_STATE;if(!a.built)return{ok:false,state,message:'먼저 비행정을 건조해야 합니다.'};
  if(a.unlockedUpgradeIds.includes(u.id))return{ok:false,state,message:'이미 적용한 업그레이드입니다.'};
  if(a.level<u.requiredLevel)return{ok:false,state,message:`비행정 Lv.${u.requiredLevel} 이상이 필요합니다.`};
  if(state.rupees<u.rupees||!canPayMaterials(state,u.materials))return{ok:false,state,message:'루피 또는 업그레이드 재료가 부족합니다.'};
  let next=payMaterials({...state,rupees:state.rupees-u.rupees},u.materials);const level=Math.min(5,a.level+1);next={...next,airship:{...a,level,maxFuel:40+level*20,fuel:Math.min(a.fuel+10,40+level*20),maxHull:100+level*45,hull:100+level*45,cargoLevel:Math.max(a.cargoLevel,Math.ceil(level/2)),engineLevel:level,navigationLevel:Math.max(a.navigationLevel,level-1),unlockedUpgradeIds:[...a.unlockedUpgradeIds,u.id]}};return{ok:true,state:next,message:`${u.name} 완료. 비행정 Lv.${level}`};
}
export function refuelAirship(state:PlayerState,itemId:'aether_fuel_cell'|'storm_fuel_cell',count=1){
  const a=state.airship||DEFAULT_AIRSHIP_STATE;
  if(!a.built)return{ok:false,state,message:'비행정이 없습니다.'};
  const room=Math.max(0,a.maxFuel-a.fuel);
  if(room<=0)return{ok:false,state,message:'비행정 연료가 이미 가득 차 있습니다.'};
  const have=qty(state.inventory,itemId);
  const use=Math.min(Math.max(0,count),have);
  if(!use)return{ok:false,state,message:'연료전지가 없습니다.'};
  const per=itemId==='storm_fuel_cell'?24:10;
  const actual=Math.min(use,Math.ceil(room/per));
  const inv=remove(state.inventory,itemId,actual);
  const gain=Math.min(room,actual*per);
  const def=getItemDefinition(itemId);
  return{ok:true,state:{...state,inventory:inv,airship:{...a,fuel:a.fuel+gain}},message:`연료 +${gain} (${a.fuel+gain}/${a.maxFuel})`,consumedCount:actual,itemName:def?.name||itemId};
}


export function calculateSurfaceTravelRange(state:PlayerState):TravelRangeBreakdown{
  const base=8;let raceBonus=0,passiveBonus=0,toolBonus=0,equipmentBonus=0;const sources:string[]=[];
  if(state.race==='YETI'){raceBonus=5;sources.push('설인: 고산 장거리 보행 +5');}
  else if(state.race==='BEASTKIN'&&state.beastkinType==='WOLF'){raceBonus=4;sources.push('늑대 수인: 장거리 추적 +4');}
  else if(state.race==='BEASTKIN'&&state.beastkinType==='DOG'){raceBonus=3;sources.push('개 수인: 지구력 +3');}
  else if(state.race==='BEASTKIN'&&state.beastkinType==='CAT'){raceBonus=2;sources.push('고양이 수인: 기민한 행군 +2');}
  else if(state.race==='ELF'){raceBonus=2;sources.push('엘프: 자연 길찾기 +2');}
  else if(state.race==='MERFOLK'){raceBonus=1;sources.push('인어족: 해안 적응 +1');}
  const passives=[...(state.passives||[]),...Object.keys(state.skillProgression?.passiveProgress||{}).filter(id=>state.skillProgression.passiveProgress[id]?.unlocked)];
  const travelPassiveBonus: Record<string,{bonus:number;name:string}> = {
    archer_passive_basic_4:{bonus:1,name:'경량 보법'}, dancer_passive_basic_2:{bonus:1,name:'유연한 보법'}, rogue_passive_advanced_1:{bonus:2,name:'무흔 보법'},
  };
  for (const id of new Set(passives)) { const b=travelPassiveBonus[id]; if(b){passiveBonus+=b.bonus;sources.push(`${b.name} +${b.bonus}`);} }
  if(passives.some(x=>/march|travel|wayfarer|endurance|행군|여행|지구력/i.test(x))){passiveBonus+=3;sources.push('여행/행군 전용 패시브 +3');}
  const invIds=new Set(state.inventory.filter(x=>x.quantity>0).map(x=>x.id));
  for(const [id,b,n] of [['field_ration_pack',2,'장거리 여행식'],['trail_compass',2,'행군용 지형 나침반'],['expedition_kit',3,'원정대 야전도구'],['wayfarer_tent',1,'경량 여행 천막']] as const){if(invIds.has(id)){toolBonus+=b;sources.push(`${n} +${b}`);}}
  const equipped=Object.values(state.equipment||{}).filter(Boolean) as string[];for(const id of equipped){const d=getEquipmentDefinition(id);if(d?.tags?.includes('TRAVEL_RANGE_1'))equipmentBonus+=1;if(d?.tags?.includes('TRAVEL_RANGE_2'))equipmentBonus+=2;if(d?.tags?.includes('TRAVEL_RANGE_3'))equipmentBonus+=3;}
  if(equipmentBonus)sources.push(`장비 이동 보정 +${equipmentBonus}`);
  return{base,raceBonus,passiveBonus,toolBonus,equipmentBonus,total:base+raceBonus+passiveBonus+toolBonus+equipmentBonus,sources};
}

export function airshipFuelCostForDistance(state:PlayerState,distance:number,layer:WorldMapLayer):number{
  const a=state.airship||DEFAULT_AIRSHIP_STATE;const layerMul=layer==='CELESTIAL'?1.8:1;const efficiency=Math.max(.55,1-(a.engineLevel-1)*.09-(a.navigationLevel-1)*.04);return Math.max(1,Math.ceil(distance*layerMul*efficiency));
}
export function canAirshipFly(state:PlayerState,layer:WorldMapLayer){const a=state.airship||DEFAULT_AIRSHIP_STATE;if(!a.built)return{ok:false,reason:'직접 제작한 비행정이 필요합니다.'};if(layer==='CELESTIAL'&&a.level<3)return{ok:false,reason:'천공 비행에는 비행정 Lv.3 이상이 필요합니다.'};if(layer!=='SKY'&&layer!=='CELESTIAL')return{ok:false,reason:'비행정은 하늘/천공 이동에 사용합니다.'};return{ok:true};}
export function consumeAirshipFuel(state:PlayerState,cost:number):PlayerState{return{...state,airship:{...(state.airship||DEFAULT_AIRSHIP_STATE),fuel:Math.max(0,(state.airship?.fuel||0)-cost)}};}
export function grantStarterLifeMaterials(state:PlayerState):PlayerState{let inv=state.inventory;for(const [id,n] of [['field_ration_pack',1],['trail_compass',1]] as const)if(qty(inv,id)<n)inv=add(inv,id,n-qty(inv,id));return{...state,inventory:inv};}
