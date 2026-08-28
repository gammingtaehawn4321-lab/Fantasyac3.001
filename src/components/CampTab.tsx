import React, { useState, useRef } from 'react';
import { PlayerState, InventoryItem } from '../types';
import { CampFacilityType } from '../data/camp/campTypes';
import { CAMP_FACILITIES_DATABASE, CAMP_SETUP_COST, READABLE_BOOKS_DATABASE } from '../data/camp/campData';
import { calculateCampStorageWeight, getCampStorageMaxCapacity, calculateItemTotalWeight } from '../data/bags/bagConfig';
import { CAMP_HOTSPOTS, CampHotspotDefinition } from '../data/camp/campHotspots';
import { CAMP_OVERVIEW_IMAGE_URL } from '../data/camp/campAssets';
import { AlchemyCraftingModal } from './AlchemyCraftingModal';
import { BlacksmithWorkshopModal } from './BlacksmithWorkshopModal';
import { Flame, Moon, BookOpen, Hammer, Package, ArrowRight, ArrowLeft, Check, ArrowUpCircle, Sparkles, Shield, ChevronRight } from 'lucide-react';

interface CampTabProps {
  playerState: PlayerState;
  onSetupCamp: () => void;
  onUpgradeFacility: (facilityId: CampFacilityType) => void;
  onCampSleep: () => void;
  onReadBook: (bookName: string) => void;
  onTransferToStorage?: (itemNameOrId: string, quantity: number) => { success: boolean; message: string };
  onTransferFromStorage?: (itemNameOrId: string, quantity: number) => { success: boolean; message: string };
  onUpdateState?: (updater: (prev: PlayerState) => PlayerState) => void;
  onAddLogMessage?: (msg: string) => void;
  onOpenBlacksmith?: () => void;
  onOpenAlchemy?: () => void;
  onOpenProfessions?: () => void;
  onOpenCompanions?: () => void;
}

export const CampTab: React.FC<CampTabProps> = ({
  playerState,
  onSetupCamp,
  onUpgradeFacility,
  onCampSleep,
  onReadBook,
  onTransferToStorage,
  onTransferFromStorage,
  onUpdateState,
  onAddLogMessage,
  onOpenBlacksmith,
  onOpenAlchemy,
  onOpenProfessions,
  onOpenCompanions,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transferMode, setTransferMode] = useState<'store' | 'retrieve'>('store');
  const [showAlchemyModalLocal, setShowAlchemyModalLocal] = useState<boolean>(false);
  const [showBlacksmithModalLocal, setShowBlacksmithModalLocal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'storage' | 'facilities'>('overview');

  const containerRef = useRef<HTMLDivElement>(null);

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
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleHotspotClick = (hotspot: CampHotspotDefinition) => {
    const facility = hotspot.facilityId
      ? playerState.campProgress.facilities.find((f) => f.facilityId === hotspot.facilityId)
      : null;

    switch (hotspot.actionType) {
      case 'CRAFT_SMITHING':
        if (onOpenBlacksmith) {
          onOpenBlacksmith();
        } else {
          setShowBlacksmithModalLocal(true);
        }
        showFeedback('⚒️ [대장 작업장] 용광로 제련 및 무구 단조 작업장에 입장했습니다.');
        break;

      case 'CRAFT_ALCHEMY':
        if (onOpenAlchemy) {
          onOpenAlchemy();
        } else {
          setShowAlchemyModalLocal(true);
        }
        showFeedback('🧪 [연금 작업대] 물약 조제 및 시약 정제 작업대에 입장했습니다.');
        break;

      case 'CRAFT_LEATHER':
        if (onOpenProfessions) {
          onOpenProfessions();
        }
        showFeedback('🧵 [가죽 작업대] 가죽 세공 및 재단 기술 메뉴를 엽니다.');
        break;

      case 'CRAFT_COOK':
        showFeedback('🍲 [조리 공간] 모닥불 화덕 스튜 및 요리 공간입니다.');
        break;

      case 'CRAFT_JEWEL':
        if (onOpenProfessions) {
          onOpenProfessions();
        }
        showFeedback('💎 [보석 작업대] 원석 세공 및 장신구 제작 공간입니다.');
        break;

      case 'REST':
        onCampSleep();
        showFeedback('⛺ 모닥불 곁에서 깊은 수면을 취하여 체력, 마나, 정신력을 완전히 회복했습니다!');
        break;

      case 'STORAGE': {
        setActiveTab('storage');
        const el = document.getElementById('camp-storage-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        showFeedback('📦 [야영지 보관함] 보관함 수납 메뉴로 이동했습니다.');
        break;
      }

      case 'COMPANION':
        if (onOpenCompanions) {
          onOpenCompanions();
        }
        showFeedback('👥 [동반자 쉼터] 동료들과 유대를 다집니다.');
        break;

      default:
        break;
    }
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
    <div id="camp-tab-root" className="p-3 sm:p-5 text-stone-200 space-y-4 bg-stone-950 min-h-full">
      {/* 1. 상단 개요 및 실시간 컨트롤 바 */}
      <div className="bg-stone-900/90 border border-amber-900/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-950/80 to-stone-900 border border-amber-600/40 rounded-2xl text-2xl shadow-inner">
            ⛺
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-amber-100">모닥불 야영지 거점 (Camp Base)</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/50 text-amber-300 font-semibold">
                Day {playerState.dayCount || 1} • {playerState.timeOfDay || 'MORNING'}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              전경 속 각 작업 공간을 터치하여 제련, 연금, 보관, 휴식 등 야영지 활동을 수행합니다.
            </p>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            id="setup-camp-btn"
            onClick={() => {
              onSetupCamp();
              showFeedback('🔥 모닥불 야영지를 새로 정비하여 행동력을 충전했습니다!');
            }}
            disabled={!canSetupCamp}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow ${
              canSetupCamp
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 cursor-pointer active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-900" /> 야영지 정비 (나뭇가지x2, 돌x1)
          </button>

          <button
            id="camp-sleep-btn"
            onClick={() => {
              onCampSleep();
              showFeedback('⛺ 모닥불 곁에서 깊은 수면을 취하여 상태를 완치했습니다.');
            }}
            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white flex items-center gap-1.5 transition-all shadow active:scale-95 cursor-pointer border border-indigo-400/30"
          >
            <Moon className="w-4 h-4 text-indigo-200" /> 수면 및 상태 완치
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-xs text-emerald-200 font-medium flex items-center gap-2 animate-fade-in shadow-lg">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2. 메인 야영지 전경 인터랙티브 스크린 (Camp Landscape Viewport) */}
      <div className="bg-stone-900 border border-amber-900/50 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
        {/* 전경 헤더 툴바 */}
        <div className="px-4 py-2.5 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
            <span className="text-base">🏰</span>
            <span>야영지 파노라마 전경 (Touch Facility Hotspots)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            <span className="hidden sm:inline">모바일: 좌우 드래그로 화면 이동 · </span>
            <span className="text-amber-400 font-medium">사물 버튼 클릭으로 작업장 입장</span>
          </div>
        </div>

        {/* 16:9 가로 파노라마 뷰포트 (모바일 좌우 스크롤 지원) */}
        <div
          ref={containerRef}
          className="relative w-full overflow-x-auto overflow-y-hidden custom-scrollbar bg-stone-950"
          style={{ touchAction: 'pan-x' }}
        >
          <div className="relative min-w-[720px] sm:min-w-full aspect-[16/9] overflow-hidden select-none">
            {/* 고품질 야영지 전경 배경 이미지 */}
            <img
              src={CAMP_OVERVIEW_IMAGE_URL}
              alt="Adventurer Camp Panorama Overview"
              className="w-full h-full object-cover pointer-events-none filter brightness-[0.92] contrast-[1.05]"
              referrerPolicy="no-referrer"
            />

            {/* 비네트 및 은은한 모닥불 오버레이 효과 */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-stone-950/40 via-transparent to-stone-950/20" />

            {/* 사물 주변 오버레이 핫스팟 버튼들 */}
            {CAMP_HOTSPOTS.map((hotspot) => {
              const facility = hotspot.facilityId
                ? playerState.campProgress.facilities.find((f) => f.facilityId === hotspot.facilityId)
                : null;
              const level = facility && facility.isBuilt ? facility.level : 0;
              const isBuilt = facility ? facility.isBuilt : true;

              return (
                <div
                  key={hotspot.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                  }}
                >
                  <button
                    onClick={() => handleHotspotClick(hotspot)}
                    className="group relative flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-950/85 hover:bg-stone-900/95 border border-amber-500/50 hover:border-amber-400 text-stone-100 shadow-2xl backdrop-blur-md transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer min-w-[140px] max-w-[190px]"
                  >
                    {/* 아이콘 및 상태 뱃지 */}
                    <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-700/60 text-lg group-hover:bg-amber-900 transition-colors">
                      <span>{hotspot.icon}</span>
                      {level > 0 && (
                        <span className="absolute -top-1 -right-1 text-[9px] font-mono font-bold px-1 rounded-full bg-amber-500 text-stone-950 border border-amber-300 shadow">
                          T{level}
                        </span>
                      )}
                    </div>

                    {/* 라벨 텍스트 */}
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-amber-100 group-hover:text-amber-300 truncate tracking-tight">
                          {hotspot.buttonLabel}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-300 truncate opacity-90 group-hover:opacity-100">
                        {isBuilt
                          ? hotspot.subLabel
                          : '미구축 (건설 필요)'}
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-amber-400/70 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 탭 전환 버튼: 독서, 보관함, 시설 증축 리스트 */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-amber-600 text-stone-950 shadow'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <span>🏕️</span> 야영지 종합 개요
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'storage'
              ? 'bg-amber-600 text-stone-950 shadow'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> 야영 보관함 ({storageItems.length}종)
        </button>
        <button
          onClick={() => setActiveTab('facilities')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'facilities'
              ? 'bg-amber-600 text-stone-950 shadow'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Hammer className="w-3.5 h-3.5" /> 시설 증축 관리 (13종)
        </button>
      </div>

      {/* 4. 가방 내 독서 가능 서적 섹션 (독서 공간) */}
      {readableBooksInInventory.length > 0 && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <BookOpen className="w-4 h-4 text-indigo-400" /> 모닥불 옆 독서 공간 (지식 및 스킬 습득)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {readableBooksInInventory.map((book) => {
              const bookDef = READABLE_BOOKS_DATABASE[book.name.trim()];
              return (
                <div
                  key={book.name}
                  className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex items-center justify-between gap-2 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-stone-100 truncate">{book.name}</div>
                    <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">{bookDef?.lore}</div>
                  </div>
                  <button
                    onClick={() => {
                      onReadBook(book.name);
                      showFeedback(`📖 [${book.name}]을(를) 완독하여 지식을 습득했습니다!`);
                    }}
                    className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-white font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer shadow"
                  >
                    읽기
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. 야영지 물품 보관함 (Camp Storage) */}
      {(activeTab === 'overview' || activeTab === 'storage') && (
        <div id="camp-storage-section" className="bg-stone-900/90 border border-amber-900/30 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-stone-100">야영지 물품 보관함 (Camp Storage)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-amber-300 font-semibold">
                {storageFacility?.isBuilt ? `Lv.${storageLevel} 보관함` : '기본 보관함'}
              </span>
            </div>

            {/* 용량 게이지 */}
            <div className="flex items-center gap-2">
              <div className="w-32 bg-stone-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-stone-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    storagePercent >= 90 ? 'bg-rose-500' : storagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-400 font-mono">
                {currentStorageWeight} / {storageCapacity} kg ({storagePercent}%)
              </span>
            </div>
          </div>

          {/* 탭 토글: 가방 -> 보관함 or 보관함 -> 가방 */}
          <div className="flex border-b border-stone-800 pb-2 gap-2">
            <button
              onClick={() => setTransferMode('store')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                transferMode === 'store'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              소지품 보관하기 ({playerState.inventory.length}종)
            </button>
            <button
              onClick={() => setTransferMode('retrieve')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                transferMode === 'retrieve'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              보관함에서 꺼내기 ({storageItems.length}종)
            </button>
          </div>

          {/* 물품 리스트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {transferMode === 'store' ? (
              playerState.inventory.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-stone-500">
                  인벤토리에 보관 가능한 아이템이 없습니다.
                </div>
              ) : (
                playerState.inventory.map((item, idx) => {
                  const totalWeight = calculateItemTotalWeight(item);
                  return (
                    <div
                      key={`${item.name}-${idx}`}
                      className="p-2.5 bg-stone-950/80 border border-stone-800 rounded-xl flex items-center justify-between gap-2 hover:border-amber-600/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-stone-200 truncate">{item.name}</div>
                        <div className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
                          <span>수량: x{item.quantity}</span>
                          <span>•</span>
                          <span>{totalWeight} kg</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStore(item, 1)}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="1개 보관"
                        >
                          1개 <ArrowRight className="w-2.5 h-2.5 text-amber-400" />
                        </button>
                        {item.quantity > 1 && (
                          <button
                            onClick={() => handleStore(item, item.quantity)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow"
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
              <div className="col-span-full py-8 text-center text-xs text-stone-500">
                야영지 보관함에 보관된 아이템이 없습니다.
              </div>
            ) : (
              storageItems.map((item, idx) => {
                const totalWeight = calculateItemTotalWeight(item);
                return (
                  <div
                    key={`stored-${item.name}-${idx}`}
                    className="p-2.5 bg-stone-950/80 border border-stone-800 rounded-xl flex items-center justify-between gap-2 hover:border-indigo-600/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-stone-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
                        <span>수량: x{item.quantity}</span>
                        <span>•</span>
                        <span>{totalWeight} kg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRetrieve(item, 1)}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="1개 꺼내기"
                      >
                        <ArrowLeft className="w-2.5 h-2.5 text-indigo-400" /> 1개
                      </button>
                      {item.quantity > 1 && (
                        <button
                          onClick={() => handleRetrieve(item, item.quantity)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow"
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
      )}

      {/* 6. 13대 야영 시설 증축 상세 리스트 (Camp Facilities Upgrades) */}
      {(activeTab === 'overview' || activeTab === 'facilities') && (
        <div className="bg-stone-900/90 border border-amber-900/30 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Hammer className="w-4 h-4 text-amber-400" /> 야영지 시설 구축 및 증축 (Facilities Upgrades)
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
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                    currentFac.isBuilt
                      ? 'border-amber-900/50 bg-stone-950/70'
                      : 'border-stone-800 bg-stone-950/30 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl p-1.5 rounded-lg bg-stone-900 border border-stone-800">
                          {facDef.iconSymbol}
                        </span>
                        <span className="font-bold text-xs text-stone-100">{facDef.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          currentFac.isBuilt
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            : 'bg-stone-800 text-stone-500 border border-stone-700'
                        }`}
                      >
                        {currentFac.isBuilt ? `Tier ${currentFac.level}` : '미구축'}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">{facDef.description}</p>

                    <div className="mt-2 text-[10px] text-amber-300/90 space-y-0.5">
                      {facDef.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 하단 업그레이드 버튼 & 필요 재료 */}
                  <div className="mt-3 pt-3 border-t border-stone-800/80">
                    {isMax ? (
                      <div className="text-[11px] text-stone-500 font-semibold text-center py-1">
                        최대 등급 달성
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] text-stone-400 line-clamp-1">
                          {upgradeCost?.ingredients.map((ing) => `${ing.itemName} x${ing.quantity}`).join(', ')}
                        </div>
                        <button
                          id={`upgrade-fac-${facId}`}
                          onClick={() => {
                            onUpgradeFacility(facId);
                          }}
                          disabled={!canUpgrade}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shrink-0 ${
                            canUpgrade
                              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 cursor-pointer shadow active:scale-95'
                              : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed'
                          }`}
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          {currentFac.isBuilt ? `Tier ${nextLvl} 증축` : '건설'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 모달 로컬 백업 (독립 실행 환경용) */}
      {showAlchemyModalLocal && (
        <AlchemyCraftingModal
          playerState={playerState}
          onClose={() => setShowAlchemyModalLocal(false)}
          onUpdateState={onUpdateState || (() => {})}
          onAddLogMessage={onAddLogMessage}
        />
      )}

      {showBlacksmithModalLocal && (
        <BlacksmithWorkshopModal
          playerState={playerState}
          onClose={() => setShowBlacksmithModalLocal(false)}
          onUpdateState={onUpdateState || (() => {})}
          onAddLogMessage={onAddLogMessage}
        />
      )}
    </div>
  );
};
