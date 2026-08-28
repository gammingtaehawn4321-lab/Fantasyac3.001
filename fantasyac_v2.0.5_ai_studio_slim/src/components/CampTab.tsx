import React, { useState } from 'react';
import { PlayerState, InventoryItem } from '../types';
import { CampFacilityType } from '../data/camp/campTypes';
import { CAMP_FACILITIES_DATABASE, CAMP_SETUP_COST, READABLE_BOOKS_DATABASE } from '../data/camp/campData';
import { calculateCampStorageWeight, getCampStorageMaxCapacity, calculateItemTotalWeight } from '../data/bags/bagConfig';
import { Flame, Moon, BookOpen, Hammer, Check, ArrowUpCircle, Package, ArrowRight, ArrowLeft } from 'lucide-react';

interface CampTabProps {
  playerState: PlayerState;
  onSetupCamp: () => void;
  onUpgradeFacility: (facilityId: CampFacilityType) => void;
  onCampSleep: () => void;
  onReadBook: (bookName: string) => void;
  onTransferToStorage?: (itemNameOrId: string, quantity: number) => { success: boolean; message: string };
  onTransferFromStorage?: (itemNameOrId: string, quantity: number) => { success: boolean; message: string };
}

export const CampTab: React.FC<CampTabProps> = ({
  playerState,
  onSetupCamp,
  onUpgradeFacility,
  onCampSleep,
  onReadBook,
  onTransferToStorage,
  onTransferFromStorage,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transferMode, setTransferMode] = useState<'store' | 'retrieve'>('store');

  const readableBooksInInventory = playerState.inventory.filter(
    (item) => READABLE_BOOKS_DATABASE[item.name.trim()]
  );

  // 야영지 설치 가능 여부 (나뭇가지 2, 돌 1)
  const canSetupCamp = CAMP_SETUP_COST.every((cost) => {
    const item = playerState.inventory.find((i) => i.name.trim() === cost.itemName.trim());
    return item && item.quantity >= cost.quantity;
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const storageFacility = playerState.campProgress.facilities.find((f) => f.facilityId === 'storage');
  const storageLevel = storageFacility && storageFacility.isBuilt ? storageFacility.level : 0;
  const storageCapacity = getCampStorageMaxCapacity(Math.max(1, storageLevel));
  const storageItems = playerState.campProgress.storageItems || [];
  const currentStorageWeight = calculateCampStorageWeight(storageItems);
  const storagePercent = Math.min(100, Math.round((currentStorageWeight / storageCapacity) * 100));

  const handleStore = (item: InventoryItem, qty: number = 1) => {
    if (!onTransferToStorage) return;
    const res = onTransferToStorage(item.name, qty);
    showFeedback(res.message);
  };

  const handleRetrieve = (item: InventoryItem, qty: number = 1) => {
    if (!onTransferFromStorage) return;
    const res = onTransferFromStorage(item.name, qty);
    showFeedback(res.message);
  };

  return (
    <div id="camp-tab-root" className="p-4 text-zinc-200 space-y-4">
      {/* 1. 상단: 야영지 개요 및 활동 컨트롤 바 */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-950/60 border border-amber-600/50 rounded-xl text-2xl">
            ⛺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100">야영지 (Camp & Rest)</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-semibold">
                Day {playerState.dayCount || 1} • {playerState.timeOfDay || 'MORNING'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              야영지에서 휴식을 취하거나 시설을 증축하고 물품을 안전하게 보관할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* 야영 설치 */}
          <button
            id="setup-camp-btn"
            onClick={() => {
              onSetupCamp();
              showFeedback('모닥불 야영지를 새로 정비했습니다!');
            }}
            disabled={!canSetupCamp}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow ${
              canSetupCamp
                ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> 야영지 정비 (나뭇가지2, 돌1)
          </button>

          {/* 수면 및 휴식 */}
          <button
            id="camp-sleep-btn"
            onClick={() => {
              onCampSleep();
              showFeedback('모닥불 곁에서 깊은 수면을 취하여 체력과 정신력을 회복했습니다.');
            }}
            className="px-3.5 py-2 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Moon className="w-3.5 h-3.5" /> 수면 및 완전 회복
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700/50 rounded-lg text-xs text-emerald-300 font-medium">
          {feedback}
        </div>
      )}

      {/* 2. 가방 내 독서 가능 서적 섹션 (독서 공간) */}
      {readableBooksInInventory.length > 0 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-indigo-300">
            <BookOpen className="w-4 h-4" /> 모닥불 옆 독서 공간 (지식 및 스킬 습득)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {readableBooksInInventory.map((book) => {
              const bookDef = READABLE_BOOKS_DATABASE[book.name.trim()];
              return (
                <div
                  key={book.name}
                  className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-zinc-100">{book.name}</div>
                    <div className="text-[11px] text-zinc-400 line-clamp-1">{bookDef?.lore}</div>
                  </div>
                  <button
                    onClick={() => {
                      onReadBook(book.name);
                      showFeedback(`[${book.name}]을(를) 읽어 지혜를 얻었습니다!`);
                    }}
                    className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs rounded transition-colors"
                  >
                    읽기
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 야영지 물품 보관함 (Camp Storage) */}
      <div id="camp-storage-section" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-100">야영지 물품 보관함 (Camp Storage)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-semibold">
              {storageFacility?.isBuilt ? `Lv.${storageLevel} 보관함` : '기본 보관함'}
            </span>
          </div>

          {/* 용량 게이지 */}
          <div className="flex items-center gap-2">
            <div className="w-28 bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  storagePercent >= 90 ? 'bg-rose-500' : storagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              {currentStorageWeight} / {storageCapacity} kg ({storagePercent}%)
            </span>
          </div>
        </div>

        {/* 탭 토글: 가방 -> 보관함 or 보관함 -> 가방 */}
        <div className="flex border-b border-zinc-800 pb-2 gap-2">
          <button
            onClick={() => setTransferMode('store')}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
              transferMode === 'store'
                ? 'bg-amber-600 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            소지품 보관하기 ({playerState.inventory.length}종)
          </button>
          <button
            onClick={() => setTransferMode('retrieve')}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
              transferMode === 'retrieve'
                ? 'bg-amber-600 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            보관함에서 꺼내기 ({storageItems.length}종)
          </button>
        </div>

        {/* 물품 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {transferMode === 'store' ? (
            playerState.inventory.length === 0 ? (
              <div className="col-span-full py-6 text-center text-xs text-zinc-500">
                인벤토리에 보관 가능한 아이템이 없습니다.
              </div>
            ) : (
              playerState.inventory.map((item, idx) => {
                const totalWeight = calculateItemTotalWeight(item);
                return (
                  <div
                    key={`${item.name}-${idx}`}
                    className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg flex items-center justify-between gap-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>수량: x{item.quantity}</span>
                        <span>•</span>
                        <span>{totalWeight} kg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStore(item, 1)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                        title="1개 보관"
                      >
                        1개 <ArrowRight className="w-2.5 h-2.5 text-amber-400" />
                      </button>
                      {item.quantity > 1 && (
                        <button
                          onClick={() => handleStore(item, item.quantity)}
                          className="px-2 py-1 bg-amber-700 hover:bg-amber-600 text-zinc-950 text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                          title="전체 보관"
                        >
                          전체 <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : storageItems.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-zinc-500">
              야영지 보관함에 보관된 아이템이 없습니다.
            </div>
          ) : (
            storageItems.map((item, idx) => {
              const totalWeight = calculateItemTotalWeight(item);
              return (
                <div
                  key={`stored-${item.name}-${idx}`}
                  className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg flex items-center justify-between gap-2 hover:border-zinc-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-zinc-200 truncate">{item.name}</div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>수량: x{item.quantity}</span>
                      <span>•</span>
                      <span>{totalWeight} kg</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRetrieve(item, 1)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                      title="1개 꺼내기"
                    >
                      <ArrowLeft className="w-2.5 h-2.5 text-indigo-400" /> 1개
                    </button>
                    {item.quantity > 1 && (
                      <button
                        onClick={() => handleRetrieve(item, item.quantity)}
                        className="px-2 py-1 bg-indigo-700 hover:bg-indigo-600 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                        title="전체 꺼내기"
                      >
                        <ArrowLeft className="w-2.5 h-2.5" /> 전체
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. 12대 야영 시설 그리드 및 증축 */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl">
        <div className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1">
          <Hammer className="w-4 h-4 text-amber-400" /> 야영지 시설 관리 및 증축
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(CAMP_FACILITIES_DATABASE) as CampFacilityType[]).map((facId) => {
            const facDef = CAMP_FACILITIES_DATABASE[facId];
            const currentFac = playerState.campProgress.facilities.find((f) => f.facilityId === facId) || {
              facilityId: facId,
              level: 0,
              isBuilt: false,
            };

            const isMax = currentFac.level >= facDef.maxLevel;
            const nextLvl = currentFac.level + 1;
            const upgradeCost = facDef.upgradeCosts[nextLvl];

            // 업그레이드 재료 검사
            let canUpgrade = !isMax && !!upgradeCost;
            if (upgradeCost) {
              if (upgradeCost.rupees && playerState.rupees < upgradeCost.rupees) canUpgrade = false;
              for (const ing of upgradeCost.ingredients) {
                const has = playerState.inventory.find(
                  (i) => i.name.trim() === ing.itemName.trim() && i.quantity >= ing.quantity
                );
                if (!has) canUpgrade = false;
              }
            }

            return (
              <div
                key={facId}
                id={`camp-facility-${facId}`}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  currentFac.isBuilt
                    ? 'border-zinc-700 bg-zinc-950/60'
                    : 'border-zinc-800/60 bg-zinc-950/30 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{facDef.iconSymbol}</span>
                      <span className="font-bold text-xs text-zinc-100">{facDef.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        currentFac.isBuilt ? 'bg-amber-950 text-amber-300 border border-amber-800/50' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {currentFac.isBuilt ? `Lv.${currentFac.level} 구축됨` : '미구축'}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{facDef.description}</p>

                  <div className="mt-2 text-[10px] text-amber-400/90 space-y-0.5">
                    {facDef.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> {b}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 하단 업그레이드 버튼 & 필요 재료 */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80">
                  {isMax ? (
                    <div className="text-[11px] text-zinc-500 font-semibold text-center py-1">
                      최대 등급 완료
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] text-zinc-400">
                        {upgradeCost?.ingredients.map((ing) => `${ing.itemName} x${ing.quantity}`).join(', ')}
                      </div>
                      <button
                        id={`upgrade-fac-${facId}`}
                        onClick={() => {
                          onUpgradeFacility(facId);
                          showFeedback(`[${facDef.name}] 시설을 성공적으로 증축했습니다!`);
                        }}
                        disabled={!canUpgrade}
                        className={`px-2.5 py-1 rounded font-bold text-[11px] flex items-center gap-1 transition-all ${
                          canUpgrade
                            ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 cursor-pointer shadow'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <ArrowUpCircle className="w-3 h-3" />
                        {currentFac.isBuilt ? `Lv.${nextLvl} 증축` : '건설'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

