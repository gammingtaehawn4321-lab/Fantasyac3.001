import type { PlayerState, SkillProgressionState, PassiveProgressEntry } from '../../types';
import { COMBAT_CLASSES, type CombatClassType } from '../classes';
import { getSkillDefinition } from '../skills';
import { CLASS_SKILL_TREES, PASSIVE_DEFINITIONS_V1, PASSIVE_RECIPE_DEFINITIONS, getAdvancedPassiveIds, getBasicActiveIds, getBasicPassiveIds, getUniquePassiveId } from './progressionData';

export function createInitialSkillProgression(): SkillProgressionState {
  return {basicClassQuestCompleted:false,advancedClassQuestCompleted:false,unlockedTreeNodeIds:[],skillProgress:{},passiveProgress:{},passiveAwakeningStones:0,knownPassiveRecipeIds:[],uniquePassiveResidue:0,uniquePassivePity:0,acquiredUniqueActiveIds:[],acquiredUniquePassiveIds:[]};
}

export function ensureProgressionState(state:PlayerState):PlayerState {
  const p={...createInitialSkillProgression(),...(state.skillProgression||{})};
  p.unlockedTreeNodeIds=Array.isArray(p.unlockedTreeNodeIds)?p.unlockedTreeNodeIds:[];
  p.knownPassiveRecipeIds=Array.isArray(p.knownPassiveRecipeIds)?p.knownPassiveRecipeIds:[];
  p.acquiredUniqueActiveIds=Array.isArray(p.acquiredUniqueActiveIds)?p.acquiredUniqueActiveIds:[];
  p.acquiredUniquePassiveIds=Array.isArray(p.acquiredUniquePassiveIds)?p.acquiredUniquePassiveIds:[];
  p.skillProgress=p.skillProgress||{}; p.passiveProgress=p.passiveProgress||{};
  const quests={...(state.quests||{})};
  if((state.level||1)>=5&&!p.basicClassQuestCompleted&&!p.basicClassChosen&&!quests.quest_class_basic) quests.quest_class_basic={questId:'quest_class_basic',status:'ACTIVE',currentStageId:1,objectives:{},startedAt:Date.now()};
  if((state.level||1)>=20&&state.combatClass&&state.combatClass!=='NONE'&&Boolean(COMBAT_CLASSES[state.combatClass]?.evolutions.length)&&!p.advancedClassQuestCompleted&&!p.advancedClassChosen&&!quests.quest_class_advanced) quests.quest_class_advanced={questId:'quest_class_advanced',status:'ACTIVE',currentStageId:1,objectives:{},startedAt:Date.now()};
  return {...state,quests,skillProgression:p};
}

export function applyProgressionLevelMilestones(state:PlayerState,oldLevel:number,newLevel:number):PlayerState {
  let s=ensureProgressionState(state); const gained=Math.max(0,newLevel-oldLevel);
  s={...s,skillProgression:{...s.skillProgression,passiveAwakeningStones:(s.skillProgression.passiveAwakeningStones||0)+gained}};
  const quests={...(s.quests||{})};
  if(oldLevel<5&&newLevel>=5&&!s.skillProgression.basicClassQuestCompleted&&!quests.quest_class_basic){quests.quest_class_basic={questId:'quest_class_basic',status:'ACTIVE',currentStageId:1,objectives:{},startedAt:Date.now()};}
  if(oldLevel<20&&newLevel>=20&&s.combatClass&&s.combatClass!=='NONE'&&Boolean(COMBAT_CLASSES[s.combatClass]?.evolutions.length)&&!s.skillProgression.advancedClassQuestCompleted&&!quests.quest_class_advanced){quests.quest_class_advanced={questId:'quest_class_advanced',status:'ACTIVE',currentStageId:1,objectives:{},startedAt:Date.now()};}
  return {...s,quests};
}

export function completeClassQuest(state:PlayerState,tier:'BASIC'|'ADVANCED'):PlayerState {
  const s=ensureProgressionState(state); const id=tier==='BASIC'?'quest_class_basic':'quest_class_advanced'; const quests={...s.quests}; if(quests[id]) quests[id]={...quests[id],status:'COMPLETED',completedAt:Date.now()};
  return {...s,quests,skillProgression:{...s.skillProgression,[tier==='BASIC'?'basicClassQuestCompleted':'advancedClassQuestCompleted']:true}};
}

export function chooseBasicClass(state:PlayerState,classId:Exclude<CombatClassType,'NONE'>):{nextState:PlayerState;message:string} {
  let s=ensureProgressionState(state); if(s.level<5) return {nextState:s,message:'Lv.5부터 기본 전직할 수 있습니다.'}; if(!s.skillProgression.basicClassQuestCompleted) return {nextState:s,message:'기본 전직 퀘스트를 먼저 완료해야 합니다.'}; if(s.combatClass&&s.combatClass!=='NONE') return {nextState:s,message:'이미 기본 전직을 완료했습니다.'};
  if (s.race === 'DRAGONKIN' && classId !== 'DRAGON_EMPEROR') return {nextState:s,message:'용족은 오직 용왕으로만 기본 전직할 수 있습니다.'};
  if (s.race !== 'DRAGONKIN' && classId === 'DRAGON_EMPEROR') return {nextState:s,message:'용왕은 용족만 선택할 수 있습니다.'};
  const cls=COMBAT_CLASSES[classId]!; if(!cls) return {nextState:s,message:'선택할 수 없는 직업입니다.'}; const learned=new Set(s.learnedSkills||['basic_attack','defend_stance']); const prog={...s.skillProgression.skillProgress};
  const basicSkills=Array.from(new Set([...getBasicActiveIds(classId), ...(cls.initialSkillIds||[])]));
  basicSkills.forEach(id=>{learned.add(id);prog[id]={skillId:id,level:1,exp:0,unlocked:true};});
  const pass={...s.skillProgression.passiveProgress}; getBasicPassiveIds(classId).forEach(id=>pass[id]={passiveId:id,grade:'BASIC',level:1,copies:0,unlocked:true});
  const rootNodes=(CLASS_SKILL_TREES[classId]||[]).filter(n=>n.grade==='BASIC').map(n=>n.id);
  s={...s,combatClass:classId,characterClass:cls.name,classEvolutionTier:1,learnedSkills:[...learned],skillProgression:{...s.skillProgression,basicClassChosen:classId,skillProgress:prog,passiveProgress:pass,unlockedTreeNodeIds:Array.from(new Set([...s.skillProgression.unlockedTreeNodeIds,...rootNodes]))}};
  return {nextState:s,message:`${cls.name} 기본 전직을 완료했습니다.`};
}

export function chooseAdvancedClass(state:PlayerState,evolutionId:string):{nextState:PlayerState;message:string} {
  let s=ensureProgressionState(state); if(s.level<20) return {nextState:s,message:'Lv.20부터 심화 전직할 수 있습니다.'}; if(!s.skillProgression.advancedClassQuestCompleted) return {nextState:s,message:'심화 전직 퀘스트를 먼저 완료해야 합니다.'}; const cls=s.combatClass&&COMBAT_CLASSES[s.combatClass]; if(!cls) return {nextState:s,message:'기본 전직이 필요합니다.'}; const evo=cls.evolutions.find(e=>e.id===evolutionId); if(!evo)return{nextState:s,message:'선택할 수 없는 심화 전직입니다.'};
  const learnedSkills=Array.from(new Set([...(s.learnedSkills||[]),...(evo.grantedSkillIds||[])]));
  const skillProgress={...s.skillProgression.skillProgress};
  for(const skillId of evo.grantedSkillIds||[]){
    if(!skillProgress[skillId]) skillProgress[skillId]={skillId,level:1,exp:0,unlocked:true};
  }
  s={...s,classEvolutionId:evo.id,classEvolutionTier:2,classEvolutionName:evo.evolutionName,characterClass:evo.evolutionName,learnedSkills,skillProgression:{...s.skillProgression,advancedClassChosen:evo.toClassId,skillProgress}};
  return {nextState:s,message:`${evo.evolutionName} 심화 전직을 완료했습니다.${evo.grantedSkillIds?.length?` 전용 스킬 ${evo.grantedSkillIds.length}종이 개방되었습니다.`:''}`};
}

export function addSkillMastery(state:PlayerState,skillId:string,amount=1):PlayerState {
  const s=ensureProgressionState(state); const current=s.skillProgression.skillProgress[skillId]||{skillId,level:1,exp:0,unlocked:true}; if(current.level>=20)return s; let exp=current.exp+Math.max(1,amount); let level=current.level; while(level<20&&exp>=level*5){exp-=level*5;level++;} return {...s,skillProgression:{...s.skillProgression,skillProgress:{...s.skillProgression.skillProgress,[skillId]:{...current,level,exp}}}};
}

export function unlockAdvancedActive(state:PlayerState,skillId:string):{nextState:PlayerState;message:string} {
  const s=ensureProgressionState(state); const classId=s.combatClass; const tree=classId?CLASS_SKILL_TREES[classId]||[]:[]; const node=tree.find(n=>n.refId===skillId&&n.kind==='ACTIVE'&&n.grade==='ADVANCED'); if(!node)return{nextState:s,message:'해당 심화 액티브 노드를 찾을 수 없습니다.'}; const req=node.requiresSkillLevel; if(req&&(s.skillProgression.skillProgress[req.skillId]?.level||0)<req.level)return{nextState:s,message:`선행 스킬 ${getSkillDefinition(req.skillId)?.name||req.skillId} Lv.${req.level}가 필요합니다.`};
  const learned=Array.from(new Set([...(s.learnedSkills||[]),skillId])); return{nextState:{...s,learnedSkills:learned,skillProgression:{...s.skillProgression,skillProgress:{...s.skillProgression.skillProgress,[skillId]:{skillId,level:1,exp:0,unlocked:true}},unlockedTreeNodeIds:Array.from(new Set([...s.skillProgression.unlockedTreeNodeIds,node.id]))}},message:`심화 액티브 ${getSkillDefinition(skillId)?.name||skillId} 습득.`};
}

export function rollPassiveAwakening(state:PlayerState,roll01=Math.random()):{nextState:PlayerState;message:string;passiveId?:string} {
  let s=ensureProgressionState(state); if((s.skillProgression.passiveAwakeningStones||0)<=0)return{nextState:s,message:'패시브 해방석이 없습니다.'}; const pool=getBasicPassiveIds(s.combatClass||''); if(!pool.length)return{nextState:s,message:'기본 전직 후 사용할 수 있습니다.'}; const id=pool[Math.floor(Math.max(0,Math.min(.999999,roll01))*pool.length)]; const prev=s.skillProgression.passiveProgress[id]||{passiveId:id,grade:'BASIC',level:1,copies:0,unlocked:true}; const level=Math.min(20,prev.level+1); const copies=prev.level>=20?prev.copies+1:prev.copies; const next:PassiveProgressEntry={...prev,level,copies}; s={...s,skillProgression:{...s.skillProgression,passiveAwakeningStones:s.skillProgression.passiveAwakeningStones-1,passiveProgress:{...s.skillProgression.passiveProgress,[id]:next}}}; return{nextState:s,message:`${PASSIVE_DEFINITIONS_V1[id]?.name||id} 획득 → Lv.${level}${prev.level>=20?' / 중복본 +1':''}`,passiveId:id};
}

export function learnPassiveRecipe(state:PlayerState,recipeId:string):PlayerState { const s=ensureProgressionState(state); if(!PASSIVE_RECIPE_DEFINITIONS[recipeId])return s; return{...s,skillProgression:{...s.skillProgression,knownPassiveRecipeIds:Array.from(new Set([...s.skillProgression.knownPassiveRecipeIds,recipeId]))}}; }

export function craftAdvancedPassive(state:PlayerState,recipeId:string):{nextState:PlayerState;message:string} {
  let s=ensureProgressionState(state); const recipe=PASSIVE_RECIPE_DEFINITIONS[recipeId]; if(!recipe||recipe.grade!=='ADVANCED')return{nextState:s,message:'유효한 심화 패시브 조합식이 아닙니다.'}; if(!s.skillProgression.knownPassiveRecipeIds.includes(recipeId))return{nextState:s,message:'해당 조합식을 아직 획득하지 못했습니다.'}; const pass={...s.skillProgression.passiveProgress}; for(const req of recipe.requiredBaseCopies){const p=pass[req.passiveId];if(!p||p.copies<req.copies)return{nextState:s,message:`${PASSIVE_DEFINITIONS_V1[req.passiveId]?.name||req.passiveId} 중복본 ${req.copies}개가 필요합니다.`};}
  recipe.requiredBaseCopies.forEach(req=>pass[req.passiveId]={...pass[req.passiveId],copies:pass[req.passiveId].copies-req.copies}); const prev=pass[recipe.resultPassiveId]||{passiveId:recipe.resultPassiveId,grade:'ADVANCED',level:0,copies:0,unlocked:true}; pass[recipe.resultPassiveId]={...prev,level:Math.min(20,prev.level+1),unlocked:true}; s={...s,skillProgression:{...s.skillProgression,passiveProgress:pass}}; return{nextState:s,message:`${PASSIVE_DEFINITIONS_V1[recipe.resultPassiveId]?.name} 합성 → Lv.${pass[recipe.resultPassiveId].level}`};
}

export function canUnlockUniquePassiveRecipe(state:PlayerState):boolean { const s=ensureProgressionState(state); const ids=getAdvancedPassiveIds(s.combatClass||''); return ids.length>0&&ids.every(id=>(s.skillProgression.passiveProgress[id]?.level||0)>=20); }

export function craftUniquePassive(state:PlayerState,roll01=Math.random()):{nextState:PlayerState;message:string;success:boolean} {
  let s=ensureProgressionState(state); if(!canUnlockUniquePassiveRecipe(s))return{nextState:s,message:'모든 심화 패시브를 Lv.20까지 성장시켜야 합니다.',success:false}; const uid=getUniquePassiveId(s.combatClass||''); if(!uid)return{nextState:s,message:'유일 패시브가 없습니다.',success:false}; if(s.skillProgression.acquiredUniquePassiveIds.includes(uid))return{nextState:s,message:'이미 유일 패시브를 완성했습니다.',success:true}; const pity=s.skillProgression.uniquePassivePity||0; const chance=Math.min(.35,.03+pity*.02+s.skillProgression.uniquePassiveResidue*.005); const success=roll01<chance||pity>=15; if(success){const pass={...s.skillProgression.passiveProgress,[uid]:{passiveId:uid,grade:'UNIQUE' as const,level:1,copies:0,unlocked:true}}; s={...s,skillProgression:{...s.skillProgression,passiveProgress:pass,acquiredUniquePassiveIds:[...s.skillProgression.acquiredUniquePassiveIds,uid],uniquePassivePity:0}};return{nextState:s,message:`유일 패시브 『${PASSIVE_DEFINITIONS_V1[uid]?.name}』 합성 성공!`,success:true};}
  s={...s,skillProgression:{...s.skillProgression,uniquePassiveResidue:s.skillProgression.uniquePassiveResidue+1,uniquePassivePity:pity+1}};return{nextState:s,message:`유일 합성 실패. 실패한 유일의 잔재 +1 (누적 ${s.skillProgression.uniquePassiveResidue})`,success:false};
}


export function grantPassiveAwakeningStones(state:PlayerState,amount:number):PlayerState {
  const s=ensureProgressionState(state); const gain=Math.max(0,Math.floor(amount));
  return {...s,skillProgression:{...s.skillProgression,passiveAwakeningStones:(s.skillProgression.passiveAwakeningStones||0)+gain}};
}

export function grantNextAdvancedPassiveRecipe(state:PlayerState):{nextState:PlayerState;recipeId?:string} {
  let s=ensureProgressionState(state); const classId=s.combatClass||'';
  const candidates=Object.values(PASSIVE_RECIPE_DEFINITIONS).filter(r=>r.classId===classId&&r.grade==='ADVANCED'&&!s.skillProgression.knownPassiveRecipeIds.includes(r.id));
  const recipe=candidates[0]; if(!recipe)return{nextState:s}; s=learnPassiveRecipe(s,recipe.id); return{nextState:s,recipeId:recipe.id};
}

export function grantUniqueActive(state:PlayerState,skillId:string):{nextState:PlayerState;message:string;success:boolean} {
  const s=ensureProgressionState(state); const classId=s.combatClass||'';
  const node=(CLASS_SKILL_TREES[classId]||[]).find(n=>n.kind==='ACTIVE'&&n.grade==='UNIQUE'&&n.refId===skillId);
  if(!node)return{nextState:s,message:'현재 직업의 유일 액티브가 아닙니다.',success:false};
  if(s.skillProgression.acquiredUniqueActiveIds.includes(skillId))return{nextState:s,message:'이미 획득한 유일 액티브입니다.',success:true};
  return {nextState:{...s,learnedSkills:Array.from(new Set([...(s.learnedSkills||[]),skillId])),skillProgression:{...s.skillProgression,acquiredUniqueActiveIds:[...s.skillProgression.acquiredUniqueActiveIds,skillId],skillProgress:{...s.skillProgression.skillProgress,[skillId]:{skillId,level:1,exp:0,unlocked:true}},unlockedTreeNodeIds:Array.from(new Set([...s.skillProgression.unlockedTreeNodeIds,node.id]))}},message:`유일 액티브 ${getSkillDefinition(skillId)?.name||skillId} 획득.`,success:true};
}
