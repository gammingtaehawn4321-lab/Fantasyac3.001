import React, { useMemo, useState } from 'react';
import { Heart, ShieldAlert, UserRoundPlus, Users, X } from 'lucide-react';
import { getKoreanLabel, type PlayerState } from '../types';

interface Props {
  isOpen:boolean;
  playerState:PlayerState;
  onClose:()=>void;
  onTalk:(characterId:string)=>void;
  onRecruit:(characterId:string)=>void;
}

export function MajorCharactersModal({isOpen,playerState,onClose,onTalk,onRecruit}:Props){
  const chars=useMemo(()=>Object.values(playerState.majorCharacters||{}).filter(c=>c.isAlive).sort((a,b)=>b.trust-a.trust||a.name.localeCompare(b.name)),[playerState.majorCharacters]);
  const [selectedId,setSelectedId]=useState<string|undefined>(chars[0]?.id);if(!isOpen)return null;const c=chars.find(x=>x.id===selectedId)||chars[0];
  return <div className="fixed inset-0 z-[75] bg-black/85 flex items-center justify-center p-3"><div className="w-full max-w-6xl max-h-[92dvh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
    <header className="p-4 border-b border-zinc-800 flex items-center"><Users className="w-4 mr-2 text-cyan-300"/><b>주요 인물 · 관계 · 영입</b><span className="ml-2 text-xs text-zinc-500">{chars.length}명</span><button className="ml-auto p-2 bg-zinc-900 rounded" onClick={onClose}><X className="w-4"/></button></header>
    <div className="grid md:grid-cols-[330px_1fr] min-h-0 flex-1"><div className="overflow-y-auto border-r border-zinc-800 p-2 space-y-1">{chars.map(x=><button key={x.id} onClick={()=>setSelectedId(x.id)} className={`w-full text-left p-3 rounded-xl border ${x.id===c?.id?'border-cyan-700 bg-cyan-950/20':'border-zinc-900 bg-zinc-950'}`}><div className="flex justify-between gap-2"><b>{x.name}</b><span className="text-[10px] text-zinc-500">{x.isRecruited?'영입됨':`신뢰 ${x.trust}`}</span></div><div className="text-[11px] text-zinc-500">{x.title} · {x.location}</div></button>)}</div>
      {c&&<div className="overflow-y-auto p-5 space-y-4"><div><h2 className="text-xl font-black">{c.name} <span className="text-sm text-amber-300">『{c.title}』</span></h2><p className="text-xs text-zinc-500 mt-1">{getKoreanLabel(c.race, c.race)}{c.beastkinType?` / ${getKoreanLabel(c.beastkinType, c.beastkinType)}`:''} · {c.faction||'무소속'} · {c.location}</p></div><p className="text-sm text-zinc-300 leading-relaxed">{c.personality}</p>
        <div className="grid grid-cols-2 gap-2 text-xs"><div className="p-3 bg-zinc-900 rounded"><Heart className="w-3 inline mr-1 text-rose-400"/>호감도 {c.relationship}</div><div className="p-3 bg-zinc-900 rounded">신뢰도 {c.trust} / {c.recruitmentTrust??55}</div></div>
        {c.memoryFlags?.maliciousIntentExposed&&<div className="p-3 rounded border border-rose-900 bg-rose-950/20 text-rose-200 text-xs"><ShieldAlert className="w-4 inline mr-1"/>이 인물의 악의 또는 기만 의도가 드러났습니다.</div>}
        <div className="text-xs text-zinc-500">고유 퀘스트: {(c.customQuestIds||[]).length?`${c.customQuestIds!.length}개`:'비어 있음'}</div>
        <div className="flex gap-2"><button onClick={()=>onTalk(c.id)} className="flex-1 p-3 rounded bg-zinc-800 hover:bg-zinc-700 font-bold">대화 / 교류</button><button disabled={c.isRecruited||!c.isRecruitable||c.trust<(c.recruitmentTrust??55)} onClick={()=>onRecruit(c.id)} className="flex-1 p-3 rounded bg-cyan-700 disabled:opacity-35 font-bold"><UserRoundPlus className="w-4 inline mr-1"/>{c.isRecruited?'영입 완료':'동료 영입'}</button></div>
        <div className="text-[11px] text-zinc-600">대화를 반복하면 호감도와 신뢰가 누적됩니다. 일부 인물은 숨은 악독함 플래그를 가지며, 충분히 교류하면 의도가 드러나거나 배신 플래그가 발생할 수 있습니다.</div>
      </div>}
    </div>
  </div></div>;
}
