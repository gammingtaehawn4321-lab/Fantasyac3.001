import React, { useState } from 'react';
import { PlayerState } from '../types';
import { SMELTING_RECIPES, executeSmelting, calculateMetalRecoveryRate } from '../data/technology/smeltingSystem';
import { calculateCraftingQualityScore, getQualityFromScore, QUALITY_TIERS, MaterialQuality } from '../data/technology/craftingQuality';
import { RECIPE_DATABASE } from '../data/professions/professionData';
import { passTime, addItem } from '../gameEngine';
import { addTechnologyExp } from '../data/technology/technologyUtils';
import { Hammer, Flame, Shield, Wrench, Anvil, Sparkles, AlertCircle } from 'lucide-react';

interface BlacksmithWorkshopModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onUpdateState: (updater: (prev: PlayerState) => PlayerState) => void;
  onAddLogMessage?: (msg: string) => void;
}

export const BlacksmithWorkshopModal: React.FC<BlacksmithWorkshopModalProps> = ({
  playerState,
  onClose,
  onUpdateState,
  onAddLogMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'SMELTING' | 'WEAPON' | 'ARMOR' | 'COMPONENT' | 'REPAIR'>('SMELTING');
  const [selectedSmeltId, setSelectedSmeltId] = useState<string>('smelt_iron_ingot');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('craft_iron_sword');
  const [batchCount, setBatchCount] = useState<number | 'MAX'>(1);

  const techState = playerState.technologyState || {};
  const smithingProgress = techState['SMITHING'] || { level: 1, exp: 0 };
  const smithingLevel = smithingProgress.level || 1;

  // 야영지 시설 등급 확인 (기본 anvil level 1, storage 등 연동)
  const campFacilities = playerState.campProgress?.facilities || [];
  const anvilFacility = campFacilities.find((f) => f.facilityId === 'anvil');
  const facilityTier = anvilFacility && anvilFacility.isBuilt ? (anvilFacility.level || 1) : 1;

  // 제련 레시피 목록
  const smeltingList = Object.values(SMELTING_RECIPES);
  const currentSmeltRecipe = SMELTING_RECIPES[selectedSmeltId] || smeltingList[0];

  // 기타 제작 레시피 목록 (대장장이 전용 무기, 방어구, 부품)
  const allBlacksmithRecipes = Object.values(RECIPE_DATABASE).filter((r) => r.professionId === 'BLACKSMITH');
  const weaponRecipes = allBlacksmithRecipes.filter((r) => r.craftingCategory === 'WEAPON' || r.category === 'EQUIPMENT');
  const armorRecipes = allBlacksmithRecipes.filter((r) => r.craftingCategory === 'ARMOR');
  const componentRecipes = allBlacksmithRecipes.filter((r) => r.category === 'MATERIAL' || (r.craftingCategory as string) === 'CONSUMABLE');


  const currentOtherList = activeTab === 'WEAPON' ? weaponRecipes : activeTab === 'ARMOR' ? armorRecipes : componentRecipes;
  const currentOtherRecipe = currentOtherList.find((r) => r.id === selectedRecipeId) || currentOtherList[0];

  // 회수율 & 예측 품질
  const recoveryInfo = calculateMetalRecoveryRate({
    smithingLevel,
    recommendedLevel: currentSmeltRecipe?.recommendedLevel || 1,
    facilityTier,
    requiredFacilityTier: currentSmeltRecipe?.requiredFacilityTier || 1,
  });

  const predictedQualityScore = calculateCraftingQualityScore({
    techLevel: smithingLevel,
    recommendedLevel: currentSmeltRecipe?.recommendedLevel || 1,
    facilityBonus: (facilityTier - (currentSmeltRecipe?.requiredFacilityTier || 1)) * 10,
  });
  const predictedQuality = getQualityFromScore(predictedQualityScore);

  // 대량 제련 실행
  const handlePerformSmelting = (count: number | 'MAX') => {
    if (!currentSmeltRecipe) return;

    const result = executeSmelting(playerState, currentSmeltRecipe.id, count, facilityTier);

    if (!result.success) {
      if (onAddLogMessage) onAddLogMessage(`❌ [제련 실패] ${result.message}`);
      return;
    }

    onUpdateState((prev) => {
      let nextState = result.nextState;
      nextState = passTime(nextState, result.minutesSpent);
      return nextState;
    });

    if (onAddLogMessage) {
      onAddLogMessage(`🔥 [대장 제련 완료] ${result.message}`);
    }
  };

  // 일반 장비/부품 단조 제작 실행
  const handlePerformCrafting = () => {
    if (!currentOtherRecipe) return;

    // 재료 보유 확인
    const inv = playerState.inventory || [];
    const hasAllMats = currentOtherRecipe.ingredients.every((ing) => {
      const count = inv.filter((i) => i.name === ing.itemName || i.id === ing.itemName).reduce((s, i) => s + (i.quantity || 1), 0);
      return count >= ing.quantity;
    });

    if (!hasAllMats) {
      if (onAddLogMessage) onAddLogMessage(`❌ [단조 실패] ${currentOtherRecipe.name}에 필요한 주괴 및 재료가 부족합니다.`);
      return;
    }

    // 재료 차용 및 제작 처리
    onUpdateState((prev) => {
      let nextState = { ...prev };
      let updatedInv = [...(nextState.inventory || [])];

      currentOtherRecipe.ingredients.forEach((ing) => {
        let remain = ing.quantity;
        updatedInv = updatedInv.map((item) => {
          if (remain <= 0) return item;
          if (item.id === ing.itemName || item.name === ing.itemName) {
            if (item.quantity > remain) {
              const qty = item.quantity - remain;
              remain = 0;
              return { ...item, quantity: qty };
            } else {
              remain -= item.quantity;
              return { ...item, quantity: 0 };
            }
          }
          return item;
        }).filter((i) => i.quantity > 0);
      });

      // 단조 결과 품질 계산
      const score = calculateCraftingQualityScore({
        techLevel: smithingLevel,
        recommendedLevel: currentOtherRecipe.requiredLevel,
      });
      const qInfo = getQualityFromScore(score);

      // 출력 완성품 추가
      const outDef = currentOtherRecipe.output;
      nextState.inventory = updatedInv;
      nextState = addItem(nextState, {
        id: outDef.equipmentId || outDef.itemName,
        name: outDef.itemName,
        quantity: outDef.baseQuantity || 1,
        category: currentOtherRecipe.category === 'CAMP_UPGRADE' ? 'MATERIAL' : (currentOtherRecipe.category || 'EQUIPMENT'),
        description: `${outDef.itemName} (대장 단조 완성품)`,
        quality: qInfo.quality,
      });

      // 경험치 & 시간 경과
      const expGain = currentOtherRecipe.expReward || 40;
      nextState.technologyState = addTechnologyExp(nextState.technologyState || {}, 'SMITHING', expGain);
      nextState = passTime(nextState, 30); // 30분 작업

      if (onAddLogMessage) {
        onAddLogMessage(`⚒️ [단조 완성] ${outDef.itemName} (품질: ${qInfo.name}) 제작 성공! [대장기술 EXP +${expGain}] [게임 시간 +30분]`);
      }

      return nextState;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-amber-900/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-200">
        
        {/* 헤더 */}
        <div className="p-4 bg-gradient-to-r from-amber-950/80 via-stone-900 to-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Anvil className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-200 flex items-center gap-2">
                대장 작업장 & 금속 제련소
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-400">
                  시설 Tier {facilityTier}
                </span>
              </h2>
              <p className="text-xs text-stone-400">광석 제련, 금속 주괴 단조, 합금 주조 및 장비 제작</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
          >
            닫기 (ESC)
          </button>
        </div>

        {/* 메인 작업장 탭 */}
        <div className="flex border-b border-stone-800 bg-stone-950/80 px-4 pt-2 gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('SMELTING')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition ${
              activeTab === 'SMELTING'
                ? 'bg-stone-900 text-amber-300 border-amber-700/50 font-bold'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            [제련] 광석 → 주괴 / 합금
          </button>
          <button
            onClick={() => setActiveTab('WEAPON')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition ${
              activeTab === 'WEAPON'
                ? 'bg-stone-900 text-amber-300 border-amber-700/50 font-bold'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200'
            }`}
          >
            <Hammer className="w-4 h-4 text-amber-400" />
            [무기] 금속 무기 단조
          </button>
          <button
            onClick={() => setActiveTab('ARMOR')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition ${
              activeTab === 'ARMOR'
                ? 'bg-stone-900 text-amber-300 border-amber-700/50 font-bold'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-400" />
            [방어구] 금속 흉갑 / 방패
          </button>
          <button
            onClick={() => setActiveTab('COMPONENT')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition ${
              activeTab === 'COMPONENT'
                ? 'bg-stone-900 text-amber-300 border-amber-700/50 font-bold'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200'
            }`}
          >
            <Wrench className="w-4 h-4 text-stone-400" />
            [부품] 금속 부품 및 재료
          </button>
        </div>

        {/* 콘텐츠 본문 */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 p-4 gap-4">
          
          {/* 좌측 레시피 리스트 */}
          <div className="md:col-span-5 border border-stone-800 bg-stone-950/50 rounded-xl p-3 flex flex-col gap-2 overflow-y-auto max-h-[50vh] md:max-h-full">
            {activeTab === 'SMELTING' ? (
              smeltingList.map((smelt) => {
                const isSelected = selectedSmeltId === smelt.id;
                const isLevelMet = smithingLevel >= smelt.requiredSmithingLevel;
                const isTierMet = facilityTier >= smelt.requiredFacilityTier;

                return (
                  <button
                    key={smelt.id}
                    onClick={() => setSelectedSmeltId(smelt.id)}
                    className={`text-left p-3 rounded-xl border transition ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-950/30'
                        : 'border-stone-800/80 bg-stone-900/60 hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-200">{smelt.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-amber-400 font-mono">
                        Lv.{smelt.requiredSmithingLevel}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1 flex items-center justify-between">
                      <span>{smelt.inputOreName} ×{smelt.inputOreCount} + {smelt.fuelName} ×{smelt.fuelCount}</span>
                      <span className="text-emerald-400 font-medium">➔ {smelt.outputIngotName} ×{smelt.baseOutputCount}</span>
                    </div>
                    {(!isLevelMet || !isTierMet) && (
                      <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {!isLevelMet ? `숙련 Lv.${smelt.requiredSmithingLevel} 필요` : `시설 Tier ${smelt.requiredFacilityTier} 필요`}
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              currentOtherList.map((rec) => {
                const isSelected = selectedRecipeId === rec.id;
                const isLevelMet = smithingLevel >= rec.requiredLevel;

                return (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedRecipeId(rec.id)}
                    className={`text-left p-3 rounded-xl border transition ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-950/30'
                        : 'border-stone-800/80 bg-stone-900/60 hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-200">{rec.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-amber-400 font-mono">
                        Lv.{rec.requiredLevel}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      주재료: {rec.ingredients.map((i) => `${i.itemName} x${i.quantity}`).join(', ')}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* 우측 세부 작업 디테일 */}
          <div className="md:col-span-7 border border-stone-800 bg-stone-950/80 rounded-xl p-4 flex flex-col justify-between overflow-y-auto">
            {activeTab === 'SMELTING' ? (
              currentSmeltRecipe ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-amber-200">{currentSmeltRecipe.name}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        소요시간: {currentSmeltRecipe.baseSmeltMinutes}분 / 1회
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">{currentSmeltRecipe.description}</p>
                  </div>

                  {/* 재료 / 연료 요구 사항 */}
                  <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2 text-xs">
                    <div className="font-bold text-stone-300 border-b border-stone-800 pb-1">필요 광석 & 연료</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2 rounded bg-stone-950 border border-stone-800">
                        <span>{currentSmeltRecipe.inputOreName}</span>
                        <span className="font-mono text-amber-400">×{currentSmeltRecipe.inputOreCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-stone-950 border border-stone-800">
                        <span>{currentSmeltRecipe.fuelName}</span>
                        <span className="font-mono text-orange-400">×{currentSmeltRecipe.fuelCount}</span>
                      </div>
                      {currentSmeltRecipe.extraMatName && (
                        <div className="col-span-2 flex items-center justify-between p-2 rounded bg-stone-950 border border-stone-800">
                          <span>{currentSmeltRecipe.extraMatName}</span>
                          <span className="font-mono text-blue-400">×{currentSmeltRecipe.extraMatCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 회수율 & 예쌍 품질 정보 */}
                  <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-xs space-y-2">
                    <div className="font-bold text-amber-300 flex items-center justify-between">
                      <span>숙련자 금속 회수율 & 예측 품질</span>
                      <span className={`px-2 py-0.5 rounded border text-[11px] ${predictedQuality.badgeColor}`}>
                        예측 품질: {predictedQuality.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-stone-300">
                      <div>금속 회수율: <b className="text-emerald-400">{recoveryInfo.ratePercent}%</b></div>
                      <div>추가 주괴 확률: <b className="text-amber-400">+{Math.round(recoveryInfo.bonusIngotChance * 100)}%</b></div>
                      <div>대장 숙련 보너스: <b className="text-blue-400">+{(smithingLevel * 0.7).toFixed(1)}점</b></div>
                      <div>획득 EXP: <b className="text-amber-300">+{currentSmeltRecipe.baseExp} EXP</b></div>
                    </div>
                  </div>

                  {/* 수량 선택 및 대량 제련 버튼 */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-stone-300">제련 횟수 선택 (대량 작업)</div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => handlePerformSmelting(1)}
                        className="py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 text-amber-200 text-xs font-bold transition"
                      >
                        1회 제련
                      </button>
                      <button
                        onClick={() => handlePerformSmelting(5)}
                        className="py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 text-amber-200 text-xs font-bold transition"
                      >
                        5회 연속
                      </button>
                      <button
                        onClick={() => handlePerformSmelting(10)}
                        className="py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 text-amber-200 text-xs font-bold transition"
                      >
                        10회 연속
                      </button>
                      <button
                        onClick={() => handlePerformSmelting('MAX')}
                        className="py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black text-xs font-extrabold transition shadow"
                      >
                        최대(MAX)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-stone-500 py-10">제련 레시피를 선택해 주세요.</div>
              )
            ) : (
              currentOtherRecipe ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-amber-200">{currentOtherRecipe.name}</h3>
                    <p className="text-xs text-stone-400 mt-1">{currentOtherRecipe.description}</p>
                  </div>

                  <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2 text-xs">
                    <div className="font-bold text-stone-300 border-b border-stone-800 pb-1">소모 주괴 및 재료</div>
                    <div className="space-y-1">
                      {currentOtherRecipe.ingredients.map((ing) => (
                        <div key={ing.itemName} className="flex items-center justify-between p-1.5 rounded bg-stone-950 border border-stone-800">
                          <span>{ing.itemName}</span>
                          <span className="font-mono text-amber-400">×{ing.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePerformCrafting}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm transition shadow"
                  >
                    단조 제작 시작
                  </button>
                </div>
              ) : (
                <div className="text-center text-stone-500 py-10">제작 레시피를 선택해 주세요.</div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
