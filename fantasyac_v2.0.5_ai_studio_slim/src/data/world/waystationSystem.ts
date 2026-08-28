import type { PlayerState, WorldRegionId } from '../../types';

export interface WaystationDefinition {id:string;name:string;regionId:WorldRegionId;q:number;r:number;description:string;baseFare:number;}
export interface WaystationRoute {id:string;from:string;to:string;distance:number;fare:number;minutes:number;}
export interface WaystationSpecialEncounter {id:string;name:string;weight:number;text:string;}

export const WAYSTATIONS:WaystationDefinition[]=[
  {id:'ws_grandia_west',name:'서부 구릉 역참',regionId:'GRANDIA',q:-16,r:0,description:'더 펠리스 서쪽 구릉과 광산길을 잇는다.',baseFare:55},
  {id:'ws_grandia_south',name:'남부 대로 역참',regionId:'GRANDIA',q:-13,r:5,description:'왕도 남부 대로의 대형 휴게 거점.',baseFare:60},
  {id:'ws_grandia_east',name:'동부 초원 역참',regionId:'GRANDIA',q:-9,r:0,description:'포레진 방면 상단과 여행자가 모인다.',baseFare:65},
  {id:'ws_grandia_north',name:'북부 목동길 역참',regionId:'GRANDIA',q:-11,r:-4,description:'목동길과 북쪽 언덕을 연결한다.',baseFare:50},

  {id:'ws_forezin_west',name:'서림 역참',regionId:'FOREZIN',q:-9,r:-6,description:'침략 전선과 숲 서쪽의 피난로를 잇는다.',baseFare:65},
  {id:'ws_forezin_river',name:'강뿌리 역참',regionId:'FOREZIN',q:-6,r:-5,description:'강변 부락을 잇는 목조 역참.',baseFare:55},
  {id:'ws_forezin_north',name:'청엽 역참',regionId:'FOREZIN',q:-3,r:-9,description:'북부 숲과 광물 능선의 중계지.',baseFare:60},
  {id:'ws_forezin_east',name:'동림 역참',regionId:'FOREZIN',q:-1,r:-5,description:'산티맥 방면으로 이어지는 숲길 거점.',baseFare:70},

  {id:'ws_santimac_west',name:'서사구 역참',regionId:'SANTIMAC',q:6,r:1,description:'레무시안 서쪽 교역로의 관문.',baseFare:70},
  {id:'ws_santimac_city',name:'레무시안 외곽 역참',regionId:'SANTIMAC',q:12,r:0,description:'도시권 외곽의 공식 교통 거점.',baseFare:65},
  {id:'ws_santimac_south',name:'남협 역참',regionId:'SANTIMAC',q:14,r:5,description:'남부 협곡과 국경을 잇는다.',baseFare:75},
  {id:'ws_santimac_north',name:'북사막 역참',regionId:'SANTIMAC',q:11,r:-5,description:'데저트 알토 외곽으로 향하는 마지막 공공 역참.',baseFare:80},

  {id:'ws_prosti_lower',name:'설산 초입 역참',regionId:'PROSTI',q:5,r:-7,description:'대설산에 오르기 전 장비를 점검하는 곳.',baseFare:75},
  {id:'ws_prosti_valley',name:'백랑 계곡 역참',regionId:'PROSTI',q:8,r:-6,description:'늑대 수인 취락과 이어지는 눈길 거점.',baseFare:70},
  {id:'ws_prosti_ridge',name:'빙벽 능선 역참',regionId:'PROSTI',q:11,r:-8,description:'고산 등반대가 쉬어가는 방풍 역참.',baseFare:90},
  {id:'ws_prosti_summit',name:'천정길 역참',regionId:'PROSTI',q:7,r:-12,description:'하늘 진입로 직전의 최후 역참.',baseFare:110},

  {id:'ws_seire_west',name:'서해안 수로역',regionId:'SEIRE',q:-7,r:8,description:'연안 마차와 소형 수송선을 갈아타는 거점.',baseFare:65},
  {id:'ws_seire_sky',name:'스카이 외항 역참',regionId:'SEIRE',q:-4,r:7,description:'수상도시 외항과 육상 운송망을 잇는다.',baseFare:75},
  {id:'ws_seire_east',name:'동해안 수로역',regionId:'SEIRE',q:-1,r:8,description:'동부 연안 교역로의 수송 거점.',baseFare:70},
  {id:'ws_seire_cliff',name:'해식절벽 역참',regionId:'SEIRE',q:2,r:7,description:'해안 절벽길과 산티맥 방면을 잇는다.',baseFare:85},
];

const linkPairs:[string,string][]=[
  ['ws_grandia_west','ws_grandia_north'],['ws_grandia_north','ws_grandia_east'],['ws_grandia_west','ws_grandia_south'],['ws_grandia_south','ws_grandia_east'],
  ['ws_grandia_east','ws_forezin_west'],['ws_forezin_west','ws_forezin_river'],['ws_forezin_river','ws_forezin_north'],['ws_forezin_river','ws_forezin_east'],['ws_forezin_east','ws_santimac_west'],
  ['ws_santimac_west','ws_santimac_city'],['ws_santimac_city','ws_santimac_south'],['ws_santimac_city','ws_santimac_north'],['ws_santimac_north','ws_prosti_lower'],
  ['ws_prosti_lower','ws_prosti_valley'],['ws_prosti_valley','ws_prosti_ridge'],['ws_prosti_ridge','ws_prosti_summit'],
  ['ws_grandia_south','ws_seire_west'],['ws_seire_west','ws_seire_sky'],['ws_seire_sky','ws_seire_east'],['ws_seire_east','ws_seire_cliff'],['ws_seire_cliff','ws_santimac_south'],
];
const byId=Object.fromEntries(WAYSTATIONS.map(x=>[x.id,x]));
const dist=(a:WaystationDefinition,b:WaystationDefinition)=>Math.max(1,(Math.abs(a.q-b.q)+Math.abs(a.r-b.r)+Math.abs((a.q+a.r)-(b.q+b.r)))/2);
export const WAYSTATION_ROUTES:WaystationRoute[]=linkPairs.map(([a,b],i)=>{const A=byId[a],B=byId[b],d=dist(A,B);return{id:`wayroute_${i+1}`,from:a,to:b,distance:d,fare:Math.round((A.baseFare+B.baseFare+d*16)/10)*10,minutes:Math.round(d*24+35)};});

export const WAYSTATION_SPECIAL_ENCOUNTERS:WaystationSpecialEncounter[]=[
  {id:'waystation_wagon_raid',name:'마차 약탈',weight:32,text:'호위 마차를 노린 약탈대가 길을 가로막았다. 안전로의 예외 상황이다.'},
  {id:'waystation_slave_trader',name:'노예상 접근',weight:22,text:'수상한 노예상이 승객을 살피며 거래를 제안한다. 거절하거나 대응할 수 있다.'},
  {id:'waystation_false_checkpoint',name:'가짜 검문소',weight:18,text:'정식 표식이 없는 검문소가 통행료를 추가로 요구한다.'},
  {id:'waystation_broken_axle',name:'마차 축 파손',weight:16,text:'수송 마차의 축이 부러져 임시 수리를 해야 한다.'},
  {id:'waystation_roaming_merchant',name:'이동 상인',weight:12,text:'역참 노선만 따라다니는 희귀 행상인이 잠시 합류했다.'},
];

export function getWaystation(id?:string){return id?byId[id]:undefined;}
export function getWaystationAt(q:number,r:number){return WAYSTATIONS.find(x=>x.q===q&&x.r===r);}
export function getWaystationRoutes(id:string){return WAYSTATION_ROUTES.filter(r=>r.from===id||r.to===id);}
export function getWaystationDestination(route:WaystationRoute,fromId:string){return getWaystation(route.from===fromId?route.to:route.from);}
export function rollWaystationSpecialEncounter(state:PlayerState,route:WaystationRoute,seed:number):WaystationSpecialEncounter|undefined{
  // 기본 14%. 이 외에는 일반 몬스터/여행 인카운터를 완전히 생략한다.
  const n=Math.abs(Math.sin((seed+state.dayCount*31+route.distance*17)*12.9898)*43758.5453)%1;if(n>=.14)return undefined;
  const total=WAYSTATION_SPECIAL_ENCOUNTERS.reduce((s,e)=>s+e.weight,0);let x=(Math.abs(Math.sin(seed*9.173+route.distance))*9999%1)*total;for(const e of WAYSTATION_SPECIAL_ENCOUNTERS){x-=e.weight;if(x<=0)return e;}return WAYSTATION_SPECIAL_ENCOUNTERS[0];
}
