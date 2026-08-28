import { Skull, RotateCcw, UserPlus, FlaskConical } from 'lucide-react';
import { PlayerState } from '../types';
import { getRaceDefinition } from '../data/raceData';

interface GameOverModalProps {
  isOpen: boolean;
  playerState: PlayerState;
  onStartNewCharacter: () => void;
  onRestartWithCurrentCharacter: () => void;
  canUseResurrectionPotion?: boolean;
  resurrectionBlockedReason?: string;
  onUseResurrectionPotion?: () => void;
}

export function GameOverModal({
  isOpen,
  playerState,
  onStartNewCharacter,
  onRestartWithCurrentCharacter,
  canUseResurrectionPotion = false,
  resurrectionBlockedReason,
  onUseResurrectionPotion,
}: GameOverModalProps) {
  if (!isOpen) return null;

  const raceDef = getRaceDefinition(playerState.race || 'HUMAN', playerState.beastkinType);
  const charName = playerState.characterName || playerState.profile?.inGameName || '모험가';

  // Determine demise reason
  const isHpDemise = playerState.hp <= 0;
  const isSanityDemise = playerState.sanity <= 0;

  let titleText = '운명의 끝에 도달했습니다';
  let causeText = '치명적인 상처를 입고 생명력을 모두 소진하여 차가운 바닥에 쓰러졌습니다.';
  let causeBadge = '사망 (체력 고갈)';

  if (isSanityDemise && !isHpDemise) {
    titleText = '이성의 끈이 끊어졌습니다';
    causeText = '끝없는 공포와 광기에 영혼이 잠식되어 자아를 잃고 어둠 속으로 가라앉았습니다.';
    causeBadge = '광기 (정신력 붕괴)';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-lg bg-stone-950 border border-red-900/60 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.25)] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with grim dark-fantasy accent */}
        <div className="relative px-6 py-6 text-center border-b border-red-950 bg-gradient-to-b from-red-950/40 to-stone-950 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-950/80 border border-red-700/60 text-red-500 shadow-inner">
            <Skull className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-2xl font-extrabold tracking-widest text-red-400 uppercase drop-shadow-md">
            게임 오버
          </h2>

          <div className="inline-block px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-700/50 text-[11px] font-bold text-red-300">
            {causeBadge}
          </div>

          <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed pt-1">
            {causeText}
          </p>
        </div>

        {/* Demise Summary */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-stone-900/80 border border-stone-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs">
              <span className="text-stone-400">모험가</span>
              <span className="font-bold text-stone-100 flex items-center gap-1.5">
                <span className="text-stone-400 font-normal">[{raceDef.name}]</span>
                {charName} <span className="text-amber-400">Lv.{playerState.level}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-stone-950/80 rounded-lg border border-stone-800">
                <div className="text-[10px] text-stone-500 mb-0.5">생존 대화 로그</div>
                <div className="font-mono font-bold text-stone-200">
                  {playerState.dialogueCount ?? 0}회
                </div>
              </div>
              <div className="p-2 bg-stone-950/80 rounded-lg border border-stone-800">
                <div className="text-[10px] text-stone-500 mb-0.5">누적 경험치</div>
                <div className="font-mono font-bold text-amber-300">
                  {playerState.experience} EXP
                </div>
              </div>
              <div className="p-2 bg-stone-950/80 rounded-lg border border-stone-800">
                <div className="text-[10px] text-stone-500 mb-0.5">보유 루피</div>
                <div className="font-mono font-bold text-amber-400">
                  {playerState.rupees.toLocaleString()} 루피
                </div>
              </div>
            </div>

            {/* Special status final note if exists */}
            {playerState.adultStatus && (
              <div className="flex items-center justify-around text-[10px] text-stone-400 pt-1 border-t border-stone-800/80">
                <span>성욕: {playerState.adultStatus.desire}/100</span>
                <span>음란도: {playerState.adultStatus.lewdness}/10</span>
                <span>감도: {playerState.adultStatus.sensitivity}/100</span>
                <span>타락도: {playerState.corruptionStatus?.corruption ?? 0}/10</span>
              </div>
            )}
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-2.5 pt-1">
            {canUseResurrectionPotion && onUseResurrectionPotion && (
              <button
                id="gameover-resurrection-potion-btn"
                onClick={onUseResurrectionPotion}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-50 border border-emerald-700/60 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer active:scale-[0.99]"
              >
                <FlaskConical className="w-4 h-4" />
                <span>부활의 물약 사용 · 전투 포기 후 생환</span>
              </button>
            )}
            {resurrectionBlockedReason && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-[11px] leading-5 text-red-300">
                {resurrectionBlockedReason}
              </div>
            )}
            <button
              id="gameover-restart-current-btn"
              onClick={onRestartWithCurrentCharacter}
              className="w-full min-h-[46px] flex items-center justify-center gap-2 bg-red-900 hover:bg-red-800 text-stone-100 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer active:scale-[0.99]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>현재 캐릭터로 다시 도전하기</span>
            </button>

            <button
              id="gameover-start-new-btn"
              onClick={onStartNewCharacter}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-stone-400" />
              <span>새로운 캐릭터 생성 및 모험 시작</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
