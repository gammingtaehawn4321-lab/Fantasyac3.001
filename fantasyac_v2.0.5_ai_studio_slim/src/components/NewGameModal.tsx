import { X, UserPlus, RotateCcw, AlertTriangle } from 'lucide-react';
import { PlayerState } from '../types';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewCharacter: () => void;
  onRestartWithCurrentCharacter: () => void;
  playerState: PlayerState;
}

export function NewGameModal({
  isOpen,
  onClose,
  onStartNewCharacter,
  onRestartWithCurrentCharacter,
  playerState,
}: NewGameModalProps) {
  if (!isOpen) return null;

  const charName = playerState.characterName || playerState.profile?.inGameName || '모험가';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-stone-100">새 게임 시작</h2>
          </div>
          <button
            id="close-new-game-modal"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              새 게임을 시작하면 현재까지 진행된 스토리 로그, 획득한 아이템 및 성장 기록이 초기화됩니다.
            </p>
          </div>

          <div className="space-y-3">
            {/* Option 1: Create New Character */}
            <button
              id="start-new-character-btn"
              onClick={onStartNewCharacter}
              className="w-full text-left p-4 rounded-xl border border-amber-500/40 bg-stone-950 hover:bg-amber-950/20 hover:border-amber-500 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-100 text-sm group-hover:text-amber-300 transition-colors">
                      새 캐릭터로 모험 시작
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      종족, 이름, 외형, 말투, 스탯을 새로 커스터마이징합니다.
                    </p>
                  </div>
                </div>
              </div>
            </button>

            {/* Option 2: Restart with Current Character */}
            <button
              id="restart-current-character-btn"
              onClick={onRestartWithCurrentCharacter}
              className="w-full text-left p-4 rounded-xl border border-stone-700 bg-stone-950 hover:bg-stone-800/80 hover:border-stone-500 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 group-hover:scale-105 transition-transform">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-100 text-sm group-hover:text-stone-200 transition-colors">
                      현재 캐릭터로 처음부터 재도전
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      <span className="text-amber-400 font-medium">[{charName}]</span>의 설정(외형/말투/스탯)을 유지하고 상태만 초기화합니다.
                    </p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/60 flex justify-end">
          <button
            id="cancel-new-game-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-300 hover:text-stone-100 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
          >
            취소하고 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}
