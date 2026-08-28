import { Compass, RotateCcw, Sparkles } from 'lucide-react';

interface HeaderProps {
  isLoading: boolean;
  onReset: () => void;
}

export function Header({ isLoading, onReset }: HeaderProps) {
  return (
    <header className="flex-none bg-stone-900/90 backdrop-blur border-b border-stone-800 px-4 py-3 sm:px-6">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-stone-100 flex items-center gap-1.5">
              AI TEXT RPG
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                GM
              </span>
            </h1>
            <p className="text-xs text-stone-400">당신의 선택으로 써 내려가는 이야기</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">GM 작성 중...</span>
            </div>
          )}
          
          <button
            id="reset-game-button"
            onClick={onReset}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/60 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="새 게임 시작"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>새로 시작</span>
          </button>
        </div>
      </div>
    </header>
  );
}
