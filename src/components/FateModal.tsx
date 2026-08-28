import { X, Sparkles, CheckCircle2, Circle, LockKeyhole, GitBranch, Flag, ScrollText } from 'lucide-react';
import type { PlayerState } from '../types';
import { getFateDefinition } from '../data/world/fateData';

interface FateModalProps {
  isOpen: boolean;
  playerState: PlayerState;
  onClose: () => void;
}

const STATUS_LABEL: Record<string,string> = {
  SELECTED:'선택됨', IN_PROGRESS:'진행 중', BRANCHED:'분기됨', COMPLETED:'완수', ABANDONED:'파기됨',
};

export function FateModal({ isOpen, playerState, onClose }: FateModalProps) {
  if (!isOpen) return null;
  const fate = getFateDefinition(playerState.fate?.fateId || '');
  if (!fate) return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="w-full max-w-3xl rounded-2xl border border-stone-800 bg-stone-950 p-5">
        <div className="flex justify-between"><b>운명 기록</b><button onClick={onClose}><X/></button></div>
        <p className="mt-6 text-stone-400">현재 운명 데이터를 찾을 수 없습니다.</p>
      </div>
    </div>
  );

  const currentId = playerState.fate.currentChapterId;
  const completed = new Set(playerState.fate.completedChapterIds || []);
  const ending = fate.endings.find((entry) => entry.id === playerState.fate.endingId);
  const progress = fate.chapters.length ? Math.round((completed.size / fate.chapters.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-ui-pop-in">
      <div className="w-full max-w-4xl max-h-[94dvh] overflow-hidden rounded-2xl border border-violet-900/60 bg-stone-950 shadow-2xl flex flex-col">
        <div className="px-4 py-3 border-b border-stone-800 bg-gradient-to-r from-violet-950/60 via-stone-950 to-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-violet-300 shrink-0"/>
            <div className="min-w-0"><div className="text-xs text-violet-300">운명 기록</div><h2 className="font-black text-stone-100 truncate">『{fate.name}』</h2></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          <section className="rounded-2xl border border-stone-800 bg-stone-900/55 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {fate.raceExclusiveLabel && <span className="text-[11px] rounded-full px-2 py-1 border border-violet-500/40 text-violet-200 bg-violet-500/5">{fate.raceExclusiveLabel}</span>}
              <span className="text-[11px] rounded-full px-2 py-1 border border-stone-700 text-stone-300">{STATUS_LABEL[playerState.fate.status] || playerState.fate.status}</span>
              {fate.requiresAdult && <span className="text-[11px] rounded-full px-2 py-1 border border-rose-500/40 text-rose-300">성인 전용 사용자 운명</span>}
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-300">{fate.description}</p>
            <div className="mt-4 h-2 rounded-full bg-stone-800 overflow-hidden"><div className="h-full bg-violet-500 transition-all" style={{width:`${progress}%`}}/></div>
            <div className="flex justify-between mt-1 text-[11px] text-stone-500"><span>운명 진행도</span><span>{completed.size}/{fate.chapters.length} · {progress}%</span></div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-bold"><ScrollText className="w-4 h-4 text-amber-300"/>운명장</div>
            {fate.chapters.map((chapter,index) => {
              const isDone = completed.has(chapter.id);
              const isCurrent = chapter.id === currentId;
              const isLocked = !isDone && !isCurrent;
              return <div key={chapter.id} className={`rounded-xl border p-3 ${isCurrent?'border-violet-500/60 bg-violet-500/8':isDone?'border-emerald-900/70 bg-emerald-950/10':'border-stone-800 bg-stone-900/35'}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{isDone?<CheckCircle2 className="w-4 h-4 text-emerald-400"/>:isCurrent?<Circle className="w-4 h-4 text-violet-300 fill-violet-500/20"/>:<LockKeyhole className="w-4 h-4 text-stone-600"/>}</div>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-xs text-stone-500">제{index+1}장</span><b className={isLocked?'text-stone-500':'text-stone-200'}>{isLocked?'???':chapter.title}</b>{isCurrent&&<span className="text-[10px] text-violet-300">현재</span>}</div>
                    {!isLocked && <><p className="text-xs text-stone-400 mt-1 leading-5">{chapter.summary}</p><p className="text-[11px] text-amber-200/70 mt-2">{chapter.unlockHint}</p></>}
                    {!isLocked && chapter.choices?.length ? <div className="mt-3 flex flex-wrap gap-2">{chapter.choices.map(choice=><span key={choice.id} className="inline-flex items-center gap-1 rounded-lg border border-stone-700 px-2 py-1 text-[11px] text-stone-300"><GitBranch className="w-3 h-3"/>{choice.label}</span>)}</div>:null}
                  </div>
                </div>
              </div>
            })}
          </section>

          {playerState.fate.choiceHistory?.length > 0 && <section className="rounded-xl border border-stone-800 p-3"><div className="font-bold text-sm flex items-center gap-2"><GitBranch className="w-4 h-4 text-cyan-300"/>지나온 선택</div><div className="mt-2 space-y-1">{playerState.fate.choiceHistory.map((choice,index)=><div key={`${choice.chapterId}-${index}`} className="text-xs text-stone-400">• {choice.choiceLabel || choice.choiceId}</div>)}</div></section>}

          <section className="rounded-xl border border-stone-800 p-3">
            <div className="font-bold text-sm flex items-center gap-2"><Flag className="w-4 h-4 text-amber-300"/>운명의 결말</div>
            {ending ? <div className="mt-2"><b className="text-amber-200">『{ending.name}』</b><p className="text-xs text-stone-400 mt-1">{ending.description}</p><div className="mt-3 text-xs text-violet-200">영구 기록: 『{fate.completionReward.name}』</div><p className="text-[11px] text-stone-500 mt-1">{fate.completionReward.description}</p></div> : <div className="mt-2 grid sm:grid-cols-2 gap-2">{fate.endings.map(end=><div key={end.id} className="rounded-lg bg-stone-900/60 border border-stone-800 p-2"><b className="text-stone-500">???</b><p className="text-[11px] text-stone-600 mt-1">운명을 끝까지 진행하면 결말이 기록됩니다.</p></div>)}</div>}
          </section>
        </div>
      </div>
    </div>
  );
}
