import type { PlayerState, WorldRegionId } from '../../types';
import { DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES } from '../raceNarrativeReferences';

export const DRAGONKIN_HUNTER_ENCOUNTER_IDS = Object.keys(DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES);
export const DRAGONKIN_HUNTER_MONSTER_IDS = [
  'dragon_hunter_tracker','dragon_hunter_netter','dragon_hunter_sealmage','dragon_hunter_chain_knight','dragon_hunter_horn_reaper',
  'dragon_hunter_resonance_hound','dragon_hunter_capture_golem','dragon_hunter_chain_ballista','dragon_hunter_scale_drone','dragon_hunter_suppression_pylon',
] as const;

/** 지역 분위기와 장비 운용 방식에 맞춘 용족 사냥대 출현 풀. */
export const DRAGONKIN_HUNTER_MONSTERS_BY_REGION: Record<WorldRegionId, readonly (typeof DRAGONKIN_HUNTER_MONSTER_IDS)[number][]> = {
  GRANDIA: ['dragon_hunter_tracker','dragon_hunter_resonance_hound'],
  SEIRE: ['dragon_hunter_horn_reaper'],
  FOREZIN: ['dragon_hunter_sealmage','dragon_hunter_suppression_pylon'],
  SANTIMAC: ['dragon_hunter_netter','dragon_hunter_capture_golem'],
  PROSTI: ['dragon_hunter_chain_knight'],
  SCROZE: ['dragon_hunter_chain_ballista','dragon_hunter_scale_drone'],
};

function hash01(seed:number){let x=Math.sin(seed*12.9898+78.233)*43758.5453;return x-Math.floor(x);}
export function rollDragonkinHunterTravelEvent(state:PlayerState,regionId:WorldRegionId,seed:number):{kind:'ENCOUNTER'|'MONSTER';id:string}|null {
  if(state.race!=='DRAGONKIN'||state.activeEncounterId||state.activeBattle) return null;
  const threat=Math.max(0,Math.min(100,Number(state.dragonkinState?.hunterThreat??10)));
  const chance=Math.min(0.24,0.07+threat*0.0012);
  if(hash01(seed+state.dayCount*17)>chance) return null;
  const combat=hash01(seed+991)<0.42;
  if(combat){
    const candidates=DRAGONKIN_HUNTER_MONSTERS_BY_REGION[regionId];
    const id=candidates[Math.floor(hash01(seed+313)*candidates.length)%candidates.length];
    return {kind:'MONSTER',id};
  }
  const id=DRAGONKIN_HUNTER_ENCOUNTER_IDS[Math.floor(hash01(seed+127)*DRAGONKIN_HUNTER_ENCOUNTER_IDS.length)%DRAGONKIN_HUNTER_ENCOUNTER_IDS.length];
  return {kind:'ENCOUNTER',id};
}

export function markDragonkinHunterEvent(state:PlayerState):PlayerState {
  if(state.race!=='DRAGONKIN') return state;
  const old=state.dragonkinState||{hunterThreat:10,hunterEncounterCount:0};
  return {...state,dragonkinState:{hunterThreat:Math.min(100,old.hunterThreat+4),hunterEncounterCount:old.hunterEncounterCount+1}};
}
