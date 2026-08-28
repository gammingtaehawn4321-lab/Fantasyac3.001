import React, { useState } from 'react';
import { PlayerState } from '../types';
import { POTION_DATABASE } from '../data/potions/potionDatabase';
import { PotionDefinition } from '../data/potions/potionTypes';
import { calculateCraftingQualityScore, getQualityFromScore, MaterialQuality } from '../data/technology/craftingQuality';
import { addTechnologyExp } from '../data/technology/technologyUtils';
import { passTime, addItem, removeItem } from '../gameEngine';
import { FlaskConical, Sparkles, Check, AlertCircle } from 'lucide-react';

interface AlchemyCraftingModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onUpdateState: (updater: (prev: PlayerState) => PlayerState) => void;
  onAddLogMessage?: (msg: string) => void;
}

export const AlchemyCraftingModal: React.FC<AlchemyCraftingModalProps> = ({
  playerState,
  onClose,
  onUpdateState,
  onAddLogMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'ELIXIR' | 'POTION' | 'REFINING'>('ELIXIR');
  const [selectedPotionId, setSelectedPotionId] = useState<string>('elixir_life');

  const techState = playerState.technologyState || {};
  const alchemyProgress = techState['ALCHEMY'] || { level: 1, exp: 0 };
  const alchemyLevel = alchemyProgress.level || 1;

  const campFacilities = playerState.campProgress?.facilities || [];
  const alcFacility = campFacilities.find((f) => f.facilityId === 'alchemy_bench');
  const facilityTier = alcFacility && alcFacility.isBuilt ? (alcFacility.level || 1) : 1;

  const allPotions = Object.values(POTION_DATABASE);
  const elixirList = allPotions.filter((p) => p.category === 'ELIXIR');
  const potionList = allPotions.filter((p) => p.category === 'POTION');

  const refiningRecipes = [
    {
      id: 'refine_dew',
      name: '맑은 이슬 정제',
      categoryLabel: '재료 정제',
      description: '약초 3개를 증류하여 연금술용 맑은 이슬 2병을 정제합니다.',
      ingredients: [{ itemName: '치유잎', quantity: 3 }],
      outputItemName: '맑은 이슬',
      outputQuantity: 2,
      requiredAlchemyLevel: 1,
    },
    {
      id: 'refine_mana_shard',
      name: '마나 석분 분쇄',
      categoryLabel: '재료 정제',
      description: '수정 군집 1개와 치유잎 2개를 연마하여 빛나는 마나석 파편 1개를 추출합니다.',
      ingredients: [{ itemName: '수정 군집', quantity: 1 }, { itemName: '치유잎', quantity: 2 }],
      outputItemName: '빛나는 마나석 파편',
      outputQuantity: 1,
      requiredAlchemyLevel: 2,
    },
  ];

  const currentList =
    activeTab === 'ELIXIR'
      ? elixirList
      : activeTab === 'POTION'
      ? potionList
      : [];

  const currentSelectedPotion: PotionDefinition | undefined =
    activeTab !== 'REFINING'
      ? POTION_DATABASE[selectedPotionId] || currentList[0]
      : undefined;

  const currentSelectedRefining =
    activeTab === 'REFINING'
      ? refiningRecipes.find((r) => r.id === selectedPotionId) || refiningRecipes[0]
      : undefined;

  const handleTabChange = (tab: 'ELIXIR' | 'POTION' | 'REFINING') => {
    setActiveTab(tab);
    if (tab === 'ELIXIR') setSelectedPotionId('elixir_life');
    else if (tab === 'POTION') setSelectedPotionId('potion_health');
    else setSelectedPotionId('refine_dew');
  };

  // 재료 가능 수량 계산
  const getIngredientCount = (itemName: string) => {
    return (playerState.inventory || [])
      .filter((i) => i.name === itemName || i.id === itemName)
      .reduce((sum, i) => sum + (i.quantity || 1), 0);
  };

  const getMaxCraftable = () => {
    if (activeTab === 'REFINING' && currentSelectedRefining) {
      const counts = currentSelectedRefining.ingredients.map((ing) =>
        Math.floor(getIngredientCount(ing.itemName) / ing.quantity)
      );
      return Math.min(...counts);
    }
    if (currentSelectedPotion) {
      const counts = currentSelectedPotion.ingredients.map((ing) =>
        Math.floor(getIngredientCount(ing.itemName) / ing.quantity)
      );
      return Math.min(...counts);
    }
    return 0;
  };

  const handleCraft = (requestedCount: number | 'MAX') => {
    const maxPoss = getMaxCraftable();
    if (maxPoss <= 0) {
      if (onAddLogMessage) onAddLogMessage('❌ [연금 제작 실패] 필요한 시약 재료가 부족합니다.');
      return;
    }

    const count = requestedCount === 'MAX' ? maxPoss : Math.min(requestedCount, maxPoss);

    if (activeTab === 'REFINING' && currentSelectedRefining) {
      if (alchemyLevel < currentSelectedRefining.requiredAlchemyLevel) return;

      onUpdateState((prev) => {
        let nextState = { ...prev };
        currentSelectedRefining.ingredients.forEach((ing) => {
          nextState = removeItem(nextState, ing.itemName, ing.quantity * count);
        });

        nextState = addItem(nextState, {
          name: currentSelectedRefining.outputItemName,
          quantity: currentSelectedRefining.outputQuantity * count,
          description: `${currentSelectedRefining.outputItemName} 정제재`,
        });

        const expGain = 15 * count;
        nextState.technologyState = addTechnologyExp(nextState.technologyState || {}, 'ALCHEMY', expGain);
        nextState = passTime(nextState, 10 * count);

        if (onAddLogMessage) {
          onAddLogMessage(`🧪 [연금 정제] ${currentSelectedRefining.outputItemName} ×${currentSelectedRefining.outputQuantity * count} 정제 완료! [연금술 EXP +${expGain}] [게임 시간 +${10 * count}분]`);
        }

        return nextState;
      });
      return;
    }

    if (!currentSelectedPotion) return;
    if (alchemyLevel < currentSelectedPotion.requiredAlchemyLevel) return;
    if (facilityTier < currentSelectedPotion.requiredFacilityTier) return;

    onUpdateState((prev) => {
      let nextState = { ...prev };
      currentSelectedPotion.ingredients.forEach((ing) => {
        nextState = removeItem(nextState, ing.itemName, ing.quantity * count);
      });

      const qScore = calculateCraftingQualityScore({
        techLevel: alchemyLevel,
        recommendedLevel: currentSelectedPotion.requiredAlchemyLevel,
        facilityBonus: (facilityTier - currentSelectedPotion.requiredFacilityTier) * 10,
      });
      const qInfo = getQualityFromScore(qScore);

      nextState = addItem(nextState, {
        id: currentSelectedPotion.id,
        name: currentSelectedPotion.name,
        quantity: count,
        category: 'CONSUMABLE',
        description: currentSelectedPotion.description,
        quality: qInfo.quality,
      });

      const expGain = (currentSelectedPotion.requiredAlchemyLevel * 8 + 25) * count;
      nextState.technologyState = addTechnologyExp(nextState.technologyState || {}, 'ALCHEMY', expGain);
      const minutesSpent = currentSelectedPotion.baseCraftMinutes * count;
      nextState = passTime(nextState, minutesSpent);

      if (onAddLogMessage) {
        onAddLogMessage(`🧪 [포션 제조] ${currentSelectedPotion.name} ×${count}병 (품질: ${qInfo.name}) 완료! [연금술 EXP +${expGain}] [게임 시간 +${minutesSpent}분]`);
      }

      return nextState;
    });
  };

  const predictedScore = currentSelectedPotion
    ? calculateCraftingQualityScore({
        techLevel: alchemyLevel,
        recommendedLevel: currentSelectedPotion.requiredAlchemyLevel,
        facilityBonus: (facilityTier - currentSelectedPotion.requiredFacilityTier) * 10,
      })
    : 50;
  const predictedQuality = getQualityFromScore(predictedScore);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-purple-900/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-200">
        
        {/* 헤더 */}
        <div className="p-4 bg-gradient-to-r from-purple-950/80 via-stone-900 to-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-200 flex items-center gap-2">
                연금술 아틀리에 & 시약 제조실
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300">
                  시설 Tier {facilityTier}
                </span>
              </h2>
              <p className="text-xs text-stone-400">비약 18종 및 비전투 물약 17종 총 35종 연금 조제</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
          >
            닫기 (ESC)
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-stone-800 bg-stone-950/80 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => handleTabChange('ELIXIR')}
            className={`px-4 py-2.5 rounded-t-xl border-t border-x transition ${
              activeTab === 'ELIXIR'
                ? 'bg-stone-900 text-purple-300 border-purple-700/50 font-bold'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200'
            }`}
          >
            전투용 비약 ({elixirList.length}종)
          </button>
          <button
            onClick={() => handleTabChange('POTION')}
            className={`px-4 py-2.5 rounded-t-xl border-t border-x transition ${
              activeTab === 'POTION'
                ? 'bg-stone-900 text-purple-300 border-purple-700/50 font-bold'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200'
            }`}
          >
            비전투용 물약 ({potionList.length}종)
          </button>
          <button
            onClick={() => handleTabChange('REFINING')}
            className={`px-4 py-2.5 rounded-t-xl border-t border-x transition ${
              activeTab === 'REFINING'
                ? 'bg-stone-900 text-purple-300 border-purple-700/50 font-bold'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200'
            }`}
          >
            시약 및 마나석 정제
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 p-4 gap-4">
          
          {/* 목록 */}
          <div className="md:col-span-5 border border-stone-800 bg-stone-950/50 rounded-xl p-3 flex flex-col gap-2 overflow-y-auto max-h-[50vh] md:max-h-full">
            {activeTab !== 'REFINING' ? (
              currentList.map((p) => {
                const isSelected = selectedPotionId === p.id;
                const isLevelMet = alchemyLevel >= p.requiredAlchemyLevel;
                const isTierMet = facilityTier >= p.requiredFacilityTier;

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPotionId(p.id)}
                    className={`text-left p-3 rounded-xl border transition ${
                      isSelected
                        ? 'border-purple-500/80 bg-purple-950/30'
                        : 'border-stone-800/80 bg-stone-900/60 hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-200">{p.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-purple-300 font-mono">
                        Lv.{p.requiredAlchemyLevel}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1 line-clamp-1">{p.description}</div>
                    {(!isLevelMet || !isTierMet) && (
                      <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {!isLevelMet ? `연금술 Lv.${p.requiredAlchemyLevel} 필요` : `시설 Tier ${p.requiredFacilityTier} 필요`}
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              refiningRecipes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedPotionId(r.id)}
                  className={`text-left p-3 rounded-xl border transition ${
                    selectedPotionId === r.id
                      ? 'border-purple-500/80 bg-purple-950/30'
                      : 'border-stone-800/80 bg-stone-900/60 hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-200">{r.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-purple-300 font-mono">
                      Lv.{r.requiredAlchemyLevel}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1">{r.description}</div>
                </button>
              ))
            )}
          </div>

          {/* 디테일 */}
          <div className="md:col-span-7 border border-stone-800 bg-stone-950/80 rounded-xl p-4 flex flex-col justify-between overflow-y-auto">
            {activeTab !== 'REFINING' && currentSelectedPotion ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-purple-200">{currentSelectedPotion.name}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      조제 시간: {currentSelectedPotion.baseCraftMinutes}분 / 1회
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{currentSelectedPotion.description}</p>
                </div>

                {/* 마실 때 연출 미리보기 */}
                <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-bold text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    시각 & 감각 연출 연동
                  </div>
                  <p className="text-stone-300 italic">"{currentSelectedPotion.drinkingPresentation}"</p>
                </div>

                {/* 재료 요구 사항 */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-bold text-stone-300 border-b border-stone-800 pb-1">필요 연금 재료</div>
                  <div className="space-y-1">
                    {currentSelectedPotion.ingredients.map((ing) => {
                      const avail = getIngredientCount(ing.itemName);
                      const isEnough = avail >= ing.quantity;
                      return (
                        <div key={ing.itemName} className="flex items-center justify-between p-1.5 rounded bg-stone-950 border border-stone-800">
                          <span>{ing.itemName}</span>
                          <span className={`font-mono ${isEnough ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {avail} / {ing.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 예측 품질 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <span>예측 시약 품질</span>
                  <span className={`px-2.5 py-0.5 rounded border ${predictedQuality.badgeColor}`}>
                    {predictedQuality.name} (효과 배율 x{predictedQuality.consumableMultiplier})
                  </span>
                </div>

                {/* 대량 제조 버튼 */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-stone-300">조제 수량 선택 (대량 작업)</div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleCraft(1)}
                      className="py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-200 text-xs font-bold transition"
                    >
                      1병 조제
                    </button>
                    <button
                      onClick={() => handleCraft(5)}
                      className="py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-200 text-xs font-bold transition"
                    >
                      5병 연속
                    </button>
                    <button
                      onClick={() => handleCraft(10)}
                      className="py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-200 text-xs font-bold transition"
                    >
                      10병 연속
                    </button>
                    <button
                      onClick={() => handleCraft('MAX')}
                      className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition shadow"
                    >
                      최대(MAX)
                    </button>
                  </div>
                </div>
              </div>
            ) : currentSelectedRefining ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-purple-200">{currentSelectedRefining.name}</h3>
                  <p className="text-xs text-stone-400 mt-1">{currentSelectedRefining.description}</p>
                </div>

                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-bold text-stone-300 border-b border-stone-800 pb-1">필요 정제 재료</div>
                  <div className="space-y-1">
                    {currentSelectedRefining.ingredients.map((ing) => (
                      <div key={ing.itemName} className="flex items-center justify-between p-1.5 rounded bg-stone-950 border border-stone-800">
                        <span>{ing.itemName}</span>
                        <span className="font-mono text-purple-300">×{ing.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleCraft(1)}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm transition shadow"
                >
                  시약 정제 시작
                </button>
              </div>
            ) : (
              <div className="text-center text-stone-500 py-10">포션 레시피를 선택해 주세요.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
