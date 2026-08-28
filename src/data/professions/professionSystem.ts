import { CraftingRank, ProfessionProgress, ProfessionType } from './professionTypes';
export const ACTIVE_CRAFTING_PROFESSIONS: ProfessionType[]=['BLACKSMITH','LEATHERWORKER','ALCHEMIST'];
export const COMING_SOON_PROFESSIONS: ProfessionType[]=['COOK','CARPENTER','TAILOR'];
export const PROFESSION_MAX_LEVEL=60;
export const getCraftingRank=(level:number):CraftingRank=>level>=51?'GRANDMASTER':level>=41?'MASTER':level>=31?'ARTISAN':level>=21?'SKILLED':level>=11?'APPRENTICE':'NOVICE';
export const CRAFTING_RANK_LABEL:Record<CraftingRank,string>={NOVICE:'입문',APPRENTICE:'견습',SKILLED:'숙련',ARTISAN:'장인',MASTER:'명장',GRANDMASTER:'거장'};
export const getTierRangeForRank=(rank:CraftingRank):[number,number]=>({NOVICE:[1,2],APPRENTICE:[3,4],SKILLED:[5,6],ARTISAN:[7,8],MASTER:[9,10],GRANDMASTER:[11,12]}[rank] as [number,number]);
export const getProfessionProgress=(all:ProfessionProgress[],id:ProfessionType)=>all.find(p=>p.professionId===id)??{professionId:id,level:1,exp:0,learnedRecipes:[],learnedPerks:[],skillPoints:0};
export const PROFESSION_SPECIALTIES={
 BLACKSMITH:['금속제 무기','금속제 방어구','금속 장신구 틀','중량 갑옷 파츠 (예정)'],
 LEATHERWORKER:['가죽제 무기','가죽제 방어구','망토','경량 갑옷 파츠 (예정)'],
 ALCHEMIST:['장신구 핵','포션','비약','무기/방어구 인챈트 (예정)']
} as const;
