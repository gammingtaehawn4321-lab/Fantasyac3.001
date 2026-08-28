import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Scroll, X, CheckCircle2, Clock, XCircle, Sparkles, User, Target, Award } from 'lucide-react';
import { PlayerState, QuestDefinition, QuestProgress, QuestStatus, QuestType } from '../types';
import { QUEST_DATABASE } from '../data/quests/questDatabase';

interface QuestModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onAcceptQuest?: (questId: string) => void;
  onDeclineQuest?: (questId: string) => void;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'OFFERED' | 'COMPLETED' | 'FAILED';

export const QuestModal: React.FC<QuestModalProps> = ({
  playerState,
  onClose,
  onAcceptQuest,
  onDeclineQuest,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  // Combine quest progresses from playerState.quests and definitions from QUEST_DATABASE
  const allUserQuests = useMemo(() => {
    const questsRecord = playerState.quests || {};
    const questEntries = Object.entries(questsRecord);

    return questEntries
      .map(([qId, progress]: [string, QuestProgress]) => {
        const def: QuestDefinition = QUEST_DATABASE[qId] || {
          id: qId,
          title: qId,
          description: '알 수 없는 퀘스트입니다.',
          summary: '',
          category: 'SUB' as QuestType,
          stages: [],
          rewards: { exp: 0, rupees: 0 },
        };
        return {
          progress,
          def,
        };
      })
      .filter(({ def, progress }) => {
        // 숨겨진 퀘스트(isHidden)는 조건을 만족하여 제안/진행/완료된 경우가 아니면 목록에서 숨김
        if (
          def.isHidden &&
          progress.status !== 'OFFERED' &&
          progress.status !== 'ACTIVE' &&
          progress.status !== 'COMPLETED'
        ) {
          return false;
        }
        return true;
      });
  }, [playerState.quests]);

  const offeredCount = useMemo(() => {
    return allUserQuests.filter((q) => q.progress.status === 'OFFERED').length;
  }, [allUserQuests]);

  const activeCount = useMemo(() => {
    return allUserQuests.filter((q) => q.progress.status === 'ACTIVE').length;
  }, [allUserQuests]);

  // Filtered list
  const filteredQuests = useMemo(() => {
    return allUserQuests.filter(({ progress, def }) => {
      // Status filter
      if (statusFilter !== 'ALL' && progress.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'ALL' && def.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [allUserQuests, statusFilter, categoryFilter]);

  // Selected quest
  const currentSelected = useMemo(() => {
    if (selectedQuestId) {
      const found = allUserQuests.find((q) => q.def.id === selectedQuestId);
      if (found) return found;
    }
    return filteredQuests[0] || null;
  }, [allUserQuests, filteredQuests, selectedQuestId]);

  const getStatusBadge = (status: QuestStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> 진행 중
          </span>
        );
      case 'OFFERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Sparkles className="w-3 h-3" /> 제안됨
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> 완료
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> 실패
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryLabel = (cat: QuestType | string) => {
    switch (cat) {
      case 'MAIN': return '메인';
      case 'SUB': return '서브';
      case 'CHARACTER': return '주요 인물';
      case 'COMPANION': return '동료';
      case 'PROFESSION': return '생활직업';
      case 'CLASS': return '전직';
      case 'GUIDE': return '가이드';
      case 'FACTION': return '세력';
      case 'HIDDEN': return '비밀';
      case 'REPEATABLE': return '반복';
      default: return '기타';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-stone-900 border border-stone-700 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-stone-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">퀘스트 일지</h2>
              <p className="text-xs text-stone-400">현재 여정에서 마주한 임무와 의뢰들을 확인합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-stone-800/80 bg-stone-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-lg border border-stone-800">
            {(['ALL', 'ACTIVE', 'OFFERED', 'COMPLETED', 'FAILED'] as StatusFilter[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  statusFilter === st
                    ? 'bg-stone-800 text-amber-400 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>
                  {st === 'ALL' && '전체'}
                  {st === 'ACTIVE' && '진행 중'}
                  {st === 'OFFERED' && '제안됨'}
                  {st === 'COMPLETED' && '완료'}
                  {st === 'FAILED' && '실패'}
                </span>
                {st === 'OFFERED' && offeredCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500 text-white font-bold animate-pulse leading-none">
                    {offeredCount}
                  </span>
                )}
                {st === 'ACTIVE' && activeCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-700 text-amber-300 font-medium leading-none">
                    {activeCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'MAIN', 'SUB', 'CHARACTER', 'COMPANION', 'PROFESSION'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded border transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                    : 'border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                }`}
              >
                {cat === 'ALL' ? '모든 유형' : getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-800 min-h-0">
          {/* Left Column: Quest List */}
          <div className="md:col-span-5 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-4 gap-2 bg-stone-950/30">
            {filteredQuests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4 py-8">
                <Scroll className="w-10 h-10 text-stone-600 mb-2" />
                <p className="text-sm font-medium text-stone-400">
                  {statusFilter === 'ACTIVE'
                    ? '현재 진행 중인 퀘스트가 없습니다.'
                    : '해당하는 퀘스트가 없습니다.'}
                </p>
                <p className="text-xs text-stone-500 mt-1">새로운 인물과 대화하거나 지역을 탐험해 보세요.</p>
              </div>
            ) : (
              filteredQuests.map(({ progress, def }) => {
                const isSelected = currentSelected?.def.id === def.id;
                return (
                  <button
                    key={def.id}
                    onClick={() => setSelectedQuestId(def.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-stone-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-stone-400">
                        [{getCategoryLabel(def.category)}]
                      </span>
                      {getStatusBadge(progress.status)}
                    </div>
                    <div className="text-sm font-bold text-stone-100 line-clamp-1">
                      {def.title}
                    </div>
                    {def.giverName && (
                      <div className="text-xs text-stone-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-stone-500" />
                        <span>{def.giverName}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Quest Details */}
          <div className="md:col-span-7 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 bg-stone-900/50">
            {currentSelected ? (
              <div className="flex flex-col gap-5">
                {/* Title & Metadata */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium border border-stone-700">
                      {getCategoryLabel(currentSelected.def.category)} 퀘스트
                    </span>
                    {getStatusBadge(currentSelected.progress.status)}
                  </div>
                  <h3 className="text-xl font-bold text-stone-100">
                    {currentSelected.def.title}
                  </h3>
                  {currentSelected.def.giverName && (
                    <div className="text-xs text-stone-400 flex items-center gap-1.5 mt-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>의뢰인: <strong className="text-stone-300 font-semibold">{currentSelected.def.giverName}</strong></span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800 text-sm text-stone-300 leading-relaxed">
                  {currentSelected.def.description}
                </div>

                {/* OFFERED Quest Action Banner */}
                {currentSelected.progress.status === 'OFFERED' && (
                  <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                    <div className="text-xs text-blue-100 flex-1">
                      <p className="font-bold text-sm text-blue-200 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        새로운 의뢰가 제안되었습니다
                      </p>
                      <p className="text-blue-300/80 leading-relaxed">
                        의뢰를 수락하면 즉시 진행 중(ACTIVE) 상태로 전환되어 퀘스트 목표를 달성할 수 있습니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        id={`accept-quest-${currentSelected.def.id}`}
                        onClick={() => onAcceptQuest?.(currentSelected.def.id)}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        수락
                      </button>
                      <button
                        id={`decline-quest-${currentSelected.def.id}`}
                        onClick={() => onDeclineQuest?.(currentSelected.def.id)}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        거절
                      </button>
                    </div>
                  </div>
                )}

                {/* Stages and Objectives */}
                {currentSelected.def.stages && currentSelected.def.stages.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      목표 및 진행 상황
                    </h4>

                    {(() => {
                      const curStageId = currentSelected.progress.currentStageId ?? 1;
                      // Only display up to current stage index (hide unrevealed future stages)
                      const visibleStages = currentSelected.def.stages.filter(
                        (s) => s.stageId <= curStageId
                      );

                      return (
                        <div className="space-y-2.5">
                          {visibleStages.map((stg) => {
                            const isCurrentStage = stg.stageId === curStageId && currentSelected.progress.status === 'ACTIVE';
                            const isPastStage = stg.stageId < curStageId || currentSelected.progress.status === 'COMPLETED';

                            return (
                              <div
                                key={stg.stageId}
                                className={`p-3 rounded-xl border text-xs ${
                                  isCurrentStage
                                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                                    : 'bg-stone-950/40 border-stone-800 text-stone-400'
                                }`}
                              >
                                <div className="font-semibold text-stone-200 mb-1">
                                  {stg.stageId}단계: {stg.title || stg.description}
                                </div>
                                {stg.description && stg.title && (
                                  <p className="text-stone-400 mb-2">{stg.description}</p>
                                )}

                                {/* Objectives */}
                                {stg.objectives && stg.objectives.length > 0 && (
                                  <div className="space-y-1.5 mt-2">
                                    {stg.objectives.map((obj) => {
                                      const objProgress = currentSelected.progress.objectives?.[obj.id];
                                      const currentCount = objProgress?.currentCount ?? (isPastStage ? obj.requiredCount : 0);
                                      const isDone = isPastStage || objProgress?.isCompleted || currentCount >= obj.requiredCount;

                                      return (
                                        <div
                                          key={obj.id}
                                          className="flex items-center justify-between pl-2 border-l-2 border-stone-700 py-0.5"
                                        >
                                          <div className="flex items-center gap-1.5 text-stone-300">
                                            {isDone ? (
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : (
                                              <div className="w-3.5 h-3.5 rounded-full border border-stone-500 flex items-center justify-center" />
                                            )}
                                            <span className={isDone ? 'line-through text-stone-500' : ''}>
                                              {obj.description}
                                            </span>
                                          </div>
                                          <span className="text-stone-400 font-mono text-[11px]">
                                            {Math.min(currentCount, obj.requiredCount)} / {obj.requiredCount}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Rewards */}
                {currentSelected.def.rewards && (
                  <div className="mt-auto pt-4 border-t border-stone-800">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      의뢰 보상
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {currentSelected.def.rewards.exp && currentSelected.def.rewards.exp > 0 && (
                        <div className="px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-medium">
                          경험치 +{currentSelected.def.rewards.exp} EXP
                        </div>
                      )}
                      {currentSelected.def.rewards.rupees && currentSelected.def.rewards.rupees > 0 && (
                        <div className="px-2.5 py-1 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 font-medium">
                          루피 +{currentSelected.def.rewards.rupees}
                        </div>
                      )}
                      {currentSelected.def.rewards.items && currentSelected.def.rewards.items.length > 0 && (
                        currentSelected.def.rewards.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-medium"
                          >
                            아이템: {it.name || it.itemId} x{it.quantity || 1}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 py-12">
                <Scroll className="w-12 h-12 text-stone-700 mb-3" />
                <p className="text-sm">목록에서 퀘스트를 선택하면 상세 정보를 확인하실 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-stone-800 bg-stone-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
