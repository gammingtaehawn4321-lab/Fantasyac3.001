import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X, Check, Lock, Shield, Sword, Eye, Crosshair, Plus, Wand2 } from 'lucide-react';
import { PlayerState, getKoreanLabel } from '../types';
import { getTalentsByCategory, TalentNode, TalentTreeCategory } from '../data/talents';
import { allocateTalentPoint } from '../gameEngine';

interface TalentTreeModalProps {
  playerState: PlayerState;
  onUpdatePlayer: (updated: PlayerState) => void;
  onClose: () => void;
}

const TALENT_CATEGORIES: { id: TalentTreeCategory; label: string }[] = [
  { id: 'COMMON', label: '공용 재능' },
  { id: 'WARRIOR', label: '전사' },
  { id: 'ARCHER', label: '궁수' },
  { id: 'ROGUE', label: '도적' },
  { id: 'CLERIC', label: '성직자' },
  { id: 'MAGE', label: '마법사' },
  { id: 'DANCER', label: '무희' },
];

export const TalentTreeModal: React.FC<TalentTreeModalProps> = ({
  playerState,
  onUpdatePlayer,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<TalentTreeCategory>('COMMON');

  const nodes = getTalentsByCategory(activeCategory);
  const talentPoints = playerState.talentPoints || 0;
  const learnedTalents = playerState.learnedTalents || {};

  const handleLearnTalent = (node: TalentNode) => {
    const currentRank = learnedTalents[node.id] || 0;
    if (currentRank >= node.maxRank || talentPoints < node.cost) return;

    if (node.requiredLevel && playerState.level < node.requiredLevel) return;
    if (node.prerequisites && node.prerequisites.length > 0) {
      const hasAllPrereqs = node.prerequisites.every((reqId) => (learnedTalents[reqId] || 0) > 0);
      if (!hasAllPrereqs) return;
    }

    const res = allocateTalentPoint(playerState, node.id);
    if (res && res.success && res.nextState) {
      onUpdatePlayer(res.nextState);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'WARRIOR': return <Sword className="w-4 h-4 text-rose-400" />;
      case 'ARCHER': return <Crosshair className="w-4 h-4 text-emerald-400" />;
      case 'ROGUE': return <Eye className="w-4 h-4 text-purple-400" />;
      case 'CLERIC': return <Shield className="w-4 h-4 text-amber-400" />;
      case 'MAGE': return <Wand2 className="w-4 h-4 text-indigo-400" />;
      case 'DANCER': return <Sparkles className="w-4 h-4 text-pink-400" />;
      default: return <Shield className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-stone-900 border border-stone-700 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden text-stone-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100">재능 및 특성 트리</h2>
              <p className="text-xs text-stone-400">
                보유 재능 포인트:{' '}
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {talentPoints} Pt
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-3 overflow-x-auto gap-1 py-1.5">
          {TALENT_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-stone-800 text-amber-300 border border-amber-800/50 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Talent Grid */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-900/90">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nodes.map((node) => {
              const currentRank = learnedTalents[node.id] || 0;
              const isMaxRank = currentRank >= node.maxRank;
              const isLevelLocked = Boolean(node.requiredLevel && playerState.level < node.requiredLevel);
              const isPrereqLocked = Boolean(
                node.prerequisites &&
                  node.prerequisites.length > 0 &&
                  !node.prerequisites.every((reqId) => (learnedTalents[reqId] || 0) > 0)
              );
              const isLocked = isLevelLocked || isPrereqLocked;
              const canLearn = !isLocked && !isMaxRank && talentPoints >= node.cost;

              return (
                <div
                  key={node.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    isMaxRank
                      ? 'bg-amber-950/20 border-amber-800/60 shadow-sm'
                      : currentRank > 0
                      ? 'bg-stone-800/80 border-amber-700/60'
                      : isLocked
                      ? 'bg-stone-950/40 border-stone-800/60 opacity-60'
                      : 'bg-stone-800/50 border-stone-700/80 hover:border-stone-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-100">{node.name}</span>
                        {isLocked && <Lock className="w-3.5 h-3.5 text-stone-500" />}
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-stone-950 text-stone-300 border border-stone-800">
                        {currentRank} / {node.maxRank}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed mt-1">
                      {node.description}
                    </p>

                    {/* Stat Modifiers Display */}
                    {node.statModifiers && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(node.statModifiers).map(([statKey, val]) => (
                          <span
                            key={statKey}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-amber-300/90 font-mono font-medium"
                          >
                            {getKoreanLabel(statKey)} +{(Number(val) || 0) * Math.max(1, currentRank)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Lock conditions */}
                    {isLocked && (
                      <div className="text-[11px] text-rose-400/90 mt-2 space-y-0.5">
                        {isLevelLocked && <div>• 요구 레벨: Lv.{node.requiredLevel} 이상</div>}
                        {isPrereqLocked && <div>• 선행 특성 습득 필요</div>}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-3 pt-2 border-t border-stone-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      소모 포인트: <span className="font-mono text-amber-400 font-bold">{node.cost} Pt</span>
                    </span>

                    <button
                      onClick={() => handleLearnTalent(node)}
                      disabled={!canLearn}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        isMaxRank
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-800/60 cursor-default'
                          : canLearn
                          ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {isMaxRank ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> 마스터
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> {currentRank > 0 ? '강화하기' : '습득하기'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
