import React,{useState} from 'react';
import { PlayerState } from '../types';
import { ProfessionType } from '../data/professions/professionTypes';
import { PROFESSIONS_DATABASE } from '../data/professions/professionData';
import { ACTIVE_CRAFTING_PROFESSIONS, COMING_SOON_PROFESSIONS, CRAFTING_RANK_LABEL, getCraftingRank, getProfessionProgress, getTierRangeForRank, PROFESSION_SPECIALTIES } from '../data/professions/professionSystem';
import { Hammer, FlaskConical, Scissors, LockKeyhole, Network, Sparkles } from 'lucide-react';
const Icon=({id}:{id:ProfessionType})=>id==='BLACKSMITH'?<Hammer/>:id==='ALCHEMIST'?<FlaskConical/>:<Scissors/>;
export const ProfessionsTab:React.FC<{playerState:PlayerState}> = ({playerState})=>{
 const [selected,setSelected]=useState<ProfessionType>('BLACKSMITH'); const p=getProfessionProgress(playerState.professions,selected); const def=PROFESSIONS_DATABASE[selected]; const rank=getCraftingRank(p.level); const [lo,hi]=getTierRangeForRank(rank); const need=Math.max(100,p.level*100);
 return <div className="p-4 text-stone-200 grid md:grid-cols-[240px_1fr] gap-4">
  <div className="space-y-2"><div className="text-xs font-bold text-stone-400">생활직업</div>{ACTIVE_CRAFTING_PROFESSIONS.map(id=>{const q=getProfessionProgress(playerState.professions,id);return <button key={id} onClick={()=>setSelected(id)} className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left ${selected===id?'border-amber-500 bg-amber-950/30':'border-stone-800 bg-stone-950'}`}><span className="w-5"><Icon id={id}/></span><span className="flex-1"><b>{PROFESSIONS_DATABASE[id].name}</b><small className="block text-stone-500">Lv.{q.level} · {CRAFTING_RANK_LABEL[getCraftingRank(q.level)]}</small></span></button>})}
  {COMING_SOON_PROFESSIONS.map(id=><div key={id} className="p-3 rounded-xl border border-dashed border-stone-800 text-stone-600 flex gap-2"><LockKeyhole className="w-4"/>추가 생활직업 · 준비 중</div>)}</div>
  <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5"><div className="flex justify-between gap-4"><div><h3 className="text-xl font-bold">{def.name}</h3><p className="text-sm text-stone-400 mt-1">{def.role}</p></div><div className="text-right"><b className="text-amber-300">Lv.{p.level}</b><div className="text-xs text-stone-500">{CRAFTING_RANK_LABEL[rank]} · T{lo}~T{hi}</div></div></div>
  <div className="mt-4 h-2 bg-stone-800 rounded overflow-hidden"><div className="h-full bg-amber-500" style={{width:`${Math.min(100,p.exp/need*100)}%`}}/></div><div className="text-[11px] text-stone-500 mt-1">EXP {p.exp} / {need}</div>
  <div className="grid sm:grid-cols-2 gap-3 mt-5"><div className="p-4 border border-stone-800 rounded-xl"><div className="flex gap-2 font-bold"><Sparkles className="w-4 text-amber-300"/>생활직업 스킬 포인트</div><div className="text-2xl mt-2">{p.skillPoints??0}</div><p className="text-xs text-stone-500 mt-2">스킬트리 노드는 확장 가능한 데이터 구조로 관리됩니다.</p></div><div className="p-4 border border-stone-800 rounded-xl"><div className="flex gap-2 font-bold"><Network className="w-4 text-cyan-300"/>전문 분야</div><div className="mt-2 space-y-1 text-sm text-stone-400">{(PROFESSION_SPECIALTIES as any)[selected]?.map((x:string)=><div key={x}>{x}</div>)}</div></div></div>
  <div className="mt-4 p-4 rounded-xl bg-stone-900/60 border border-stone-800"><b>생활직업 스킬트리</b><p className="text-xs text-stone-500 mt-1">현재는 성장 정보와 포인트를 관리합니다. 실제 제작은 메인 메뉴의 「제작」에서 진행합니다.</p></div></div>
 </div>
}
