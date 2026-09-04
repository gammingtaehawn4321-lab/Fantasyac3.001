import { RotateCcw, Home, Clock, Save } from 'lucide-react';
import { PlayerState } from '../types';
import { getRequiredExp, formatGameTime } from '../gameEngine';
import { CharacterPortraitHud } from './CharacterPortraitHud';

interface StatusHeaderProps {
  playerState: PlayerState;
  isLoading: boolean;
  onReset: () => void;
  onOpenStatus: () => void;
  onGoToTitle?: () => void;
  onOpenSaveModal?: () => void;
}

export function StatusHeader({
  playerState,
  isLoading,
  onReset,
  onOpenStatus,
  onGoToTitle,
  onOpenSaveModal,
}: StatusHeaderProps) {
  const nextExp = getRequiredExp(playerState.level);
  const expPercent = Math.min(100, Math.max(0, (playerState.experience / Math.max(1, nextExp)) * 100));

  return (
    <header className="sticky top-0 flex-none shrink-0 w-full bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/80 px-2 sm:px-3 py-1.5 z-40 select-none shadow-lg shadow-black/20">
      <div className="w-full max-w-3xl mx-auto min-w-0">
        {/* Mobile: keep the character HUD and square actions on one row.  The
            clock is moved below so it can no longer squeeze/crop the status HUD. */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <CharacterPortraitHud playerState={playerState} isLoading={isLoading} onClick={onOpenStatus} />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenSaveModal && (
              <button
                id="header-save-load-btn"
                onClick={onOpenSaveModal}
                disabled={isLoading}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-amber-400 hover:text-amber-300 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                title="저장 / 불러오기"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            )}

            {onGoToTitle && (
              <button
                id="header-title-screen-btn"
                onClick={onGoToTitle}
                disabled={isLoading}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-stone-400 hover:text-stone-100 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                title="메인 화면으로 이동"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="reset-game-button"
              onClick={onReset}
              disabled={isLoading}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-stone-400 hover:text-stone-100 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              title="새 게임 / 캐릭터 재생성"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2 min-w-0">
          <div
            id="header-game-time-badge"
            className="h-5 max-w-[150px] sm:max-w-[220px] flex items-center gap-1 px-1.5 rounded-md bg-stone-900/75 border border-stone-800 text-amber-300 font-mono text-[9px] sm:text-[10px] font-semibold shrink-0"
            title="현재 게임 시간"
          >
            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{formatGameTime(playerState)}</span>
          </div>

          <div className="flex-1 min-w-0 h-[4px] rounded-full bg-stone-900 overflow-hidden" title={`EXP ${playerState.experience}/${nextExp}`}>
            <div className="h-full bg-amber-400/80 transition-[width] duration-300" style={{ width: `${expPercent}%` }} />
          </div>
          <span className="hidden sm:inline text-[8px] text-stone-600 font-mono shrink-0">EXP</span>
        </div>
      </div>
    </header>
  );
}
