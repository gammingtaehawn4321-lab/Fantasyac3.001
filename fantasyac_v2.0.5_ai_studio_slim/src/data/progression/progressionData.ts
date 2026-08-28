import type { CombatClassType } from '../classes';
import type { PassiveGrade, SkillGrade } from '../../types';

export interface TreeNodeDefinition {
  id: string;
  classId: Exclude<CombatClassType,'NONE'>;
  kind: 'ACTIVE' | 'PASSIVE' | 'GATE';
  grade: SkillGrade | PassiveGrade;
  refId?: string;
  name: string;
  description: string;
  x: number;
  y: number;
  prerequisiteNodeIds: string[];
  requiresSkillLevel?: { skillId: string; level: number };
  requiresAdvancedClass?: boolean;
}

export interface PassiveDefinitionV1 {
  id: string;
  classId: Exclude<CombatClassType,'NONE'>;
  name: string;
  grade: PassiveGrade;
  description: string;
  maxLevel: number;
  effectPerLevel: Partial<Record<'physicalAttack'|'magicAttack'|'physicalDefense'|'magicDefense'|'accuracy'|'evasion'|'actionSpeed'|'criticalChance'|'criticalDamage'|'physicalPenetration'|'magicPenetration'|'statusHitRate'|'statusResistance'|'maxCost'|'costRegen', number>>;
}

export interface PassiveRecipeDefinition {
  id: string;
  classId: Exclude<CombatClassType,'NONE'>;
  resultPassiveId: string;
  requiredBaseCopies: Array<{ passiveId:string; copies:number }>;
  catalystName: string;
  grade: 'ADVANCED' | 'UNIQUE';
}

export interface UniqueActiveDefinition {
  skillId: string;
  classId: Exclude<CombatClassType,'NONE'>;
  sourceHints: string[];
}

const classes: Array<Exclude<CombatClassType,'NONE'>>=['WARRIOR','ARCHER','ROGUE','CLERIC','MAGE','DANCER'];
const ko:Record<string,string>={WARRIOR:'전사',ARCHER:'궁수',ROGUE:'도적',CLERIC:'성직자',MAGE:'마법사',DANCER:'무희'};

const PASSIVE_NAMES:Record<string,{basic:string[];advanced:string[];unique:string}>={
  WARRIOR:{basic:['강철 호흡','완강한 자세','무기 숙련','전투 본능'],advanced:['불굴의 전열','파쇄의 리듬','피의 방벽'],unique:'전장을 거부하는 자'},
  ARCHER:{basic:['침착한 조준','바람 읽기','급소 관측','경량 보법'],advanced:['추격자의 호흡','매의 시야','연속 사격술'],unique:'놓치지 않는 별'},
  ROGUE:{basic:['그림자 호흡','독 감각','회피 반사','급소 해부'],advanced:['무흔 보법','독성 순환','암살자의 집중'],unique:'기록되지 않은 칼날'},
  CLERIC:{basic:['기도의 호흡','정화 감응','수호 의식','치유 집중'],advanced:['성역 공명','기적의 여운','신성 순환'],unique:'꺼지지 않는 성광'},
  MAGE:{basic:['마력 회로','원소 기억','주문 단축','비전 집중'],advanced:['다중 공식','마나 역류','속성 해석'],unique:'완성되지 않는 공식'},
  DANCER:{basic:['박자 감각','유연한 보법','시선 유도','호흡 조절'],advanced:['연무의 흐름','갈채 순환','완무 준비'],unique:'끝나지 않는 무도'},
};

export const PASSIVE_DEFINITIONS_V1: Record<string,PassiveDefinitionV1>={};
export const PASSIVE_RECIPE_DEFINITIONS: Record<string,PassiveRecipeDefinition>={};

classes.forEach((classId,ci)=>{
  const names=PASSIVE_NAMES[classId];
  names.basic.forEach((name,i)=>{
    const id=`${classId.toLowerCase()}_passive_basic_${i+1}`;
    const statKeys = classId==='WARRIOR' ? ['physicalAttack','physicalDefense','statusResistance','accuracy'] :
      classId==='ARCHER' ? ['accuracy','actionSpeed','criticalChance','evasion'] :
      classId==='ROGUE' ? ['evasion','criticalChance','actionSpeed','physicalPenetration'] :
      classId==='CLERIC' ? ['magicDefense','costRegen','statusResistance','magicAttack'] :
      classId==='MAGE' ? ['magicAttack','maxCost','magicPenetration','costRegen'] : ['actionSpeed','evasion','statusHitRate','criticalChance'];
    PASSIVE_DEFINITIONS_V1[id]={id,classId,name,grade:'BASIC',description:`${ko[classId]}의 기본 전투 감각을 성장시키는 패시브. 중복 획득으로 Lv.20까지 강화한다.`,maxLevel:20,effectPerLevel:{[statKeys[i] as any]: i===2?0.35:0.6}};
  });
  names.advanced.forEach((name,i)=>{
    const id=`${classId.toLowerCase()}_passive_advanced_${i+1}`;
    const statKeys=classId==='WARRIOR'?['physicalAttack','physicalDefense','actionSpeed']:classId==='ARCHER'?['criticalChance','accuracy','actionSpeed']:classId==='ROGUE'?['criticalDamage','evasion','physicalPenetration']:classId==='CLERIC'?['costRegen','magicDefense','statusResistance']:classId==='MAGE'?['magicAttack','magicPenetration','costRegen']:['actionSpeed','statusHitRate','costRegen'];
    PASSIVE_DEFINITIONS_V1[id]={id,classId,name,grade:'ADVANCED',description:`기본 패시브의 조합식으로 합성하는 ${ko[classId]} 심화 패시브.`,maxLevel:20,effectPerLevel:{[statKeys[i] as any]: i===0?0.9:0.7}};
    PASSIVE_RECIPE_DEFINITIONS[`recipe_${id}`]={id:`recipe_${id}`,classId,resultPassiveId:id,requiredBaseCopies:[{passiveId:`${classId.toLowerCase()}_passive_basic_${(i%4)+1}`,copies:2},{passiveId:`${classId.toLowerCase()}_passive_basic_${((i+1)%4)+1}`,copies:2}],catalystName:'심화 패시브 촉매',grade:'ADVANCED'};
  });
  const uid=`${classId.toLowerCase()}_passive_unique_1`;
  PASSIVE_DEFINITIONS_V1[uid]={id:uid,classId,name:names.unique,grade:'UNIQUE',description:`모든 ${ko[classId]} 심화 패시브 Lv.20 이후 변화된 합성식으로만 도전 가능한 유일 패시브.`,maxLevel:1,effectPerLevel:{actionSpeed:3,costRegen:1}};
  PASSIVE_RECIPE_DEFINITIONS[`recipe_${uid}`]={id:`recipe_${uid}`,classId,resultPassiveId:uid,requiredBaseCopies:[],catalystName:'변화된 유일 합성식',grade:'UNIQUE'};
});

const BASIC_ACTIVES:Record<string,string[]>={
  WARRIOR:['warrior_heavy_strike','warrior_shield_bash'],ARCHER:['archer_precision_shot','archer_poison_arrow'],ROGUE:['rogue_ambush','rogue_shadow_strike'],CLERIC:['cleric_divine_heal','cleric_holy_smite'],MAGE:['mage_firebolt','mage_magic_missile'],DANCER:['dancer_chakram_slash','dancer_alluring_step']
};
const ADVANCED_ACTIVES:Record<string,string[]>={
  WARRIOR:['warrior_iron_wall','warrior_whirlwind'],ARCHER:['archer_evasive_shot','archer_arrow_rain'],ROGUE:['rogue_smoke_bomb','rogue_vital_point'],CLERIC:['cleric_sacred_shield','cleric_divine_retribution'],MAGE:['mage_arcane_burst','mage_frost_nova','mage_chain_lightning'],DANCER:['dancer_spinning_dance']
};

export const UNIQUE_ACTIVE_SKILLS: UniqueActiveDefinition[]=[];
classes.forEach((classId)=>{ for(let i=1;i<=4;i++) UNIQUE_ACTIVE_SKILLS.push({skillId:`${classId.toLowerCase()}_unique_${i}`,classId,sourceHints:['특별 인카운터','초고난도 제작','극희귀 상점','지역 보스']}); });

export const CLASS_SKILL_TREES: Record<string,TreeNodeDefinition[]>={};
classes.forEach((classId)=>{
  const b=BASIC_ACTIVES[classId], a=ADVANCED_ACTIVES[classId]; const pfx=classId.toLowerCase();
  const nodes:TreeNodeDefinition[]=[
    {id:`${pfx}_root`,classId,kind:'GATE',grade:'BASIC',name:`${ko[classId]}의 뿌리`,description:'기본 전직 완료 시 개방.',x:50,y:5,prerequisiteNodeIds:[]},
    {id:`${pfx}_active_b1`,classId,kind:'ACTIVE',grade:'BASIC',refId:b[0],name:'기본 액티브 I',description:'기본 전직 시 자동 습득.',x:28,y:22,prerequisiteNodeIds:[`${pfx}_root`]},
    {id:`${pfx}_active_b2`,classId,kind:'ACTIVE',grade:'BASIC',refId:b[1],name:'기본 액티브 II',description:'기본 전직 시 자동 습득.',x:72,y:22,prerequisiteNodeIds:[`${pfx}_root`]},
  ];
  for(let i=1;i<=4;i++) nodes.push({id:`${pfx}_passive_b${i}`,classId,kind:'PASSIVE',grade:'BASIC',refId:`${pfx}_passive_basic_${i}`,name:PASSIVE_NAMES[classId].basic[i-1],description:'해방석 중복으로 성장.',x:15+i*17,y:40+(i%2)*8,prerequisiteNodeIds:[i<=2?`${pfx}_active_b1`:`${pfx}_active_b2`]});
  a.forEach((skillId,i)=>nodes.push({id:`${pfx}_active_a${i+1}`,classId,kind:'ACTIVE',grade:'ADVANCED',refId:skillId,name:`심화 액티브 ${i+1}`,description:'연결된 기본 액티브 Lv.20 달성 후 습득.',x:25+i*(50/Math.max(1,a.length-1)),y:63,prerequisiteNodeIds:[i%2===0?`${pfx}_active_b1`:`${pfx}_active_b2`],requiresSkillLevel:{skillId:b[i%2],level:20}}));
  for(let i=1;i<=3;i++) nodes.push({id:`${pfx}_passive_a${i}`,classId,kind:'PASSIVE',grade:'ADVANCED',refId:`${pfx}_passive_advanced_${i}`,name:PASSIVE_NAMES[classId].advanced[i-1],description:'조합식 합성으로 제작/강화.',x:25+i*13,y:78,prerequisiteNodeIds:[`${pfx}_passive_b${i}`],requiresAdvancedClass:true});
  for(let i=1;i<=4;i++) nodes.push({id:`${pfx}_unique_${i}`,classId,kind:'ACTIVE',grade:'UNIQUE',refId:`${pfx}_unique_${i}`,name:`유일 액티브 ${i}`,description:'외부 콘텐츠에서 획득하면 나무에 접붙여진다.',x:12+i*18,y:94,prerequisiteNodeIds:[],requiresAdvancedClass:true});
  CLASS_SKILL_TREES[classId]=nodes;
});

export function getBasicActiveIds(classId:string){return BASIC_ACTIVES[classId]||[];}
export function getAdvancedActiveIds(classId:string){return ADVANCED_ACTIVES[classId]||[];}
export function getBasicPassiveIds(classId:string){return Object.values(PASSIVE_DEFINITIONS_V1).filter(p=>p.classId===classId&&p.grade==='BASIC').map(p=>p.id);}
export function getAdvancedPassiveIds(classId:string){return Object.values(PASSIVE_DEFINITIONS_V1).filter(p=>p.classId===classId&&p.grade==='ADVANCED').map(p=>p.id);}
export function getUniquePassiveId(classId:string){return Object.values(PASSIVE_DEFINITIONS_V1).find(p=>p.classId===classId&&p.grade==='UNIQUE')?.id;}
