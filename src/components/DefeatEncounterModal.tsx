import { AlertTriangle, ArrowRight, Skull, Clock, Coins, HeartPulse } from 'lucide-react';
import type { DefeatAftermathState, PlayerState } from '../types';

interface DefeatEncounterModalProps {
  isOpen: boolean;
  playerState: PlayerState;
  aftermath: DefeatAftermathState;
  onContinue: () => void;
}

export function DefeatEncounterModal({ isOpen, playerState, aftermath, onContinue }: DefeatEncounterModalProps) {
  if (!isOpen || aftermath.kind === 'DEATH') return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden border border-amber-900/60 bg-stone-950 shadow-[0_0_60px_rgba(120,53,15,0.35)]">
        <div className="px-6 py-5 text-center border-b border-stone-800 bg-gradient-to-b from-amber-950/30 to-stone-950">
          <div className="mx-auto mb-2 w-12 h-12 rounded-full border border-amber-700/60 bg-amber-950/50 flex items-center justify-center">
            <Skull className="w-7 h-7 text-amber-400" />
          </div>
          <div className="text-[11px] tracking-[0.24em] font-black text-amber-500">DEFEAT AFTERMATH</div>
          <h2 className="mt-1 text-xl font-extrabold text-stone-100">{aftermath.title}</h2>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4 text-sm leading-7 text-stone-300">
            {aftermath.description}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-lg border border-stone-800 bg-stone-900 p-2.5">
              <HeartPulse className="w-4 h-4 mx-auto mb-1 text-rose-400" />
              <div className="text-stone-500">현재 HP</div>
              <div className="font-bold text-stone-200">{playerState.hp}/{playerState.maxHp}</div>
            </div>
            <div className="rounded-lg border border-stone-800 bg-stone-900 p-2.5">
              <Coins className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <div className="text-stone-500">보유 루피</div>
              <div className="font-bold text-stone-200">{playerState.rupees.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-stone-800 bg-stone-900 p-2.5">
              <Clock className="w-4 h-4 mx-auto mb-1 text-sky-400" />
              <div className="text-stone-500">전투 결과</div>
              <div className="font-bold text-rose-300">패배 확정</div>
            </div>
          </div>

          <div className="flex gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-[11px] text-amber-200/80 leading-5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>이 인카운터는 전투 승리로 취급되지 않습니다. 이미 쓰러뜨린 적의 경험치와 전리품만 정산되고, 패배 후 세계 상태로 이어집니다.</span>
          </div>

          <button
            onClick={onContinue}
            className="w-full min-h-[46px] rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            이 결과를 받아들이고 계속하기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
