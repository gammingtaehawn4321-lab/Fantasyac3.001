import React, { useState } from 'react';
import { PlayerState } from '../types';
import { TECHNOLOGY_DATABASE } from '../data/technology/technologyDatabase';
import { TechId, LifeTechKind, TechnologyCategory } from '../data/technology/technologyTypes';
import {
  getRequiredExpForTechLevel,
  getTechRankInfo,
  getTechTierInfo,
  calculateAvailableSkillPoints,
  calculateTotalSkillPoints,
  calculateUsedSkillPoints,
} from '../data/technology/technologyUtils';
import { MAX_TECH_LEVEL } from '../data/technology/technologyConfig';

interface LifeSkillsModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onUpdateState?: (updater: (prev: PlayerState) => PlayerState) => void;
  onAddLogMessage?: (msg: string) => void;
  initialCategory?: TechnologyCategory;
  initialKind?: LifeTechKind;
}

export const LifeSkillsModal: React.FC<LifeSkillsModalProps> = ({
  playerState,
  onClose,
  onUpdateState,
  onAddLogMessage,
  initialCategory = 'LIFE',
  initialKind = 'SPECIALIZED',
}) => {
  const [topCategory, setTopCategory] = useState<TechnologyCategory>(initialCategory);
  const [activeKind, setActiveKind] = useState<LifeTechKind>(initialKind);
  const [selectedTechId, setSelectedTechId] = useState<TechId>('SMITHING');
  const [subView, setSubView] = useState<'TREE' | 'PERKS' | 'DISCOVERY'>('TREE');

  const techState = playerState.technologyState || playerState.technologies || {};

  const specializedTechs = Object.values(TECHNOLOGY_DATABASE).filter(
    (t) => t.kind === 'SPECIALIZED'
  );
  const gatheringTechs = Object.values(TECHNOLOGY_DATABASE).filter(
    (t) => t.kind === 'GATHERING'
  );

  const activeTechList = activeKind === 'SPECIALIZED' ? specializedTechs : gatheringTechs;
  const currentTechDef = TECHNOLOGY_DATABASE[selectedTechId] || activeTechList[0];
  const currentProgress = techState[selectedTechId] || {
    techId: selectedTechId,
    level: 1,
    exp: 0,
    totalMastery: 10,
    skillPoints: 0,
    unlockedPerkIds: [],
    treeNodeRanks: {},
    unlockedRecipes: [],
    stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 },
  };

  const level = Math.min(MAX_TECH_LEVEL, Math.max(1, currentProgress.level || 1));
  const reqExp = getRequiredExpForTechLevel(level);
  const rankInfo = getTechRankInfo(level);
  const tierInfo = getTechTierInfo(level);
  const expPercent = level >= MAX_TECH_LEVEL ? 100 : Math.min(100, Math.floor(((currentProgress.exp || 0) / reqExp) * 100));

  const totalEarnedPoints = calculateTotalSkillPoints(level);
  const usedPoints = calculateUsedSkillPoints(currentProgress.treeNodeRanks || {});
  const availablePoints = Math.max(0, totalEarnedPoints - usedPoints);

  // 다음 주요 해금 찾기
  const getNextMajorUnlockText = () => {
    if (level >= MAX_TECH_LEVEL) return '최고 숙련 등급 『대가』 달성 완료';
    const milestoneLevels = [4, 5, 8, 10, 12, 16, 20, 35, 40, 50, 60, 70, 80, 90, 100];
    const nextLvl = milestoneLevels.find((l) => l > level);
    if (!nextLvl) return 'Lv.100 대가 등급 도달 지점';
    if ([20, 40, 60, 80, 100].includes(nextLvl)) {
      const nextRank = getTechRankInfo(nextLvl).rankName;
      return `Lv.${nextLvl}: 『${nextRank}』 등급 승급 & 승급 포인트 + 자동 특전 해금`;
    }
    return `Lv.${nextLvl}: 신규 스킬트리 노드 & 기술 포인트 획득`;
  };

  const handleSelectKind = (kind: LifeTechKind) => {
    setActiveKind(kind);
    if (kind === 'SPECIALIZED') {
      setSelectedTechId('SMITHING');
    } else {
      setSelectedTechId('LOGGING');
    }
  };

  // 노드 포인트 투자 (+)
  const handleAllocateNodePoint = (nodeId: string, maxRank: number, requiredLevel: number, requiredNodeId?: string) => {
    if (!onUpdateState) return;
    if (availablePoints <= 0) {
      onAddLogMessage?.('⚠️ 사용 가능한 기술 포인트가 부족합니다.');
      return;
    }
    if (level < requiredLevel) {
      onAddLogMessage?.(`⚠️ 요구 레벨(Lv.${requiredLevel})을 만족하지 못했습니다.`);
      return;
    }
    if (requiredNodeId) {
      const parentRank = currentProgress.treeNodeRanks?.[requiredNodeId] || 0;
      if (parentRank < 1) {
        onAddLogMessage?.('⚠️ 선행 노드에 1포인트 이상 먼저 투자해야 합니다.');
        return;
      }
    }

    const currentRank = currentProgress.treeNodeRanks?.[nodeId] || 0;
    if (currentRank >= maxRank) return;

    onUpdateState((prev) => {
      const prevTechs = prev.technologyState || prev.technologies || {};
      const current = prevTechs[selectedTechId] || { ...currentProgress };
      const rank = current.treeNodeRanks?.[nodeId] || 0;

      const updatedTreeNodeRanks = {
        ...(current.treeNodeRanks || {}),
        [nodeId]: rank + 1,
      };

      const updatedUsedPoints = calculateUsedSkillPoints(updatedTreeNodeRanks);
      const updatedAvailablePoints = Math.max(0, calculateTotalSkillPoints(current.level || 1) - updatedUsedPoints);

      const nextTechState = {
        ...prevTechs,
        [selectedTechId]: {
          ...current,
          skillPoints: updatedAvailablePoints,
          treeNodeRanks: updatedTreeNodeRanks,
        },
      };

      return {
        ...prev,
        technologyState: nextTechState,
      };
    });

    onAddLogMessage?.(`✨ [${currentTechDef.name}] 스킬트리 노드 포인트 투자 완료!`);
  };

  // 노드 포인트 반환 (-)
  const handleDeallocateNodePoint = (nodeId: string) => {
    if (!onUpdateState) return;
    const currentRank = currentProgress.treeNodeRanks?.[nodeId] || 0;
    if (currentRank <= 0) return;

    onUpdateState((prev) => {
      const prevTechs = prev.technologyState || prev.technologies || {};
      const current = prevTechs[selectedTechId] || { ...currentProgress };
      const rank = current.treeNodeRanks?.[nodeId] || 0;
      if (rank <= 0) return prev;

      const updatedTreeNodeRanks = {
        ...(current.treeNodeRanks || {}),
        [nodeId]: rank - 1,
      };

      const updatedUsedPoints = calculateUsedSkillPoints(updatedTreeNodeRanks);
      const updatedAvailablePoints = Math.max(0, calculateTotalSkillPoints(current.level || 1) - updatedUsedPoints);

      return {
        ...prev,
        technologyState: {
          ...prevTechs,
          [selectedTechId]: {
            ...current,
            skillPoints: updatedAvailablePoints,
            treeNodeRanks: updatedTreeNodeRanks,
          },
        },
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-5 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* Top Floating Category Menu */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-stone-900/90 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 tracking-wide flex items-center gap-2">
                <span>기술 (Skills) 및 숙련 엔진</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 font-semibold">
                  v3.0
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">10대 생활기술 · 공통 숙련 레벨(Lv.1~100) · 3종 전문화 스킬트리</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-700/60 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 1. Main Category Tabs (생활기술 / 전투기술 / 잡기술) */}
        <div className="flex bg-stone-900/40 border-b border-stone-800/80 px-3 pt-2 gap-1.5 overflow-x-auto select-none">
          <button
            onClick={() => setTopCategory('LIFE')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              topCategory === 'LIFE'
                ? 'bg-stone-950 border-stone-700 text-amber-300 border-b-transparent shadow-sm'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
            }`}
          >
            <span>🌿</span>
            <span>생활기술 (Life Skills)</span>
          </button>

          <button
            onClick={() => setTopCategory('COMBAT')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              topCategory === 'COMBAT'
                ? 'bg-stone-950 border-stone-700 text-amber-300 border-b-transparent shadow-sm'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
            }`}
          >
            <span>⚔️</span>
            <span>전투기술 (Combat)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400">준비중</span>
          </button>

          <button
            onClick={() => setTopCategory('MISC')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              topCategory === 'MISC'
                ? 'bg-stone-950 border-stone-700 text-amber-300 border-b-transparent shadow-sm'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
            }`}
          >
            <span>💡</span>
            <span>잡기술 (Misc)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400">준비중</span>
          </button>
        </div>

        {/* If non-LIFE category selected, display registry notification */}
        {topCategory !== 'LIFE' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-stone-950">
            <span className="text-5xl">🛡️</span>
            <h3 className="text-xl font-bold text-amber-200">
              {topCategory === 'COMBAT' ? '전투기술 (Combat Skills) 공통 숙련 엔진 등록 완료' : '잡기술 (Misc Skills) 공통 숙련 엔진 등록 완료'}
            </h3>
            <p className="text-sm text-stone-400 max-w-md leading-relaxed">
              본 카테고리는 v3.0 공통 숙련 엔진 구조에 정상 등록되었습니다.
              현재는 **『생활기술 10종』**이 완벽 완성되어 이용 가능하며, 전투 및 잡기술 세부 스킬트리는 향후 업데이트에서 순차적으로 공개됩니다.
            </p>
            <button
              onClick={() => setTopCategory('LIFE')}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              생활기술 완성 모듈 바로가기
            </button>
          </div>
        ) : (
          /* LIFE SKILLS FULL MODULE */
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-950">
            
            {/* 2. Life Skills Sub Tabs [전문기술] [채집기술] */}
            <div className="flex bg-stone-900/30 border-b border-stone-800/80 px-4 py-2 gap-2 select-none">
              <button
                onClick={() => handleSelectKind('SPECIALIZED')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-2 cursor-pointer ${
                  activeKind === 'SPECIALIZED'
                    ? 'bg-amber-950/50 border-amber-600/60 text-amber-200 shadow-sm'
                    : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>🔨</span>
                <span>전문기술 (5종)</span>
              </button>

              <button
                onClick={() => handleSelectKind('GATHERING')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-2 cursor-pointer ${
                  activeKind === 'GATHERING'
                    ? 'bg-amber-950/50 border-amber-600/60 text-amber-200 shadow-sm'
                    : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>🌿</span>
                <span>채집기술 (5종)</span>
              </button>
            </div>

            {/* Main Split View: Left Skill List, Right Skill Details */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Skill Selector List */}
              <div className="w-full md:w-72 bg-stone-950 border-r border-stone-800/80 p-2.5 overflow-y-auto space-y-2">
                <div className="text-[11px] font-bold text-stone-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between border-b border-stone-800/60 mb-1">
                  <span>{activeKind === 'SPECIALIZED' ? '전문기술 (5종)' : '채집기술 (5종)'}</span>
                  <span className="text-[10px] text-stone-400">최대 Lv.100</span>
                </div>

                {activeTechList.map((tech) => {
                  const p = techState[tech.id] || { level: 1, exp: 0 };
                  const isSelected = selectedTechId === tech.id;
                  const tLvl = Math.min(MAX_TECH_LEVEL, Math.max(1, p.level || 1));
                  const tRank = getTechRankInfo(tLvl);
                  const tReqExp = getRequiredExpForTechLevel(tLvl);
                  const tPercent = tLvl >= MAX_TECH_LEVEL ? 100 : Math.min(100, Math.floor(((p.exp || 0) / tReqExp) * 100));
                  const tAvailablePts = calculateAvailableSkillPoints(tLvl, p.treeNodeRanks || {});

                  return (
                    <button
                      key={tech.id}
                      onClick={() => setSelectedTechId(tech.id)}
                      className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-stone-900 border-amber-500/70 text-stone-100 shadow-lg shadow-black/40'
                          : 'bg-stone-900/30 border-stone-800/80 text-stone-400 hover:bg-stone-900/60 hover:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl p-1 bg-stone-950/80 rounded-lg border border-stone-800">{tech.iconSymbol}</span>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-stone-200 flex items-center gap-1.5">
                              <span>{tech.name}</span>
                              {tAvailablePts > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold">
                                  +{tAvailablePts}pt
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 font-medium">Lv.{tLvl}</div>
                          </div>
                        </div>

                        {/* Rank Badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${tRank.badgeColor}`}>
                          {tRank.rankName}
                        </span>
                      </div>

                      {/* Mini EXP Bar */}
                      <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${tPercent}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Skill Detail Panel */}
              <div className="flex-1 flex flex-col bg-stone-950 p-3 sm:p-5 overflow-y-auto space-y-4">
                
                {/* 1. Header Card (Skill Info, Level, Rank, EXP Bar, Points, Next Major Unlock) */}
                <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Skill Summary */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <span className="text-3xl p-2.5 bg-stone-950 rounded-xl border border-stone-800">{currentTechDef.iconSymbol}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-amber-200">{currentTechDef.name}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-md border font-bold ${rankInfo.badgeColor}`}>
                          숙련 등급 『{rankInfo.rankName}』
                        </span>
                        <span className="text-[11px] text-stone-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                          {tierInfo.tierName}
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">{currentTechDef.description}</p>
                      
                      {/* Next Major Unlock */}
                      <div className="mt-2 text-[11px] text-amber-400/90 font-medium flex items-center gap-1.5 bg-stone-950/60 px-2.5 py-1 rounded-lg border border-stone-800/80">
                        <span>✨</span>
                        <span>{getNextMajorUnlockText()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Level & Points Gauge */}
                  <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 min-w-[220px] flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-bold">숙련 레벨</span>
                      <span className="text-amber-300 font-bold text-base">Lv. {level} / 100</span>
                    </div>

                    {/* EXP Bar */}
                    <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-800">
                      <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{ width: `${expPercent}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>EXP {currentProgress.exp || 0} / {level >= MAX_TECH_LEVEL ? 'MAX' : reqExp}</span>
                      <span>({expPercent}%)</span>
                    </div>

                    <div className="border-t border-stone-800 pt-2 flex items-center justify-between text-xs">
                      <span className="text-stone-400">보유 기술 포인트:</span>
                      <span className="text-amber-300 font-bold">
                        {availablePoints} Pt <span className="text-[10px] text-stone-500">(총 {totalEarnedPoints}Pt)</span>
                      </span>
                    </div>
                  </div>

                </div>

                {/* Sub View Toggle Buttons */}
                <div className="flex border-b border-stone-800 gap-4 select-none">
                  <button
                    onClick={() => setSubView('TREE')}
                    className={`pb-2 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                      subView === 'TREE'
                        ? 'border-amber-400 text-amber-200'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span>🌿</span>
                    <span>3개 계통 스킬트리</span>
                    {availablePoints > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-stone-950 text-[10px] font-bold rounded-full">
                        +{availablePoints}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setSubView('PERKS')}
                    className={`pb-2 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                      subView === 'PERKS'
                        ? 'border-amber-400 text-amber-200'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span>🌟</span>
                    <span>자동 특전 (6단계)</span>
                  </button>

                  <button
                    onClick={() => setSubView('DISCOVERY')}
                    className={`pb-2 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                      subView === 'DISCOVERY'
                        ? 'border-amber-400 text-amber-200'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span>📊</span>
                    <span>도감 & 기록 통계</span>
                  </button>
                </div>

                {/* Sub View 1: 3 Specialization Branches Skill Tree */}
                {subView === 'TREE' && (
                  <div className="space-y-4">
                    <div className="text-xs text-stone-400 bg-stone-900/60 p-3 rounded-xl border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>💡 3개의 계통 전문화 노드에 기술 포인트를 배치하세요. (모두 찍기에 포인트가 제한되므로 원하는 전문화를 선택하세요)</span>
                      <span className="text-amber-300 font-bold whitespace-nowrap">사용 가능: {availablePoints} Pt</span>
                    </div>

                    {/* 3 Specialization Columns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 overflow-x-auto pb-2">
                      {currentTechDef.branches.map((branch) => {
                        const branchNodes = currentTechDef.treeNodes.filter((n) => n.branchId === branch.id);
                        return (
                          <div
                            key={branch.id}
                            className="bg-stone-900/50 border border-stone-800 rounded-xl p-3 flex flex-col gap-3"
                          >
                            {/* Branch Header */}
                            <div className="border-b border-stone-800 pb-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
                                <span className="text-lg">{branch.iconSymbol}</span>
                                <span>{branch.name}</span>
                              </div>
                              <p className="text-[11px] text-stone-400 mt-0.5">{branch.description}</p>
                            </div>

                            {/* Node Vertical Hierarchy Stream */}
                            <div className="space-y-2.5">
                              {branchNodes.map((node) => {
                                const currentRank = currentProgress.treeNodeRanks?.[node.id] || 0;
                                const isUnlockedLevel = level >= node.requiredLevel;
                                const hasParentReq = !node.requiredNodeId || (currentProgress.treeNodeRanks?.[node.requiredNodeId] || 0) >= 1;
                                const canUpgrade = availablePoints > 0 && currentRank < node.maxRank && isUnlockedLevel && hasParentReq;

                                return (
                                  <div
                                    key={node.id}
                                    className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                                      currentRank > 0
                                        ? 'bg-stone-900 border-amber-600/60 text-stone-100 shadow-md'
                                        : isUnlockedLevel && hasParentReq
                                        ? 'bg-stone-950 border-stone-700/80 text-stone-300'
                                        : 'bg-stone-950/40 border-stone-900 text-stone-600 opacity-60'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-amber-200">{node.name}</span>
                                          {node.tier === 6 && (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                                              최종 캡스톤
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-stone-800 text-amber-300">
                                          {currentRank} / {node.maxRank} Rk
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-stone-400 mb-1.5">{node.description}</p>
                                      
                                      <div className="text-[11px] text-amber-300 bg-stone-950 p-1.5 rounded-md border border-stone-800">
                                        효과: {node.statOrBonusEffect}
                                      </div>

                                      {!isUnlockedLevel && (
                                        <div className="text-[10px] text-rose-400 mt-1">
                                          🔒 요구 레벨: Lv.{node.requiredLevel}
                                        </div>
                                      )}
                                      {node.requiredNodeId && !hasParentReq && (
                                        <div className="text-[10px] text-amber-400 mt-1">
                                          🔒 선행 노드 포인트 필요
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Buttons (+ / -) */}
                                    <div className="flex items-center gap-1.5 mt-2.5">
                                      <button
                                        onClick={() => handleAllocateNodePoint(node.id, node.maxRank, node.requiredLevel, node.requiredNodeId)}
                                        disabled={!canUpgrade}
                                        className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                                          canUpgrade
                                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md'
                                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                                        }`}
                                      >
                                        {currentRank >= node.maxRank ? '최대 달성' : '포인트 투자 (+1)'}
                                      </button>

                                      {currentRank > 0 && (
                                        <button
                                          onClick={() => handleDeallocateNodePoint(node.id)}
                                          className="px-2 py-1 text-[11px] font-bold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
                                          title="포인트 회수"
                                        >
                                          -
                                        </button>
                                      )}
                                    </div>

                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub View 2: Level Milestone Automatic Perks */}
                {subView === 'PERKS' && (
                  <div className="space-y-3">
                    <div className="text-xs text-stone-400 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                      🌟 레벨 달성 시 기술 포인트를 소비하지 않고 **자동 해금**되는 6단계 주요 특전(Perk) 목록입니다.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentTechDef.perks.map((perk) => {
                        const isUnlocked = level >= perk.requiredLevel;
                        return (
                          <div
                            key={perk.id}
                            className={`p-3.5 rounded-xl border transition flex items-start gap-3 ${
                              isUnlocked
                                ? 'bg-stone-900 border-amber-600/50 text-stone-200 shadow-md'
                                : 'bg-stone-950/50 border-stone-800 text-stone-500'
                            }`}
                          >
                            <span className="text-2xl mt-0.5">{isUnlocked ? '🌟' : '🔒'}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className={`font-bold text-sm ${isUnlocked ? 'text-amber-200' : 'text-stone-400'}`}>
                                  {perk.name}
                                </h5>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                  isUnlocked
                                    ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                                    : 'bg-stone-900 text-stone-500 border-stone-800'
                                }`}>
                                  Lv.{perk.requiredLevel} 달성
                                </span>
                              </div>
                              <p className="text-xs text-stone-300 mt-1 leading-relaxed">{perk.description}</p>
                              <div className="text-xs text-amber-400/90 mt-1.5 font-medium">
                                요약: {perk.effectSummary}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub View 3: Discovery & Statistics */}
                {subView === 'DISCOVERY' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Activity Statistics */}
                      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-4">
                        <h4 className="font-bold text-sm text-amber-200 mb-3 flex items-center gap-2">
                          <span>📊</span>
                          <span>기술 숙련 통계</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between border-b border-stone-800/80 pb-2">
                            <span className="text-stone-400">총 시도/행동 횟수</span>
                            <span className="text-stone-200 font-bold">{currentProgress.stats?.totalActionCount || 0}회</span>
                          </div>
                          <div className="flex justify-between border-b border-stone-800/80 pb-2">
                            <span className="text-stone-400">성공한 작업</span>
                            <span className="text-stone-200 font-bold">{currentProgress.stats?.successfulCrafts || 0}건</span>
                          </div>
                          <div className="flex justify-between border-b border-stone-800/80 pb-2">
                            <span className="text-stone-400">명품(Masterwork) / 대성공</span>
                            <span className="text-amber-300 font-bold">{currentProgress.stats?.masterworkCount || 0}회</span>
                          </div>
                          <div className="flex justify-between border-b border-stone-800/80 pb-2">
                            <span className="text-stone-400">생산/수집한 아이템 총수</span>
                            <span className="text-emerald-300 font-bold">{currentProgress.stats?.itemsProduced || 0}개</span>
                          </div>
                        </div>
                      </div>

                      {/* Discovered / Unlocked Elements */}
                      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-4">
                        <h4 className="font-bold text-sm text-amber-200 mb-3 flex items-center gap-2">
                          <span>🔓</span>
                          <span>주요 해금 및 도감 자원</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                          {currentTechDef.unlockablesSummary.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-stone-300 bg-stone-950 p-2 rounded-lg border border-stone-800">
                              <span className="text-amber-400">✔</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-stone-900/90 px-4 py-3 border-t border-stone-800 flex justify-between items-center text-xs text-stone-400">
          <span>판타지악 v3.0 『기술과 숙련』 시스템</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
