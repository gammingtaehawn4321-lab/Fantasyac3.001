import { UserPlus, FolderOpen, Sparkles } from 'lucide-react';

interface MainTitleScreenProps {
  onOpenLoadModal: () => void;
  onStartNewGame: () => void;
}

export function MainTitleScreen({
  onOpenLoadModal,
  onStartNewGame,
}: MainTitleScreenProps) {
  return (
    <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col justify-between overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Dark fantasy ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-600/10 via-red-900/5 to-transparent blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-red-950/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900/40 via-stone-950/90 to-stone-950" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-lg mx-auto w-full">
        {/* Title & Branding */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-stone-400 text-xs tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Dark Fantasy Text RPG</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-200 to-stone-400 drop-shadow-lg">
            판타지악
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
            자유로운 선택과 끝없는 서사가 펼쳐지는 인터랙티브 TRPG. 미지의 대륙에서 당신만의 전설을 기록하세요.
          </p>
        </div>

        {/* Main Action Buttons - EXACTLY 2 BUTTONS: [새 게임] [불러오기] */}
        <div className="w-full space-y-3">
          {/* New Game Button */}
          <button
            id="main-new-game-btn"
            onClick={onStartNewGame}
            className="w-full min-h-[52px] flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition-all shadow-lg shadow-amber-500/10 cursor-pointer active:scale-[0.99]"
          >
            <UserPlus className="w-5 h-5 fill-current" />
            <span>새 게임</span>
          </button>

          {/* Load Game Button */}
          <button
            id="main-load-game-btn"
            onClick={onOpenLoadModal}
            className="w-full min-h-[52px] flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-base bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-stone-100 border border-stone-700 hover:border-amber-500/50 transition-all cursor-pointer active:scale-[0.99]"
          >
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <span>불러오기</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full mt-10 text-center text-xs">
          <div className="p-3 bg-stone-900/50 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-300">자유로운 텍스트 행동</div>
            <div className="text-[11px] text-stone-500">모든 명령 직접 입력</div>
          </div>
          <div className="p-3 bg-stone-900/50 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-300">캐릭터 말투 & 성격</div>
            <div className="text-[11px] text-stone-500">고유한 어조 서사 반영</div>
          </div>
          <div className="p-3 bg-stone-900/50 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-300">다크 판타지 세계관</div>
            <div className="text-[11px] text-stone-500">종족별 고유 상호작용</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-4 text-center text-[11px] text-stone-600 border-t border-stone-900">
        『판타지악』 · AI Interactive Dark Fantasy Text RPG
      </div>
    </div>
  );
}

