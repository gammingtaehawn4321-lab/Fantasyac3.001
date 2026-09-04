import type { CompanionData, PetGrade, PlayerState } from '../../types';
import { normalizePetState } from './petState';

export const PET_GRADE_ORDER: PetGrade[] = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY'];
export const PET_GRADE_LABELS: Record<PetGrade,string> = { COMMON:'일반', UNCOMMON:'고급', RARE:'희귀', EPIC:'영웅', LEGENDARY:'전설' };
export const PET_GRADE_LEVEL_CAP: Record<PetGrade,number> = { COMMON:10, UNCOMMON:20, RARE:30, EPIC:40, LEGENDARY:50 };
export const PET_GRADE_DESIRE_MULTIPLIER: Record<PetGrade,number> = { COMMON:1, UNCOMMON:1.35, RARE:1.8, EPIC:2.4, LEGENDARY:3.2 };
export const PET_GRADE_WILDNESS_MULTIPLIER: Record<PetGrade,number> = { COMMON:1, UNCOMMON:1.25, RARE:1.6, EPIC:2.05, LEGENDARY:2.7 };

export function getPetRequiredExp(level:number):number { return 60 + Math.max(0, level-1)*25; }
export function getPetMetabolismMultiplier(level:number):number { return 1 + Math.max(0, Math.min(5, level))*0.20; }
export function getPetStatMultiplier(metabolismBoost:number):number { return 1 + Math.max(0,Math.min(5,metabolismBoost))*0.03; }

/** 반복 거절 한계의 강제형 요구가 발생했을 때 적용하는 큰 야생성 상승량.
 * 등급 야생성 배율의 제곱근만 반영해 고등급에서 과도하게 즉시 100에 붙는 것을 막는다.
 */
export function getForcedRequestWildnessGain(grade: PetGrade): number {
  const multiplier = PET_GRADE_WILDNESS_MULTIPLIER[grade] || 1;
  return Math.round(10 * Math.sqrt(multiplier) * 100) / 100;
}

export function grantPetExperience(state:PlayerState, exp:number):{nextState:PlayerState; messages:string[]} {
  const gain=Math.max(0,Math.floor(exp)); if(!gain) return {nextState:state,messages:[]};
  const messages:string[]=[];
  const companions=(state.companions||[]).map(c=>{
    if(c.kind!=='PET'||!c.petState||!c.isActivePartyMember) return c;
    const ps=normalizePetState(c.petState)!;
    let level=Math.max(1,ps.growth.level||c.level||1), petExp=Math.max(0,ps.growth.exp||0), grade=ps.growth.grade;
    petExp += gain;
    let promoted=false;
    while(level < 50){
      const need=getPetRequiredExp(level); if(petExp<need) break;
      petExp-=need; level+=1;
      const cap=PET_GRADE_LEVEL_CAP[grade];
      if(level>=cap){
        const idx=PET_GRADE_ORDER.indexOf(grade);
        if(idx<PET_GRADE_ORDER.length-1){ grade=PET_GRADE_ORDER[idx+1]; promoted=true; }
      }
    }
    messages.push(`🐾 ${c.name} 펫 경험치 +${gain}${level>(ps.growth.level||1)?` · Lv.${level}`:''}${promoted?` · ${PET_GRADE_LABELS[grade]} 등급 승급`:''}`);
    return {...c, level, experience:petExp, petState:{...ps, growth:{...ps.growth, level, exp:petExp, grade}}};
  });
  return {nextState:{...state,companions},messages};
}
