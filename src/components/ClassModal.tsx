import React, { useState } from 'react';
import { Crosshair, Eye, Image as ImageIcon, Lock, Shield, Sparkles, Sword, Wand2, X } from 'lucide-react';
import type { PlayerState } from '../types';
import { getAllCombatClasses, getCombatClass, type CombatClassType } from '../data/classes';
import { getSkillDefinition } from '../data/skills';
import { chooseAdvancedClass, chooseBasicClass, completeClassQuest } from '../data/progression/progressionSystem';

interface Props { playerState:PlayerState; onUpdatePlayer:(s:PlayerState)=>void; onClose:()=>void; }
const BASE_STAT_LABELS:Record<string,string>={strength:'근력',vitality:'체력',agility:'민첩',intelligence:'지능',spirit:'정신',luck:'행운'};
const COMBAT_STAT_LABELS:Record<string,string>={physicalAttack:'물리 공격력',magicAttack:'마법 공격력',physicalDefense:'물리 방어력',magicDefense:'마법 방어력',physicalPenetration:'물리 관통',magicPenetration:'마법 관통',accuracy:'명중',evasion:'회피',criticalChance:'치명타 확률',criticalDamage:'치명타 피해',actionSpeed:'행동 속도',tenacity:'강인함',statusResistance:'상태이상 저항',statusHitRate:'상태이상 적중',maxHp:'최대 체력',maxMp:'최대 마나',maxSanity:'최대 정신력',maxCost:'최대 전투 자원',costRegen:'전투 자원 회복'};
const ARMOR_LABELS:Record<string,string>={LIGHT:'경갑',HEAVY:'중갑',CLOTH:'천옷'};
const formatBonuses=(bonuses:Record<string,number>|undefined)=>Object.entries(bonuses||{}).map(([key,value])=>{
  const label=COMBAT_STAT_LABELS[key]||key;
  const shown=key==='criticalDamage'?`${Math.round(Number(value)*100)}%`:String(value);
  return `${label} +${shown}`;
}).join(' · ');
const Icon=({id}:{id:string})=>id==='WARRIOR'?<Sword/>:id==='ARCHER'?<Crosshair/>:id==='ROGUE'?<Eye/>:id==='MAGE'?<Wand2/>:id==='DANCER'?<Sparkles/>:<Shield/>;
export const ClassModal:React.FC<Props>=({playerState,onUpdatePlayer,onClose})=>{
  const classes=getAllCombatClasses().filter((c)=>playerState.race==='DRAGONKIN'?c.id==='DRAGON_EMPEROR':c.id!=='DRAGON_EMPEROR'); const current=getCombatClass(playerState.combatClass); const basicDone=playerState.skillProgression?.basicClassQuestCompleted; const advDone=playerState.skillProgression?.advancedClassQuestCompleted;
  const advancedMode=Boolean(current && current.evolutions.length>0); const alreadyAdvanced=Boolean(playerState.skillProgression?.advancedClassChosen || (playerState.classEvolutionTier||1)>=2); const [selectedBase,setSelectedBase]=useState<CombatClassType>((playerState.combatClass&&playerState.combatClass!=='NONE'?playerState.combatClass:(playerState.race==='DRAGONKIN'?'DRAGON_EMPEROR':'WARRIOR')) as CombatClassType); const [selectedEvo,setSelectedEvo]=useState(playerState.classEvolutionId||current?.evolutions[0]?.id||'');
  const preview=advancedMode?current?.evolutions.find(e=>e.id===selectedEvo):classes.find(c=>c.id===selectedBase); const locked=advancedMode?playerState.level<20||!advDone||alreadyAdvanced:playerState.level<5||!basicDone;
  const clearTrial=()=>onUpdatePlayer(completeClassQuest(playerState,advancedMode?'ADVANCED':'BASIC'));
  const choose=()=>{if(advancedMode){const r=chooseAdvancedClass(playerState,selectedEvo);onUpdatePlayer(r.nextState);}else{const r=chooseBasicClass(playerState,selectedBase as Exclude<CombatClassType,'NONE'>);onUpdatePlayer(r.nextState);}};
  const basicPreview=!advancedMode?classes.find(c=>c.id===selectedBase):undefined;
  return <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2"><div className="w-full max-w-4xl max-h-[92dvh] bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
    <header className="p-4 border-b border-stone-800 flex items-center"><div><h2 className="font-black text-lg">{advancedMode?'심화 전직':'기본 전직'}</h2><p className="text-xs text-stone-500">{advancedMode?'레벨 20 심화 전직 퀘스트 완료 후 계열 선택':playerState.race==='DRAGONKIN'?'레벨 5 전직 퀘스트 완료 후 용족 전용 기본 직업 『용왕』 해금':'레벨 5 기본 전직 퀘스트 완료 후 6직업 중 선택'}</p></div><button onClick={onClose} className="ml-auto p-2 bg-stone-800 rounded"><X className="w-4"/></button></header>
    <div className="flex-1 overflow-y-auto p-4">
      {(!advancedMode&&playerState.level<5||advancedMode&&playerState.level<20)?<div className="p-6 rounded-xl border border-stone-800 text-center"><Lock className="mx-auto mb-2"/><b>{advancedMode?'레벨 20':'레벨 5'}에 도달하면 전직 퀘스트가 발생합니다.</b></div>:!((advancedMode&&advDone)||(!advancedMode&&basicDone))?<div className="p-6 rounded-xl border border-amber-900 bg-amber-950/20 text-center"><Shield className="mx-auto text-amber-300 mb-2"/><h3 className="font-bold">{advancedMode?'심화 전직 시험':'기본 전직 시험'}</h3><p className="text-sm text-stone-400 mt-2">퀘스트가 발생했습니다. 시험을 완료하면 전직 선택 UI가 해방됩니다.</p><button onClick={clearTrial} className="mt-4 px-5 py-3 rounded-xl bg-amber-500 text-stone-950 font-bold">전직 시험 완료</button></div>:<>
        <div className="grid md:grid-cols-[1fr_360px] gap-4">
          <div className="min-h-[420px] rounded-2xl border border-stone-800 bg-stone-950/60 p-5 flex flex-col items-center justify-center text-center">
            <div className="w-56 h-56 rounded-2xl border border-dashed border-stone-700 flex flex-col items-center justify-center bg-stone-900"><ImageIcon className="w-12 h-12 text-stone-600"/><span className="text-xs text-stone-600 mt-2">직업 삽화 경로 준비됨 · 이미지 미생성</span></div>
            <h3 className="text-2xl font-black mt-4">{advancedMode?(preview as any)?.evolutionName:basicPreview?.name}</h3>
            <p className="text-stone-400 mt-2 max-w-xl">{advancedMode?(preview as any)?.description:basicPreview?.description}</p>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-stone-800"><b>전투 방식</b><p className="text-sm text-stone-400 mt-1">{advancedMode?(preview as any)?.weaponSpecialization:basicPreview?.role}</p></div>
            {!advancedMode&&basicPreview&&<><div className="p-3 rounded-xl border border-stone-800"><b>주 사용 스탯</b><p className="text-sm text-amber-300 mt-1">{basicPreview.primaryStats.map(s=>BASE_STAT_LABELS[s]||s).join(' / ')}</p></div><div className="p-3 rounded-xl border border-stone-800"><b>추천 방어구</b><p className="text-sm text-stone-400 mt-1">{ARMOR_LABELS[basicPreview.recommendedArmor]||basicPreview.recommendedArmor}</p></div><div className="p-3 rounded-xl border border-stone-800"><b>기본 액티브 미리보기</b><div className="space-y-1 mt-2">{basicPreview.initialSkillIds.map(id=>{const s=getSkillDefinition(id);return <div key={id} className="text-xs p-2 bg-stone-950 rounded"><b>{s?.name||id}</b><p className="text-stone-500">{s?.description}</p></div>})}</div></div></>}
            {advancedMode&&preview&&<>
              <div className="p-3 rounded-xl border border-stone-800"><b>심화 보너스</b><p className="text-xs text-stone-400 mt-2">{formatBonuses((preview as any).statBonuses)}</p></div>
              {(preview as any).passive&&<div className="p-3 rounded-xl border border-stone-800"><b>고유 패시브 · {(preview as any).passive.name}</b>{(preview as any).passive.description&&<p className="text-xs text-stone-400 mt-2">{(preview as any).passive.description}</p>}<p className="text-xs text-stone-500 mt-2">{formatBonuses((preview as any).passive.statBonuses)}</p></div>}
              {((preview as any).grantedSkillIds||[]).length>0&&<div className="p-3 rounded-xl border border-stone-800"><b>전용 액티브</b><div className="space-y-1 mt-2">{(preview as any).grantedSkillIds.map((id:string)=>{const skill=getSkillDefinition(id);const visibleName=(skill?.name||'').trim();return <div key={id} className="text-xs p-2 bg-stone-950 rounded">{visibleName&&<b>{visibleName}</b>}{skill?.description&&<p className="text-stone-500">{skill.description}</p>}<span className="text-stone-600">소모 {skill?.cost??0} · 재사용 {skill?.cooldown??0}턴</span></div>})}</div></div>}
            </>}
            <button disabled={locked} onClick={choose} className="w-full p-3 rounded-xl bg-amber-500 text-stone-950 font-black disabled:opacity-40">{advancedMode?(alreadyAdvanced?'심화 전직 완료':'이 심화 계열로 전직'):'이 직업으로 전직'}</button>
          </div>
        </div>
        <div className="mt-4 border-t border-stone-800 pt-4"><div className="text-xs text-stone-500 mb-2">{advancedMode?'심화 계열':playerState.race==='DRAGONKIN'?'용족 전용 전직':'기본 전직 6종'}</div><div className="flex gap-2 overflow-x-auto pb-2">{advancedMode?current?.evolutions.map(e=><button key={e.id} disabled={alreadyAdvanced} onClick={()=>{if(!alreadyAdvanced)setSelectedEvo(e.id)}} className={`min-w-40 p-3 rounded-xl border ${selectedEvo===e.id?'border-amber-500 bg-amber-500/10':'border-stone-800'}`}><b>{e.evolutionName}</b><div className="text-xs text-stone-500">{e.weaponSpecialization}</div></button>):classes.map(c=><button key={c.id} onClick={()=>setSelectedBase(c.id)} className={`min-w-32 p-3 rounded-xl border ${selectedBase===c.id?'border-amber-500 bg-amber-500/10':'border-stone-800'}`}><Icon id={c.id}/><b className="block mt-1">{c.name}</b></button>)}</div></div>
      </>}
    </div>
  </div></div>
}
