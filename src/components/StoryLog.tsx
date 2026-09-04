import React, { useEffect, useRef } from 'react';
import { GameMessage, BattleTriggerInfo } from '../types';
import { AlertCircle, RefreshCw, Skull, Sparkles, Swords } from 'lucide-react';
import { normalizeNarrativeText } from '../utils/narrativeSanitizer';

interface StoryLogProps {
  messages: GameMessage[];
  isLoading: boolean;
  isGameOver: boolean;
  gameOverReason?: 'hp' | 'sanity';
  onRetry?: (actionText: string) => void;
  onStartBattle?: (battleTrigger: BattleTriggerInfo) => void;
  onOpenGameOverModal?: () => void;
  onStartNewCharacter?: () => void;
  onRestartWithCurrentCharacter?: () => void;
}

export function StoryLog({
  messages,
  isLoading,
  isGameOver,
  gameOverReason = 'hp',
  onRetry,
  onStartBattle,
  onStartNewCharacter,
  onRestartWithCurrentCharacter,
}: StoryLogProps) {
  const containerRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialMountRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  // Drag-to-scroll refs
  const isMouseDownRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);

  // Function to scroll to the top of the newest turn (last user action or latest message)
  const scrollToLatestTurn = (behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;

    let lastUserMsg: GameMessage | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i];
        break;
      }
    }
    const targetMsg = lastUserMsg || messages[messages.length - 1];

    if (targetMsg) {
      const targetElement = document.getElementById(`msg-${targetMsg.id}`);
      if (targetElement) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
        container.scrollTo({
          top: Math.max(0, relativeTop - 12),
          behavior,
        });
        return;
      }
    }

    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
    }
  };

  // Auto-scroll on mount and when new messages arrive:
  // Scroll to the top of the newly generated turn (the user's action or latest GM response)
  // so the player starts reading from the top of the new log rather than the very top of the game or the very bottom.
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevMessagesLengthRef.current = messages.length;

      // Immediate and staged frame execution to ensure DOM & fonts layout are fully calculated
      scrollToLatestTurn('auto');

      const rafId = requestAnimationFrame(() => {
        scrollToLatestTurn('auto');
      });

      const timer1 = setTimeout(() => {
        scrollToLatestTurn('auto');
      }, 60);

      const timer2 = setTimeout(() => {
        scrollToLatestTurn('auto');
      }, 200);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    if (messages.length > prevMessagesLengthRef.current) {
      scrollToLatestTurn('smooth');
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, isGameOver]);

  // When loading starts, scroll to bring the loader/latest area into view
  useEffect(() => {
    if (isLoading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLoading]);

  // Mouse Drag-to-Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    // Only trigger on primary mouse button (left-click)
    if (e.button !== 0) return;

    // Do not initiate drag if clicking interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]')) {
      return;
    }

    if (!containerRef.current) return;

    isMouseDownRef.current = true;
    startYRef.current = e.clientY;
    startScrollTopRef.current = containerRef.current.scrollTop;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;

    const deltaY = e.clientY - startYRef.current;
    containerRef.current.scrollTop = startScrollTopRef.current - deltaY;
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
  };

  return (
    <main
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pt-5 pb-24 sm:pt-7 sm:pb-24 select-text cursor-grab active:cursor-grabbing touch-pan-y"
    >
      <div className="w-full max-w-2xl mx-auto space-y-5">
        {messages.map((msg, index) => (
          <div key={msg.id} id={`msg-${msg.id}`} className="w-full">
            {msg.role === 'user' ? (
              <div className="py-2 border-y border-stone-800/70 text-sm text-stone-400 italic select-text">
                <span className="text-amber-500 not-italic font-semibold mr-2">행동</span>
                {msg.content}
              </div>
            ) : msg.role === 'system' ? (
              <div className="w-full border-l-2 border-amber-500 bg-amber-950/20 px-3 py-2.5 text-amber-100 text-sm flex items-start gap-2.5 select-text">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
              </div>
            ) : msg.status === 'error' ? (
              <div className="w-full border border-red-500/40 bg-red-950/30 rounded-lg p-3 text-red-200 text-sm flex items-start gap-2.5 select-text">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="font-bold text-red-300">오류가 발생했습니다</p>
                  <p className="text-xs text-red-200/90 leading-relaxed break-words whitespace-pre-line">{msg.content}</p>
                  {msg.actionText && onRetry && (
                    <button
                      id={`retry-action-${index}`}
                      onClick={() => onRetry(msg.actionText!)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-medium bg-red-900/70 hover:bg-red-800 text-red-100 border border-red-700/60 px-3 py-1.5 rounded cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> 다시 시도
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <article className="w-full text-stone-200 text-[15px] sm:text-base leading-8 select-text">
                  {normalizeNarrativeText(msg.content).split('\n\n').map((paragraph, pIdx) => {
                    const hasDialogue = paragraph.includes('"') || paragraph.includes('“') || paragraph.includes('「');
                    return (
                      <p
                        key={pIdx}
                        className={`whitespace-pre-wrap break-words ${pIdx > 0 ? 'mt-4' : ''} ${hasDialogue ? 'text-stone-100' : 'text-stone-300'}`}
                      >
                        {paragraph}
                      </p>
                    );
                  })}
                </article>

                {/* 실제 변경된 아이템 및 자원 시스템 로그 */}
                {Array.isArray(msg.systemChangeLogs) && msg.systemChangeLogs.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono select-none">
                    {msg.systemChangeLogs.map((log, lIdx) => {
                      const isGain = log.startsWith('[획득]') || log.startsWith('[경험치]') || log.includes('+');
                      const isLoss = log.startsWith('[소실]') || log.includes('-');
                      return (
                        <span
                          key={lIdx}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                            isGain
                              ? 'text-amber-300/90 bg-amber-950/40 border border-amber-800/40'
                              : isLoss
                              ? 'text-stone-400 bg-stone-900/60 border border-stone-800/60'
                              : 'text-stone-300 bg-stone-900/50'
                          }`}
                        >
                          {log}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 전투 진입 선택지 (전투 인카운터 발생 시 사전 확인 UI) */}
                {msg.pendingBattle && onStartBattle && (
                  <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-red-950/70 border border-red-800/90 shadow-xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-red-900/80 border border-red-700/80 text-red-300 shadow-inner">
                          <Swords className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-red-200 flex items-center flex-wrap gap-1.5">
                            <span className="text-red-400 font-semibold">[전투 인카운터 발생]</span>
                            <span className="text-amber-300 font-bold">{msg.pendingBattle.enemyName || '적의 기습'}</span>
                            {msg.pendingBattle.enemyLevel && (
                              <span className="text-[11px] px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 text-stone-300 font-mono">
                                Lv.{msg.pendingBattle.enemyLevel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-300 mt-1">
                            {msg.pendingBattle.battlefield?.name
                              ? `전장: ${msg.pendingBattle.battlefield.name}`
                              : '적대적 대상과의 대치 상태입니다. 전열을 가다듬고 전투에 돌입하세요.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        id={`start-battle-btn-${msg.id}`}
                        onClick={() => onStartBattle(msg.pendingBattle!)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold text-xs sm:text-sm rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all border border-red-500/60"
                      >
                        <Swords className="w-4 h-4 text-white" />
                        <span>[전투 돌입] {msg.pendingBattle.enemyName || '적'}과의 전투 시작하기</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="py-3 text-sm text-stone-500 flex items-center gap-2">
            <div className="flex space-x-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse [animation-delay:200ms]" />
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse [animation-delay:400ms]" />
            </div>
            <span>이야기가 이어지는 중...</span>
          </div>
        )}

        {isGameOver && (
          <div className="w-full bg-red-950/70 border border-red-700/60 rounded-xl p-5 text-center space-y-3 shadow-lg">
            <div className="flex items-center justify-center gap-2 text-red-400 font-extrabold text-lg tracking-wider">
              <Skull className="w-6 h-6 animate-pulse" /> GAME OVER <Skull className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-sm text-red-200 leading-relaxed max-w-md mx-auto">
              {gameOverReason === 'sanity'
                ? '정신력이 0이 되어 깊은 광기와 공포에 자아를 잃었습니다.'
                : '체력이 0이 되어 치명상을 입고 쓰러졌습니다.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {onRestartWithCurrentCharacter && (
                <button
                  id="storylog-restart-current-btn"
                  onClick={onRestartWithCurrentCharacter}
                  className="min-h-[38px] px-4 py-2 bg-red-800 hover:bg-red-700 active:bg-red-900 text-stone-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  현재 캐릭터로 다시 도전
                </button>
              )}
              {onStartNewCharacter && (
                <button
                  id="storylog-start-new-btn"
                  onClick={onStartNewCharacter}
                  className="min-h-[38px] px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  새 캐릭터 생성
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
    </main>
  );
}
