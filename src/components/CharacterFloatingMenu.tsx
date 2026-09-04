import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Backpack,
  BarChart2,
  Briefcase,
  Compass,
  FileText,
  Scroll,
  Shield,
  Sparkles,
  Tent,
  Users,
  WandSparkles,
  Boxes,
  Hammer,
} from 'lucide-react';
import { PlayerState, QuestProgress } from '../types';

interface CharacterFloatingMenuProps {
  playerState: PlayerState;
  onOpenStatus: () => void;
  onOpenStats: () => void;
  onOpenInternalStatus: () => void;
  onOpenTalents: () => void;
  onOpenClass: () => void;
  onOpenSkillTree: () => void;
  onOpenWorldMap: () => void;
  onOpenProfessions: () => void;
  onOpenInventory: () => void;
  onOpenEquipment: () => void;
  onOpenCrafting: () => void;
  onOpenQuests: () => void;
  onOpenFate: () => void;
  onOpenCamp: () => void;
  onOpenCompanions: () => void;
  onOpenMajorCharacters: () => void;
  /** 큰 모달/상태창이 열렸을 때 플로팅 모험 버튼을 숨겨 겹침을 방지한다. */
  hideAdventureFab?: boolean;
}

type MenuCategory = 'status' | 'bag' | 'growth' | 'tech' | 'adventure' | null;

const submenuMotion = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.98 },
  transition: { duration: 0.16 },
};

export const CharacterFloatingMenu: React.FC<CharacterFloatingMenuProps> = ({
  playerState,
  onOpenStatus,
  onOpenStats,
  onOpenInternalStatus,
  onOpenTalents,
  onOpenClass,
  onOpenSkillTree,
  onOpenWorldMap,
  onOpenProfessions,
  onOpenInventory,
  onOpenEquipment,
  onOpenCrafting,
  onOpenQuests,
  onOpenFate,
  onOpenCamp,
  onOpenCompanions,
  onOpenMajorCharacters,
  hideAdventureFab = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const quests = Object.values(playerState.quests || {}) as QuestProgress[];
  const offeredQuestCount = quests.filter((q) => q.status === 'OFFERED').length;
  // 단순 진행 중(ACTIVE)인 퀘스트는 알림이 아니다. 엔진이 기록한 미확인 변화만 표시한다.
  const questAlertCount = playerState.questAlertQuestIds ? new Set(playerState.questAlertQuestIds).size : offeredQuestCount;
  const hasStatPoints = (playerState.statPoints || 0) > 0;
  const hasTalentPoints = (playerState.talentPoints || 0) > 0;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const open = (cb: () => void) => {
    setActiveCategory(null);
    cb();
  };

  const toggle = (category: Exclude<MenuCategory, null>) => {
    setActiveCategory((current) => (current === category ? null : category));
  };

  const rootButtonClass = (active: boolean) =>
    `relative min-w-0 min-h-[42px] sm:min-h-[44px] flex items-center justify-center gap-1 px-1 sm:px-3 py-2 rounded-xl border text-[9px] min-[390px]:text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.97] ${
      active
        ? 'bg-amber-500/18 border-amber-500/60 text-amber-200 shadow-sm shadow-amber-950/40'
        : 'bg-stone-950/85 border-stone-700/80 text-stone-300 hover:text-stone-100 hover:border-stone-500 hover:bg-stone-900'
    }`;

  const subButtonClass =
    'min-h-[40px] flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-950/95 hover:bg-stone-900 border border-stone-700/90 hover:border-amber-500/55 text-stone-200 text-xs font-semibold shadow-xl shadow-black/40 backdrop-blur-md transition-colors whitespace-nowrap';

  return (
    <div ref={rootRef} className="relative z-30 w-full select-none">
      <AnimatePresence mode="wait">
        {activeCategory && (
          <motion.div
            key={activeCategory}
            {...submenuMotion}
            className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-1.5 max-w-[min(94vw,660px)] p-1.5 rounded-2xl border border-stone-800/70 bg-stone-950/94 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            {activeCategory === 'status' && (
              <>
                <button className={subButtonClass} onClick={() => open(onOpenStatus)}>
                  <FileText className="w-3.5 h-3.5 text-stone-300" /> 기본
                </button>
                <button className={subButtonClass} onClick={() => open(onOpenEquipment)}>
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> 장비
                </button>
                <button className={subButtonClass} onClick={() => open(onOpenInternalStatus)}>
                  <Boxes className="w-3.5 h-3.5 text-rose-300" /> 내부상태
                </button>
                <button className={subButtonClass} onClick={() => open(onOpenStats)}>
                  <BarChart2 className="w-3.5 h-3.5 text-sky-300" /> 스탯 상세
                  {hasStatPoints && <span className="text-[10px] text-amber-300">+{playerState.statPoints}</span>}
                </button>
              </>
            )}

            {activeCategory === 'bag' && (
              <>
                <button className={subButtonClass} onClick={() => open(onOpenInventory)}>
                  <Backpack className="w-3.5 h-3.5 text-emerald-400" /> 인벤토리
                </button>
                <button className={subButtonClass} onClick={() => open(onOpenCamp)}>
                  <Boxes className="w-3.5 h-3.5 text-amber-300" /> 야영지 보관함
                </button>
              </>
            )}

            {activeCategory === 'tech' && (
              <>
                <button className={subButtonClass} onClick={() => open(onOpenProfessions)}>
                  <Briefcase className="w-3.5 h-3.5 text-amber-300" /> 생활기술 (10종)
                </button>
                <button
                  className={subButtonClass}
                  onClick={() => open(() => alert('전투기술 시스템 2차 개편 준비 중입니다.'))}
                >
                  <Shield className="w-3.5 h-3.5 text-rose-400" /> 전투기술 (준비 중)
                </button>
                <button
                  className={subButtonClass}
                  onClick={() => open(() => alert('잡기술 시스템 준비 중입니다.'))}
                >
                  <WandSparkles className="w-3.5 h-3.5 text-purple-300" /> 잡기술 (준비 중)
                </button>
              </>
            )}

            {activeCategory === 'growth' && (
              <>
                <button className={subButtonClass} onClick={() => open(onOpenTalents)}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 재능
                  {hasTalentPoints && <span className="text-[10px] text-amber-300">+{playerState.talentPoints}</span>}
                </button>
                <button className={subButtonClass} onClick={() => open(onOpenClass)}>
                  <Shield className="w-3.5 h-3.5 text-indigo-300" /> 전직
                </button>
                <button className={subButtonClass} onClick={() => open(onOpenSkillTree)}>
                  <WandSparkles className="w-3.5 h-3.5 text-violet-300" /> 스킬트리
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-6 gap-1 sm:gap-1.5 w-full max-w-[720px] pb-0.5">
        <button className={rootButtonClass(activeCategory === 'status')} onClick={() => toggle('status')}>
          <Activity className="w-3.5 h-3.5 text-rose-300" /> 상태
          {(hasStatPoints || Boolean(playerState.adultNarrativeQueue?.length)) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button className={rootButtonClass(activeCategory === 'growth')} onClick={() => toggle('growth')}>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 성장
          {hasTalentPoints && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />}
        </button>

        <button className={rootButtonClass(activeCategory === 'tech')} onClick={() => toggle('tech')}>
          <Briefcase className="w-3.5 h-3.5 text-amber-300" /> 기술
        </button>

        <button className={rootButtonClass(activeCategory === 'bag')} onClick={() => toggle('bag')}>
          <Backpack className="w-3.5 h-3.5 text-emerald-400" /> 가방
        </button>

        <button className={rootButtonClass(false)} onClick={() => open(onOpenCrafting)}>
          <Hammer className="w-3.5 h-3.5 text-orange-300" /> 제작
        </button>

        <button className={rootButtonClass(false)} onClick={() => open(onOpenCompanions)}>
          <Users className="w-3.5 h-3.5 text-cyan-300" /> 동료
        </button>
      </div>

      {/* 독립 상시 플로팅 모험 (나침반) 버튼 및 서브메뉴 — 공식 위치는 오른쪽 하단 */}
      {!hideAdventureFab && <div className="fixed right-5 sm:right-6 bottom-[calc(118px+env(safe-area-inset-bottom,0px))] z-35 flex flex-col items-end gap-2 select-none">
        <AnimatePresence>
          {activeCategory === 'adventure' && (
            <motion.div
              key="adventure-popup"
              {...submenuMotion}
              className="flex flex-col sm:flex-row flex-wrap gap-1.5 max-w-[min(92vw,420px)] p-2 rounded-2xl border border-stone-800/90 bg-stone-950/96 shadow-2xl shadow-black/90 backdrop-blur-xl"
            >
              <button className={subButtonClass} onClick={() => open(onOpenWorldMap)}>
                <Compass className="w-3.5 h-3.5 text-sky-300" /> 세계 지도
              </button>
              <button className={subButtonClass} onClick={() => open(onOpenQuests)}>
                <Scroll className="w-3.5 h-3.5 text-amber-400" /> 퀘스트
                {questAlertCount > 0 && <span className="text-[10px] text-amber-300">{questAlertCount}</span>}
              </button>
              <button className={subButtonClass} onClick={() => open(onOpenFate)}>
                <Sparkles className="w-3.5 h-3.5 text-violet-300" /> 운명
              </button>
              <button className={subButtonClass} onClick={() => open(onOpenCamp)}>
                <Tent className="w-3.5 h-3.5 text-emerald-400" /> 야영지
              </button>
              <button className={subButtonClass} onClick={() => open(onOpenMajorCharacters)}>
                <Users className="w-3.5 h-3.5 text-cyan-300" /> 주요 인물
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => toggle('adventure')}
          className={`group relative w-[60px] h-[60px] rounded-full border-2 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-md cursor-pointer ${
            activeCategory === 'adventure'
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-amber-500/20 ring-2 ring-amber-500/30'
              : 'bg-stone-950/92 hover:bg-stone-900 border-amber-500/65 hover:border-amber-400 text-amber-400 shadow-black/80'
          }`}
          title="모험 (세계 지도, 퀘스트, 야영지 등)"
        >
          <Compass className="w-6 h-6 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          <span className="text-[10px] font-bold text-amber-200 tracking-tight -mt-0.5">모험</span>
          {questAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 border border-stone-950 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
              {questAlertCount}
            </span>
          )}
        </button>
      </div>}
    </div>
  );
};
