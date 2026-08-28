import { useState, FormEvent, ReactNode } from 'react';
import { Send } from 'lucide-react';

interface ActionInputProps {
  onSendAction: (action: string) => void;
  isLoading: boolean;
  isGameOver?: boolean;
  characterMenu?: ReactNode;
}

export function ActionInput({ onSendAction, isLoading, isGameOver = false, characterMenu }: ActionInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isGameOver) return;
    onSendAction(input.trim());
    setInput('');
  };

  return (
    <footer className="flex-none shrink-0 w-full bg-stone-950/92 backdrop-blur-xl border-t border-stone-800/90 px-2.5 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] z-30 shadow-[0_-10px_32px_rgba(0,0,0,0.28)]">
      <div className="w-full max-w-3xl mx-auto space-y-1.5">
        {characterMenu && <div className="flex items-center justify-start">{characterMenu}</div>}

        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          <div className="flex-1 min-w-0 relative">
            <input
              id="player-action-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isGameOver ? '게임 오버: 새 게임을 시작해 주세요.' : '행동을 자유롭게 입력하세요...'}
              disabled={isLoading || isGameOver}
              className="w-full min-h-[46px] bg-stone-900/85 border border-stone-700/90 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2 text-sm text-stone-100 placeholder-stone-500 outline-none transition-all disabled:opacity-50 shadow-inner"
              autoFocus={!isGameOver}
              autoComplete="off"
            />
          </div>

          <button
            id="send-action-button"
            type="submit"
            disabled={!input.trim() || isLoading || isGameOver}
            className="min-h-[46px] min-w-[52px] sm:min-w-[76px] shrink-0 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold px-3 rounded-xl text-sm transition-all active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed shadow-lg shadow-amber-950/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">행동</span>
          </button>
        </form>
      </div>
    </footer>
  );
}
