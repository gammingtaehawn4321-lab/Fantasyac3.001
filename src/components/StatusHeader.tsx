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
    <header className="sticky top-0 flex-none shrink-0 w-full bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/80 px-2.5 sm:px-3 py-1.5 z-40 select-none shadow-lg shadow-black/20">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <CharacterPortraitHud playerState={playerState} isLoading={isLoading} onClick={onOpenStatus} />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              id="header-game-time-badge"
              className="min-h-[34px] flex items-center gap-1.5 px-2 sm:px-2.5 rounded-lg bg-stone-900/80 border border-stone-800 text-amber-300 font-mono text-[10px] sm:text-[11px] font-semibold"
              title="현재 게임 시간"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="max-w-[112px] sm:max-w-none truncate">{formatGameTime(playerState)}</span>
            </div>

            {onOpenSaveModal && (
              <button
                id="header-save-load-btn"
                onClick={onOpenSaveModal}
                disabled={isLoading}
                className="w-9 h-9 flex items-center justify-center text-amber-400 hover:text-amber-300 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
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
                className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-100 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                title="메인 화면으로 이동"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="reset-game-button"
              onClick={onReset}
              disabled={isLoading}
              className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-100 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              title="새 게임 / 캐릭터 재생성"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-1 h-[2px] rounded-full bg-stone-900 overflow-hidden" title={`EXP ${playerState.experience}/${nextExp}`}>
          <div className="h-full bg-amber-400/80 transition-[width] duration-300" style={{ width: `${expPercent}%` }} />
        </div>
      </div>
    </header>
  );
}
